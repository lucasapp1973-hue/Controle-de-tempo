import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TimerState, TimerMode } from '../types';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    mode: 'regressive',
    initialDuration: 300,
    currentTime: 300,
    lastUpdated: Date.now(),
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Automatically connect to the host of the current page
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Fetch latest state upon connection
      socket.emit('timer:sync');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('timer:state', (state: TimerState) => {
      setTimerState(state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startTimer = useCallback(() => {
    socketRef.current?.emit('timer:start');
  }, []);

  const pauseTimer = useCallback(() => {
    socketRef.current?.emit('timer:pause');
  }, []);

  const resumeTimer = useCallback(() => {
    socketRef.current?.emit('timer:resume');
  }, []);

  const resetTimer = useCallback(() => {
    socketRef.current?.emit('timer:reset');
  }, []);

  const setTimer = useCallback((minutes: number, seconds: number, mode: TimerMode) => {
    socketRef.current?.emit('timer:set', { minutes, seconds, mode });
  }, []);

  return {
    isConnected,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setTimer,
  };
}
