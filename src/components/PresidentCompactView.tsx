import { useState, useEffect } from 'react';
import { DoorOpen, Wifi, WifiOff, LayoutGrid, Minimize2, Maximize2, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause } from 'lucide-react';
import { TimerState, ScheduleItem } from '../types';
import { motion } from 'motion/react';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import TimerCard from './TimerCard';

interface PresidentCompactViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  systemConfig?: any;
}

export default function PresidentCompactView({
  timerState,
  isConnected,
  onBack,
  systemConfig,
}: PresidentCompactViewProps) {
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime, isStopped } = timerState;

  // Force compact and pinned/fixed view on entry, as requested by the user
  const [isCompact, setIsCompact] = useState<boolean>(true);
  const [isPinned] = useState<boolean>(true);

  // Find the currently active schedule participant
  const activeItem = schedule.find((item) => item.id === activeId);

  // Time formatter
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

  // Difference calculation for Status do Tempo
  let diffSecs = 0;
  let isOvertime = false;
  
  if (activeItem) {
    if (mode === 'regressive') {
      // In regressive mode, currentTime <= 0 indicates overtime
      isOvertime = currentTime <= 0;
      // If overtime, diff is positive (how much they exceeded)
      // If within time, diff is negative (how much is remaining)
      diffSecs = isOvertime ? Math.abs(currentTime) : -currentTime;
    } else {
      // In progressive mode, currentTime >= initialDuration is overtime
      isOvertime = currentTime >= initialDuration;
      diffSecs = currentTime - initialDuration;
    }
  }

  // Automatic transition:
  // - Show "Expanded" automatically when time runs out (isOvertime === true)
  // - Return to "Compact" when the "Iniciar" button is clicked (isRunning === true & isOvertime === false)
  useEffect(() => {
    if (isOvertime) {
      setIsCompact(false);
    } else if (isRunning) {
      setIsCompact(true);
    }
  }, [isOvertime, isRunning]);

  const formatDiffTime = (totalSeconds: number) => {
    const absSeconds = Math.abs(totalSeconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = totalSeconds >= 0 ? '+' : '−';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  // Timing Status Label & Styling
  let statusText = 'Sem Parte Ativa';
  let statusBgClass = 'bg-slate-900 border-slate-800 text-slate-400';
  let statusIcon = null;

  if (activeItem) {
    if (isOvertime) {
      statusText = 'Tempo Excedido';
      statusBgClass = 'bg-red-500/15 border-red-500/30 text-red-400 font-extrabold animate-pulse';
      statusIcon = <ShieldAlert className="w-4 h-4 text-red-400" />;
    } else {
      statusText = 'Dentro do Tempo';
      statusBgClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-extrabold';
      statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  }

  return (
    <div className={`min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-between transition-all duration-300 ${isPinned ? 'p-1' : ''}`}>
      
      {/* HEADER BAR (Optional back button and utility bar) */}
      {!isPinned ? (
        <header className="p-4 bg-transparent border-none flex items-center justify-between shadow-none">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">Presidente</h1>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Acompanhamento Discreto</p>
            </div>
          </div>
        </header>
      ) : (
        /* TINY HEADER UNDER PINNED MODE */
        <div className="py-2 px-3 bg-transparent border-none flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <AnalogueClock type="presidente" />
            Presidente
          </span>
          <div />
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 px-4 w-full max-w-md mx-auto space-y-4">
        
        {/* REUSED STOPWATCH VIEW */}
        {!isStopped && (
          <div className="w-full">
            <TimerCard
              timerState={timerState}
              systemConfig={systemConfig}
              isReadOnly={true}
              isCompact={isCompact}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* COMPLEMENTARY REVEAL DETAILS PANEL (hidden in compact mode) */}
        {(!isCompact || isStopped) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3.5"
          >
            <div className="border-b border-slate-800/80 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dados da Parte Ativa</span>
              {activeItem && isRunning && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  EM ANDAMENTO
                </span>
              )}
            </div>

            {/* Structured info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Orador/Participante</span>
                <span className="text-xs font-black text-white block mt-0.5 truncate">
                  {activeItem ? activeItem.name : 'Nenhum'}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Estudo/Designação</span>
                <span className="text-xs font-black text-indigo-400 block mt-0.5 truncate">
                  {activeItem ? activeItem.partType : 'Nenhuma'}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Tempo Previsto</span>
                <span className="text-xs font-mono font-bold text-slate-300 block mt-0.5">
                  {activeItem ? formatTime(activeItem.expectedTime) : '00:00'}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Tempo Realizado</span>
                <span className="text-xs font-mono font-bold text-slate-300 block mt-0.5">
                  {activeItem ? formatTime(elapsedTime) : '00:00'}
                </span>
              </div>
            </div>

            {/* SPECIAL FIELD: Status do Tempo Indicator */}
            {activeItem && (
              <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${statusBgClass}`}>
                <div className="flex items-center gap-2">
                  {statusIcon}
                  <span className="text-xs font-bold uppercase tracking-wide">{statusText}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black">{formatDiffTime(diffSecs)}</span>
                  <span className="block text-[9px] font-semibold text-slate-400 tracking-wider">Diferença</span>
                </div>
              </div>
            )}
            
            {/* MANUAL CONSELHOS MELHORE MENTION */}
            <p className="text-[9px] text-slate-500 text-center italic">
              Acompanhamento projetado para o uso adequado do tempo de acordo com o manual <span className="font-semibold text-slate-400">Melhore</span>.
            </p>
          </motion.div>
        )}

      </main>

      {/* FOOTER METADATA - Static lock-in screen footer */}
      <footer className="p-3 border-t border-slate-900 text-center text-[10px] text-slate-600 bg-slate-950">
        <p>Espelho do Presidente • Dispositivo Sincronizado</p>
      </footer>

    </div>
  );
}
