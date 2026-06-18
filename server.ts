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
  isStopped?: boolean;
}

interface TimerSession {
  state: TimerState;
  interval: NodeJS.Timeout | null;
}

const initialRealState: TimerState = {
  isRunning: false,
  mode: 'regressive',
  initialDuration: 300,
  currentTime: 300,
  lastUpdated: Date.now(),
  schedule: [],
  activeId: null,
  elapsedTime: 0,
  meetings: [],
  isStopped: false
};

const getDemoMockSchedule = (): ScheduleItem[] => [
  { id: 'dp_a1', name: 'João Silva', partType: 'Leitura da Bíblia', expectedTime: 240, status: 'active', completedTime: null },
  { id: 'dp_a2', name: 'Maria Souza', partType: 'Primeira Conversa', expectedTime: 180, status: 'pending', completedTime: null },
  { id: 'dp_a3', name: 'Pedro Santos', partType: 'Revisita', expectedTime: 300, status: 'pending', completedTime: null },
  { id: 'dp_a4', name: 'Ana Costa', partType: 'Estudo Bíblico', expectedTime: 300, status: 'pending', completedTime: null },
  { id: 'dp_a5', name: 'Roberto Lima', partType: 'Joias Espirituais', expectedTime: 600, status: 'pending', completedTime: null }
];

const initialDemoState = (): TimerState => ({
  isRunning: false,
  mode: 'regressive',
  initialDuration: 240,
  currentTime: 240,
  lastUpdated: Date.now(),
  schedule: getDemoMockSchedule(),
  activeId: 'dp_a1',
  elapsedTime: 0,
  meetings: [],
  isStopped: false
});

let realSession: TimerSession = {
  state: initialRealState,
  interval: null
};

let demoSession: TimerSession = {
  state: initialDemoState(),
  interval: null
};

function broadcastState(isDemo: boolean) {
  const roomName = isDemo ? 'demo_room' : 'real_room';
  const state = isDemo ? demoSession.state : realSession.state;
  io.to(roomName).emit('timer:state', state);
}

function startTick(isDemo: boolean) {
  const session = isDemo ? demoSession : realSession;
  if (session.interval) return;
  
  session.interval = setInterval(() => {
    if (session.state.isRunning) {
      if (session.state.mode === 'regressive') {
        if (session.state.currentTime > 0) {
          session.state.currentTime--;
        }
      } else {
        if (session.state.currentTime < session.state.initialDuration) {
          session.state.currentTime++;
        }
      }
      
      session.state.elapsedTime++;
      session.state.lastUpdated = Date.now();
      broadcastState(isDemo);
    } else {
      stopTick(isDemo);
    }
  }, 1000);
}

function stopTick(isDemo: boolean) {
  const session = isDemo ? demoSession : realSession;
  if (session.interval) {
    clearInterval(session.interval);
    session.interval = null;
  }
}

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  const isDemo = socket.handshake.query.demo === 'true';
  const session = isDemo ? demoSession : realSession;
  const roomName = isDemo ? 'demo_room' : 'real_room';
  
  socket.join(roomName);

  // Send current state to newly connected client
  socket.emit('timer:state', session.state);

  // Start timer
  socket.on('timer:start', () => {
    session.state.isRunning = true;
    session.state.isStopped = false;
    session.state.lastUpdated = Date.now();
    startTick(isDemo);
    broadcastState(isDemo);
  });

  // Pause timer
  socket.on('timer:pause', () => {
    session.state.isRunning = false;
    session.state.isStopped = true;
    session.state.lastUpdated = Date.now();
    stopTick(isDemo);
    broadcastState(isDemo);
  });

  // Resume timer
  socket.on('timer:resume', () => {
    session.state.isRunning = true;
    session.state.isStopped = false;
    session.state.lastUpdated = Date.now();
    startTick(isDemo);
    broadcastState(isDemo);
  });

  // Reset timer
  socket.on('timer:reset', () => {
    session.state.isRunning = false;
    session.state.isStopped = false;
    stopTick(isDemo);
    if (session.state.mode === 'regressive') {
      session.state.currentTime = session.state.initialDuration;
    } else {
      session.state.currentTime = 0;
    }
    session.state.elapsedTime = 0;
    session.state.lastUpdated = Date.now();
    broadcastState(isDemo);
  });

  // Set timer configuration
  socket.on('timer:set', (config: { minutes: number; seconds: number; mode: 'progressive' | 'regressive' }) => {
    session.state.isRunning = false;
    stopTick(isDemo);
    session.state.mode = config.mode;
    session.state.initialDuration = config.minutes * 60 + config.seconds;
    
    if (config.mode === 'regressive') {
      session.state.currentTime = config.minutes * 60 + config.seconds;
    } else {
      session.state.currentTime = 0;
    }
    
    session.state.elapsedTime = 0;
    session.state.lastUpdated = Date.now();
    broadcastState(isDemo);
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
    
    session.state.schedule.push(newItem);
    
    // If no active item, auto-activate this
    if (!session.state.activeId) {
      session.state.activeId = newItem.id;
      newItem.status = 'active';
      session.state.initialDuration = newItem.expectedTime;
      session.state.currentTime = session.state.mode === 'regressive' ? newItem.expectedTime : 0;
      session.state.elapsedTime = 0;
    }
    
    broadcastState(isDemo);
  });

  // Schedule management: Edit
  socket.on('schedule:edit', (updated: ScheduleItem) => {
    const idx = session.state.schedule.findIndex(i => i.id === updated.id);
    if (idx !== -1) {
      session.state.schedule[idx] = { ...session.state.schedule[idx], ...updated };
      
      // If editing the currently active item, update timer config too
      if (session.state.activeId === updated.id) {
        session.state.initialDuration = updated.expectedTime;
        if (!session.state.isRunning) {
          session.state.currentTime = session.state.mode === 'regressive' ? updated.expectedTime : 0;
        }
      }
      broadcastState(isDemo);
    }
  });

  // Schedule management: Remove
  socket.on('schedule:remove', (id: string) => {
    session.state.schedule = session.state.schedule.filter(i => i.id !== id);
    
    // If the active item was removed, fallback to the next pending or null
    if (session.state.activeId === id) {
      session.state.isRunning = false;
      stopTick(isDemo);
      
      const nextPending = session.state.schedule.find(i => i.status === 'pending');
      if (nextPending) {
        session.state.activeId = nextPending.id;
        nextPending.status = 'active';
        session.state.initialDuration = nextPending.expectedTime;
        session.state.currentTime = session.state.mode === 'regressive' ? nextPending.expectedTime : 0;
      } else {
        session.state.activeId = null;
        session.state.initialDuration = 300;
        session.state.currentTime = session.state.mode === 'regressive' ? 300 : 0;
      }
      session.state.elapsedTime = 0;
    }
    
    broadcastState(isDemo);
  });

  // Schedule management: Reorder
  socket.on('schedule:reorder', (newList: ScheduleItem[]) => {
    session.state.schedule = newList;
    broadcastState(isDemo);
  });

  // Schedule management: Activate item manually
  socket.on('schedule:activate', (id: string) => {
    session.state.isRunning = false;
    stopTick(isDemo);
    
    session.state.schedule = session.state.schedule.map(item => {
      if (item.id === id) {
        return { ...item, status: 'active' };
      }
      // If we activate a new item manually, previous active goes to pending
      if (item.status === 'active') {
        return { ...item, status: 'pending' };
      }
      return item;
    });

    const activeItem = session.state.schedule.find(i => i.id === id);
    if (activeItem) {
      session.state.activeId = id;
      session.state.initialDuration = activeItem.expectedTime;
      session.state.currentTime = session.state.mode === 'regressive' ? activeItem.expectedTime : 0;
      session.state.elapsedTime = 0;
    }
    
    broadcastState(isDemo);
  });

  // Schedule management: Complete item
  socket.on('schedule:complete', (id: string) => {
    // 1. Mark target item as completed and register elapsed time
    let targetIdx = session.state.schedule.findIndex(i => i.id === id);
    if (targetIdx !== -1) {
      session.state.schedule[targetIdx].status = 'completed';
      session.state.schedule[targetIdx].completedTime = session.state.elapsedTime;
    }

    session.state.isRunning = false;
    session.state.isStopped = true;
    stopTick(isDemo);

    // 2. Automatically select next participant (status = 'pending')
    const nextPending = session.state.schedule.find(i => i.status === 'pending');
    if (nextPending) {
      session.state.activeId = nextPending.id;
      nextPending.status = 'active';
      session.state.initialDuration = nextPending.expectedTime;
      
      if (session.state.mode === 'regressive') {
        session.state.currentTime = nextPending.expectedTime;
      } else {
        session.state.currentTime = 0;
      }
    } else {
      session.state.activeId = null;
    }
    
    session.state.elapsedTime = 0;
    broadcastState(isDemo);
  });

  // Schedule management: Reset all to pending
  socket.on('schedule:reset', () => {
    session.state.isRunning = false;
    stopTick(isDemo);
    
    if (isDemo) {
      session.state.schedule = getDemoMockSchedule();
    } else {
      session.state.schedule = session.state.schedule.map(item => ({
        ...item,
        status: 'pending',
        completedTime: null,
      }));
    }

    if (session.state.schedule.length > 0) {
      session.state.activeId = session.state.schedule[0].id;
      session.state.schedule[0].status = 'active';
      session.state.initialDuration = session.state.schedule[0].expectedTime;
      session.state.currentTime = session.state.mode === 'regressive' ? session.state.schedule[0].expectedTime : 0;
    } else {
      session.state.activeId = null;
      session.state.initialDuration = 300;
      session.state.currentTime = session.state.mode === 'regressive' ? 300 : 0;
    }
    
    session.state.elapsedTime = 0;
    broadcastState(isDemo);
  });

  // Register and archive completed meeting
  socket.on('meeting:register', (data: { title: string }) => {
    if (session.state.schedule && session.state.schedule.length > 0) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      const newMeeting: CompletedMeeting = {
        id: 'meet_' + Math.random().toString(36).substring(2, 9),
        date: dateString,
        title: data.title || `Reunião de ${dateString}`,
        schedule: JSON.parse(JSON.stringify(session.state.schedule)),
      };

      // Ensure active/pending are parsed cleanly
      newMeeting.schedule.forEach(item => {
        if (item.status === 'active') {
          item.status = 'completed';
          item.completedTime = session.state.elapsedTime;
        } else if (item.status === 'pending') {
          item.status = 'completed';
          item.completedTime = item.expectedTime; // defaults to expected if not started
        }
      });

      if (!session.state.meetings) {
        session.state.meetings = [];
      }
      session.state.meetings.unshift(newMeeting);
    }

    // Reset current active states and clear schedule
    session.state.isRunning = false;
    stopTick(isDemo);
    
    if (isDemo) {
      session.state.schedule = getDemoMockSchedule();
      session.state.activeId = 'dp_a1';
      session.state.initialDuration = 240;
      session.state.currentTime = 240;
    } else {
      session.state.schedule = [];
      session.state.activeId = null;
      session.state.currentTime = 300;
      session.state.initialDuration = 300;
    }
    session.state.elapsedTime = 0;
    session.state.lastUpdated = Date.now();

    broadcastState(isDemo);
  });

  // Delete a specific completed meeting
  socket.on('meeting:delete', (data: { id: string }) => {
    if (session.state.meetings) {
      session.state.meetings = session.state.meetings.filter(m => m.id !== data.id);
      broadcastState(isDemo);
    }
  });

  // Clear all archived meetings
  socket.on('meetings:clear', () => {
    session.state.meetings = [];
    broadcastState(isDemo);
  });

  // Handle manual sync request
  socket.on('timer:sync', () => {
    socket.emit('timer:state', session.state);
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
  const isDemo = req.query.demo === 'true';
  res.json(isDemo ? demoSession.state : realSession.state);
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
