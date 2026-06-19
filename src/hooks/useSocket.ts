import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TimerState, TimerMode, ScheduleItem } from '../types';
import { sessionStore } from '../services/sessionStore';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [sessionType, setSessionType] = useState(sessionStore.getSessionType());
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    mode: 'regressive',
    initialDuration: 300,
    currentTime: 300,
    lastUpdated: Date.now(),
    schedule: [],
    activeId: null,
    elapsedTime: 0,
    meetings: [],
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const handleSessionChanged = () => {
      setSessionType(sessionStore.getSessionType());
    };
    window.addEventListener('sessionTypeChanged', handleSessionChanged);
    return () => {
      window.removeEventListener('sessionTypeChanged', handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    const isDemoMode = sessionType === 'demo';
    // Automatically connect to the host of the current page with demo parameter
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      query: {
        demo: isDemoMode ? 'true' : 'false',
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
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
  }, [sessionType]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      setIsReconnecting(true);
      socketRef.current.disconnect();
      setTimeout(() => {
        socketRef.current?.connect();
        // Fallback safety to reset isReconnecting state if network takes time
        setTimeout(() => {
          setIsReconnecting(false);
        }, 1200);
      }, 400);
    }
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
  const addScheduleItem = useCallback((name: string, partType: string, expectedTime: number, avaliada?: boolean, brochuraId?: string | null, licaoNumero?: number | null) => {
    socketRef.current?.emit('schedule:add', { name, partType, expectedTime, avaliada, brochuraId, licaoNumero });
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

  const registerMeeting = useCallback((title: string) => {
    socketRef.current?.emit('meeting:register', { title });
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    socketRef.current?.emit('meeting:delete', { id });
  }, []);

  const clearAllMeetings = useCallback(() => {
    socketRef.current?.emit('meetings:clear');
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnect,
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
    registerMeeting,
    deleteMeeting,
    clearAllMeetings,
  };
}

