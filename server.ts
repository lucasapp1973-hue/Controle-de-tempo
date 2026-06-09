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
interface TimerState {
  isRunning: boolean;
  mode: 'progressive' | 'regressive';
  initialDuration: number; // in seconds
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
}

let timerState: TimerState = {
  isRunning: false,
  mode: 'regressive',
  initialDuration: 300, // 5 minutes default
  currentTime: 300,
  lastUpdated: Date.now(),
};

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
        } else {
          timerState.isRunning = false;
          stopTick();
        }
      } else {
        // progressive
        if (timerState.currentTime < timerState.initialDuration) {
          timerState.currentTime++;
        } else {
          timerState.isRunning = false;
          stopTick();
        }
      }
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
    
    timerState.lastUpdated = Date.now();
    broadcastState();
  });

  // Handle manual sync request
  socket.on('timer:sync', () => {
    socket.emit('timer:state', timerState);
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Optionally log or clean up
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
