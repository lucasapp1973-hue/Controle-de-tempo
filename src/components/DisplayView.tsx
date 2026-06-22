import { useState, useEffect, useRef } from 'react';
import { TimerState } from '../types';

interface DisplayViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  systemConfig?: any;
}

export default function DisplayView({ timerState, isConnected, onBack, systemConfig }: DisplayViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const displayContainerRef = useRef<HTMLDivElement>(null);

  const { currentTime, mode, initialDuration, isRunning } = timerState;

  // Try to enter fullscreen automatically on mount/init (if allowed by browser user gesture cascade)
  useEffect(() => {
    const tryFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await displayContainerRef.current?.requestFullscreen();
        }
      } catch (err) {
        console.warn('Initial fullscreen try failed/blocked:', err);
      }
    };
    tryFullscreen();
  }, []);

  // Fullscreen handle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await displayContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Sync fullscreen state in case of Esc key or external change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pad = (num: number) => String(num).padStart(2, '0');
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Color logic according to parameters
  const alertThreshold = systemConfig?.alertaSegundos ?? 20;
  let bgColorStyle = systemConfig?.corTempoNormal ?? '#10b981';

  if (mode === 'regressive') {
    if (currentTime <= 0) {
      bgColorStyle = systemConfig?.corTempoEsgotado ?? '#ef4444';
    } else if (currentTime <= alertThreshold) {
      bgColorStyle = systemConfig?.corTempoAlerta ?? '#f59e0b';
    } else {
      bgColorStyle = systemConfig?.corTempoNormal ?? '#10b981';
    }
  } else {
    // Progressive Mode
    const timeRemaining = Math.max(0, initialDuration - currentTime);
    if (currentTime >= initialDuration) {
      bgColorStyle = systemConfig?.corTempoEsgotado ?? '#ef4444';
    } else if (timeRemaining <= alertThreshold) {
      bgColorStyle = systemConfig?.corTempoAlerta ?? '#f59e0b';
    } else {
      bgColorStyle = systemConfig?.corTempoNormal ?? '#10b981';
    }
  }

  return (
    <div
      id="display-container"
      ref={displayContainerRef}
      style={{ backgroundColor: bgColorStyle }}
      onClick={toggleFullscreen}
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center transition-colors duration-1000 overflow-hidden text-white select-none cursor-pointer"
    >
      {/* Subtle overlay for physical display look */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/10 pointer-events-none" />

      {/* Display is STRICTLY the elapsed time, huge, centered, no text layout */}
      <div className="flex items-center justify-center text-center w-full select-none z-10 px-4">
        <div 
          className="font-mono text-[28vw] leading-none font-bold tracking-tighter drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Sleek, elegant progress bar at the bottom */}
      {initialDuration > 0 && (() => {
        const total = initialDuration > 0 ? initialDuration : 0;
        const elapsed = mode === 'regressive' 
          ? Math.max(0, initialDuration - currentTime)
          : currentTime;
        const progressPercent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
        
        const isTimeExceeded = mode === 'regressive' 
          ? currentTime <= 0 
          : currentTime >= initialDuration;

        return (
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-black/40 backdrop-blur-md border-t border-white/5 z-20 overflow-hidden flex items-center">
            <div 
              style={{ width: `${progressPercent}%` }}
              className={`h-full opacity-90 shadow-[0_0_10px_rgba(255,255,255,0.73)] rounded-r-full transition-all duration-1000 ease-linear ${
                isTimeExceeded
                  ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                  : 'bg-white'
              }`}
            />
          </div>
        );
      })()}
    </div>
  );
}
