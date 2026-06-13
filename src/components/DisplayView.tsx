import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { TimerState } from '../types';

interface DisplayViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  systemConfig?: any;
}

export default function DisplayView({ timerState, isConnected, onBack, systemConfig }: DisplayViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const displayContainerRef = useRef<HTMLDivElement>(null);

  const { currentTime, mode, initialDuration, isRunning } = timerState;

  // Track cursor movement to show/hide back and fullscreen floating buttons
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isRunning) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isRunning]);

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

  // Sync fullscreen state in case of Esc key
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
      className="relative w-full h-screen flex flex-col items-center justify-center transition-colors duration-1000 overflow-hidden text-white select-none"
    >
      {/* Subtle overlay for physical display look */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/10 pointer-events-none" />

      {/* Connection status warning - kept minimal/subtle, only shows if offline */}
      {!isConnected && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-800/90 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          Conectando...
        </div>
      )}

      {/* Floating minimalist Actions - shown only on hover/movement and auto-fades */}
      <div
        className={`absolute top-4 left-4 right-4 flex justify-end items-center transition-all duration-300 z-50 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-black/30 hover:bg-black/50 active:scale-95 text-white/95 hover:text-white rounded-lg backdrop-blur-md transition-all cursor-pointer border border-white/10"
          title={isFullscreen ? 'Sair de Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Display is STRICTLY the elapsed time, huge, centered, no text layout */}
      <div className="flex items-center justify-center text-center w-full select-none z-10">
        <div 
          className="font-mono text-[28vw] leading-none font-bold tracking-tighter drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
}
