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
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime } = timerState;

  // Local storage persisted preferences
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('president_compact_mode') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('president_pinned_mode') === 'true';
    } catch (_) {
      return false;
    }
  });

  const toggleCompact = () => {
    const next = !isCompact;
    setIsCompact(next);
    try {
      localStorage.setItem('president_compact_mode', String(next));
    } catch (_) {}
  };

  const togglePinned = () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem('president_pinned_mode', String(next));
    } catch (_) {}
  };

  const openInWindow = () => {
    try {
      // Open in a separate popup window
      const url = `/?mode=president-compact`;
      window.open(url, 'presidentCompact', 'width=520,height=630,resizable=yes,scrollbars=yes');
    } catch (err) {
      console.warn('Erro ao abrir em nova janela, abrindo aba normal:', err);
      window.open(`/?mode=president-compact`, '_blank');
    }
  };

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
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer active:scale-95"
              title="Voltar ao Portal"
            >
              <DoorOpen className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">Presidente Compacto</h1>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Acompanhamento Discreto</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 py-1 px-3 rounded-full border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {isConnected ? 'Sincronizado' : 'Conectando'}
              </span>
            </div>
          </div>
        </header>
      ) : (
        /* TINY HEADER UNDER PINNED MODE */
        <div className="py-2 px-3 bg-slate-900/60 border border-slate-800/50 rounded-xl flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <AnalogueClock type="presidente" />
            Presidente Compacto
          </span>
          <div className="flex items-center gap-3">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <button
              onClick={togglePinned}
              className="text-[9px] font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-0.5"
              title="Mostrar menus adicionais"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 px-4 w-full max-w-md mx-auto space-y-4">
        
        {/* REUSED STOPWATCH VIEW */}
        <div className="w-full">
          <TimerCard
            timerState={timerState}
            systemConfig={systemConfig}
            isReadOnly={true}
            isCompact={isCompact}
            isConnected={isConnected}
          />
        </div>

        {/* COMPLEMENTARY REVEAL DETAILS PANEL (hidden in compact mode) */}
        {!isCompact && (
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

        {/* QUICK OPTION TOOGLES PANEL */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2">
          {/* Toggle Compact Mode */}
          <button
            type="button"
            onClick={toggleCompact}
            className={`py-2 px-2.5 border rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer ${
              isCompact
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-white'
            }`}
            title="Mostra apenas os dígitos do cronômetro e a designação"
          >
            <span>📌</span>
            <span>{isCompact ? 'Expandido' : 'Compactar'}</span>
          </button>

          {/* Toggle Pinned Mode */}
          <button
            type="button"
            onClick={togglePinned}
            className={`py-2 px-2.5 border rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer ${
              isPinned
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-white'
            }`}
            title="Esconde barras de navegação para maximizar o foco e encaixar em janelas pequenas"
          >
            <span>📍</span>
            <span>{isPinned ? 'Desafixar' : 'Fixar'}</span>
          </button>

          {/* Open in external windows popup */}
          <button
            type="button"
            onClick={openInWindow}
            className="py-2 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer"
            title="Abre este mini-timer em uma janela popup do navegador"
          >
            <ExternalLink className="w-3 h-3 text-slate-400" />
            <span>Na Janela</span>
          </button>
        </div>

      </main>

      {/* FOOTER METADATA */}
      {!isPinned ? (
        <footer className="p-4 border-t border-slate-900/50 text-center text-[10px] text-slate-500 select-none bg-slate-950/80">
          <p>Sincronizador de Tempo • Espelho do Presidente v1.0</p>
        </footer>
      ) : (
        <button
          onClick={togglePinned}
          className="w-full py-1.5 text-[9px] bg-slate-900/40 hover:bg-slate-900 text-slate-500 hover:text-slate-300 text-center cursor-pointer uppercase font-semibold border-t border-slate-900/20"
        >
          Sair da Visualização Fixada
        </button>
      )}

    </div>
  );
}
