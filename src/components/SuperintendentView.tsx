import { useState, useEffect } from 'react';
import { DoorOpen, Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { TimerState } from '../types';
import { motion } from 'motion/react';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';

interface SuperintendentViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
}

export default function SuperintendentView({
  timerState,
  isConnected,
  onBack,
}: SuperintendentViewProps) {
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime } = timerState;

  // Format any seconds into MM:SS
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

  // Format result diff
  const formatResultDiff = (diffVal: number) => {
    const absDiff = Math.abs(diffVal);
    const mins = Math.floor(absDiff / 60);
    const secs = absDiff % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = diffVal > 0 ? '+' : diffVal < 0 ? '-' : '';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  const getExplanationText = (diffVal: number) => {
    if (diffVal === 0) return 'Dentro do tempo';
    const absDiff = Math.abs(diffVal);
    const minsVal = Math.floor(absDiff / 60);
    const secsVal = absDiff % 60;
    
    let textStr = '';
    if (minsVal > 0) {
      textStr += `${minsVal} min `;
    }
    if (secsVal > 0 || minsVal === 0) {
      textStr += `${secsVal} segundos`;
    }
    
    if (diffVal > 0) {
      return `Excedeu ${textStr}`;
    } else {
      return `Terminou ${textStr} antes`;
    }
  };

  // Color logic for the stopwatch:
  // Verde = tempo normal
  // Amarelo = restam 30 segundos
  // Vermelho = tempo esgotado
  let isOvertime = false;
  let isUnder30s = false;

  if (mode === 'regressive') {
    if (currentTime <= 0) {
      isOvertime = true;
    } else if (currentTime <= 30) {
      isUnder30s = true;
    }
  } else {
    if (currentTime >= initialDuration) {
      isOvertime = true;
    } else if (initialDuration - currentTime <= 30) {
      isUnder30s = true;
    }
  }

  let stopwatchBgClass = 'bg-emerald-600';
  if (isOvertime) {
    stopwatchBgClass = 'bg-red-600';
  } else if (isUnder30s) {
    stopwatchBgClass = 'bg-amber-500';
  }

  // Find the latest completed item to display result
  const completedItems = schedule.filter(item => item.status === 'completed');
  const latestCompleted = completedItems[completedItems.length - 1];

  let resultCard = null;
  if (latestCompleted) {
    const expected = latestCompleted.expectedTime;
    const actual = latestCompleted.completedTime || 0;
    const diff = actual - expected;

    let highlightColorClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400';
    let label = '🟢 Dentro do tempo';
    let icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;

    if (diff > 0) {
      if (diff <= 30) {
        highlightColorClass = 'border-amber-500/40 bg-amber-950/20 text-amber-400';
        label = '🟡 Pequeno excesso';
        icon = <AlertTriangle className="w-12 h-12 text-amber-400 animate-pulse" />;
      } else {
        highlightColorClass = 'border-red-500/40 bg-red-950/20 text-red-500';
        label = '🔴 Excesso significativo';
        icon = <XCircle className="w-12 h-12 text-red-500 animate-bounce" />;
      }
    }

    resultCard = (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-lg mx-auto p-8 rounded-3xl border-2 shadow-2xl backdrop-blur-md text-center space-y-6 ${highlightColorClass}`}
      >
        <div className="flex justify-center">{icon}</div>
        
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Resultado da Parte Terminada
        </h2>

        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-bold uppercase">{latestCompleted.name}</p>
          <p className="text-lg font-black text-white">{latestCompleted.partType}</p>
        </div>

        <div className="py-4 border-y border-white/5 space-y-2">
          <div className="text-5xl font-mono font-black tracking-wider text-white">
            {formatResultDiff(diff)}
          </div>
          <div className="text-sm font-black uppercase tracking-wider">
            {getExplanationText(diff)}
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            {label}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

       {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4 sticky top-0 z-35">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <SystemModuleReturnIcon onClick={onBack} />

          <div className="flex flex-col items-center gap-1 select-none">
            <AnalogueClock type="presidente" />
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">Presidente</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-450" /> : <WifiOff className="w-3.5 h-3.5 text-red-2400" />}
            <span>{isConnected ? '🟢 ONLINE' : '🔴 DESCONECTADO'}</span>
          </div>
        </div>
      </header>

      {/* Primary Clean Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex items-center justify-center relative z-10">
        {isRunning ? (
          /* Estado Durante a Parte: EXIBE APENAS CRONÔMETRO CENTRALIZADO */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-2xl aspect-[16/10] rounded-3xl ${stopwatchBgClass} shadow-2xl flex flex-col items-center justify-center text-white transition-colors duration-700 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/10 pointer-events-none" />
            <div className="font-mono text-[14vw] sm:text-[10rem] font-bold tracking-tighter select-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              {formatTime(currentTime)}
            </div>
            {isOvertime && (
              <div className="absolute bottom-8 text-xs font-black uppercase tracking-widest bg-black/30 border border-white/10 px-4 py-1.5 rounded-full animate-bounce">
                Tempo Esgotado
              </div>
            )}
          </motion.div>
        ) : (
          /* Estado Após o Encerramento: EXIBE CARD DO ÚLTIMO RESULTADO */
          resultCard ? (
            resultCard
          ) : (
            <div className="text-center space-y-3 bg-slate-900/40 p-12 rounded-3xl border border-slate-850 max-w-md">
              <Clock className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Aguardando Início</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nenhum cronômetro ativo e nenhum participante concluído no momento. Os resultados aparecerão instantaneamente quando a primeira parte for finalizada.
              </p>
            </div>
          )
        )}
      </main>

      {/* Clean elegant bottom rail */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 select-none">
        <p>Gabinete do Presidente • Sincronização em Tempo Real</p>
      </footer>
    </div>
  );
}
