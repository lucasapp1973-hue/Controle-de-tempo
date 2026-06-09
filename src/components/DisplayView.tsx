import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ArrowLeft, Tv, RefreshCw } from 'lucide-react';
import { TimerState } from '../types';

interface DisplayViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
}

export default function DisplayView({ timerState, isConnected, onBack }: DisplayViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const displayContainerRef = useRef<HTMLDivElement>(null);

  const { currentTime, mode, initialDuration, isRunning } = timerState;

  // Track cursor movement to show/hide control bar
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

  // Progressive / Regressive Mapping
  let bgColorClass = 'bg-emerald-600';
  let statusText = 'TEMPO NORMAL';

  if (mode === 'regressive') {
    if (currentTime <= 0) {
      bgColorClass = 'bg-red-600 animate-pulse';
      statusText = 'TEMPO ESGOTADO!';
    } else if (currentTime <= 30) {
      bgColorClass = 'bg-amber-500';
      statusText = 'ATENÇÃO: ÚLTIMOS 30 SEGUNDOS';
    }
  } else {
    // Progressive
    const remaining = Math.max(0, initialDuration - currentTime);
    if (currentTime >= initialDuration) {
      bgColorClass = 'bg-red-600 animate-pulse';
      statusText = 'ALVO ALCANÇADO!';
    } else if (remaining <= 30) {
      bgColorClass = 'bg-amber-500';
      statusText = 'ATENÇÃO: QUASE CONCLUÍDO';
    }
  }

  const activeItem = timerState.schedule?.find(item => item.id === timerState.activeId);

  return (
    <div
      id="display-container"
      ref={displayContainerRef}
      className={`relative w-full h-screen ${bgColorClass} flex flex-col items-center justify-center transition-colors duration-1000 overflow-hidden text-white select-none`}
    >
      {/* Dynamic Grid Overlay for visual polish */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

      {/* Persistent Connection Drop Warning */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-800/90 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          Conexão perdida com o servidor
        </div>
      )}

      {/* Floating Header Actions - Autohide */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent transition-all duration-300 z-40 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white py-2 px-3 rounded-lg text-sm font-medium backdrop-blur-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Sair do Display
        </button>

        <div className="flex items-center gap-4">
          <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            Display ({mode === 'regressive' ? 'Regressivo' : 'Progressivo'})
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg backdrop-blur-md transition-all cursor-pointer"
            title={isFullscreen ? 'Sair de Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex flex-col items-center justify-center text-center px-4 w-full z-10 select-none">
        {/* Status label displaying context */}
        <p className="text-white/70 font-semibold tracking-widest text-lg sm:text-2xl uppercase mb-1">
          {statusText}
        </p>

        {/* Active Participant details - Large and clean */}
        {activeItem && (
          <div className="mb-2 text-white/95 text-2xl sm:text-4xl font-bold tracking-wide drop-shadow-md">
            {activeItem.name}
            <span className="block text-white/70 font-medium text-lg sm:text-2xl mt-1">
              Part: {activeItem.partType}
            </span>
          </div>
        )}

        {/* Huge glowing numbers */}
        <div 
          className={`font-mono text-[22vw] leading-none font-bold tracking-tighter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] select-all ${
            !isRunning && currentTime > 0 ? 'opacity-90' : 'opacity-100'
          }`}
        >
          {formatTime(currentTime)}
        </div>

        {/* Small subtitle with preset target info */}
        <div className="mt-4 flex items-center gap-3 justify-center text-base sm:text-xl font-medium text-white/80 bg-black/15 py-1.5 px-4 rounded-full backdrop-blur-sm">
          <span>Meta: {formatTime(initialDuration)}</span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
            {isRunning ? 'Executando' : 'Pausado'}
          </span>
        </div>
      </div>

      {/* Floating Instructions/Indicator when paused */}
      {!isRunning && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/35 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/5 animate-pulse text-white/90">
          Aguardando comando do painel de controle
        </div>
      )}
    </div>
  );
}
