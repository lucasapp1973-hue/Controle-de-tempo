export type TimerMode = 'progressive' | 'regressive';

export interface ScheduleItem {
  id: string;
  name: string;
  partType: string;
  expectedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
  completedTime?: number | null; // in seconds actually taken
}

export interface TimerState {
  isRunning: boolean;
  mode: TimerMode;
  initialDuration: number; // in seconds
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
  schedule: ScheduleItem[];
  activeId: string | null; // ID of the currently active schedule participant
  elapsedTime: number; // actual seconds spent on the current active participant
}

export interface TimerConfig {
  minutes: number;
  seconds: number;
  mode: TimerMode;
}

