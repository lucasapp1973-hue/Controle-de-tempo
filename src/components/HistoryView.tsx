import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, Wifi, WifiOff, Calendar, Trash2, ChevronDown, ChevronUp, 
  Clock, AlertTriangle, CheckCircle2, XCircle, Search, Trash, 
  Star, Users, BarChart3, FileText, FolderClosed, Copy, Check, Loader2
} from 'lucide-react';
import { TimerState, CompletedMeeting, ScheduleItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { reunioesService } from '../services/reunioesService';

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
  // Load finished meetings from Firestore
  const [firebaseMeetings, setFirebaseMeetings] = useState<CompletedMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFirestoreMeetings = async () => {
    try {
      setLoading(true);
      const list = await reunioesService.fetchReunioes();
      // Only keep 'concluida' meetings for history view
      const completedList = list.filter(m => m.status === 'concluida');

      const mapped: CompletedMeeting[] = [];
      for (const m of completedList) {
        // Fetch parts for each meeting
        const partes = await reunioesService.fetchPartes(m.id);
        
        // Convert to ScheduleItem
        const scheduleItems: ScheduleItem[] = partes.map((p) => ({
          id: p.id,
          name: p.participante,
          partType: p.tipoParte,
          expectedTime: p.tempoPrevisto,
          status: 'completed',
          completedTime: p.tempoRealizado
        }));

        // Format date string to DD/MM/YYYY for title display
        let formattedDateDisplay = m.data;
        try {
          if (m.data.includes('-')) {
            const pts = m.data.split('-');
            if (pts.length === 3) {
              formattedDateDisplay = `${pts[2]}/${pts[1]}/${pts[0]}`;
            }
          }
        } catch (e) {}

        mapped.push({
          id: m.id,
          date: formattedDateDisplay,
          title: `Presidida por ${m.presidente}`,
          schedule: scheduleItems
        });
      }

      // Sort by date DESC
      mapped.sort((a,b) => {
        const parseDate = (dStr: string) => {
          if (dStr.includes('/')) {
            const [d, m, y] = dStr.split('/');
            return new Date(Number(y), Number(m)-1, Number(d)).getTime();
          }
          return new Date(dStr).getTime();
        };
        return parseDate(b.date) - parseDate(a.date);
      });

      setFirebaseMeetings(mapped);
    } catch (err) {
      console.error("Erro ao carregar reuniões do Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirestoreMeetings();
  }, []);

  const meetings = firebaseMeetings;
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'ultima' | 'todas' | 'participantes' | 'graficos' | 'relatorios'>('ultima');
  
  // Reporting selected meeting
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Set the default selected report when meetings change
  useEffect(() => {
    if (meetings && meetings.length > 0 && !selectedReportId) {
      setSelectedReportId(meetings[0].id);
    }
  }, [meetings, selectedReportId]);

  // Expand the newest meeting automatically when a new one is added
  useEffect(() => {
    if (meetings && meetings.length > 0) {
      const newestId = meetings[0].id;
      setExpandedIds(prev => {
        if (!prev.hasOwnProperty(newestId)) {
          return { ...prev, [newestId]: true };
        }
        return prev;
      });
    }
  }, [meetings]);

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Deseja realmente apagar esta reunião do histórico permanentemente?")) return;
    try {
      await reunioesService.deleteReuniao(meetingId);
      // Fallback call socket
      deleteMeeting(meetingId);
      // Reload from Firestore
      await loadFirestoreMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllMeetings = async () => {
    if (!confirm("ATENÇÃO: Deseja apagar TODO o histórico de reuniões permanentemente do Firestore?")) return;
    try {
      const list = await reunioesService.fetchReunioes();
      for (const m of list) {
        await reunioesService.deleteReuniao(m.id);
      }
      clearAllMeetings();
      setFirebaseMeetings([]);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteMeeting(id);
    if (selectedReportId === id && meetings.length > 1) {
      // Switch reported view if current is deleted
      const remaining = meetings.filter(m => m.id !== id);
      setSelectedReportId(remaining[0]?.id || '');
    }
  };

  const handleClearAllClick = () => {
    handleClearAllMeetings();
    setSelectedReportId('');
  };

  // Time format helper
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

  // Difference format value helper
  const formatDifferenceValue = (diff: number) => {
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60);
    const secs = absDiff % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
    
    if (diff === 0) return '00:00';
    return `${sign}${pad(mins)}:${pad(secs)}`;
  };

  // Search filter
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.date.includes(searchQuery) ||
    m.schedule.some(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.partType.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Group and aggregate participant stats
  const participantsMap: Record<string, {
    name: string;
    roles: Set<string>;
    partsCount: number;
    totalExpected: number;
    totalActual: number;
    onTargetCount: number;
    smallOverrunCount: number;
    largeOverrunCount: number;
  }> = {};

  meetings.forEach(meeting => {
    const sched = meeting.schedule || [];
    sched.forEach(item => {
      const nameKey = item.name.trim();
      if (!nameKey) return;
      if (!participantsMap[nameKey]) {
        participantsMap[nameKey] = {
          name: nameKey,
          roles: new Set<string>(),
          partsCount: 0,
          totalExpected: 0,
          totalActual: 0,
          onTargetCount: 0,
          smallOverrunCount: 0,
          largeOverrunCount: 0,
        };
      }
      const p = participantsMap[nameKey];
      p.roles.add(item.partType);
      p.partsCount += 1;
      p.totalExpected += item.expectedTime;
      const cmpTime = item.completedTime ?? item.expectedTime;
      p.totalActual += cmpTime;
      
      const diff = cmpTime - item.expectedTime;
      if (diff <= 0) {
        p.onTargetCount += 1;
      } else if (diff <= 30) {
        p.smallOverrunCount += 1;
      } else {
        p.largeOverrunCount += 1;
      }
    });
  });

  const participantsList = Object.values(participantsMap).map(p => ({
    ...p,
    roles: Array.from(p.roles),
    avgDeviation: (p.totalActual - p.totalExpected) / p.partsCount,
    successRate: Math.round((p.onTargetCount / p.partsCount) * 100),
  })).sort((a, b) => b.partsCount - a.partsCount);

  // Chart Data Assembly
  const lastMeetingsData = [...meetings].reverse().slice(-5).map((m) => {
    let expectedSum = 0;
    let actualSum = 0;
    m.schedule?.forEach(p => {
      expectedSum += p.expectedTime;
      actualSum += p.completedTime ?? p.expectedTime;
    });
    const deviationMins = Math.round((actualSum - expectedSum) / 60);
    return {
      name: m.date,
      title: m.title.length > 12 ? m.title.slice(0, 12) + '...' : m.title,
      'Atraso Total (Min)': deviationMins,
    };
  });

  // Global status distribution
  let totalGreen = 0;
  let totalYellow = 0;
  let totalRed = 0;
  meetings.forEach(m => {
    m.schedule?.forEach(p => {
      const diff = (p.completedTime ?? p.expectedTime) - p.expectedTime;
      if (diff <= 0) totalGreen++;
      else if (diff <= 20) totalYellow++;
      else totalRed++;
    });
  });

  const chartStatusData = [
    { name: 'Dentro do Tempo', value: totalGreen, color: '#10b981' },
    { name: 'Sobrevôo Curto (≤20s)', value: totalYellow, color: '#f59e0b' },
    { name: 'Excesso (>20s)', value: totalRed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Generate textual shareable report
  const handleCopyReport = (meeting: CompletedMeeting) => {
    let reportText = `⭐ *RELATÓRIO DE REUNIÃO CONSOLIDADO* ⭐\n\n📌 *Reunião:* ${meeting.title}\n📅 *Data:* ${meeting.date}\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    meeting.schedule?.forEach((p, idx) => {
      const act = p.completedTime ?? p.expectedTime;
      const diff = act - p.expectedTime;
      const sign = diff > 0 ? '+' : '';
      const statusIcon = diff <= 0 ? '🟢 Dentro da Meta' : diff <= 20 ? '🟡 Pequeno Excesso (≤20s)' : '🔴 Excesso (>20s)';
      
      reportText += `${idx + 1}. *${p.name}* (${p.partType})\n`;
      reportText += `   ⏱ Previsto: ${formatTime(p.expectedTime)} | Realizado: ${formatTime(act)}\n`;
      reportText += `   📊 Status: ${statusIcon} (${diff === 0 ? 'Pontual' : `${sign}${formatDifferenceValue(diff)}`})\n\n`;
    });

    reportText += `━━━━━━━━━━━━━━━━━━━━━━━━\nGerado automaticamente via Sincronizador de Tempo do Presidente.`;
    
    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative ambient background spots */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 pt-8 pb-4 sm:pt-10 sticky top-0 z-35">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative min-h-[46px]">
          <div className="z-10 flex items-center">
            <SystemModuleReturnIcon onClick={onBack} />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
            <div className="flex flex-col items-center gap-1">
              <AnalogueClock type="historico" />
              <span className="text-sm sm:text-base md:text-lg font-black tracking-widest text-white uppercase">Histórico</span>
            </div>
          </div>

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

      {/* Sub-navigation Menu bar */}
      <div className="w-full bg-slate-950/90 border-b border-slate-900 sticky top-[98px] sm:top-[112px] z-30">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 items-center overflow-x-auto py-2.5 no-scrollbar">
          {[
            { id: 'ultima', label: '⭐ Última Reunião' },
            { id: 'todas', label: '📁 Todas as Reuniões' },
            { id: 'participantes', label: '👤 Participantes' },
            { id: 'graficos', label: '📊 Gráficos' },
            { id: 'relatorios', label: '📄 Relatórios' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-none py-1.8 px-3.2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 select-none cursor-pointer active:scale-95 border ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 relative z-10">

        {meetings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-900 rounded-3xl space-y-4 max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Histórico Vazio</h3>
            <p className="text-xs text-slate-500 leading-relaxed px-8">
              Nenhuma reunião arquivada disponível no momento. Conclua e registre uma reunião pelo painel de <b>Controle</b> para gerar relatórios, gráficos e acompanhar o seu desempenho!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* TAB: ULTIMA REUNIAO */}
            {activeTab === 'ultima' && (
              <motion.div
                key="ultima"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Visual Highlight Wrapper */}
                <div className="border border-amber-500/15 bg-amber-500/[0.02] p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-xl">
                  {/* subtle color bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500/40 via-amber-600/50 to-amber-500/40" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 pt-1">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-450 mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                        Destaque Reunião Mais Recente
                      </div>
                      <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-0.5">
                        {meetings[0].title}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 text-slate-350">
                        {meetings[0].date}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(meetings[0].id, meetings[0].title, e)}
                        className="py-1.5 px-3 bg-red-950/20 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Deletar reunião"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Accordion list details embedded instantly to remove steps */}
                  <div className="mt-6 space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Estatísticas
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-950 border border-slate-900/60 p-3 rounded-xl">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Total de Partes</span>
                          <span className="text-lg font-black text-white">{meetings[0].schedule.length}</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-900/60 p-3 rounded-xl">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">No Tempo</span>
                          <span className="text-lg font-black text-emerald-400">
                            {meetings[0].schedule.filter(i => (i.completedTime ?? i.expectedTime) - i.expectedTime <= 0).length}
                          </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-900/60 p-3 rounded-xl">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Atraso</span>
                          <span className="text-lg font-black text-red-400">
                            {meetings[0].schedule.filter(i => (i.completedTime ?? i.expectedTime) - i.expectedTime > 0).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Quadro detalhado dos Participantes
                      </h3>

                      <div className="overflow-x-auto rounded-xl border border-slate-900 shadow-inner">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-950 border-b border-slate-900 text-slate-450 text-[10px] font-bold uppercase tracking-widest leading-none">
                              <th className="p-3 font-medium">Participante / Parte</th>
                              <th className="p-3 font-medium">Previsto</th>
                              <th className="p-3 font-medium">Realizado</th>
                              <th className="p-3 font-medium text-right">Diferença</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/40 bg-slate-950/10">
                            {meetings[0].schedule.map((item) => {
                              const expect = item.expectedTime;
                              const act = item.completedTime ?? expect;
                              const diff = act - expect;

                              let statusBorderLeft = 'border-l-4 border-l-emerald-500';
                              let diffTextClass = 'text-emerald-400 font-bold';

                              if (diff > 0) {
                                if (diff <= 30) {
                                  statusBorderLeft = 'border-l-4 border-l-amber-500';
                                  diffTextClass = 'text-amber-400 font-bold';
                                } else {
                                  statusBorderLeft = 'border-l-4 border-l-red-500';
                                  diffTextClass = 'text-red-400 font-bold';
                                }
                              }

                              return (
                                <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                                  <td className={`p-3 ${statusBorderLeft}`}>
                                    <div className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{item.partType}</div>
                                  </td>
                                  <td className="p-3 font-mono text-slate-350">{formatTime(expect)}</td>
                                  <td className="p-3 font-mono text-slate-350">{formatTime(act)}</td>
                                  <td className={`p-3 text-right font-mono ${diffTextClass}`}>
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
                </div>
              </motion.div>
            )}

            {/* TAB: TODAS AS REUNIOES (Accordion and Filter) */}
            {activeTab === 'todas' && (
              <motion.div
                key="todas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Search Bar / Clear Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar por participante, parte ou data..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-850 focus:border-amber-500/50 text-slate-100 text-sm rounded-xl focus:outline-none transition-all placeholder:text-slate-500"
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
                  {filteredMeetings.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs italic">
                      Nenhum resultado correspondente para "{searchQuery}".
                    </div>
                  ) : (
                    filteredMeetings.map((meeting) => {
                      const isOpen = !!expandedIds[meeting.id];
                      const sched = meeting.schedule || [];

                      let greenCount = 0;
                      let yellowCount = 0;
                      let redCount = 0;

                      sched.forEach(item => {
                        const act = item.completedTime ?? item.expectedTime;
                        const diff = act - item.expectedTime;
                        if (diff <= 0) greenCount++;
                        else if (diff <= 30) yellowCount++;
                        else redCount++;
                      });

                      return (
                        <div
                          key={meeting.id}
                          className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden transition-all duration-350"
                        >
                          <div
                            onClick={() => toggleAccordion(meeting.id)}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="p-2.5 bg-slate-950/90 border border-slate-850 text-amber-500 rounded-xl hidden sm:block">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-[10px] font-black text-amber-450 tracking-wider">
                                    {meeting.date}
                                  </span>
                                  <span className="text-[9px] uppercase font-bold bg-slate-800 text-slate-400 px-2.2 py-0.5 rounded-full">
                                    {sched.length} {sched.length === 1 ? 'parte' : 'partes'}
                                  </span>
                                </div>
                                <h3 className="text-sm font-black text-white truncate uppercase tracking-tight">
                                  {meeting.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteClick(meeting.id, meeting.title, e)}
                                className="p-1.8 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                                title="Excluir reunião"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="p-1 hover:text-white text-slate-400">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="border-t border-slate-900/40 bg-slate-950/30"
                              >
                                <div className="p-4 sm:p-5 space-y-4">
                                  <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900/65">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Total</span>
                                      <span className="text-sm font-black text-white">{sched.length}</span>
                                    </div>
                                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900/65">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Dentro</span>
                                      <span className="text-sm font-black text-emerald-400">{greenCount}</span>
                                    </div>
                                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900/65">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Excedido</span>
                                      <span className="text-sm font-black text-red-400">{redCount + yellowCount}</span>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto rounded-lg border border-slate-900">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-950 border-b border-slate-900 text-slate-550 font-bold uppercase text-[9px] tracking-wider">
                                          <th className="p-2.5">Participante</th>
                                          <th className="p-2.5">Meta</th>
                                          <th className="p-2.5">Realizado</th>
                                          <th className="p-2.5 text-right">Diferença</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sched.map((item) => {
                                          const diff = (item.completedTime ?? item.expectedTime) - item.expectedTime;
                                          let diffCol = 'text-emerald-450';
                                          if (diff > 0) {
                                            diffCol = diff <= 30 ? 'text-amber-450' : 'text-red-450';
                                          }
                                          return (
                                            <tr key={item.id} className="border-b border-slate-900/40 hover:bg-slate-900/10">
                                              <td className="p-2.5">
                                                <div className="font-bold text-slate-100">{item.name}</div>
                                                <div className="text-[9px] text-slate-400">{item.partType}</div>
                                              </td>
                                              <td className="p-2.5 font-mono text-slate-400">{formatTime(item.expectedTime)}</td>
                                              <td className="p-2.5 font-mono text-slate-400">{formatTime(item.completedTime ?? item.expectedTime)}</td>
                                              <td className={`p-2.5 text-right font-mono ${diffCol}`}>{formatDifferenceValue(diff)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
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
              </motion.div>
            )}

            {/* TAB: PARTICIPANTES */}
            {activeTab === 'participantes' && (
              <motion.div
                key="participantes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl">
                  <h3 className="text-sm font-black uppercase text-white mb-1 tracking-wide">FICHA DE PRECISÃO NO USO DO TEMPO</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Visualização compilada de todos os Participantes e suas taxas de precisão em todas as reuniões arquivadas.
                  </p>

                  <div className="space-y-3.5">
                    {participantsList.length === 0 ? (
                      <p className="text-center text-xs text-slate-550 italic py-6">Nenhum orador registrado no banco.</p>
                    ) : (
                      participantsList.map((p, idx) => {
                        let scoreColor = 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5';
                        if (p.successRate < 70) {
                          scoreColor = p.successRate < 45 
                            ? 'text-red-400 border-red-500/25 bg-red-500/5'
                            : 'text-amber-400 border-amber-500/25 bg-amber-500/5';
                        }
                        
                        return (
                          <div
                            key={p.name + idx}
                            className="bg-slate-950 border border-slate-900/50 hover:border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                          >
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-white uppercase tracking-tight">{p.name}</h4>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {p.roles.slice(0, 3).map((role, i) => (
                                  <span key={i} className="text-[9px] uppercase font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                                    {role}
                                  </span>
                                ))}
                                {p.roles.length > 3 && (
                                  <span className="text-[9px] text-slate-500">+ {p.roles.length - 3}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 justify-between sm:justify-start">
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Participações</span>
                                <span className="text-xs font-black text-slate-350">{p.partsCount} {p.partsCount === 1 ? 'discurso' : 'discursos'}</span>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Atraso</span>
                                <span className={`text-xs font-mono font-black ${p.avgDeviation > 0 ? (p.avgDeviation <= 20 ? 'text-amber-400' : 'text-red-400') : 'text-emerald-400'}`}>
                                  {formatDifferenceValue(Math.round(p.avgDeviation))}
                                </span>
                              </div>

                              <div className={`p-2.5 rounded-lg border text-center ${scoreColor} min-w-[70px]`}>
                                <span className="text-[8px] uppercase tracking-wider block font-bold text-slate-400 leading-none mb-1">Precisão</span>
                                <span className="text-sm font-black tracking-tighter">{p.successRate}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: GRAFICOS */}
            {activeTab === 'graficos' && (
              <motion.div
                key="graficos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Visualizer 1: Deviation Tendency */}
                <div className="bg-slate-900/30 border border-slate-900 p-4 sm:p-5 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">Atraso Acumulado das Últimas Reuniões</h3>
                    <p className="text-xs text-slate-400">
                      Soma total em minutos dos atrasos... apresentados por reunião. Próximo de zero indica cronometragem perfeita.
                    </p>
                  </div>

                  {lastMeetingsData.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">Dados insuficientes para gerar gráficos.</p>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lastMeetingsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${Math.round(val)}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px' }}
                            labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#fbbf24', fontSize: '11px' }}
                          />
                          <Bar dataKey="Atraso Total (Min)" fill="#d97706" radius={[4, 4, 0, 0]}>
                            {lastMeetingsData.map((entry, index) => {
                              const dev = entry['Atraso Total (Min)'];
                              const fillCol = dev > 0 ? '#f59e0b' : '#10b981';
                              return <Cell key={`cell-${index}`} fill={fillCol} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Visualizer 2: Distribution of speech statuses */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/30 border border-slate-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-sm font-black uppercase text-white tracking-wide">Distribuição de Status</h3>
                      <p className="text-xs text-slate-400">Proporção total de participantes que finalizaram suas partes no tempo concedido</p>
                    </div>

                    {chartStatusData.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-6 text-center">Aguardando dados estruturados.</p>
                    ) : (
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px' }}
                              itemStyle={{ fontSize: '11px', color: '#fff' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/30 border border-slate-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-center space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Identificadores Geométricos</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-md bg-emerald-500 block" />
                        <span className="text-slate-300">Dentro da Meta: <b>{totalGreen} partes</b> (Fundo Verde)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-md bg-amber-500 block" />
                        <span className="text-slate-300">Margem Amarela (≤20s): <b>{totalYellow} partes</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-md bg-red-500 block" />
                        <span className="text-slate-300">Excedidos Vermelho (&gt;20s): <b>{totalRed} partes</b></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900/80">
                      <p className="text-[10px] text-slate-550 leading-relaxed uppercase font-semibold">
                        A pontualidade cumpre papel prioritário na harmonia geral dos encontros e no respeito às agendas estabelecidas.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: RELATORIOS */}
            {activeTab === 'relatorios' && (
              <motion.div
                key="relatorios"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">Gerador de Resumos para Compartilhamento</h3>
                    <p className="text-xs text-slate-400">
                      Selecione uma reunião para gerar um relatório de texto limpo, pronto para ser copiado e colado em aplicativos de mensagens ou e-mail.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <label className="text-xs font-bold text-slate-350 min-w-[120px] uppercase">Reunião:</label>
                      <select
                        value={selectedReportId}
                        onChange={(e) => {
                          setSelectedReportId(e.target.value);
                          setCopiedReport(false);
                        }}
                        className="w-full sm:max-w-md bg-slate-950 border border-slate-850 py-2.2 px-3 focus:outline-none focus:border-amber-500/50 rounded-xl text-xs text-slate-200"
                      >
                        {meetings.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.date} - {m.title} ({m.schedule?.length || 0} partes)
                          </option>
                        ))}
                      </select>
                    </div>

                    {meetings.find((m) => m.id === selectedReportId) && (
                      <div className="space-y-3.5 pt-2">
                        {/* Box raw display code */}
                        <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line shadow-inner select-all">
                          {meetings.find((m) => m.id === selectedReportId) && (
                            <>
                              <span className="text-amber-500 font-bold">⭐ RELATÓRIO CONSOLIDADO ⭐</span>
                              <br />
                              <span><b>Reunião:</b> {meetings.find((m) => m.id === selectedReportId)?.title}</span>
                              <br />
                              <span><b>Data:</b> {meetings.find((m) => m.id === selectedReportId)?.date}</span>
                              <br />
                              <span>━━━━━━━━━━━━━━━━━━━━━━━━</span>
                              <br />
                              {meetings.find((m) => m.id === selectedReportId)?.schedule?.map((p, ix) => {
                                const act = p.completedTime ?? p.expectedTime;
                                const diff = act - p.expectedTime;
                                const sign = diff > 0 ? '+' : '';
                                const iconBadge = diff <= 0 ? '🟢 Dentro da Meta' : diff <= 20 ? '🟡 Pequeno Excesso' : '🔴 Excesso Significativo';
                                return (
                                  <div key={p.id} className="mt-3 pl-3 border-l-2 border-slate-800">
                                    <span>{ix + 1}. <b>{p.name}</b> ({p.partType})</span>
                                    <br />
                                    <span className="text-slate-400">⏱ Previsto: {formatTime(p.expectedTime)} | Realizado: {formatTime(act)}</span>
                                    <br />
                                    <span className="text-slate-400">📊 Status: {iconBadge} ({diff === 0 ? 'Pontual' : `${sign}${formatDifferenceValue(diff)}`})</span>
                                  </div>
                                );
                              })}
                              <br />
                              <span>━━━━━━━━━━━━━━━━━━━━━━━━</span>
                              <br />
                              <span className="text-slate-450 italic">Gerado automaticamente via Sincronizador de Tempo do Presidente.</span>
                            </>
                          )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleCopyReport(meetings.find((m) => m.id === selectedReportId)!)}
                            className="py-2.5 px-5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/40 text-amber-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            {copiedReport ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                Copiado com Sucesso!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copiar Texto Formatado
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 select-none">
        <p>Análise Histórica de Reuniões • Relatórios Sincronizados</p>
      </footer>
    </div>
  );
}
