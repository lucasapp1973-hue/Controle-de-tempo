export type TimerMode = 'progressive' | 'regressive';

export interface TimerState {
  isRunning: boolean;
  mode: TimerMode;
  initialDuration: number; // in seconds
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
}

export interface TimerConfig {
  minutes: number;
  seconds: number;
  mode: TimerMode;
}
