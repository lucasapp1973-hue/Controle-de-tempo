import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TimerState, TimerMode, ScheduleItem } from '../types';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    mode: 'regressive',
    initialDuration: 300,
    currentTime: 350,
    lastUpdated: Date.now(),
    schedule: [],
    activeId: null,
    elapsedTime: 0,
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

  // Schedule Management APIs
  const addScheduleItem = useCallback((name: string, partType: string, expectedTime: number) => {
    socketRef.current?.emit('schedule:add', { name, partType, expectedTime });
  }, []);

  const editScheduleItem = useCallback((item: ScheduleItem) => {
    socketRef.current?.emit('schedule:edit', item);
  }, []);

  const removeScheduleItem = useCallback((id: string) => {
    socketRef.current?.emit('schedule:remove', id);
  }, []);

  const reorderSchedule = useCallback((newList: ScheduleItem[]) => {
    socketRef.current?.emit('schedule:reorder', newList);
  }, []);

  const activateScheduleItem = useCallback((id: string) => {
    socketRef.current?.emit('schedule:activate', id);
  }, []);

  const completeScheduleItem = useCallback((id: string) => {
    socketRef.current?.emit('schedule:complete', id);
  }, []);

  const resetSchedule = useCallback(() => {
    socketRef.current?.emit('schedule:reset');
  }, []);

  return {
    isConnected,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setTimer,
    addScheduleItem,
    editScheduleItem,
    removeScheduleItem,
    reorderSchedule,
    activateScheduleItem,
    completeScheduleItem,
    resetSchedule,
  };
}

