import { useState, useEffect, FormEvent } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Sliders, Smartphone, Wifi, WifiOff, Clock, Plus, Minus, Trash2, Edit2, ArrowUp, ArrowDown, Save, X, Check, ClipboardList, ListRestart } from 'lucide-react';
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
  resumeTimer,
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

  // Local state for configuration inputs
  const [localMinutes, setLocalMinutes] = useState(5);
  const [localSeconds, setLocalSeconds] = useState(0);
  const [localMode, setLocalMode] = useState<TimerMode>('regressive');

  // Add Participant Form State
  const [addName, setAddName] = useState('');
  const [addPartType, setAddPartType] = useState('');
  const [addMinutes, setAddMinutes] = useState(4);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPartType, setEditPartType] = useState('');
  const [editMinutes, setEditMinutes] = useState(4);

  // Sync inputs with state when timer is stopped/reset to match initialDuration
  useEffect(() => {
    if (!isRunning) {
      const totalSecs = initialDuration;
      setLocalMinutes(Math.floor(totalSecs / 60));
      setLocalSeconds(totalSecs % 60);
      setLocalMode(mode);
    }
  }, [initialDuration, mode, isRunning]);

  // Operator Vibration Trigger
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
      // progressive mode is counting up to initialDuration
      const diff = initialDuration - currentTime;
      if (diff === 30) {
        remains30s = true;
      } else if (diff === 0) {
        ended = true;
      }
    }

    if (remains30s) {
      try {
        navigator.vibrate(200); // vibrate briefly (200ms)
      } catch (err) {
        console.warn('Vibration failed', err);
      }
    } else if (ended) {
      try {
        navigator.vibrate([400, 200, 400]); // vibrate twice/stronger upon completion
      } catch (err) {
        console.warn('Vibration failed', err);
      }
    }
  }, [currentTime, isRunning, mode, initialDuration]);

  // Adjust inputs helpers
  const adjustMinutes = (amount: number) => {
    setLocalMinutes((prev) => Math.min(599, Math.max(0, prev + amount)));
  };

  const adjustSeconds = (amount: number) => {
    setLocalSeconds((prev) => {
      let newValue = prev + amount;
      if (newValue > 59) {
        adjustMinutes(1);
        return 0;
      }
      if (newValue < 0) {
        if (localMinutes > 0) {
          adjustMinutes(-1);
          return 59;
        }
        return 0;
      }
      return newValue;
    });
  };

  // Quick preset trigger (immediate apply)
  const applyPreset = (minutes: number) => {
    setLocalMinutes(minutes);
    setLocalSeconds(0);
    setTimer(minutes, 0, localMode);
  };

  // Apply custom config trigger
  const handleApplyConfig = () => {
    setTimer(localMinutes, localSeconds, localMode);
  };

  // Helper to format remaining time on the preview
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

  // Handlers for Add Form
  const handleAddParticipant = (e: FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPartType.trim()) return;
    addScheduleItem(addName, addPartType, addMinutes * 60);
    setAddName('');
    setAddPartType('');
    setAddMinutes(4);
  };

  // Handlers for Edit
  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPartType(item.partType);
    setEditMinutes(Math.floor(item.expectedTime / 60));
  };

  const saveEdit = (item: ScheduleItem) => {
    editScheduleItem({
      ...item,
      name: editName,
      partType: editPartType,
      expectedTime: editMinutes * 60,
    });
    setEditingId(null);
  };

  // Move Item for Reordering list
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

  // Find the first pending item index to mark as "Próximo"
  const firstPendingId = schedule.find(i => i.status === 'pending')?.id;
  const activeItem = schedule.find(i => i.id === activeId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header Panel */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-850"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Voltar</span>
          </button>

          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            Painel de Controle
          </h1>

          {/* Connection badge with real-time status */}
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

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6 overflow-y-auto pb-12">
        
        {/* Real-Time Sync Status Preview */}
        <section id="sync-preview-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Exibição Atual (Display em Tempo Real)
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-slate-300">{isRunning ? 'RODANDO' : 'PAUSADO'}</span>
            </div>
          </div>
          
          <div className="bg-slate-950 rounded-xl p-6 text-center border border-slate-850 shadow-inner">
            {activeItem && (
              <div className="mb-2 text-slate-300 text-sm font-semibold tracking-wide">
                Participante Atual: <span className="text-white font-bold">{activeItem.name}</span> ({activeItem.partType})
              </div>
            )}
            <div className="text-4xl text-emerald-400 font-mono font-semibold tracking-widest leading-none my-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-slate-500 uppercase font-semibold mt-2">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
              {activeItem && isRunning && (
                <span className="block text-slate-400 mt-1">
                  Tempo Realizado: <span className="font-mono text-emerald-500 font-bold">{formatTime(elapsedTime)}</span> (Dif: {formatDifference(initialDuration, elapsedTime)})
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Real-time Operation Controls */}
        <section id="controls-panel" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Play className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Controles do Cronômetro</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-1">
            {/* Play/Pause Button Logic */}
            {!isRunning ? (
              <button
                type="button"
                onClick={startTimer}
                disabled={!isConnected}
                className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.97] disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer min-h-[50px] col-span-2 sm:col-span-1"
              >
                <Play className="w-5 h-5 fill-current" />
                {currentTime !== initialDuration && currentTime !== 0 ? 'Continuar' : 'Iniciar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                disabled={!isConnected}
                className="py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-[0.97] disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer min-h-[50px] col-span-2 sm:col-span-1"
              >
                <Pause className="w-5 h-5 fill-current" />
                Pausar
              </button>
            )}

            {/* Complete active participant button (If active) */}
            {activeId ? (
              <button
                type="button"
                onClick={() => completeScheduleItem(activeId)}
                disabled={!isConnected}
                className="py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-600/10 transition-all cursor-pointer min-h-[50px] col-span-2 sm:col-span-1"
                title="Registra tempo e avança para a próxima parte"
              >
                <Check className="w-5 h-5" />
                Concluir Parte
              </button>
            ) : (
              <button
                type="button"
                onClick={resetTimer}
                disabled={!isConnected}
                className="py-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.97] disabled:opacity-50 text-slate-200 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer min-h-[50px] col-span-2 sm:col-span-1"
              >
                <RotateCcw className="w-4 h-4" />
                Zerar
              </button>
            )}

            {/* Zero button shown below if Complete button took its primary space */}
            {activeId && (
              <button
                type="button"
                onClick={resetTimer}
                disabled={!isConnected}
                className="col-span-2 py-3 bg-slate-800/80 hover:bg-slate-700 active:scale-[0.97] disabled:opacity-50 text-slate-300 hover:text-white rounded-xl font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar Tempo Atual (Zerar)
              </button>
            )}
          </div>
        </section>

        {/* Dynamic Schedule List "Lista da Programação" */}
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
                title="Reinicia todo o andamento do cronograma da reunião"
              >
                <ListRestart className="w-3.5 h-3.5" />
                Reiniciar Programação
              </button>
            )}
          </div>

          <div className="space-y-3">
            {schedule.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Nenhum participante cadastrado na programação. Use o formulário abaixo para adicionar!
              </div>
            ) : (
              schedule.map((item, idx) => {
                const isEditing = editingId === item.id;
                const isItemActive = item.id === activeId;
                const isNext = item.id === firstPendingId;

                // Status indicator classes
                let statusBadge = '';
                if (item.status === 'completed') {
                  statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                } else if (item.status === 'active') {
                  statusBadge = 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse';
                } else if (isNext) {
                  statusBadge = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                } else {
                  statusBadge = 'bg-slate-800/40 text-slate-400 border border-slate-800';
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isItemActive 
                        ? 'bg-slate-900 border-indigo-500/40 shadow-md shadow-indigo-950/20' 
                        : 'bg-slate-950/80 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Editing Layout */
                      <div className="flex-1 space-y-3 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500">Participante</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500">Parte / Tipo</label>
                            <input
                              type="text"
                              value={editPartType}
                              onChange={(e) => setEditPartType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-1.5 cursor-pointer max-h-[32px] flex items-center justify-center gap-1 text-xs font-semibold px-2"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg p-1.5 cursor-pointer max-h-[32px]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Row Layout */
                      <>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${statusBadge}`}>
                              {item.status === 'completed' && '✓ Concluído'}
                              {item.status === 'active' && '► Em andamento'}
                              {item.status === 'pending' && (isNext ? '⏳ Próximo' : 'Aguardando')}
                            </span>
                            <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/10">
                              Previsto: {Math.floor(item.expectedTime / 60)} min
                            </span>
                            {item.status === 'completed' && item.completedTime !== null && (
                              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/20">
                                Realizado: {formatTime(item.completedTime)} (Dif: {formatDifference(item.expectedTime, item.completedTime)})
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {item.status === 'completed' && <span className="text-emerald-400 mr-1.5 font-bold">✓</span>}
                            {item.status === 'active' && <span className="text-blue-400 mr-1.5 font-bold">►</span>}
                            {isNext && <span className="text-amber-500 mr-1.5 font-bold">⏳</span>}
                            {item.name} <span className="text-xs text-slate-400 font-medium">| {item.partType}</span>
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center justify-end gap-1 px-1">
                          {/* Reordering Controls */}
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0 || item.status === 'completed'}
                            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg cursor-pointer"
                            title="Subir na programação"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === schedule.length - 1 || item.status === 'completed'}
                            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg cursor-pointer"
                            title="Descer na programação"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Trigger/Activate Control */}
                          {item.status !== 'completed' && !isItemActive && (
                            <button
                              type="button"
                              onClick={() => activateScheduleItem(item.id)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer ml-1 text-nowrap"
                            >
                              Carregar
                            </button>
                          )}

                          {/* Complete Trigger when row is active for quick bypass */}
                          {isItemActive && (
                            <button
                              type="button"
                              onClick={() => completeScheduleItem(item.id)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer ml-1 text-nowrap"
                            >
                              Concluir
                            </button>
                          )}

                          {/* Edit / Remove row controls */}
                          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                          
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-indigo-400 rounded-lg cursor-pointer"
                            title="Editar participante"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removeScheduleItem(item.id)}
                            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer"
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

        {/* Cadastro da Programação Form */}
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

        {/* Configuration Panel */}
        <section id="config-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Ajuste de Tempo e Modo Manual</h2>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Modo do Cronômetro</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setLocalMode('regressive')}
                className={`py-2 px-3 rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
                  localMode === 'regressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Regressivo (Regressiva)
              </button>
              <button
                type="button"
                onClick={() => setLocalMode('progressive')}
                className={`py-2 px-3 rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
                  localMode === 'progressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Progressivo (Contagem)
              </button>
            </div>
          </div>

          {/* Time Picker Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Minutes Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Minutos</label>
              <div className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 p-1 select-none">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-1)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={localMinutes}
                  onChange={(e) => setLocalMinutes(Math.min(599, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 text-center text-xl font-bold bg-transparent border-0 focus:ring-0 text-white font-mono focus:outline-none"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={() => adjustMinutes(1)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seconds Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Segundos</label>
              <div className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 p-1 select-none">
                <button
                  type="button"
                  onClick={() => adjustSeconds(-5)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="-5s"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={localSeconds}
                  onChange={(e) => setLocalSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 text-center text-xl font-bold bg-transparent border-0 focus:ring-0 text-white font-mono focus:outline-none"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={() => adjustSeconds(5)}
                  className="p-2.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="+5s"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Preset Selection Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Configurações Rápidas</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => applyPreset(mins)}
                  className="py-2.5 text-center bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 text-xs sm:text-sm font-bold text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Apply Config Button */}
          <button
            type="button"
            onClick={handleApplyConfig}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            Aplicar Configuração de Tempo Manual
          </button>
        </section>
      </main>

      {/* Localhost / Info Footer Info */}
      <footer className="p-4 bg-slate-950/45 text-center border-t border-slate-800 text-xs text-slate-500 select-none">
        <p>Desenvolvido para rede local com latência ultra-baixa.</p>
        <p className="mt-0.5 opacity-60">Abra este app em outro dispositivo na rede para sincronização instantânea.</p>
      </footer>
    </div>
  );
}
