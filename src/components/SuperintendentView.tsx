import { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff, Clock, User, ClipboardList, TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { TimerState, ScheduleItem } from '../types';

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

  // Format any seconds into elegant text
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

  // Difference format (e.g. +01:23, -00:45)
  const formatDifferenceValue = (diff: number) => {
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60);
    const secs = absDiff % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  const getDifferenceFormatted = (expected: number, actual: number) => {
    return formatDifferenceValue(actual - expected);
  };

  // Find active participant details
  const activeItem = schedule.find((item) => item.id === activeId);

  // Background color rules depending on timer status
  let bgColorClass = 'bg-slate-900';
  let bannerColorClass = 'border-slate-800 text-slate-300';
  
  if (isRunning) {
    if (currentTime === 0) {
      bgColorClass = 'bg-red-950/20';
      bannerColorClass = 'border-red-500/20 text-red-400 bg-red-500/5';
    } else if (mode === 'regressive' && currentTime <= 30) {
      bgColorClass = 'bg-amber-950/25';
      bannerColorClass = 'border-amber-500/20 text-amber-400 bg-amber-500/5';
    } else {
      bgColorClass = 'bg-slate-900';
      bannerColorClass = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
    }
  }

  // Calculate high-level metrics for Summary Panel
  const completedParts = schedule.filter((item) => item.status === 'completed');
  const countTotal = schedule.length;
  const countCompleted = completedParts.length;

  let countWithinTime = 0;
  let countOverTime = 0;
  let totalDifference = 0;

  completedParts.forEach((item) => {
    if (item.completedTime !== null) {
      const diff = item.completedTime - item.expectedTime;
      totalDifference += diff;
      if (diff <= 0) {
        countWithinTime++;
      } else {
        countOverTime++;
      }
    }
  });

  const avgDifferenceSecs = countCompleted > 0 ? Math.round(totalDifference / countCompleted) : 0;
  const avgDifferenceText = formatDifferenceValue(avgDifferenceSecs);

  return (
    <div className={`min-h-screen ${bgColorClass} text-slate-100 flex flex-col justify-between font-sans transition-colors duration-500`}>
      {/* Read-Only Top Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-850"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Voltar</span>
          </button>

          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            Superintendente de Circuito
            <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold px-2 py-0.5 rounded-full select-none uppercase">
              Leitura-Única
            </span>
          </h1>

          {/* Connection badge */}
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

      {/* Primary Workspace */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 space-y-6 pb-12">
        
        {/* UPPER STATUS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Real-time Giant Stopwatch Mirror block (Left Side of Status) */}
          <div className="md:col-span-6 bg-slate-950/60 border border-slate-850 rounded-2xl p-6 shadow-xl relative flex flex-col justify-center items-center text-center overflow-hidden min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-4">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Cronômetro Sincronizado
            </span>

            {/* Giant color-coded timer preview */}
            <div className={`text-6xl md:text-7xl font-mono font-bold tracking-widest leading-none my-2 transition-colors ${
              isRunning 
                ? (currentTime === 0 ? 'text-red-500 animate-pulse' : (mode === 'regressive' && currentTime <= 30 ? 'text-amber-400 font-extrabold' : 'text-emerald-400'))
                : 'text-slate-500'
            }`}>
              {formatTime(currentTime)}
            </div>

            {/* Meta state line */}
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-2">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
            </div>

            {/* Visual banner warnings */}
            {isRunning && currentTime === 0 && (
              <div className="mt-4 px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tempo Limite Excedido! (Estourado: {formatTime(elapsedTime - initialDuration)})
              </div>
            )}
            {isRunning && mode === 'regressive' && currentTime <= 30 && currentTime > 0 && (
              <div className="mt-4 px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Atenção: Menos de 30s!
              </div>
            )}
          </div>

          {/* Active Participant Details with Avatar (Right Side of Status) */}
          <div className="md:col-span-6 bg-slate-950/60 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[220px]">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Participante em Exibição
            </span>

            {activeItem ? (
              <div className="flex items-center gap-4 my-2">
                {/* Visual Avatar Placeholder */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border text-slate-300 shadow-md ${
                  currentTime === 0 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : (mode === 'regressive' && currentTime <= 30 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/20')
                }`}>
                  <User className="w-8 h-8 opacity-80" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 w-fit px-2 py-0.5 rounded-md">
                    {activeItem.partType}
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight lead-none">
                    {activeItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Planejado: {Math.floor(activeItem.expectedTime / 60)} min
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 my-2 text-slate-500 text-sm italic flex flex-col items-center gap-1">
                <User className="w-8 h-8 opacity-30 mb-1 animate-pulse" />
                Sem participante ativo no momento.
                <span className="text-xs text-slate-600 block not-italic">O operador da mídia precisa carregar uma parte.</span>
              </div>
            )}

            {/* Operational real-time statistics if participant active */}
            {activeItem && (
              <div className={`mt-2 border-t pt-3 flex items-center justify-between text-xs font-mono font-medium ${bannerColorClass}`}>
                <span>Tempo Realizado: <b className="text-white font-bold">{formatTime(elapsedTime)}</b></span>
                <span>Desvio: <b className="text-white font-bold">{getDifferenceFormatted(activeItem.expectedTime, elapsedTime)}</b></span>
              </div>
            )}
          </div>

        </div>

        {/* HIGH-LEVEL MEETING SUMMARY (Automatic calculation / Real-time updates) */}
        <section id="superintendent-summary" className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Resumo da Reunião (Métricas Consolidadas)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Total Schedule Count */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">Total de Partes</span>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{countTotal}</span>
                <span className="text-xs text-slate-500 font-medium">({countCompleted} conc.)</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${countTotal > 0 ? (countCompleted / countTotal) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Within expected duration stats */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">No Tempo Estimado</span>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {countCompleted > 0 ? countWithinTime : 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({countCompleted > 0 ? Math.round((countWithinTime / countCompleted) * 100) : 0}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Concluíram dentro da meta
              </div>
            </div>

            {/* Overtime duration stats */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">Excederam o Tempo</span>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-400">
                  {countCompleted > 0 ? countOverTime : 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({countCompleted > 0 ? Math.round((countOverTime / countCompleted) * 100) : 0}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                Ultrapassaram o planejado
              </div>
            </div>

            {/* Average deviation stats */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">Desvio Médio Geral</span>
              <div className="my-1.5">
                <span className={`text-xl font-bold font-mono tracking-tight ${
                  avgDifferenceSecs > 0 ? 'text-red-400' : (avgDifferenceSecs < 0 ? 'text-indigo-400' : 'text-slate-300')
                }`}>
                  {avgDifferenceText}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-none">
                {avgDifferenceSecs > 0 
                  ? 'Média de atraso por parte' 
                  : (avgDifferenceSecs < 0 ? 'Média de folga por parte' : 'Média dentro do esperado')
                }
              </div>
            </div>

          </div>
        </section>

        {/* MEETING DETAILED SESSION HISTORY TABLE */}
        <section id="superintendent-history-table" className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Histórico de Conclusão da Reunião</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <th className="p-3.5 font-bold">Participante / Parte</th>
                  <th className="p-3.5 font-bold">Tempo Previsto</th>
                  <th className="p-3.5 font-bold">Tempo Realizado</th>
                  <th className="p-3.5 font-bold text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 select-none italic">
                      Nenhuma parte cadastrada no cronograma.
                    </td>
                  </tr>
                ) : (
                  schedule.map((item, index) => {
                    const isCompleted = item.status === 'completed';
                    const isItemActive = item.id === activeId;
                    
                    let rowBg = 'hover:bg-slate-900/40';
                    if (isItemActive) {
                      rowBg = 'bg-indigo-900/5 hover:bg-indigo-900/10 font-medium';
                    }

                    return (
                      <tr key={item.id} className={`${rowBg} transition-colors`}>
                        <td className="p-3.5">
                          <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            {item.name}
                            {isItemActive && (
                              <span className="text-[9px] bg-blue-500/15 text-blue-400 font-bold border border-blue-500/20 px-1.5 py-0.2 rounded uppercase tracking-wide animate-pulse">
                                Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{item.partType}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {formatTime(item.expectedTime)}
                        </td>
                        <td className="p-3.5 font-mono">
                          {isCompleted && item.completedTime !== null ? (
                            <span className="text-slate-200">{formatTime(item.completedTime)}</span>
                          ) : isItemActive ? (
                            <span className="text-emerald-400 animate-pulse">{formatTime(elapsedTime)} (em and.)</span>
                          ) : (
                            <span className="text-slate-600">Pendente</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          {isCompleted && item.completedTime !== null ? (
                            (() => {
                              const diff = item.completedTime - item.expectedTime;
                              const isOver = diff > 0;
                              return (
                                <span className={isOver ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {formatDifferenceValue(diff)}
                                </span>
                              );
                            })()
                          ) : isItemActive ? (
                            (() => {
                              const diff = elapsedTime - item.expectedTime;
                              const isOver = diff > 0;
                              return (
                                <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                  {formatDifferenceValue(diff)}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-900/50 bg-slate-950/80 text-center text-xs text-slate-500 z-10 select-none">
        <p>Cronograma do Superintendente de Circuito • Sincronização em Tempo Real</p>
      </footer>
    </div>
  );
}
