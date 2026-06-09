import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Timer State
interface ScheduleItem {
  id: string;
  name: string;
  partType: string;
  expectedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
  completedTime?: number | null; // in seconds actually taken
}

interface TimerState {
  isRunning: boolean;
  mode: 'progressive' | 'regressive';
  initialDuration: number; // in seconds
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
  schedule: ScheduleItem[];
  activeId: string | null;
  elapsedTime: number; // actual seconds spent on active item
}

let timerState: TimerState = {
  isRunning: false,
  mode: 'regressive',
  initialDuration: 240, // default 4 mins to match first participant
  currentTime: 240,
  lastUpdated: Date.now(),
  schedule: [
    { id: 'part_1', name: 'João Silva', partType: 'Leitura da Bíblia', expectedTime: 240, status: 'pending', completedTime: null },
    { id: 'part_2', name: 'Maria Souza', partType: 'Primeira Conversa', expectedTime: 180, status: 'pending', completedTime: null },
    { id: 'part_3', name: 'Pedro Santos', partType: 'Revisita', expectedTime: 300, status: 'pending', completedTime: null },
    { id: 'part_4', name: 'Ana Costa', partType: 'Discurso', expectedTime: 240, status: 'pending', completedTime: null },
  ],
  activeId: null,
  elapsedTime: 0,
};

// Set first participant active by default if none is active
if (timerState.schedule.length > 0) {
  timerState.activeId = timerState.schedule[0].id;
  timerState.schedule[0].status = 'active';
  timerState.initialDuration = timerState.schedule[0].expectedTime;
  timerState.currentTime = timerState.schedule[0].expectedTime;
}

let timerInterval: NodeJS.Timeout | null = null;

function broadcastState() {
  io.emit('timer:state', timerState);
}

function startTick() {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    if (timerState.isRunning) {
      if (timerState.mode === 'regressive') {
        if (timerState.currentTime > 0) {
          timerState.currentTime--;
        }
        // Do not force-stop timer on 0 so speaker can see overrun if needed on control,
        // but display stays red at 0. Or, if they want to stop exactly at 0, let's keep it ticking
        // so that elapsed time increases.
      } else {
        // progressive
        if (timerState.currentTime < timerState.initialDuration) {
          timerState.currentTime++;
        }
      }
      
      timerState.elapsedTime++;
      timerState.lastUpdated = Date.now();
      broadcastState();
    } else {
      stopTick();
    }
  }, 1000);
}

function stopTick() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  // Send current state to newly connected client
  socket.emit('timer:state', timerState);

  // Start timer
  socket.on('timer:start', () => {
    timerState.isRunning = true;
    timerState.lastUpdated = Date.now();
    startTick();
    broadcastState();
  });

  // Pause timer
  socket.on('timer:pause', () => {
    timerState.isRunning = false;
    timerState.lastUpdated = Date.now();
    stopTick();
    broadcastState();
  });

  // Resume timer
  socket.on('timer:resume', () => {
    timerState.isRunning = true;
    timerState.lastUpdated = Date.now();
    startTick();
    broadcastState();
  });

  // Reset timer
  socket.on('timer:reset', () => {
    timerState.isRunning = false;
    stopTick();
    if (timerState.mode === 'regressive') {
      timerState.currentTime = timerState.initialDuration;
    } else {
      timerState.currentTime = 0;
    }
    timerState.elapsedTime = 0;
    timerState.lastUpdated = Date.now();
    broadcastState();
  });

  // Set timer configuration
  socket.on('timer:set', (config: { minutes: number; seconds: number; mode: 'progressive' | 'regressive' }) => {
    timerState.isRunning = false;
    stopTick();
    timerState.mode = config.mode;
    timerState.initialDuration = config.minutes * 60 + config.seconds;
    
    if (config.mode === 'regressive') {
      timerState.currentTime = timerState.initialDuration;
    } else {
      timerState.currentTime = 0;
    }
    
    timerState.elapsedTime = 0;
    timerState.lastUpdated = Date.now();
    broadcastState();
  });

  // Schedule management: Add
  socket.on('schedule:add', (item: { name: string; partType: string; expectedTime: number }) => {
    const newItem: ScheduleItem = {
      id: 'part_' + Math.random().toString(36).substring(2, 9),
      name: item.name,
      partType: item.partType,
      expectedTime: item.expectedTime,
      status: 'pending',
      completedTime: null,
    };
    
    timerState.schedule.push(newItem);
    
    // If no active item, auto-activate this
    if (!timerState.activeId) {
      timerState.activeId = newItem.id;
      newItem.status = 'active';
      timerState.initialDuration = newItem.expectedTime;
      timerState.currentTime = timerState.mode === 'regressive' ? newItem.expectedTime : 0;
      timerState.elapsedTime = 0;
    }
    
    broadcastState();
  });

  // Schedule management: Edit
  socket.on('schedule:edit', (updated: ScheduleItem) => {
    const idx = timerState.schedule.findIndex(i => i.id === updated.id);
    if (idx !== -1) {
      timerState.schedule[idx] = { ...timerState.schedule[idx], ...updated };
      
      // If editing the currently active item, update timer config too
      if (timerState.activeId === updated.id) {
        timerState.initialDuration = updated.expectedTime;
        if (!timerState.isRunning) {
          timerState.currentTime = timerState.mode === 'regressive' ? updated.expectedTime : 0;
        }
      }
      broadcastState();
    }
  });

  // Schedule management: Remove
  socket.on('schedule:remove', (id: string) => {
    timerState.schedule = timerState.schedule.filter(i => i.id !== id);
    
    // If the active item was removed, fallback to the next pending or null
    if (timerState.activeId === id) {
      timerState.isRunning = false;
      stopTick();
      
      const nextPending = timerState.schedule.find(i => i.status === 'pending');
      if (nextPending) {
        timerState.activeId = nextPending.id;
        nextPending.status = 'active';
        timerState.initialDuration = nextPending.expectedTime;
        timerState.currentTime = timerState.mode === 'regressive' ? nextPending.expectedTime : 0;
      } else {
        timerState.activeId = null;
        timerState.initialDuration = 300;
        timerState.currentTime = timerState.mode === 'regressive' ? 300 : 0;
      }
      timerState.elapsedTime = 0;
    }
    
    broadcastState();
  });

  // Schedule management: Reorder
  socket.on('schedule:reorder', (newList: ScheduleItem[]) => {
    timerState.schedule = newList;
    broadcastState();
  });

  // Schedule management: Activate item manually
  socket.on('schedule:activate', (id: string) => {
    timerState.isRunning = false;
    stopTick();
    
    timerState.schedule = timerState.schedule.map(item => {
      if (item.id === id) {
        return { ...item, status: 'active' };
      }
      // If we activate a new item manually, previous active goes to pending
      if (item.status === 'active') {
        return { ...item, status: 'pending' };
      }
      return item;
    });

    const activeItem = timerState.schedule.find(i => i.id === id);
    if (activeItem) {
      timerState.activeId = id;
      timerState.initialDuration = activeItem.expectedTime;
      timerState.currentTime = timerState.mode === 'regressive' ? activeItem.expectedTime : 0;
      timerState.elapsedTime = 0;
    }
    
    broadcastState();
  });

  // Schedule management: Complete item
  socket.on('schedule:complete', (id: string) => {
    // 1. Mark target item as completed and register elapsed time
    let targetIdx = timerState.schedule.findIndex(i => i.id === id);
    if (targetIdx !== -1) {
      timerState.schedule[targetIdx].status = 'completed';
      timerState.schedule[targetIdx].completedTime = timerState.elapsedTime;
    }

    timerState.isRunning = false;
    stopTick();

    // 2. Automatically select next participant (status = 'pending')
    const nextPending = timerState.schedule.find(i => i.status === 'pending');
    if (nextPending) {
      timerState.activeId = nextPending.id;
      nextPending.status = 'active';
      timerState.initialDuration = nextPending.expectedTime;
      
      if (timerState.mode === 'regressive') {
        timerState.currentTime = nextPending.expectedTime;
      } else {
        timerState.currentTime = 0;
      }
    } else {
      timerState.activeId = null;
    }
    
    timerState.elapsedTime = 0;
    broadcastState();
  });

  // Schedule management: Reset all to pending
  socket.on('schedule:reset', () => {
    timerState.isRunning = false;
    stopTick();
    
    timerState.schedule = timerState.schedule.map(item => ({
      ...item,
      status: 'pending',
      completedTime: null,
    }));

    if (timerState.schedule.length > 0) {
      timerState.activeId = timerState.schedule[0].id;
      timerState.schedule[0].status = 'active';
      timerState.initialDuration = timerState.schedule[0].expectedTime;
      timerState.currentTime = timerState.mode === 'regressive' ? timerState.schedule[0].expectedTime : 0;
    } else {
      timerState.activeId = null;
      timerState.initialDuration = 300;
      timerState.currentTime = timerState.mode === 'regressive' ? 300 : 0;
    }
    
    timerState.elapsedTime = 0;
    broadcastState();
  });

  // Handle manual sync request
  socket.on('timer:sync', () => {
    socket.emit('timer:state', timerState);
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Clean up
  });
});

// API routes go here FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', socketConnected: io.engine.clientsCount });
});

app.get('/api/timer-state', (req, res) => {
  res.json(timerState);
});

// Vite middleware setup
async function setupVite() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    console.log('Serving production static files from', distPath);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Development mode: Using Vite dev server middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const templatePath = path.join(process.cwd(), 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }
}

setupVite().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server runs on http://0.0.0.0:${PORT}`);
  });
});
