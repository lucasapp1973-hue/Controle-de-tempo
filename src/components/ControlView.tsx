import { useState, useEffect, FormEvent } from 'react';
import { Play, Pause, RotateCcw, SkipForward, LogOut, DoorOpen, Smartphone, Wifi, WifiOff, Clock, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Save, X, Check, ClipboardList, ListRestart, ChevronDown, Settings } from 'lucide-react';
import { TimerState, TimerMode, ScheduleItem } from '../types';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import { reunioesService } from '../services/reunioesService';
import { participantesService } from '../services/participantesService';
import { configuracoesService } from '../services/configuracoesService';

const NOMES_OPTIONS = [
  "1. Abel Domiciano",
  "2. Alef Gall",
  "3. Leônidas Alves",
  "4. Lucas Evangelista",
  "5. Marcus Vinícius",
  "6. Moisés Werly",
  "7. Nathan Evangelista",
  "8. Rafael Barbosa",
  "divider",
  "9. Alice Werly",
  "10. Cynthia Marinho",
  "11. Elaine Fabíola",
  "12. Erika Marinho",
  "13. Francislaine Evangelista",
  "14. Geralda Cassiano",
  "15. Jaqueline Werly",
  "16. Juciene Emerick",
  "17. Maria Luiza",
  "18. Noemi Evangelista",
  "19. Rebeca Vilela",
  "20. Rosane Domiciano",
  "21. Rute Emerick",
  "22. Terezinha de Jesus"
];

const PART_TYPES_OPTIONS = [
  "1. Tesouros da Palavra de Deus",
  "2. Joias espirituais",
  "3. Leitura da Bíblia",
  "4. Cultivando o interesse",
  "5. Discurso",
  "6. Explicando suas crenças",
  "7. Fazendo discípulos",
  "8. Iniciando conversas",
  "9. O que você diria?",
  "10. Vida Cristã parte 1",
  "11. Vida Cristã parte 2",
  "12. Estudo bíblico de congregação"
];

interface ControlViewProps {
  timerState: TimerState;
  isConnected: boolean;
  isReconnecting?: boolean;
  reconnect?: () => void;
  registerMeeting?: (title: string) => void;
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
  systemConfig?: any;
}

export default function ControlView({
  timerState,
  isConnected,
  isReconnecting = false,
  reconnect,
  registerMeeting,
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
  systemConfig,
}: ControlViewProps) {
  const { isRunning, mode, currentTime, initialDuration, schedule = [], activeId, elapsedTime } = timerState;

  // Parameters states for custom thresholds and colors
  const alertThreshold = systemConfig?.alertaSegundos ?? 20;
  const [currentMeetingId, setCurrentMeetingId] = useState<string>('');
  const [presidente, setPresidente] = useState<string>('');

  // Local state for Collapsible Configuration Box
  const [showParamsCollapse, setShowParamsCollapse] = useState(false);
  const [paramAlertaSegundos, setParamAlertaSegundos] = useState(20);
  const [paramSenhaControle, setParamSenhaControle] = useState('2121');
  const [paramCorTempoNormal, setParamCorTempoNormal] = useState('#10b981');
  const [paramCorTempoAlerta, setParamCorTempoAlerta] = useState('#f59e0b');
  const [paramCorTempoEsgotado, setParamCorTempoEsgotado] = useState('#ef4444');

  useEffect(() => {
    if (systemConfig) {
      setParamAlertaSegundos(systemConfig.alertaSegundos ?? 20);
      setParamSenhaControle(systemConfig.senhaControle ?? '2121');
      setParamCorTempoNormal(systemConfig.corTempoNormal ?? '#10b981');
      setParamCorTempoAlerta(systemConfig.corTempoAlerta ?? '#f59e0b');
      setParamCorTempoEsgotado(systemConfig.corTempoEsgotado ?? '#ef4444');
    }
  }, [systemConfig]);

  // Load and bootstrap active meeting and default participants list
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Check or create active meeting for today
        const meetingsList = await reunioesService.fetchReunioes();
        const activeMeeting = meetingsList.find(m => m.status === 'em_andamento');
        if (activeMeeting) {
          setCurrentMeetingId(activeMeeting.id);
          setPresidente(activeMeeting.presidente || '');
        } else {
          const today = new Date().toISOString().split('T')[0];
          const newId = await reunioesService.createReuniao({
            data: today,
            presidente: 'Não informado',
            status: 'em_andamento'
          });
          if (newId) {
            setCurrentMeetingId(newId);
          }
        }

        // 2. Populate participants list in Firestore of NOMES_OPTIONS if empty
        const participantsCheck = await participantesService.fetchParticipantes();
        if (participantsCheck.length === 0) {
          console.log("Auto-Bootstrap: Inicializando tabela de participantes...");
          for (const opt of NOMES_OPTIONS) {
            if (opt !== 'divider') {
              const cleanNome = opt.replace(/^\d+\.\s*/, '');
              await participantesService.addParticipante(cleanNome, 'Cadastrado automaticamente na inicialização');
            }
          }
        }
      } catch (err) {
        console.error("Falha ao inicializar sessões e dados no Firestore:", err);
      }
    };
    initData();
  }, []);

  // Smart Migration: move local meetings in timerState.meetings to Firestore if database is empty
  useEffect(() => {
    if (timerState.meetings && timerState.meetings.length > 0) {
      const runMigration = async () => {
        try {
          const fbMeetings = await reunioesService.fetchReunioes();
          const closedFb = fbMeetings.filter(m => m.status === 'concluida');
          if (closedFb.length === 0) {
            console.log("Migração Inteligente: Sincronizando reuniões locais para o Firestore...");
            for (const lMeeting of timerState.meetings) {
              let formattedDate = new Date().toISOString().split('T')[0];
              try {
                if (lMeeting.date.includes('/')) {
                  const pts = lMeeting.date.split('/');
                  if (pts.length === 3) {
                    formattedDate = `${pts[2]}-${pts[1].padStart(2, '0')}-${pts[0].padStart(2, '0')}`;
                  }
                }
              } catch (e) {}

              const pres = lMeeting.title.replace('Presidida por ', '');
              const newMeetingId = await reunioesService.createReuniao({
                data: formattedDate,
                presidente: pres || 'Não informado',
                status: 'concluida'
              });

              if (newMeetingId) {
                for (const part of lMeeting.schedule) {
                  await reunioesService.addParteToReuniao(newMeetingId, {
                    participante: part.name,
                    tipoParte: part.partType,
                    tempoPrevisto: part.expectedTime,
                    tempoRealizado: part.completedTime ?? part.expectedTime,
                    diferenca: (part.completedTime ?? part.expectedTime) - part.expectedTime,
                    observacao: '',
                    concluida: part.status === 'completed'
                  });
                }
              }
            }
            console.log("Migração de Reuniões concluída.");
          }
        } catch (e) {
          console.error("Erro na migração inteligente:", e);
        }
      };
      runMigration();
    }
  }, [timerState.meetings]);

  // Calculate stopwatch card coloring matching the exact Display rules
  let cardBgClass = 'bg-slate-950/20 border-slate-800';
  let activeColor = systemConfig?.corTempoNormal ?? '#10b981';
  let cardStateLabel = '🟢 Tempo Normal';

  if (mode === 'regressive') {
    if (currentTime <= 0) {
      cardBgClass = 'bg-red-950/30 border-red-500/40 text-red-100';
      activeColor = systemConfig?.corTempoEsgotado ?? '#ef4444';
      cardStateLabel = '🔴 Tempo Esgotado';
    } else if (currentTime <= alertThreshold) {
      cardBgClass = 'bg-amber-950/20 border-amber-500/35 text-amber-100';
      activeColor = systemConfig?.corTempoAlerta ?? '#f59e0b';
      cardStateLabel = `🟡 Últimos ${alertThreshold} segundos`;
    } else {
      cardBgClass = 'bg-emerald-950/10 border-emerald-500/25 text-emerald-100';
      activeColor = systemConfig?.corTempoNormal ?? '#10b981';
      cardStateLabel = '🟢 Tempo Normal';
    }
  } else {
    const timeRemaining = Math.max(0, initialDuration - currentTime);
    if (currentTime >= initialDuration) {
      cardBgClass = 'bg-red-950/30 border-red-500/40 text-red-100';
      activeColor = systemConfig?.corTempoEsgotado ?? '#ef4444';
      cardStateLabel = '🔴 Tempo Esgotado';
    } else if (timeRemaining <= alertThreshold) {
      cardBgClass = 'bg-amber-950/20 border-amber-500/35 text-amber-100';
      activeColor = systemConfig?.corTempoAlerta ?? '#f59e0b';
      cardStateLabel = `🟡 Últimos ${alertThreshold} segundos`;
    } else {
      cardBgClass = 'bg-emerald-950/10 border-emerald-500/25 text-emerald-100';
      activeColor = systemConfig?.corTempoNormal ?? '#10b981';
      cardStateLabel = '🟢 Tempo Normal';
    }
  }

  // Add Participant Form State
  const [addName, setAddName] = useState('');
  const [addPartType, setAddPartType] = useState('');
  const [addMinutes, setAddMinutes] = useState(4);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPartType, setEditPartType] = useState('');
  const [editMinutes, setEditMinutes] = useState(4);

  // Dropdown Open/Close states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);
  const [showMinutesDropdown, setShowMinutesDropdown] = useState(false);

  const [showEditNameDropdown, setShowEditNameDropdown] = useState(false);
  const [showEditPartTypeDropdown, setShowEditPartTypeDropdown] = useState(false);
  const [showEditMinutesDropdown, setShowEditMinutesDropdown] = useState(false);

  // Operator Vibration Trigger on threshold remaining and completion/overrun
  useEffect(() => {
    if (!isRunning || !('vibrate' in navigator)) return;

    let remainsThreshold = false;
    let ended = false;

    if (mode === 'regressive') {
      if (currentTime === alertThreshold) {
        remainsThreshold = true;
      } else if (currentTime === 0) {
        ended = true;
      }
    } else {
      // Progressive mode counts up to initialDuration
      const diff = initialDuration - currentTime;
      if (diff === alertThreshold) {
        remainsThreshold = true;
      } else if (diff === 0) {
        ended = true;
      }
    }

    if (remainsThreshold) {
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
  }, [currentTime, isRunning, mode, initialDuration, alertThreshold]);

  // Save global parameters to Firestore
  const handleSaveParams = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await configuracoesService.updateConfig({
        alertaSegundos: Number(paramAlertaSegundos),
        senhaControle: paramSenhaControle,
        corTempoNormal: paramCorTempoNormal,
        corTempoAlerta: paramCorTempoAlerta,
        corTempoEsgotado: paramCorTempoEsgotado
      });
      alert("Parâmetros do sistema salvos com sucesso no Firestore!");
      setShowParamsCollapse(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar parâmetros.");
    }
  };

  // Handle completing active part and appending to meeting in Firestore
  const handleNextPart = async () => {
    if (!activeId) return;

    // Send complete to socket to advances automatically
    completeScheduleItem(activeId);

    const activeItem = schedule.find(i => i.id === activeId);
    if (activeItem && currentMeetingId) {
      try {
        const cleanNome = activeItem.name.replace(/^\d+\.\s*/, '');
        
        // Save part to Firestore
        await reunioesService.addParteToReuniao(currentMeetingId, {
          participante: cleanNome,
          tipoParte: activeItem.partType,
          tempoPrevisto: activeItem.expectedTime,
          tempoRealizado: elapsedTime,
          diferenca: elapsedTime - activeItem.expectedTime,
          observacao: '',
          concluida: true
        });

        // Ensure participant exists in database
        const allP = await participantesService.fetchParticipantes();
        if (!allP.some(p => p.nome.trim().toLowerCase() === cleanNome.trim().toLowerCase())) {
          await participantesService.addParticipante(cleanNome, 'Cadastrado automaticamente via cronômetro');
        }
      } catch (err) {
        console.error("Erro ao arquivar parte no Firestore:", err);
      }
    }
  };

  // Handle locking the meeting as completed
  const handleRegisterMeetingAndClose = async (prefTitle: string = '') => {
    if (!currentMeetingId) return;

    try {
      // Complete meeting in Firestore
      await reunioesService.updateReuniao(currentMeetingId, {
        status: 'concluida',
        data: new Date().toISOString().split('T')[0],
        presidente: presidente || 'Não informado'
      });

      // Synchronize any remainings from schedule state as well
      for (const item of schedule) {
        if (item.status === 'completed') {
          const cleanNome = item.name.replace(/^\d+\.\s*/, '');
          const existingPartes = await reunioesService.fetchPartes(currentMeetingId);
          if (!existingPartes.some(p => p.participante.toLowerCase() === cleanNome.toLowerCase() && p.tipoParte === item.partType)) {
            await reunioesService.addParteToReuniao(currentMeetingId, {
              participante: cleanNome,
              tipoParte: item.partType,
              tempoPrevisto: item.expectedTime,
              tempoRealizado: item.completedTime ?? item.expectedTime,
              diferenca: (item.completedTime ?? item.expectedTime) - item.expectedTime,
              observacao: '',
              concluida: true
            });
          }
        }
      }

      // Sync via Socket.IO
      registerMeeting?.(prefTitle);

      // Instantly generate a new active meeting doc for next run
      const today = new Date().toISOString().split('T')[0];
      const newId = await reunioesService.createReuniao({
        data: today,
        presidente: 'Não informado',
        status: 'em_andamento'
      });
      if (newId) {
        setCurrentMeetingId(newId);
        setPresidente('');
      }

      alert(`Reunião registrada com sucesso no Firestore!`);
    } catch (err) {
      console.error("Erro ao arquivar reunião:", err);
    }
  };

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

  const getFilteredOptions = (currentVal: string, fullOptions: string[]) => {
    if (!currentVal.trim()) return fullOptions;
    return fullOptions.filter(opt => opt !== 'divider' && opt.toLowerCase().includes(currentVal.toLowerCase()));
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
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <SystemModuleReturnIcon onClick={onBack} />

          <div className="flex flex-col items-center gap-1 select-none">
            <AnalogueClock type="controle" />
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">Controle</span>
          </div>

          <button
            onClick={reconnect}
            disabled={isReconnecting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 cursor-pointer max-h-[38px] ${
              isReconnecting
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                : isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/40'
                  : 'bg-red-500/10 border-red-500/20 text-red-400 animate-bounce'
            }`}
          >
            {isReconnecting ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Reconectando...</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>🟢 Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span>🔴 Desconectado</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Control Panel Workspace */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6 overflow-y-auto pb-12 mt-2">
        
        {/* PARÂMETROS DO SISTEMA (FIRESTORE SYNC) */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => setShowParamsCollapse(!showParamsCollapse)}
            className="w-full flex items-center justify-between p-4 font-bold text-slate-350 text-xs uppercase tracking-wider hover:bg-slate-900/80 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Parâmetros do Sistema (Firebase)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showParamsCollapse ? 'rotate-180' : ''}`} />
          </button>
          
          {showParamsCollapse && (
            <form onSubmit={handleSaveParams} className="p-4 border-t border-slate-850 bg-slate-950/40 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Senha de Acesso (Controle)</label>
                  <input
                    type="text"
                    value={paramSenhaControle}
                    onChange={(e) => setParamSenhaControle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Limite de Alerta (Segundos)</label>
                  <input
                    type="number"
                    value={paramAlertaSegundos}
                    onChange={(e) => setParamAlertaSegundos(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-850/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paleta de Cores do Display</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Normal</span>
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="color"
                        value={paramCorTempoNormal}
                        onChange={(e) => setParamCorTempoNormal(e.target.value)}
                        className="w-6 h-6 border-0 p-0 rounded-md cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{paramCorTempoNormal}</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Alerta</span>
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="color"
                        value={paramCorTempoAlerta}
                        onChange={(e) => setParamCorTempoAlerta(e.target.value)}
                        className="w-6 h-6 border-0 p-0 rounded-md cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{paramCorTempoAlerta}</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Esgotado</span>
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="color"
                        value={paramCorTempoEsgotado}
                        onChange={(e) => setParamCorTempoEsgotado(e.target.value)}
                        className="w-6 h-6 border-0 p-0 rounded-md cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{paramCorTempoEsgotado}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-850/60">
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}
        </section>

        {/* INPUT DE PRESIDENTE DA REUNIÃO */}
        <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Presidente de Hoje</span>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Nome do Presidente..."
                value={presidente}
                onChange={async (e) => {
                  setPresidente(e.target.value);
                  if (currentMeetingId) {
                    await reunioesService.updateReuniao(currentMeetingId, { presidente: e.target.value });
                  }
                }}
                className="bg-transparent border-0 font-extrabold text-sm text-white focus:outline-none focus:ring-0 p-0 w-full"
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 md:text-right hidden sm:block">
            <span>Sessão ativa: <span className="font-mono text-slate-400">{currentMeetingId ? currentMeetingId.substring(0, 8) : 'Carregando...'}</span></span>
          </div>
        </section>

        {/* NEW SIMPLIFIED STOPWATCH MAIN CARD WITH DYNAMIC DISPLAY STATES */}
        <section id="sync-preview-card" className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-700 ${cardBgClass}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 opacity-90">
              <Clock className="w-4 h-4 text-indigo-400" />
              Cronômetro Atual ({cardStateLabel})
            </span>
            <div className="flex items-center gap-2 bg-slate-950/90 border border-white/10 py-1 px-2.5 rounded-full shadow-inner">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-450 animate-ping' : 'bg-amber-450'}`} />
              <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest">{isRunning ? 'RODANDO' : 'PAUSADO'}</span>
            </div>
          </div>
          
          <div className="bg-slate-950/80 rounded-2xl p-6 text-center border border-white/5 shadow-inner space-y-3">
            {activeItem ? (
              <div className="text-slate-200 text-sm font-bold tracking-wide">
                Participante Ativo: <span className="text-indigo-400">{activeItem.name}</span> <span className="text-xs text-slate-400 font-medium">| {activeItem.partType}</span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic">
                Nenhum participante ativo selecionado. Clique em alguém abaixo para carregar.
              </div>
            )}

            {/* Giant Centralized Digits */}
            <div style={{ color: activeColor }} className="text-6xl md:text-7xl font-mono font-black tracking-widest leading-none my-2 transition-colors duration-500">
              {formatTime(currentTime)}
            </div>

            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Modo {mode === 'regressive' ? 'Regressivo' : 'Progressivo'} • Meta: {formatTime(initialDuration)}
              {activeItem && isRunning && (
                <span className="block text-slate-300 mt-1">
                  Tempo Realizado: <span className="font-mono text-emerald-400 font-bold">{formatTime(elapsedTime)}</span> (Dif: {formatDifference(initialDuration, elapsedTime)})
                </span>
              )}
            </div>
          </div>

          {/* STREAMLINED OPERATION BUTTONS */}
          <div className="mt-5 grid grid-cols-2 gap-3">
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

            {/* Próxima Parte Button */}
            <button
              type="button"
              onClick={handleNextPart}
              disabled={!isConnected || !activeId}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] transition-all disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer text-sm"
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
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'regressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Regressivo
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('progressive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'progressive'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Progressivo
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

            {schedule.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toLocaleDateString('pt-BR');
                    const titleInput = prompt("Digite o nome da reunião para registrar no histórico:", `Reunião de ${todayStr}`);
                    if (titleInput !== null) {
                      handleRegisterMeetingAndClose(titleInput);
                    }
                  }}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 font-bold text-xs text-white uppercase tracking-wider rounded-xl transition-all hover:shadow-indigo-550/20 shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer border border-indigo-500/45"
                >
                  <Save className="w-3.5 h-3.5" />
                  Registrar e Fechar Reunião
                </button>
              </div>
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
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nome do Participante</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Santos"
                    value={addName}
                    onChange={(e) => {
                      setAddName(e.target.value);
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => setShowNameDropdown(true)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNameDropdown(!showNameDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showNameDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNameDropdown(false)} 
                      />
                      <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto shadow-2xl z-50 py-1 font-sans">
                        {NOMES_OPTIONS.filter(opt => {
                          if (opt === 'divider') return true;
                          if (!addName.trim()) return true;
                          return opt.toLowerCase().includes(addName.toLowerCase());
                        }).map((opt, oIdx, arr) => {
                          if (opt === 'divider') {
                            // Only render divider if not filtering names
                            if (addName.trim()) return null;
                            return (
                              <div key={`div-${oIdx}`} className="h-[1px] bg-slate-800/80 my-1.5 mx-2" />
                            );
                          }
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const formattedName = opt.replace(/^\d+\.\s*/, '');
                                setAddName(formattedName);
                                setShowNameDropdown(false);
                              }}
                              className="w-full text-left py-2 px-4 hover:bg-indigo-600/10 hover:text-indigo-455 text-sm font-semibold text-slate-300 transition-colors"
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tipo da Parte</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Revisita"
                    value={addPartType}
                    onChange={(e) => {
                      setAddPartType(e.target.value);
                      setShowPartTypeDropdown(true);
                    }}
                    onFocus={() => setShowPartTypeDropdown(true)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPartTypeDropdown(!showPartTypeDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showPartTypeDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowPartTypeDropdown(false)} 
                      />
                      <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto shadow-2xl z-50 py-1 font-sans">
                        {getFilteredOptions(addPartType, PART_TYPES_OPTIONS).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const formattedPartType = opt.replace(/^\d+\.\s*/, '');
                              setAddPartType(formattedPartType);
                              setShowPartTypeDropdown(false);
                            }}
                            className="w-full text-left py-2 px-4 hover:bg-indigo-600/10 hover:text-indigo-455 text-sm font-semibold text-slate-300 transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tempo Previsto:</span>
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 font-sans select-none relative">
                  <button
                    type="button"
                    onClick={() => setAddMinutes(prev => Math.max(1, prev - 1))}
                    className="p-2 w-8 hover:bg-slate-900 rounded text-slate-400 hover:text-white max-h-[36px] flex items-center justify-center cursor-pointer font-bold font-mono"
                  >
                    -
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMinutesDropdown(!showMinutesDropdown)}
                      className="px-2.5 py-1 hover:bg-slate-900 rounded text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{addMinutes} min</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showMinutesDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowMinutesDropdown(false)} 
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto shadow-2xl z-50 py-1 w-28 text-center font-bold">
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 30].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setAddMinutes(m);
                                setShowMinutesDropdown(false);
                              }}
                              className={`w-full py-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-sm transition-colors block text-center ${
                                addMinutes === m ? 'text-indigo-400 bg-slate-900 font-bold' : 'text-slate-300'
                              }`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddMinutes(prev => Math.min(120, prev + 1))}
                    className="p-2 w-8 hover:bg-slate-900 rounded text-slate-400 hover:text-white max-h-[36px] flex items-center justify-center cursor-pointer font-bold font-mono"
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
