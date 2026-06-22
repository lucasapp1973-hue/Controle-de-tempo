import { useState, useEffect } from 'react';
import { DoorOpen, Wifi, WifiOff, LayoutGrid, Minimize2, Maximize2, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause, BookOpen, Lightbulb, Speech, Heart } from 'lucide-react';
import { TimerState, ScheduleItem } from '../types';
import { motion } from 'motion/react';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import TimerCard from './TimerCard';
import { licoesService } from '../services/licoesService';
import { LICOES_MELHORE_DATA } from '../data/licoes';

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

  // Initialize and load brochures on startup
  useEffect(() => {
    licoesService.fetchBrochuras();
  }, []);

  // Find the currently active schedule participant
  const activeItem = schedule.find((item) => item.id === activeId);

  // Dynamically load lessons for the active item's brochure
  useEffect(() => {
    if (activeItem?.avaliada && activeItem?.brochuraId) {
      licoesService.fetchLicoesByBrochura(activeItem.brochuraId);
    }
  }, [activeItem?.brochuraId, activeItem?.avaliada]);

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

        {/* NEW SYSTEM-WIDE DEFINITIVE BROCHURE LESSON DETAILED PANEL */}
        {activeItem && activeItem.avaliada && activeItem.brochuraId && activeItem.licaoNumero && (
          (() => {
            const currentBrochuraNome = licoesService.getBrochuraNome(activeItem.brochuraId);
            const currentLicao = licoesService.getLicao(activeItem.brochuraId, activeItem.licaoNumero);

            if (!currentLicao) {
              return (
                <div className="w-full bg-slate-900 border border-slate-850 rounded-3xl p-6 text-center text-xs text-slate-500">
                  Carregando conteúdo da lição...
                </div>
              );
            }

            const isAmePessoas = activeItem.brochuraId === 'ame_pessoas';
            const theme = isAmePessoas
              ? {
                  border: "border-rose-500/40",
                  headerDivider: "border-rose-950",
                  iconBg: "bg-rose-500",
                  textBadge: "text-rose-450",
                  nodeTitle: "text-rose-400 border-rose-650",
                  bullet: "text-rose-500",
                  dicaBg: "bg-rose-950/15 border border-rose-900/10",
                  dicaText: "text-rose-100",
                  icon: <Heart className="w-5 h-5 text-white animate-pulse" />
                }
              : {
                  border: "border-indigo-500/40",
                  headerDivider: "border-indigo-950",
                  iconBg: "bg-indigo-600",
                  textBadge: "text-indigo-400",
                  nodeTitle: "text-indigo-400 border-indigo-650",
                  bullet: "text-indigo-500",
                  dicaBg: "bg-indigo-950/15 border border-indigo-900/30",
                  dicaText: "text-indigo-100",
                  icon: <BookOpen className="w-5 h-5 text-white" />
                };

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full bg-slate-900 border-2 ${theme.border} rounded-3xl p-6 shadow-2xl space-y-4`}
              >
                {/* Header */}
                <div className={`flex items-center gap-3 border-b ${theme.headerDivider} pb-3`}>
                  <div className={`${theme.iconBg} rounded-xl p-2 text-white`}>
                    {theme.icon}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${theme.textBadge} block`}>
                      {currentBrochuraNome}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                      Lição {currentLicao.numero} — {currentLicao.titulo}
                    </h3>
                  </div>
                </div>

                {/* Content Nodes */}
                <div className="space-y-3 pt-1">
                  {(() => {
                    const isMelhore = activeItem.brochuraId === 'melhore';
                    const melhoreData = isMelhore ? LICOES_MELHORE_DATA.find(lm => lm.numero === activeItem.licaoNumero) : null;

                    if (isMelhore && melhoreData) {
                      return (
                        <div className="space-y-4 font-sans text-left">
                          {/* 1. Titulo da licao e objetivo (Comece bem (negrito): objetivo) */}
                          <div className="text-xs sm:text-sm text-slate-350 leading-relaxed font-normal">
                            <strong className="text-white font-extrabold text-[#ffffff]">{melhoreData.titulo}: </strong> 
                            {melhoreData.objetivo}
                          </div>

                          {/* 2. Seções Como Fazer / Na pregação */}
                          <div className="space-y-4">
                            {melhoreData.comoFazer.map((cf, cfIdx) => {
                              const isNaPregacao = cf.titulo.toLowerCase().trim().replace(/ç/g, 'c').replace(/ã/g, 'a') === 'na pregacao';

                              if (isNaPregacao) {
                                return (
                                  <div key={cfIdx} className="bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-2xl flex items-start gap-2.5 mt-3 text-left transition-all">
                                    <Speech className="w-4.5 h-4.5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                                    <div className="space-y-0.5 leading-relaxed text-xs sm:text-sm text-slate-300">
                                      <strong className="text-purple-400 font-extrabold">Na pregação: </strong>
                                      {cf.descricao}
                                    </div>
                                  </div>
                                );
                              }

                              // Segment description and "Dica"
                              const { descricaoPrincipal, dica } = (() => {
                                const parts = cf.descricao.split(/(?:Dica:)/i);
                                if (parts.length > 1) {
                                  return {
                                    descricaoPrincipal: parts[0].trim(),
                                    dica: parts[1].trim()
                                  };
                                }
                                return { descricaoPrincipal: cf.descricao.trim() };
                              })();

                              return (
                                <div key={cfIdx} className="space-y-2">
                                  {/* Bullet point */}
                                  <div className="flex gap-2.5 items-start pl-1 sm:pl-2">
                                    <span className="text-indigo-500 font-black select-none text-base">•</span>
                                    <p className="text-slate-350 text-xs sm:text-sm font-medium leading-relaxed flex-1 break-words">
                                      <strong className="text-white font-extrabold text-[#ffffff]">{cf.titulo}: </strong>
                                      {descricaoPrincipal}
                                    </p>
                                  </div>

                                  {/* Embedded tip (Dica) if present */}
                                  {dica && (
                                    <div className="bg-amber-950/10 border border-amber-900/20 p-3 px-4 rounded-xl flex items-start gap-2.5 ml-6 sm:ml-8 transition-all">
                                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5 font-sans leading-relaxed text-xs text-amber-100">
                                        <strong className="text-amber-400 font-extrabold">Dica: </strong>
                                        {dica}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Standard dynamic fullback node mapper for fallback/dynamic/other brochures info
                    return currentLicao.conteudo.map((node, idx) => {
                      switch (node.tipo) {
                        case 'titulo':
                          return (
                            <h4 
                              key={idx} 
                              className={`text-xs sm:text-sm font-black ${theme.nodeTitle} uppercase tracking-wide mt-4 border-l-2 pl-2.5`}
                            >
                              {node.texto}
                            </h4>
                          );
                        case 'paragrafo':
                          return (
                            <p 
                              key={idx} 
                              className="text-slate-350 text-xs sm:text-sm font-normal leading-relaxed break-words whitespace-pre-wrap text-left"
                            >
                              {node.texto}
                            </p>
                          );
                        case 'bullet':
                          return (
                            <div key={idx} className="flex gap-2.5 items-start pl-1 sm:pl-2 text-left">
                              <span className={`${theme.bullet} font-bold select-none`}>•</span>
                              <p className="text-slate-350 text-xs sm:text-sm font-medium leading-relaxed flex-1 break-words">
                                {node.texto}
                              </p>
                            </div>
                          );
                        case 'dica':
                          return (
                            <div 
                              key={idx} 
                              className={`${theme.dicaBg} p-4 rounded-2xl flex items-start gap-3 mt-2 text-left`}
                            >
                              <Lightbulb className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-amber-450 uppercase tracking-widest block">Dica</span>
                                <p className={`text-xs font-semibold ${theme.dicaText} leading-relaxed break-words whitespace-pre-wrap`}>
                                  {node.texto}
                                </p>
                              </div>
                            </div>
                          );
                        case 'pregacao':
                          return (
                            <div 
                              key={idx} 
                              className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-2xl flex items-start gap-3 mt-2 text-left"
                            >
                              <Speech className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Na Pregação</span>
                                <p className="text-xs font-semibold text-purple-100 leading-relaxed break-words whitespace-pre-wrap">
                                  {node.texto}
                                </p>
                              </div>
                            </div>
                          );
                        default:
                          return null;
                      }
                    });
                  })()}
                </div>
              </motion.div>
            );
          })()
        )}

      </main>

      {/* FOOTER METADATA - Static lock-in screen footer */}
      <footer className="p-3 border-t border-slate-900 text-center text-[10px] text-slate-600 bg-slate-950">
        <p>Espelho do Presidente • Dispositivo Sincronizado</p>
      </footer>

    </div>
  );
}
