import React, { useState, useEffect } from 'react';
import { DoorOpen, Wifi, WifiOff, Calendar, Trash2, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle2, XCircle, Search, Trash } from 'lucide-react';
import { TimerState, CompletedMeeting } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  deleteMeeting: (meetingId: string) => void;
  clearAllMeetings: () => void;
}

export default function HistoryView({
  timerState,
  isConnected,
  onBack,
  deleteMeeting,
  clearAllMeetings,
}: HistoryViewProps) {
  const { meetings = [] } = timerState;
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Expand the newest meeting automatically when a new one is added
  useEffect(() => {
    if (meetings && meetings.length > 0) {
      const newestId = meetings[0].id;
      setExpandedIds(prev => {
        // If we don't have this ID registered, make it expanded by default
        if (!prev.hasOwnProperty(newestId)) {
          return { ...prev, [newestId]: true };
        }
        return prev;
      });
    }
  }, [meetings]);

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a reunião "${title}" do histórico?`)) {
      deleteMeeting(id);
    }
  };

  const handleClearAllClick = () => {
    if (confirm('Tem certeza que deseja limpar COMPLEMENTAMENTE todo o histórico? Esta ação é irreversível.')) {
      clearAllMeetings();
    }
  };

  // Helper formats
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

  const formatDifferenceValue = (diff: number) => {
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60);
    const secs = absDiff % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
    
    if (diff === 0) return '00:00';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  // Filter meetings based on query
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.date.includes(searchQuery) ||
    m.schedule.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.partType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative ambient background spots */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4 sticky top-0 z-35">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-450 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all active:scale-95 cursor-pointer py-1.5 px-3 rounded-lg border border-slate-800 font-bold text-xs uppercase tracking-wider"
          >
            <DoorOpen className="w-4 h-4 text-indigo-400" />
            <span>Sair para Módulos</span>
          </button>

          <h1 className="text-base font-black tracking-wider text-white flex items-center gap-1 uppercase">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Histórico
          </h1>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-505 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-450" /> : <WifiOff className="w-3.5 h-3.5 text-red-450" />}
            <span>{isConnected ? '🟢 ONLINE' : '🔴 DESCONECTADO'}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-6 relative z-10">
        
        {/* Toolbar & Global Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por participante, parte ou data..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-xl focus:outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {meetings.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className="w-full sm:w-auto py-2 px-4 bg-red-950/20 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Trash className="w-3.5 h-3.5" />
              Limpar Todo o Histórico
            </button>
          )}
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-3xl space-y-3 max-w-lg mx-auto">
              <Calendar className="w-12 h-12 text-slate-850 mx-auto" />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Histórico Vazio</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-6">
                Nenhuma reunião arquivada disponível. Finalize uma reunião na tela de <b>Controle</b> clicando em <b>"Registrar e Fechar Reunião"</b> para salvar e ver as estatísticas consolidadas!
              </p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 border border-slate-850 rounded-2xl text-slate-400 text-sm">
              Nenhum resultado correspondente para "{searchQuery}".
            </div>
          ) : (
            filteredMeetings.map((meeting) => {
              const isOpen = !!expandedIds[meeting.id];
              const sched = meeting.schedule || [];
              const totalDiscursos = sched.length;

              // Calculate Metrics
              let dentroDoTempo = 0;
              let pequenoExcesso = 0;
              let excessoSignificativo = 0;

              sched.forEach(item => {
                const cmpTime = item.completedTime ?? item.expectedTime;
                const diffSecs = cmpTime - item.expectedTime;
                if (diffSecs <= 0) {
                  dentroDoTempo++;
                } else if (diffSecs <= 30) {
                  pequenoExcesso++;
                } else {
                  excessoSignificativo++;
                }
              });

              return (
                <div
                  key={meeting.id}
                  className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden transition-all duration-350 shadow-lg"
                >
                  {/* Header Accordion */}
                  <div
                    onClick={() => toggleAccordion(meeting.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hidden sm:block">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-black text-indigo-400 tracking-wider">
                            {meeting.date}
                          </span>
                          <span className="text-[10px] uppercase font-black bg-slate-800 text-slate-350 px-2.2 py-0.5 rounded-full">
                            {totalDiscursos} {totalDiscursos === 1 ? 'parte' : 'partes'}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-white truncate uppercase tracking-tight">
                          {meeting.title}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteClick(meeting.id, meeting.title, e)}
                        className="p-2 hover:bg-red-950/40 border border-slate-850 hover:border-red-900/40 text-slate-450 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                        title="Excluir reunião"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1.5 text-slate-400 hover:text-white transition-colors">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandible Section Accordion Content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="border-t border-slate-850/60"
                      >
                        <div className="p-5 sm:p-6 space-y-6 bg-slate-950/40">
                          
                          {/* Consolidated Statistics Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                            
                            {/* Total speeches card */}
                            <div className="bg-slate-950 border border-slate-850/50 p-4 rounded-xl flex flex-col justify-between shadow-inner">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total de discursos</span>
                              <div className="text-2xl font-black text-white mt-1">{totalDiscursos}</div>
                              <span className="text-[9px] text-slate-500 mt-1">Sessões realizadas</span>
                            </div>

                            {/* On target speeches card */}
                            <div className="bg-slate-950 border border-slate-850/50 p-4 rounded-xl flex flex-col justify-between shadow-inner">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Dentro da Meta</span>
                              <div className="text-2xl font-black text-emerald-450 mt-1">{dentroDoTempo}</div>
                              <span className="text-[9px] text-emerald-550 mt-1">Fundo Verde</span>
                            </div>

                            {/* Small overruns card */}
                            <div className="bg-slate-950 border border-slate-850/50 p-4 rounded-xl flex flex-col justify-between shadow-inner">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pequeno Excesso</span>
                              <div className="text-2xl font-black text-amber-450 mt-1">{pequenoExcesso}</div>
                              <span className="text-[9px] text-amber-550 mt-1">Fundo Amarelo (≤30s)</span>
                            </div>

                            {/* Major overruns card */}
                            <div className="bg-slate-950 border border-slate-850/50 p-4 rounded-xl flex flex-col justify-between shadow-inner">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Excesso Alto</span>
                              <div className="text-2xl font-black text-red-450 mt-1">{excessoSignificativo}</div>
                              <span className="text-[9px] text-red-550 mt-1">Fundo Vermelho (&gt;30s)</span>
                            </div>

                          </div>

                          {/* Meeting Table Details */}
                          <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Tabela Detalhada dos Participantes
                            </h3>

                            <div className="overflow-x-auto rounded-xl border border-slate-850 shadow-inner">
                              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                <thead>
                                  <tr className="bg-slate-950 border-b border-slate-850 text-slate-550 text-[10px] font-bold uppercase tracking-widest leading-none">
                                    <th className="p-3 font-bold">Participante</th>
                                    <th className="p-3 font-bold">Previsto</th>
                                    <th className="p-3 font-bold">Realizado</th>
                                    <th className="p-3 font-bold text-right">Diferença</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/60 bg-slate-950/20">
                                  {sched.map((item) => {
                                    const expected = item.expectedTime;
                                    const actual = item.completedTime ?? expected;
                                    const diff = actual - expected;

                                    // Color scheme depending on diff values
                                    let cellBorderColor = 'border-l-4 border-l-emerald-500';
                                    let diffColorClass = 'text-emerald-450 font-bold';
                                    let rowBgClass = 'hover:bg-slate-950/40';

                                    if (diff > 0) {
                                      if (diff <= 30) {
                                        cellBorderColor = 'border-l-4 border-l-amber-500';
                                        diffColorClass = 'text-amber-450 font-bold';
                                      } else {
                                        cellBorderColor = 'border-l-4 border-l-red-500';
                                        diffColorClass = 'text-red-450 font-bold';
                                      }
                                    }

                                    return (
                                      <tr key={item.id} className={`${rowBgClass} transition-colors`}>
                                        {/* Name & Type */}
                                        <td className={`p-3 ${cellBorderColor}`}>
                                          <div className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{item.name}</div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">{item.partType}</div>
                                        </td>
                                        {/* Previsto */}
                                        <td className="p-3 font-mono text-slate-350">{formatTime(expected)}</td>
                                        {/* Realizado */}
                                        <td className="p-3 font-mono text-slate-350">{formatTime(actual)}</td>
                                        {/* Diferença */}
                                        <td className={`p-3 text-right font-mono ${diffColorClass}`}>
                                          {formatDifferenceValue(diff)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 select-none">
        <p>Análise Histórica de Reuniões • Relatórios Sincronizados</p>
      </footer>
    </div>
  );
}
