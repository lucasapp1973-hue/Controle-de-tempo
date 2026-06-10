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

interface CompletedMeeting {
  id: string;
  date: string;
  title: string;
  schedule: ScheduleItem[];
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
  meetings: CompletedMeeting[];
}

let timerState: TimerState = {
  isRunning: false,
  mode: 'regressive',
  initialDuration: 300,
  currentTime: 300,
  lastUpdated: Date.now(),
  schedule: [],
  activeId: null,
  elapsedTime: 0,
  meetings: [
    {
      id: 'meet_999',
      date: '09/06/2026',
      title: 'Reunião de 09/06/2026',
      schedule: [
        { id: 'h_1', name: 'João Silva', partType: 'Leitura da Bíblia', expectedTime: 240, status: 'completed', completedTime: 238 },
        { id: 'h_2', name: 'Maria Souza', partType: 'Primeira Conversa', expectedTime: 180, status: 'completed', completedTime: 202 },
        { id: 'h_3', name: 'Pedro Santos', partType: 'Revisita', expectedTime: 300, status: 'completed', completedTime: 285 },
        { id: 'h_4', name: 'Ana Costa', partType: 'Discurso', expectedTime: 240, status: 'completed', completedTime: 240 }
      ]
    },
    {
      id: 'meet_998',
      date: '05/06/2026',
      title: 'Reunião de 05/06/2026',
      schedule: [
        { id: 'h_5', name: 'Carlos Ramos', partType: 'Estudo Bíblico', expectedTime: 180, status: 'completed', completedTime: 175 },
        { id: 'h_6', name: 'Sandra Lima', partType: 'Segunda Conversa', expectedTime: 240, status: 'completed', completedTime: 264 }
      ]
    }
  ]
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

  // Register and archive completed meeting
  socket.on('meeting:register', (data: { title: string }) => {
    if (timerState.schedule && timerState.schedule.length > 0) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      const newMeeting: CompletedMeeting = {
        id: 'meet_' + Math.random().toString(36).substring(2, 9),
        date: dateString,
        title: data.title || `Reunião de ${dateString}`,
        schedule: JSON.parse(JSON.stringify(timerState.schedule)),
      };

      // Ensure active/pending are parsed cleanly
      newMeeting.schedule.forEach(item => {
        if (item.status === 'active') {
          item.status = 'completed';
          item.completedTime = timerState.elapsedTime;
        } else if (item.status === 'pending') {
          item.status = 'completed';
          item.completedTime = item.expectedTime; // defaults to expected if not started
        }
      });

      if (!timerState.meetings) {
        timerState.meetings = [];
      }
      timerState.meetings.unshift(newMeeting);
    }

    // Reset current active states and clear schedule
    timerState.isRunning = false;
    stopTick();
    timerState.schedule = [];
    timerState.activeId = null;
    timerState.elapsedTime = 0;
    timerState.currentTime = 300;
    timerState.initialDuration = 300;
    timerState.lastUpdated = Date.now();

    broadcastState();
  });

  // Delete a specific completed meeting
  socket.on('meeting:delete', (data: { id: string }) => {
    if (timerState.meetings) {
      timerState.meetings = timerState.meetings.filter(m => m.id !== data.id);
      broadcastState();
    }
  });

  // Clear all archived meetings
  socket.on('meetings:clear', () => {
    timerState.meetings = [];
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
