import { Clock, Play, Pause, SkipForward, ArrowDown, ArrowUp } from 'lucide-react';
import { TimerState, TimerMode } from '../types';

export interface TimerCardProps {
  timerState: TimerState;
  systemConfig?: any;
  isReadOnly?: boolean;
  isCompact?: boolean;
  isConnected?: boolean;
  // Controls (req when isReadOnly is false)
  startTimer?: () => void;
  pauseTimer?: () => void;
  handleNextPart?: () => void;
  handleModeChange?: (targetMode: TimerMode) => void;
}

export default function TimerCard({
  timerState,
  systemConfig,
  isReadOnly = false,
  isCompact = false,
  isConnected = true,
  startTimer,
  pauseTimer,
  handleNextPart,
  handleModeChange,
}: TimerCardProps) {
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime } = timerState;

  const activeItem = schedule.find((i) => i.id === activeId);
  const alertThreshold = systemConfig?.alertaSegundos ?? 20;

  // Format total seconds into MM:SS
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

  // Formatter for differences (e.g. +00:05, -00:13)
  const formatDifference = (expected: number, actual: number) => {
    const diff = actual - expected;
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60);
    const secs = absDiff % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  // Calculate stopwatch card coloring matching the exact Display rules
  let cardBgClass = 'bg-slate-950/20 border-slate-800';
  let activeColor = systemConfig?.corTempoNormal ?? '#10b981';
  let cardStateLabel = '🟢 Tempo Normal';

  if (mode === 'regressive') {
    if (currentTime <= 0) {
      cardBgClass = 'bg-red-950/30 border-red-500/40 text-red-100';
      activeColor = systemConfig?.corTempoEsgotado ?? '#ef4444';
      cardStateLabel = '🔴 Tempo Esgotado';
    } else if (currentTime <= alertThreshold) {
      cardBgClass = 'bg-amber-950/20 border-amber-500/35 text-amber-100';
      activeColor = systemConfig?.corTempoAlerta ?? '#f59e0b';
      cardStateLabel = `🟡 Últimos ${alertThreshold} segundos`;
    } else {
      cardBgClass = 'bg-emerald-950/10 border-emerald-500/25 text-emerald-100';
      activeColor = systemConfig?.corTempoNormal ?? '#10b981';
      cardStateLabel = '🟢 Tempo Normal';
    }
  } else {
    const timeRemaining = Math.max(0, initialDuration - currentTime);
    if (currentTime >= initialDuration) {
      cardBgClass = 'bg-red-950/30 border-red-500/40 text-red-100';
      activeColor = systemConfig?.corTempoEsgotado ?? '#ef4444';
      cardStateLabel = '🔴 Tempo Esgotado';
    } else if (timeRemaining <= alertThreshold) {
      cardBgClass = 'bg-amber-950/20 border-amber-500/35 text-amber-100';
      activeColor = systemConfig?.corTempoAlerta ?? '#f59e0b';
      cardStateLabel = `🟡 Últimos ${alertThreshold} segundos`;
    } else {
      cardBgClass = 'bg-emerald-950/10 border-emerald-500/25 text-emerald-100';
      activeColor = systemConfig?.corTempoNormal ?? '#10b981';
      cardStateLabel = '🟢 Tempo Normal';
    }
  }

  return (
    <section id="sync-preview-card" className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-700 ${cardBgClass}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 opacity-90">
          <Clock className="w-4 h-4 text-indigo-400" />
          Cronômetro
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 py-1 px-2.5 rounded-full shadow-inner">
          {isRunning ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-500">
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
              <Pause className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-slate-950/80 rounded-2xl p-6 text-center border border-white/5 shadow-inner space-y-3">
        {isCompact ? (
          /* COMPACT VIEW MODE */
          <div className="flex flex-col items-center justify-center space-y-2">
            {/* Giant Centralized Digits */}
            <div style={{ color: activeColor }} className="text-6xl md:text-7xl font-mono font-black tracking-widest leading-none my-1 transition-colors duration-500">
              {formatTime(currentTime)}
            </div>

            <div className="text-sm font-bold tracking-wide text-slate-200">
              {activeItem ? (
                <span className="text-indigo-400 uppercase tracking-wider">{activeItem.partType}</span>
              ) : (
                <span className="text-slate-500 italic text-xs">Sem Parte Ativa</span>
              )}
            </div>
          </div>
        ) : (
          /* EXPANDED VIEW MODE */
          <>
            {activeItem ? (
              <div className="text-slate-200 text-sm font-bold tracking-wide">
                Participante Ativo: <span className="text-indigo-400">{activeItem.name}</span> <span className="text-xs text-slate-400 font-medium">| {activeItem.partType}</span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic">
                Nenhum participante ativo selecionado.
              </div>
            )}

            {/* Giant Centralized Digits */}
            <div style={{ color: activeColor }} className="text-6xl md:text-7xl font-mono font-black tracking-widest leading-none my-2 transition-colors duration-500">
              {formatTime(currentTime)}
            </div>

            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
              {activeItem && isRunning && (
                <span className="block text-slate-300 mt-1">
                  Tempo Realizado: <span className="font-mono text-emerald-400 font-bold">{formatTime(elapsedTime)}</span> (Dif: {formatDifference(initialDuration, elapsedTime)})
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* STREAMLINED OPERATION BUTTONS (Only if not read only) */}
      {!isReadOnly && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Play / Pause Toggle Button */}
            {!isRunning ? (
              <button
                type="button"
                onClick={startTimer}
                disabled={!isConnected}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer text-sm"
              >
                <Play className="w-4 h-4 fill-current animate-pulse" />
                Iniciar
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                disabled={!isConnected}
                className="py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 cursor-pointer text-sm"
              >
                <Pause className="w-4 h-4 fill-current" />
                Pausar
              </button>
            )}

            {/* Próxima Parte Button */}
            <button
              type="button"
              onClick={handleNextPart}
              disabled={!isConnected || !activeId}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer text-sm"
              title="Registra tempo da parte atual e avança automaticamente para o próximo participante"
            >
              <SkipForward className="w-4 h-4" />
              Próxima Parte
            </button>
          </div>

          {/* SOLID DYNAMIC MODE SELECTOR (Instant Sinc) */}
          <div className="mt-5 border-t border-slate-850 pt-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Configurar Modo Sincronizado</span>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => handleModeChange && handleModeChange('regressive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'regressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Regressivo
              </button>
              <button
                type="button"
                onClick={() => handleModeChange && handleModeChange('progressive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'progressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Progressivo
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
