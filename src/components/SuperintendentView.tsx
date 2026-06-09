import { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff, Clock, User, ClipboardList, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
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

  // Format any seconds into elegant MM:SS or HH:MM:SS text
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
    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
    
    if (diff === 0) return '00:00';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  const getDifferenceFormatted = (expected: number, actual: number) => {
    return formatDifferenceValue(actual - expected);
  };

  // Find active participant details
  const activeItem = schedule.find((item) => item.id === activeId);

  // Reproduzir os mesmos estados do Display:
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
    // progressive
    if (currentTime >= initialDuration) {
      isOvertime = true;
    } else if (initialDuration - currentTime <= 30) {
      isUnder30s = true;
    }
  }

  // Choose alert visual color state: Verde, Amarelo, Vermelho
  let stateLabel = 'VERDE (Tempo Normal)';
  let stateColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let stateDotClass = 'bg-emerald-400';
  let informativeMessage = '';

  if (isOvertime) {
    stateLabel = 'VERMELHO (Tempo Esgotado)';
    stateColorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
    stateDotClass = 'bg-red-500';
    informativeMessage = 'Tempo esgotado';
  } else if (isUnder30s) {
    stateLabel = 'AMARELO (Atenção)';
    stateColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    stateDotClass = 'bg-amber-500';
    informativeMessage = '30 segundos restantes';
  }

  // Calculate high-level metrics for Meeting Statistics (Estatísticas da Reunião)
  const completedParts = schedule.filter((item) => item.status === 'completed');
  const countTotal = schedule.length;
  const countCompleted = completedParts.length;

  let countWithinTime = 0; // dentro do tempo (realizado === previsto, diff === 0)
  let countOverTime = 0;   // acima do tempo (realizado > previsto, diff > 0)
  let countUnderTime = 0;  // abaixo do tempo (realizado < previsto, diff < 0)
  let totalDifference = 0;

  completedParts.forEach((item) => {
    if (item.completedTime !== null) {
      const diff = item.completedTime - item.expectedTime;
      totalDifference += diff;
      if (diff === 0) {
        countWithinTime++;
      } else if (diff > 0) {
        countOverTime++;
      } else {
        countUnderTime++;
      }
    }
  });

  const avgDifferenceSecs = countCompleted > 0 ? Math.round(totalDifference / countCompleted) : 0;
  const avgDifferenceText = formatDifferenceValue(avgDifferenceSecs);

  return (
    <div className="min-h-screen bg-slate-900 border-slate-800 text-slate-100 flex flex-col justify-between font-sans">
      {/* Read-Only Top Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-850"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-bold">Voltar ao Portal</span>
          </button>

          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2 uppercase">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            Painel do Superintendente da Escola
            <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold px-2 py-0.5 rounded-full select-none ml-1">
              SOMENTE LEITURA
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
            <span>{isConnected ? 'ONLINE' : 'DISCONNECT_RETRY'}</span>
          </div>
        </div>
      </header>

      {/* Primary Workspace */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 space-y-6 pb-12 mt-2">
        
        {/* UPPER STATUS GRID - ACTIVE PRESENTATION MONITOR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Synchronized Stopwatch Mirror Display (Left Card) */}
          <div className="md:col-span-5 bg-slate-950/60 border border-slate-850 rounded-2xl p-6 shadow-xl relative flex flex-col justify-center items-center text-center overflow-hidden min-h-[240px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-indigo-400" />
              Cronômetro
            </span>

            {/* Giant synchronized numbers */}
            <div className={`text-6xl md:text-7xl font-mono font-bold tracking-widest leading-none my-1.5 ${
              isRunning 
                ? (isOvertime ? 'text-red-500 animate-pulse font-extrabold' : (isUnder30s ? 'text-amber-400 font-extrabold' : 'text-emerald-400'))
                : 'text-slate-400'
            }`}>
              {formatTime(currentTime)}
            </div>

            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-2">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
            </div>

            {/* Active alert indicator in sync with Display */}
            <div className={`mt-4 px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 ${stateColorClass}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${stateDotClass} ${isOvertime ? 'animate-ping' : ''}`} />
              {stateLabel}
            </div>

            {/* Informative text notification block */}
            {informativeMessage && (
              <div className="mt-3 text-sm font-extrabold text-white uppercase tracking-wider bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg animate-pulse">
                &ldquo;{informativeMessage}&rdquo;
              </div>
            )}
          </div>

          {/* Complete Information about Active Student Group (Right Card) */}
          <div className="md:col-span-7 bg-slate-950/60 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[240px]">
            <div>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-4">
                Informações da Parte Atual
              </span>

              {activeItem ? (
                <div className="space-y-4">
                  {/* Detailed Field Pairs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Participante:</span>
                      <span className="text-base sm:text-lg font-black text-white">{activeItem.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Parte (Tipo):</span>
                      <span className="text-base sm:text-lg font-black text-indigo-300">{activeItem.partType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-850 pt-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block mb-0.5">Tempo Previsto:</span>
                      <span className="text-lg font-mono font-bold text-slate-300">{formatTime(activeItem.expectedTime)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block mb-0.5">Tempo Realizado:</span>
                      <span className="text-lg font-mono font-bold text-emerald-400">
                        {formatTime(elapsedTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block mb-0.5">Diferença:</span>
                      <span className={`text-lg font-mono font-bold ${elapsedTime - activeItem.expectedTime > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {getDifferenceFormatted(activeItem.expectedTime, elapsedTime)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                  <User className="w-10 h-10 text-slate-700 animate-pulse" />
                  <p className="font-medium">Nenhum participante ativo no momento.</p>
                  <span className="text-xs text-slate-600 block">Aguardando o operador acionar ou carregar um estudante.</span>
                </div>
              )}
            </div>

            {activeItem && isRunning && (
              <div className="border-t border-slate-850/60 pt-3 mt-4 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>• Ativo no Display em Tempo Real</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sincronizado
                </span>
              </div>
            )}
          </div>

        </div>

        {/* ESTATÍSTICAS DA REUNIÃO (Automatic Meeting Statistics - Calculated after sections complete) */}
        <section id="meeting-statistics-panel" className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Estatísticas da Reunião (Gerado Automaticamente)</h2>
            </div>
            {countCompleted > 0 && (
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-bold">
                {countCompleted} de {countTotal} Concluídos
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Total de Participantes */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Participantes</span>
              <div className="my-2 text-3xl font-black text-white">{countTotal}</div>
              <div className="text-[10px] text-slate-500">Agendados no cronograma</div>
            </div>

            {/* Dentro do Tempo (diff === 0) */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dentro do Tempo</span>
              <div className="my-2 text-3xl font-black text-indigo-400">{countWithinTime}</div>
              <div className="text-[10px] text-slate-500">Exatamente na meta prevista</div>
            </div>

            {/* Acima do Tempo (diff > 0) */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Acima do Tempo</span>
              <div className="my-2 text-3xl font-black text-red-400">{countOverTime}</div>
              <div className="text-[10px] text-red-500 font-semibold">Excederam o planejado</div>
            </div>

            {/* Abaixo do Tempo (diff < 0) */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Abaixo do Tempo</span>
              <div className="my-2 text-3xl font-black text-emerald-400">{countUnderTime}</div>
              <div className="text-[10px] text-slate-500">Concluíram com folga</div>
            </div>

            {/* Média de Diferença de Tempo */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Média de Desvio</span>
              <div className={`my-2 text-2xl font-black font-mono tracking-tight ${
                avgDifferenceSecs > 0 ? 'text-red-400' : avgDifferenceSecs < 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {avgDifferenceText}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {avgDifferenceSecs > 0 ? 'Média de atraso genérico' : avgDifferenceSecs < 0 ? 'Tempo de folga médio' : 'Alvos alcançados'}
              </div>
            </div>

          </div>
        </section>

        {/* HISTÓRICO DA REUNIÃO (Detailed presentation table layout) */}
        <section id="superintendent-history-panel" className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Histórico da Reunião</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <th className="p-3.5 font-bold">Participante</th>
                  <th className="p-3.5 font-bold">Previsto</th>
                  <th className="p-3.5 font-bold">Realizado</th>
                  <th className="p-3.5 font-bold text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 italic select-none">
                      Nenhuma parte cadastrada na programação.
                    </td>
                  </tr>
                ) : (
                  schedule.map((item) => {
                    const isCompleted = item.status === 'completed';
                    const isItemActive = item.id === activeId;
                    
                    let rowBg = 'hover:bg-slate-900/40';
                    if (isItemActive) {
                      rowBg = 'bg-indigo-900/5 hover:bg-indigo-900/10 font-bold';
                    }

                    return (
                      <tr key={item.id} className={`${rowBg} transition-colors`}>
                        {/* Participante Column */}
                        <td className="p-3.5">
                          <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            {isCompleted && <span className="text-emerald-400">✓</span>}
                            {isItemActive && <span className="text-blue-400 animate-pulse">►</span>}
                            {item.name}
                            {isItemActive && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide">
                                Em Andamento
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{item.partType}</div>
                        </td>

                        {/* Previsto Column */}
                        <td className="p-3.5 font-mono text-slate-300">
                          {formatTime(item.expectedTime)}
                        </td>

                        {/* Realizado Column */}
                        <td className="p-3.5 font-mono">
                          {isCompleted && item.completedTime !== null ? (
                            <span className="text-slate-200">{formatTime(item.completedTime)}</span>
                          ) : isItemActive ? (
                            <span className="text-emerald-400 font-extrabold animate-pulse">{formatTime(elapsedTime)}</span>
                          ) : (
                            <span className="text-slate-600">Pendente</span>
                          )}
                        </td>

                        {/* Diferença Column */}
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
                            <span className="text-slate-400">Em andamento</span>
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

      {/* Footer info */}
      <footer className="py-6 border-t border-slate-900/50 bg-slate-950/80 text-center text-xs text-slate-500 select-none">
        <p>Acompanhamento do Desempenho Escolar • Modo de Consulta Sincronizado</p>
      </footer>
    </div>
  );
}
