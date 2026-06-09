import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Sliders, Smartphone, Wifi, WifiOff, Clock, Plus, Minus } from 'lucide-react';
import { TimerState, TimerMode } from '../types';

interface ControlViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTimer: (minutes: number, seconds: number, mode: TimerMode) => void;
}

export default function ControlView({
  timerState,
  isConnected,
  onBack,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  setTimer,
}: ControlViewProps) {
  const { isRunning, mode, currentTime, initialDuration } = timerState;

  // Local state for configuration inputs
  const [localMinutes, setLocalMinutes] = useState(5);
  const [localSeconds, setLocalSeconds] = useState(0);
  const [localMode, setLocalMode] = useState<TimerMode>('regressive');

  // Sync inputs with state when timer is stopped/reset to match initialDuration
  useEffect(() => {
    if (!isRunning) {
      const totalSecs = initialDuration;
      setLocalMinutes(Math.floor(totalSecs / 60));
      setLocalSeconds(totalSecs % 60);
      setLocalMode(mode);
    }
  }, [initialDuration, mode, isRunning]);

  // Adjust inputs helpers
  const adjustMinutes = (amount: number) => {
    setLocalMinutes((prev) => Math.min(599, Math.max(0, prev + amount)));
  };

  const adjustSeconds = (amount: number) => {
    setLocalSeconds((prev) => {
      let newValue = prev + amount;
      if (newValue > 59) {
        adjustMinutes(1);
        return 0;
      }
      if (newValue < 0) {
        if (localMinutes > 0) {
          adjustMinutes(-1);
          return 59;
        }
        return 0;
      }
      return newValue;
    });
  };

  // Quick preset trigger (immediate apply)
  const applyPreset = (minutes: number) => {
    setLocalMinutes(minutes);
    setLocalSeconds(0);
    setTimer(minutes, 0, localMode);
  };

  // Apply custom config trigger
  const handleApplyConfig = () => {
    setTimer(localMinutes, localSeconds, localMode);
  };

  // Helper to format remaining time on the preview
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header Panel */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-850"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Voltar</span>
          </button>

          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            Painel de Controle
          </h1>

          {/* Connection badge with real-time status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? 'ONLINE' : 'DISCONECTADO'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-5 overflow-y-auto">
        
        {/* Real-Time Sync Status Preview */}
        <section id="sync-preview-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Exibição Atual (Display em Tempo Real)
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-slate-300">{isRunning ? 'RODANDO' : 'PAUSADO'}</span>
            </div>
          </div>
          
          <div className="bg-slate-950 rounded-xl p-6 text-center border border-slate-850 shadow-inner">
            <div className="text-3xl sm:text-4xl text-emerald-400 font-mono font-semibold tracking-widest">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-slate-500 uppercase font-semibold mt-1">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
            </div>
          </div>
        </section>

        {/* Configuration Panel */}
        <section id="config-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Ajuste de Tempo e Modo</h2>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Modo do Cronômetro</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setLocalMode('regressive')}
                className={`py-2 px-3 rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
                  localMode === 'regressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Regressivo (Regressiva)
              </button>
              <button
                type="button"
                onClick={() => setLocalMode('progressive')}
                className={`py-2 px-3 rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
                  localMode === 'progressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Progressivo (Contagem)
              </button>
            </div>
          </div>

          {/* Time Picker Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Minutes Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Minutos</label>
              <div className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 p-1 select-none">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-1)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={localMinutes}
                  onChange={(e) => setLocalMinutes(Math.min(599, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 text-center text-xl font-bold bg-transparent border-0 focus:ring-0 text-white font-mono"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={() => adjustMinutes(1)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seconds Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Segundos</label>
              <div className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 p-1 select-none">
                <button
                  type="button"
                  onClick={() => adjustSeconds(-5)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="-5s"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={localSeconds}
                  onChange={(e) => setLocalSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 text-center text-xl font-bold bg-transparent border-0 focus:ring-0 text-white font-mono"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={() => adjustSeconds(5)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="+5s"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Preset Selection Buttons (2, 3, 4, 5, 6, 7, 8, 10, 15, 30 min) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Configurações Rápidas</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => applyPreset(mins)}
                  className="py-2.5 text-center bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 text-xs sm:text-sm font-bold text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Apply Config Button */}
          <button
            type="button"
            onClick={handleApplyConfig}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            Aplicar Configuração de Tempo
          </button>
        </section>

        {/* Real-time Operation Controls */}
        <section id="controls-panel" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Play className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Controles do Cronômetro</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-1">
            {/* Play/Pause Button Logic */}
            {!isRunning ? (
              <button
                type="button"
                onClick={startTimer}
                disabled={!isConnected}
                className="col-span-2 sm:col-span-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.97] disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer min-h-[50px]"
              >
                <Play className="w-5 h-5 fill-current" />
                {currentTime !== initialDuration && currentTime !== 0 ? 'Continuar' : 'Iniciar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                disabled={!isConnected}
                className="col-span-2 sm:col-span-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-[0.97] disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer min-h-[50px]"
              >
                <Pause className="w-5 h-5 fill-current" />
                Pausar
              </button>
            )}

            {/* Reset Button */}
            <button
              type="button"
              onClick={resetTimer}
              disabled={!isConnected}
              className="py-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.97] disabled:opacity-50 text-slate-200 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer min-h-[50px]"
            >
              <RotateCcw className="w-4 h-4" />
              Zerar
            </button>
          </div>
        </section>
      </main>

      {/* Localhost / Info Footer Info */}
      <footer className="p-4 bg-slate-950/40 text-center border-t border-slate-800 text-xs text-slate-500 select-none">
        <p>Desenvolvido para rede local com latência ultra-baixa.</p>
        <p className="mt-0.5 opacity-60">Abra este app em outro dispositivo na rede para sincronização instantânea.</p>
      </footer>
    </div>
  );
}
