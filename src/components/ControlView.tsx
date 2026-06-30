import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { Play, Pause, RotateCcw, SkipForward, LogOut, DoorOpen, Smartphone, Wifi, WifiOff, Clock, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Save, X, Check, ClipboardList, ListRestart, ChevronDown, Settings, User, BookOpen, Heart, RefreshCw, Database } from 'lucide-react';
import { TimerState, TimerMode, ScheduleItem, Brochura, Licao } from '../types';
import SystemModuleReturnIcon, { AnalogueClock } from './SystemModuleReturnIcon';
import TimerCard from './TimerCard';
import DatabaseStatusIndicator from './DatabaseStatusIndicator';
import { reunioesService } from '../services/reunioesService';
import { participantesService } from '../services/participantesService';
import { configuracoesService } from '../services/configuracoesService';
import { sessionStore, congregationStore } from '../services/sessionStore';
import { licoesService } from '../services/licoesService';
import { integracaoService } from '../services/integracaoService';
import { LicaoMelhore } from '../data/licoes';

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

const PRESIDENTE_OPTIONS = [
  "Leônidas Alves",
  "Rafael Barbosa",
  "Marcus Vinícius",
  "Moisés Calegário",
  "Alef Gall"
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
  addScheduleItem: (name: string, partType: string, expectedTime: number, avaliada?: boolean, brochuraId?: string | null, licaoNumero?: number | null) => void;
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

  // Saturday Meeting exclusive states for Demo Mode
  const [saturdaySpeaker, setSaturdaySpeaker] = useState('Reginaldo Moreira');
  const [saturdayTheme, setSaturdayTheme] = useState('Como a sabedoria de Deus nos beneficia?');

  // Local state for Collapsible Configuration Box
  const [showParamsCollapse, setShowParamsCollapse] = useState(false);
  const [isParamsUnlocked, setIsParamsUnlocked] = useState(false);
  const [paramsPassword, setParamsPassword] = useState('');
  const [paramsPasswordError, setParamsPasswordError] = useState('');
  const [showPresidenteDropdown, setShowPresidenteDropdown] = useState(false);

  const [paramAlertaSegundos, setParamAlertaSegundos] = useState(20);
  const [paramSenhaControle, setParamSenhaControle] = useState('2121');
  const [paramCorTempoNormal, setParamCorTempoNormal] = useState('#10b981');
  const [paramCorTempoAlerta, setParamCorTempoAlerta] = useState('#f59e0b');
  const [paramCorTempoEsgotado, setParamCorTempoEsgotado] = useState('#ef4444');
  const [paramSalvarReuniao, setParamSalvarReuniao] = useState(true);

  useEffect(() => {
    if (systemConfig) {
      setParamAlertaSegundos(systemConfig.alertaSegundos ?? 20);
      setParamSenhaControle(systemConfig.senhaControle ?? '2121');
      setParamCorTempoNormal(systemConfig.corTempoNormal ?? '#10b981');
      setParamCorTempoAlerta(systemConfig.corTempoAlerta ?? '#f59e0b');
      setParamCorTempoEsgotado(systemConfig.corTempoEsgotado ?? '#ef4444');
      setParamSalvarReuniao(systemConfig.salvarReuniao !== false);
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
  const [isAvaliada, setIsAvaliada] = useState(false);
  const [selectedBrochuraId, setSelectedBrochuraId] = useState<string>('melhore');
  const [selectedLicao, setSelectedLicao] = useState<number>(1);

  // Ecosystem Sync integration state
  const [isSyncingEcosystem, setIsSyncingEcosystem] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'idle' | 'success' | 'info' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [detectedMeeting, setDetectedMeeting] = useState<{ isMeetingDay: boolean; meetingType: 'vida_e_ministerio' | 'fim_de_semana' | null; dayName: string } | null>(null);

  useEffect(() => {
    const cong = congregationStore.getCongregation();
    const result = integracaoService.isTodayMeetingDay(cong);
    setDetectedMeeting(result);
  }, [timerState.schedule]);

  const handleImportFromEcosystem = async (useTemplateFallback = true) => {
    const cong = congregationStore.getCongregation();
    if (!cong || cong === 'default') {
      setSyncFeedback({
        status: 'error',
        message: 'Por favor, conecte a sua Congregação primeiro no portal antes de importar.'
      });
      return;
    }

    setIsSyncingEcosystem(true);
    setSyncFeedback({ status: 'info', message: 'Sincronizando com o ecossistema...' });

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await integracaoService.fetchEcosystemSchedule(cong, todayStr);

      if (result && result.partes.length > 0) {
        reorderSchedule(result.partes);
        if (result.presidente) {
          setPresidente(result.presidente);
          if (currentMeetingId) {
            await reunioesService.updateReuniao(currentMeetingId, { presidente: result.presidente });
          }
        }
        setSyncFeedback({
          status: 'success',
          message: `Sucesso! Programação oficial importada do Firestore para ${cong.toUpperCase()} (${result.partes.length} partes).`
        });
        setIsSyncingEcosystem(false);
        return;
      }

      if (useTemplateFallback) {
        const meetingInfo = integracaoService.isTodayMeetingDay(cong);
        const mType = meetingInfo.meetingType || 'vida_e_ministerio';
        const fallback = integracaoService.getMockScheduleTemplate(mType, cong);
        
        reorderSchedule(fallback.partes);
        setPresidente(fallback.presidente);
        if (currentMeetingId) {
          await reunioesService.updateReuniao(currentMeetingId, { presidente: fallback.presidente });
        }

        setSyncFeedback({
          status: 'success',
          message: `Gerenciador: Nenhum cadastro oficial encontrado para hoje (${todayStr}) no Firestore. Carregado modelo inteligente de ${mType === 'vida_e_ministerio' ? 'Vida e Ministério' : 'Discurso e Sentinela'} para ${cong.toUpperCase()}!`
        });
      } else {
        setSyncFeedback({
          status: 'error',
          message: `Nenhuma programação oficial do Gerenciador cadastrada para hoje para ${cong.toUpperCase()}.`
        });
      }
    } catch (error) {
      console.error('Ecosystem integration error:', error);
      setSyncFeedback({
        status: 'error',
        message: 'Conexão falhou ao consultar banco de dados compartilhado.'
      });
    } finally {
      setIsSyncingEcosystem(false);
    }
  };

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPartType, setEditPartType] = useState('');
  const [editMinutes, setEditMinutes] = useState(4);
  const [editIsAvaliada, setEditIsAvaliada] = useState(false);
  const [editSelectedBrochuraId, setEditSelectedBrochuraId] = useState<string>('melhore');
  const [editSelectedLicao, setEditSelectedLicao] = useState<number>(1);

  // Lists and Cache
  const [brochuras, setBrochuras] = useState<Brochura[]>([]);
  const [licoesList, setLicoesList] = useState<Licao[]>([]);
  const [editLicoesList, setEditLicoesList] = useState<Licao[]>([]);

  // Dropdown Open/Close states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);
  const [showMinutesDropdown, setShowMinutesDropdown] = useState(false);

  const [showEditNameDropdown, setShowEditNameDropdown] = useState(false);
  const [showEditPartTypeDropdown, setShowEditPartTypeDropdown] = useState(false);
  const [showEditMinutesDropdown, setShowEditMinutesDropdown] = useState(false);

  // Initial load of brochures (lessons are loaded by selectedBrochuraId effect)
  useEffect(() => {
    const initData = async () => {
      const bList = await licoesService.fetchBrochuras();
      setBrochuras(bList);
    };
    initData();
  }, []);

  // Fetch lessons when selected brochure changes (creation form)
  useEffect(() => {
    const load = async () => {
      const data = await licoesService.fetchLicoesByBrochura(selectedBrochuraId);
      setLicoesList(data);
      if (data.length > 0) {
        setSelectedLicao(data[0].numero);
      } else {
        setSelectedLicao(1);
      }
    };
    load();
  }, [selectedBrochuraId]);

  // Fetch lessons when selected brochure changes (inline edit form)
  useEffect(() => {
    const load = async () => {
      const data = await licoesService.fetchLicoesByBrochura(editSelectedBrochuraId);
      setEditLicoesList(data);
    };
    load();
  }, [editSelectedBrochuraId]);

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
        corTempoEsgotado: paramCorTempoEsgotado,
        salvarReuniao: paramSalvarReuniao
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
    addScheduleItem(
      addName,
      addPartType,
      addMinutes * 60,
      isAvaliada,
      isAvaliada ? selectedBrochuraId : null,
      isAvaliada ? selectedLicao : null
    );
    setAddName('');
    setAddPartType('');
    setAddMinutes(4);
    setIsAvaliada(false);
    setSelectedLicao(1);
  };

  // Handler to initiate edit Mode
  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPartType(item.partType);
    setEditMinutes(Math.floor(item.expectedTime / 60));
    setEditIsAvaliada(item.avaliada ?? false);
    setEditSelectedBrochuraId(item.brochuraId ?? 'melhore');
    setEditSelectedLicao(item.licaoNumero ?? 1);
  };

  // Save changes from inline edit
  const saveEdit = (item: ScheduleItem) => {
    editScheduleItem({
      ...item,
      name: editName,
      partType: editPartType,
      expectedTime: editMinutes * 60,
      avaliada: editIsAvaliada,
      brochuraId: editIsAvaliada ? editSelectedBrochuraId : null,
      licaoNumero: editIsAvaliada ? editSelectedLicao : null,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
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
              <AnalogueClock type="controle" />
              <span className="text-sm sm:text-base md:text-lg font-black tracking-widest text-white uppercase">Controle</span>
            </div>
          </div>

          {/* Wifi & Database status on right */}
          <div className="z-10 flex items-center gap-2">
            <DatabaseStatusIndicator />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-450" /> : <WifiOff className="w-3.5 h-3.5 text-red-450" />}
              <span className="hidden sm:inline">{isConnected ? 'ONLINE' : 'DESCONECTADO'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Control Panel Workspace */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6 overflow-y-auto pb-12 mt-2">
        
        {/* PARÂMETROS DO SISTEMA (FIRESTORE SYNC - SOFTER CONTOUR & PROTECTION) */}
        <section className="bg-slate-900/40 border border-slate-900/40 rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300">
          <button
            type="button"
            onClick={() => setShowParamsCollapse(!showParamsCollapse)}
            className="w-full flex items-center justify-between p-4 font-bold text-slate-355 text-xs uppercase tracking-wider hover:bg-slate-900/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Parâmetros do Sistema (Firebase)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showParamsCollapse ? 'rotate-180' : ''}`} />
          </button>
          
          {showParamsCollapse && (
            !isParamsUnlocked ? (
              <div className="p-6 border-t border-slate-900/40 bg-slate-950/40 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505"></span>
                  </span>
                  Acesso Restrito
                </div>
                <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
                  Insira a senha de desenvolvedor para visualizar e configurar os parâmetros do Firebase:
                </p>
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    type="password"
                    placeholder="Senha de acesso..."
                    value={paramsPassword}
                    onChange={(e) => {
                      setParamsPassword(e.target.value);
                      setParamsPasswordError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (paramsPassword === '2222') {
                          setIsParamsUnlocked(true);
                          setParamsPasswordError('');
                        } else {
                          setParamsPasswordError('Senha incorreta!');
                        }
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (paramsPassword === '2222') {
                        setIsParamsUnlocked(true);
                        setParamsPasswordError('');
                      } else {
                        setParamsPasswordError('Senha incorreta!');
                      }
                    }}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-xs cursor-pointer select-none transition-all font-sans"
                  >
                    Confirmar
                  </button>
                </div>
                {paramsPasswordError && (
                  <span className="text-[10px] font-bold text-red-400 animate-pulse">{paramsPasswordError}</span>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveParams} className="p-4 border-t border-slate-900/40 bg-slate-950/40 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Senha de Acesso (Controle)</label>
                    <input
                      type="text"
                      value={paramSenhaControle}
                      onChange={(e) => setParamSenhaControle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-855 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-white text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Limite de Alerta (Segundos)</label>
                    <input
                      type="number"
                      value={paramAlertaSegundos}
                      onChange={(e) => setParamAlertaSegundos(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-855 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono text-center"
                    />
                  </div>
                </div>

                {/* SALVAR REUNIÃO TOGGLE CONTROL */}
                <div className="space-y-2 pt-2 border-t border-slate-855/60">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Gravar Reunião no Firebase? (Modo Demonstração)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setParamSalvarReuniao(true)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        paramSalvarReuniao
                          ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-black'
                          : 'bg-slate-950 border border-slate-900 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${paramSalvarReuniao ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                      Sim (Gravação Ativa)
                    </button>
                    <button
                      type="button"
                      onClick={() => setParamSalvarReuniao(false)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        !paramSalvarReuniao
                          ? 'bg-pink-500/10 border border-pink-500/40 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)] font-black'
                          : 'bg-slate-950 border border-slate-900 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${!paramSalvarReuniao ? 'bg-pink-400 animate-pulse' : 'bg-slate-700'}`} />
                      Não (Modo Demonstração)
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                    * Ao escolher não salvar, a reunião funcionará idêntica em tempo real, porém todos os registros e relatórios de partes de oradores concluídos ficarão guardados apenas na memória da sessão atual do seu navegador, sem enviar nada ao banco de dados Firestore do Firebase.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-855/60">
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

                <div className="flex justify-end pt-2 border-t border-slate-855/60">
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )
          )}
        </section>

        {/* INPUT DE PRESIDENTE DA REUNIÃO */}
        <section className={`relative bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 transition-all duration-200 ${showPresidenteDropdown ? 'z-40' : 'z-20'}`}>
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Presidente de Hoje</h2>
            </div>
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Sessão ativa: <span className="text-slate-400">{currentMeetingId ? currentMeetingId.substring(0, 8) : 'Carregando...'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2.5 focus-within:ring-2 focus-within:ring-indigo-600/50 focus-within:border-indigo-600 transition-all">
              <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                placeholder="Ex: Leônidas Alves"
                value={presidente}
                onChange={async (e) => {
                  setPresidente(e.target.value);
                  if (currentMeetingId) {
                    await reunioesService.updateReuniao(currentMeetingId, { presidente: e.target.value });
                  }
                }}
                onFocus={() => setShowPresidenteDropdown(true)}
                className="bg-transparent border-0 font-extrabold text-sm text-white focus:outline-none focus:ring-0 p-0 w-full"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowPresidenteDropdown(!showPresidenteDropdown)}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <ChevronDown className="w-4.5 h-4.5" />
            </button>

            {showPresidenteDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPresidenteDropdown(false)} 
                />
                <div className="absolute left-0 right-0 top-[52px] mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto shadow-2xl z-50 py-1 font-sans">
                  {PRESIDENTE_OPTIONS.filter(opt => {
                    if (!presidente.trim()) return true;
                    return opt.toLowerCase().includes(presidente.toLowerCase());
                  }).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={async () => {
                        setPresidente(opt);
                        setShowPresidenteDropdown(false);
                        if (currentMeetingId) {
                          await reunioesService.updateReuniao(currentMeetingId, { presidente: opt });
                        }
                      }}
                      className="w-full text-left py-2.5 px-4 hover:bg-indigo-600/10 hover:text-indigo-400 text-sm font-semibold text-slate-300 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* CARD EXCLUSIVO DE SÁBADO (MODO DEMONSTRAÇÃO) */}
        {sessionStore.isDemo() && (
          <section id="saturday-meeting-card" className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <span className="text-lg">📅</span>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">Reunião de Sábado — Discurso Público</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome do Orador</label>
                <input
                  type="text"
                  placeholder="Nome do Orador..."
                  value={saturdaySpeaker}
                  onChange={(e) => setSaturdaySpeaker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Tema do Discurso Público</label>
                <input
                  type="text"
                  placeholder="Tema do Discurso..."
                  value={saturdayTheme}
                  onChange={(e) => setSaturdayTheme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                Configura a parte na programação e define o cronômetro para 30 minutos regresso. O presidente poderá visualizar em tempo real.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!saturdaySpeaker.trim() || !saturdayTheme.trim()) {
                    alert("Por favor, preencha o Nome do Orador e o Tema do Discurso.");
                    return;
                  }
                  // Send to socket
                  addScheduleItem(saturdaySpeaker, `Discurso Público: ${saturdayTheme}`, 30 * 60);
                  setTimer(30, 0, 'regressive');
                  alert("Sucesso! 30 minutos configurados para o Orador e Tema selecionados!");
                }}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 font-extrabold text-xs text-slate-950 uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-600"
              >
                <span>⏱</span>
                <span>Configurar 30 Minutos</span>
              </button>
            </div>
          </section>
        )}

        {/* NEW SIMPLIFIED STOPWATCH MAIN CARD WITH DYNAMIC DISPLAY STATES */}
        <TimerCard
          timerState={timerState}
          systemConfig={systemConfig}
          isReadOnly={false}
          isConnected={isConnected}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          handleNextPart={handleNextPart}
          handleModeChange={handleModeChange}
        />

        {/* LISTA DA PROGRAMAÇÃO WITH SELEÇÃO INTELIGENTE CHANNELS */}
        <section id="schedule-list-card" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Lista da Programação</h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSyncingEcosystem}
                onClick={() => handleImportFromEcosystem(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 border border-indigo-500/20 py-1.5 px-2.5 rounded-lg cursor-pointer"
                title="Sincronizar programação do Gerenciador/Agenda"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEcosystem ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
              {schedule.length > 0 && (
                <button
                  type="button"
                  onClick={resetSchedule}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors active:scale-95 bg-slate-900 border border-slate-800 py-1.5 px-2.5 rounded-lg cursor-pointer"
                  title="Reinicia todo o andamento das partes anteriores"
                >
                  <ListRestart className="w-3.5 h-3.5" />
                  Reiniciar
                </button>
              )}
            </div>
          </div>

          {syncFeedback.status !== 'idle' && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 border transition-all ${
              syncFeedback.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              syncFeedback.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <div className="flex items-center gap-2">
                <span>{syncFeedback.status === 'success' ? '✨' : syncFeedback.status === 'error' ? '⚠️' : 'ℹ️'}</span>
                <span>{syncFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncFeedback({ status: 'idle', message: '' })}
                className="text-[10px] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            {schedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/25 border border-slate-900/60 rounded-xl space-y-4 text-center">
                <Database className="w-8 h-8 text-indigo-400 animate-pulse" />
                
                {detectedMeeting && detectedMeeting.isMeetingDay ? (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white">
                      📅 Reunião Detectada para Hoje ({detectedMeeting.dayName})
                    </h3>
                    <p className="text-[11px] text-slate-400 max-w-md leading-relaxed mx-auto">
                      Identificamos que hoje é dia de reunião para a congregação <strong className="text-indigo-400">{congregationStore.getCongregation().toUpperCase()}</strong>! Quer carregar a programação oficial do Gerenciador/Agenda automaticamente?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Nenhuma programação carregada para hoje
                    </h3>
                    <p className="text-[11px] text-slate-400 max-w-md leading-relaxed mx-auto">
                      Você pode sincronizar a programação automaticamente do ecossistema de aplicativos ou cadastrar as partes manualmente abaixo.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSyncingEcosystem}
                  onClick={() => handleImportFromEcosystem(true)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs tracking-wide shadow-lg hover:shadow-indigo-650/15 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEcosystem ? 'animate-spin' : ''}`} />
                  {isSyncingEcosystem ? 'Sincronizando...' : '✨ Sincronizar Programação'}
                </button>
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
                         <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 my-2 space-y-2.5">
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                             <input
                               type="checkbox"
                               checked={editIsAvaliada}
                               onChange={(e) => setEditIsAvaliada(e.target.checked)}
                               className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 accent-indigo-500"
                             />
                             <span className="text-xs text-slate-300 font-semibold">Editar: Parte avaliada por brochuras</span>
                           </label>
                           {editIsAvaliada && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                               <div className="space-y-1">
                                 <label className="text-[10px] uppercase font-bold text-slate-500 block">Brochura</label>
                                 <select
                                   value={editSelectedBrochuraId}
                                   onChange={(e) => setEditSelectedBrochuraId(e.target.value)}
                                   className="w-full bg-slate-955 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white"
                                 >
                                   {brochuras.map((b) => (
                                     <option key={b.id} value={b.id}>
                                       {b.nome}
                                     </option>
                                   ))}
                                 </select>
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] uppercase font-bold text-slate-500 block">Escolher Lição</label>
                                 <select
                                   value={editSelectedLicao}
                                   onChange={(e) => setEditSelectedLicao(Number(e.target.value))}
                                   className="w-full bg-slate-955 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white"
                                 >
                                   {editLicoesList.map((licao) => (
                                     <option key={licao.numero} value={licao.numero}>
                                       Lição {licao.numero} — {licao.titulo}
                                     </option>
                                   ))}
                                 </select>
                               </div>
                             </div>
                           )}
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
                          <div className="text-sm font-bold text-white leading-relaxed flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {statusSymbol && <span className="mr-1">{statusSymbol}</span>}
                              <span>{item.name}</span>
                              <span className="text-slate-300 font-semibold"> - {Math.floor(item.expectedTime / 60)} min</span>
                              <span className="text-slate-500 font-normal text-xs">| {item.partType}</span>
                            </div>

                             {item.avaliada && item.brochuraId && item.licaoNumero && (
                               (() => {
                                 const isAmePessoas = item.brochuraId === 'ame_pessoas';
                                 return (
                                   <div className={`flex items-center gap-1.5 text-xs ${isAmePessoas ? 'text-rose-450 bg-rose-950/40 border-rose-900/30' : 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30'} px-2.5 py-1 border rounded-xl w-fit select-none font-semibold mt-1`}>
                                     {isAmePessoas ? (
                                       <Heart className="w-3.5 h-3.5 text-rose-300" />
                                     ) : (
                                       <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                                     )}
                                     <span className={`text-[10px] ${isAmePessoas ? 'text-rose-300' : 'text-indigo-300'} uppercase tracking-widest font-extrabold`}>{licoesService.getBrochuraNome(item.brochuraId)}:</span>
                                     <span>Lição {item.licaoNumero} — {licoesService.getLicao(item.brochuraId, item.licaoNumero)?.titulo || 'Lição'}</span>
                                   </div>
                                 );
                               })()
                             )}
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
                <div className="flex items-center gap-2 relative">
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
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNameDropdown(!showNameDropdown)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <ChevronDown className="w-4.5 h-4.5" />
                  </button>

                  {showNameDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNameDropdown(false)} 
                      />
                      <div className="absolute left-0 right-0 top-[52px] mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto shadow-2xl z-50 py-1 font-sans">
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
                <div className="flex items-center gap-2 relative">
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
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 font-sans text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPartTypeDropdown(!showPartTypeDropdown)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <ChevronDown className="w-4.5 h-4.5" />
                  </button>

                  {showPartTypeDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowPartTypeDropdown(false)} 
                      />
                      <div className="absolute left-0 right-0 top-[52px] mt-1.5 bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto shadow-2xl z-50 py-1 font-sans">
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

            {/* Dynamic Evaluation Brochures & Lesson Selection */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAvaliada}
                  onChange={(e) => setIsAvaliada(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600/50 focus:ring-2 focus:ring-offset-slate-900 focus:outline-none transition-all cursor-pointer accent-indigo-650"
                />
                <span className="text-sm font-semibold text-slate-200">Parte avaliada por brochuras</span>
              </label>

              {isAvaliada && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                      Brochura
                    </label>
                    <select
                      value={selectedBrochuraId}
                      onChange={(e) => setSelectedBrochuraId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-650/50 focus:border-indigo-600 font-sans text-sm cursor-pointer"
                    >
                      {brochuras.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-950 text-slate-200 font-sans">
                          {b.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                      Lição em Avaliação
                    </label>
                    <select
                      value={selectedLicao}
                      onChange={(e) => setSelectedLicao(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-650/50 focus:border-indigo-600 font-sans text-sm cursor-pointer"
                    >
                      {licoesList.map((licao) => (
                        <option key={licao.numero} value={licao.numero} className="bg-slate-950 text-slate-200 font-sans">
                          Lição {licao.numero} — {licao.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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
