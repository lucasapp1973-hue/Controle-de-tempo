import { useState, useEffect } from 'react';
import { DoorOpen, Wifi, WifiOff, LayoutGrid, Minimize2, Maximize2, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause, BookOpen } from 'lucide-react';
import { TimerState, ScheduleItem } from '../types';
import { motion } from 'motion/react';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import TimerCard from './TimerCard';
import { licoesService } from '../services/licoesService';

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
  const [localElapsedTime, setLocalElapsedTime] = useState(elapsedTime);

  // Sync local client-side elapsed clock with official server-side state broadcasts
  useEffect(() => {
    setLocalElapsedTime(elapsedTime);
  }, [elapsedTime]);

  // Keep local elapsed time incrementing in real-time between official broadcasts (buttery smooth ticking)
  useEffect(() => {
    if (!isRunning || isStopped) return;

    const interval = setInterval(() => {
      setLocalElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isStopped]);

  // Initialize and load lessons cache once
  useEffect(() => {
    licoesService.fetchLicoes();
  }, []);

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
    // Determine overtime based on elapsed time vs expected duration
    isOvertime = localElapsedTime >= activeItem.expectedTime;
    // Difference continues tracking elapsed seconds vs the expected duration
    diffSecs = localElapsedTime - activeItem.expectedTime;
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
      statusBgClass = 'bg-red-500/15 border-red-500/30 text-red-100 font-extrabold animate-pulse';
      statusIcon = <ShieldAlert className="w-4 h-4 text-red-400" />;
    } else {
      statusText = 'Dentro do Tempo';
      statusBgClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-extrabold';
      statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-between transition-all duration-300">
      
      {/* Standardized Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 pt-8 pb-4 sm:pt-10 sticky top-0 z-35 text-slate-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative min-h-[46px]">
          {/* Back button */}
          <div className="z-10 flex items-center">
            <SystemModuleReturnIcon onClick={onBack} />
          </div>

          {/* Centered Clock & Title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
            <div className="flex flex-col items-center gap-1">
              <AnalogueClock type="presidente" />
              <span className="text-sm sm:text-base md:text-lg font-black tracking-widest text-white uppercase">Presidente</span>
            </div>
          </div>

          {/* Wifi status on right */}
          <div
            className={`z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-450" /> : <WifiOff className="w-3.5 h-3.5 text-red-450" />}
            <span className="hidden sm:inline">{isConnected ? 'ONLINE' : 'DESCONECTADO'}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-6 px-4 w-full max-w-md mx-auto space-y-5">
        
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

        {/* COMPLEMENTARY REVEAL DETAILS PANEL (ALWAYS VISIBLE & REFORMULATED PRODUCING EXTREME VISIBILITY) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
        >
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-450">Dados da Parte Ativa</span>
            {activeItem && isRunning && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                EM ANDAMENTO
              </span>
            )}
          </div>

          {/* Structured info grid - Amplified & highly visible */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex flex-col justify-center min-h-[72px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Orador / Participante</span>
              <span className="text-xl sm:text-2xl font-black text-white block truncate">
                {activeItem ? activeItem.name : 'Nenhum Ativo'}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex flex-col justify-center min-h-[72px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Designação (Parte)</span>
              <span className="text-lg sm:text-xl font-black text-indigo-400 block truncate">
                {activeItem ? activeItem.partType : 'Aguardando Início'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex flex-col justify-center text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tempo Previsto</span>
                <span className="text-2xl font-mono font-black text-slate-100 block">
                  {activeItem ? formatTime(activeItem.expectedTime) : '00:00'}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex flex-col justify-center text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tempo Realizado</span>
                <span className="text-2xl font-mono font-black text-amber-400 block">
                  {activeItem ? formatTime(localElapsedTime) : '00:00'}
                </span>
              </div>
            </div>
          </div>

          {/* SPECIAL FIELD: Status do Tempo Indicator - Amplified */}
          {activeItem && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${statusBgClass} shadow-md`}>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-slate-950/30">
                  {statusIcon}
                </div>
                <span className="text-sm sm:text-base font-black uppercase tracking-wide">{statusText}</span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-mono font-black">{formatDiffTime(diffSecs)}</span>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider">Diferença</span>
              </div>
            </div>
          )}
          
          {/* MANUAL CONSELHOS MELHORE MENTION */}
          <p className="text-[10px] text-slate-500 text-center italic">
            Acompanhamento projetado para o uso de tempo em conformidade com o manual <span className="font-semibold text-slate-400">Melhore</span>.
          </p>
        </motion.div>

        {/* SPECIAL PANEL: ACTIVE MELHORE BROCHURE LESSON */}
        {activeItem && activeItem.avaliada && activeItem.licaoNumero && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
          >
            {/* Lesson Header */}
            <div className="flex items-center gap-3 border-b border-indigo-950 pb-3">
              <div className="bg-indigo-600 rounded-xl p-2 text-white">
                <BookOpen className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">Brochura "Melhore"</span>
                <h3 className="text-base font-black text-white leading-tight">
                  Lição {activeItem.licaoNumero} — {licoesService.getLicaoByNumero(activeItem.licaoNumero)?.titulo || 'Conselho'}
                </h3>
              </div>
            </div>

            {/* Objective */}
            <div className="bg-indigo-950/15 border border-indigo-900/30 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Objetivo da Lição</span>
              <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                {licoesService.getLicaoByNumero(activeItem.licaoNumero)?.objetivo}
              </p>
            </div>

            {/* Resumo/Key points (Highlighted) */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Resumo de Ações</span>
              <div className="flex flex-wrap gap-1.5">
                {licoesService.getLicaoByNumero(activeItem.licaoNumero)?.resumoCurto.map((resumo, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-600/15 border border-indigo-500/35 text-indigo-300 font-extrabold text-[11px] px-3 py-1 rounded-full shadow-sm"
                  >
                    ✦ {resumo}
                  </span>
                ))}
              </div>
            </div>

            {/* Como Fazer steps */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Conselhos / Como Fazer</span>
              <div className="space-y-2.5">
                {licoesService.getLicaoByNumero(activeItem.licaoNumero)?.comoFazer.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl space-y-1">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wide">
                      {idx + 1}. {item.titulo}
                    </h4>
                    <p className="text-[11.5px] font-normal text-slate-300 leading-relaxed">
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
