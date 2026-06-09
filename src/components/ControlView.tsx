import { useState, useEffect, FormEvent } from 'react';
import { Play, Pause, RotateCcw, SkipForward, ArrowLeft, Smartphone, Wifi, WifiOff, Clock, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Save, X, Check, ClipboardList, ListRestart } from 'lucide-react';
import { TimerState, TimerMode, ScheduleItem } from '../types';

interface ControlViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTimer: (minutes: number, seconds: number, mode: TimerMode) => void;
  addScheduleItem: (name: string, partType: string, expectedTime: number) => void;
  editScheduleItem: (item: ScheduleItem) => void;
  removeScheduleItem: (id: string) => void;
  reorderSchedule: (newList: ScheduleItem[]) => void;
  activateScheduleItem: (id: string) => void;
  completeScheduleItem: (id: string) => void;
  resetSchedule: () => void;
}

export default function ControlView({
  timerState,
  isConnected,
  onBack,
  startTimer,
  pauseTimer,
  resetTimer,
  setTimer,
  addScheduleItem,
  editScheduleItem,
  removeScheduleItem,
  reorderSchedule,
  activateScheduleItem,
  completeScheduleItem,
  resetSchedule,
}: ControlViewProps) {
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime } = timerState;

  // Add Participant Form State
  const [addName, setAddName] = useState('');
  const [addPartType, setAddPartType] = useState('');
  const [addMinutes, setAddMinutes] = useState(4);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPartType, setEditPartType] = useState('');
  const [editMinutes, setEditMinutes] = useState(4);

  // Operator Vibration Trigger on 30s remaining and completion/overrun
  useEffect(() => {
    if (!isRunning || !('vibrate' in navigator)) return;

    let remains30s = false;
    let ended = false;

    if (mode === 'regressive') {
      if (currentTime === 30) {
        remains30s = true;
      } else if (currentTime === 0) {
        ended = true;
      }
    } else {
      // Progressive mode counts up to initialDuration
      const diff = initialDuration - currentTime;
      if (diff === 30) {
        remains30s = true;
      } else if (diff === 0) {
        ended = true;
      }
    }

    if (remains30s) {
      try {
        navigator.vibrate(200); // short vibrate (200ms)
      } catch (err) {
        console.warn('Vibration failed:', err);
      }
    } else if (ended) {
      try {
        navigator.vibrate([400, 200, 400]); // double vibrate upon completion
      } catch (err) {
        console.warn('Vibration failed:', err);
      }
    }
  }, [currentTime, isRunning, mode, initialDuration]);

  // Handle immediate mode selection and sync to all screens
  const handleModeChange = (targetMode: TimerMode) => {
    const currentDuration = initialDuration || 240;
    const mins = Math.floor(currentDuration / 60);
    const secs = currentDuration % 60;
    setTimer(mins, secs, targetMode);
  };

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

  // Handler for adding a participant
  const handleAddParticipant = (e: FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPartType.trim()) return;
    addScheduleItem(addName, addPartType, addMinutes * 60);
    setAddName('');
    setAddPartType('');
    setAddMinutes(4);
  };

  // Handler to initiate edit Mode
  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPartType(item.partType);
    setEditMinutes(Math.floor(item.expectedTime / 60));
  };

  // Save changes from inline edit
  const saveEdit = (item: ScheduleItem) => {
    editScheduleItem({
      ...item,
      name: editName,
      partType: editPartType,
      expectedTime: editMinutes * 60,
    });
    setEditingId(null);
  };

  // Manual Reordering trigger
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...schedule];
    if (direction === 'up' && index > 0) {
      const temp = newList[index];
      newList[index] = newList[index - 1];
      newList[index - 1] = temp;
    } else if (direction === 'down' && index < newList.length - 1) {
      const temp = newList[index];
      newList[index] = newList[index + 1];
      newList[index + 1] = temp;
    }
    reorderSchedule(newList);
  };

  // Find the first pending item index to mark as "⏳ Próximo"
  const firstPendingId = schedule.find(i => i.status === 'pending')?.id;
  const activeItem = schedule.find(i => i.id === activeId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      {/* Dynamic Sync Top Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-850 font-bold text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <h1 className="text-base font-black tracking-wider text-white flex items-center gap-2 uppercase">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            Controle do Operador
          </h1>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? 'ONLINE' : 'DESCONECTADO'}</span>
          </div>
        </div>
      </header>

      {/* Main Control Panel Workspace */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6 overflow-y-auto pb-12 mt-2">
        
        {/* NEW SIMPLIFIED STOPWATCH MAIN CARD */}
        <section id="sync-preview-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
            <span className="text-xs font-black tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Cronômetro Atual
            </span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 py-1 px-2.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isRunning ? 'RODANDO' : 'PAUSADO'}</span>
            </div>
          </div>
          
          <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-850 shadow-inner space-y-3">
            {activeItem ? (
              <div className="text-slate-300 text-sm font-bold tracking-wide">
                Participante Ativo: <span className="text-indigo-400">{activeItem.name}</span> <span className="text-xs text-slate-400 font-medium">| {activeItem.partType}</span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic">
                Nenhum participante ativo selecionado. Clique em alguém abaixo para carregar.
              </div>
            )}

            {/* Giant Centralized Digits */}
            <div className="text-6xl md:text-7xl font-mono font-black tracking-widest leading-none my-2 text-emerald-400 drop-shadow-[0_4px_12px_rgba(16,185,129,0.15)]">
              {formatTime(currentTime)}
            </div>

            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
              {activeItem && isRunning && (
                <span className="block text-slate-400 mt-1">
                  Tempo Realizado: <span className="font-mono text-emerald-500 font-bold">{formatTime(elapsedTime)}</span> (Dif: {formatDifference(initialDuration, elapsedTime)})
                </span>
              )}
            </div>
          </div>

          {/* STREAMLINED OPERATION BUTTONS */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Play / Pause Toggle Button */}
            {!isRunning ? (
              <button
                type="button"
                onClick={startTimer}
                disabled={!isConnected}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
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

            {/* Reiniciar Parte Button */}
            <button
              type="button"
              onClick={resetTimer}
              disabled={!isConnected}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-750 active:scale-[0.97] transition-all disabled:opacity-50 text-slate-200 hover:text-white rounded-xl font-bold flex items-center justify-center gap-1.5 border border-slate-755 cursor-pointer text-sm"
              title="Reinicia a contagem com o tempo original desta parte"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Parte
            </button>

            {/* Próxima Parte Button */}
            <button
              type="button"
              onClick={() => activeId && completeScheduleItem(activeId)}
              disabled={!isConnected || !activeId}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer text-sm col-span-2 md:col-span-2"
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
                onClick={() => handleModeChange('regressive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  mode === 'regressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Regressivo (Regressiva)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('progressive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  mode === 'progressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Progressivo (Contagem)
              </button>
            </div>
          </div>
        </section>

        {/* LISTA DA PROGRAMAÇÃO WITH SELEÇÃO INTELIGENTE CHANNELS */}
        <section id="schedule-list-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Lista da Programação</h2>
            </div>
            {schedule.length > 0 && (
              <button
                type="button"
                onClick={resetSchedule}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors active:scale-95 bg-slate-900 border border-slate-800 py-1.5 px-2.5 rounded-lg cursor-pointer"
                title="Reinicia todo o andamento das partes anteriores"
              >
                <ListRestart className="w-3.5 h-3.5" />
                Reiniciar Programação
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {schedule.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Nenhum participante cadastrado na programação. Use o formulário abaixo para cadastrar!
              </div>
            ) : (
              schedule.map((item, idx) => {
                const isEditing = editingId === item.id;
                const isItemActive = item.id === activeId;
                const isNext = item.id === firstPendingId;

                // Status Badge Colors
                let statusBadge = '';
                let statusSymbol = '';
                if (item.status === 'completed') {
                  statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  statusSymbol = '✓';
                } else if (item.status === 'active') {
                  statusBadge = 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse';
                  statusSymbol = '►';
                } else if (isNext) {
                  statusBadge = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                  statusSymbol = '⏳';
                } else {
                  statusBadge = 'bg-slate-800/40 text-slate-400 border border-slate-800';
                  statusSymbol = '';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isEditing && item.status !== 'completed') {
                        activateScheduleItem(item.id);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isItemActive 
                        ? 'bg-slate-900/90 border-indigo-500/55 shadow-md shadow-indigo-950/20' 
                        : item.status === 'completed'
                          ? 'bg-slate-950/30 border-slate-850/60 opacity-65 hover:opacity-90'
                          : 'bg-slate-950/80 border-slate-850 hover:border-slate-800 cursor-pointer hover:bg-slate-900/50'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Editor Container */
                      <div className="flex-1 space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500">Participante</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg py-1 px-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500">Parte / Tipo</label>
                            <input
                              type="text"
                              value={editPartType}
                              onChange={(e) => setEditPartType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg py-1 px-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-slate-850/40 pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Previsto (min):</span>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={editMinutes}
                              onChange={(e) => setEditMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 bg-slate-900 border border-slate-800 rounded-lg py-0.5 px-2 text-center text-sm font-bold text-white font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveEdit(item)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-1.5 cursor-pointer flex items-center justify-center gap-1 text-xs font-extrabold px-2.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg p-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Elegant Row Information */
                      <>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider ${statusBadge}`}>
                              {statusSymbol && `${statusSymbol} `}
                              {item.status === 'completed' && 'Concluído'}
                              {item.status === 'active' && 'Em andamento'}
                              {item.status === 'pending' && (isNext ? 'Próximo' : 'Aguardando')}
                            </span>
                            
                            {item.status === 'completed' && item.completedTime !== null && (
                              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/20">
                                Realizado: {formatTime(item.completedTime)} (Dif: {formatDifference(item.expectedTime, item.completedTime)})
                              </span>
                            )}
                          </div>

                          {/* Simplified dynamic label format to match exact requirement */}
                          <div className="text-sm font-bold text-white leading-relaxed">
                            {statusSymbol && <span className="mr-1">{statusSymbol}</span>}
                            <span>{item.name}</span>
                            <span className="text-slate-300 font-semibold"> - {Math.floor(item.expectedTime / 60)} min</span>
                            <span className="text-slate-500 font-normal text-xs ml-1.5">| {item.partType}</span>
                          </div>
                        </div>

                        {/* Row Manipulation Tools */}
                        <div className="flex items-center justify-end gap-1 px-1" onClick={(e) => e.stopPropagation()}>
                          {/* Reordering indicators */}
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0 || item.status === 'completed'}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded-lg cursor-pointer transition-all"
                            title="Subir posição"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === schedule.length - 1 || item.status === 'completed'}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded-lg cursor-pointer transition-all"
                            title="Descer posição"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                          
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg cursor-pointer transition-all"
                            title="Editar participante"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removeScheduleItem(item.id)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition-all"
                            title="Excluir participante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* CADASTRO DA PROGRAMAÇÃO FORM */}
        <section id="add-participant-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Plus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Cadastro da Programação</h2>
          </div>

          <form onSubmit={handleAddParticipant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nome do Participante</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Santos"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tipo da Parte</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisita"
                  value={addPartType}
                  onChange={(e) => setAddPartType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tempo Previsto:</span>
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 font-mono select-none">
                  <button
                    type="button"
                    onClick={() => setAddMinutes(prev => Math.max(1, prev - 1))}
                    className="p-2 hover:bg-slate-900 rounded text-slate-400 hover:text-white max-h-[36px] flex items-center justify-center cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-white">{addMinutes} min</span>
                  <button
                    type="button"
                    onClick={() => setAddMinutes(prev => Math.min(120, prev + 1))}
                    className="p-2 hover:bg-slate-900 rounded text-slate-400 hover:text-white max-h-[36px] flex items-center justify-center cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isConnected}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <Plus className="w-4 h-4" />
                Adicionar Participante
              </button>
            </div>
          </form>
        </section>

      </main>

      {/* Simplified Bottom Workspace Info */}
      <footer className="p-4 bg-slate-950/45 text-center border-t border-slate-800 text-xs text-slate-500 select-none">
        <p>Configuração do Cronômetro baseada na Programação Cadastrada</p>
      </footer>
    </div>
  );
}
