import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Play, Pause, RotateCcw, Check, Sparkles, Plus, Trash2, Edit3, 
  Eye, Monitor, Layers, List, Clock, AlertTriangle, FileText, ChevronDown, 
  ChevronUp, Move, Minimize2, Maximize2, RefreshCw, Send, Save, ArrowRight, Book, X
} from 'lucide-react';
import { TimerState, ScheduleItem, Esboco, EsbocoBlock } from '../types';
import { esbocosService } from '../services/esbocosService';
import { bibleService } from '../services/bibleService';
import { congregationStore } from '../services/sessionStore';
import SystemModuleReturnIcon from './SystemModuleReturnIcon';

interface PortaEsbocoViewProps {
  timerState: TimerState;
  isConnected: boolean;
  onBack: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTimer: (minutes: number, seconds: number, mode: 'progressive' | 'regressive') => void;
  completeScheduleItem: (id: string, actualTime: number) => void;
  activateScheduleItem: (id: string) => void;
}

export default function PortaEsbocoView({
  timerState,
  isConnected,
  onBack,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  setTimer,
  completeScheduleItem,
  activateScheduleItem
}: PortaEsbocoViewProps) {
  const congregation = congregationStore.getCongregation();
  
  // Lists of outlines
  const [esbocos, setEsbocos] = useState<Esboco[]>([]);
  const [selectedEsboco, setSelectedEsboco] = useState<Esboco | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Interface Views: 'list' | 'editor' | 'presentation' | 'script'
  const [currentTab, setCurrentTab] = useState<'list' | 'editor' | 'presentation' | 'script'>('list');
  
  // Floating timer state
  const [isMiniTimerOpen, setIsMiniTimerOpen] = useState(true);
  const [miniTimerPos, setMiniTimerPos] = useState({ x: 0, y: 0 });
  const [isMiniTimerCollapsed, setIsMiniTimerCollapsed] = useState(false);
  
  // Expandable verses state
  const [expandedVerses, setExpandedVerses] = useState<Record<string, { text: string; isOpen: boolean; isLoading: boolean }>>({});
  
  // Active timing blocks in presentation/script mode
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [blockElapsedTimes, setBlockElapsedTimes] = useState<Record<string, number>>({});
  const blockTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Editor state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSpeaker, setEditedSpeaker] = useState('');
  const [editedDuration, setEditedDuration] = useState(30); // in minutes
  const [editedBlocks, setEditedBlocks] = useState<EsbocoBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [currentBlockType, setCurrentBlockType] = useState<'title' | 'heading' | 'paragraph' | 'comment' | 'script'>('paragraph');
  const [currentBlockContent, setCurrentBlockContent] = useState('');
  const [currentBlockAllocTime, setCurrentBlockAllocTime] = useState(2); // in minutes

  // Load sketches on startup
  useEffect(() => {
    loadEsbocos();
  }, [congregation]);

  // Timed block clock tick (for block-by-block scripts)
  useEffect(() => {
    if (timerState.isRunning && activeBlockId) {
      if (!blockTimerRef.current) {
        blockTimerRef.current = setInterval(() => {
          setBlockElapsedTimes(prev => ({
            ...prev,
            [activeBlockId]: (prev[activeBlockId] || 0) + 1
          }));
        }, 1000);
      }
    } else {
      if (blockTimerRef.current) {
        clearInterval(blockTimerRef.current);
        blockTimerRef.current = null;
      }
    }
    return () => {
      if (blockTimerRef.current) clearInterval(blockTimerRef.current);
    };
  }, [timerState.isRunning, activeBlockId]);

  const loadEsbocos = async () => {
    setIsLoading(true);
    try {
      const list = await esbocosService.fetchEsbocos();
      setEsbocos(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEsboco = (esboco: Esboco) => {
    setSelectedEsboco(esboco);
    setEditedTitle(esboco.title);
    setEditedSpeaker(esboco.speaker);
    setEditedDuration(Math.round(esboco.duration / 60));
    setEditedBlocks([...esboco.blocks]);
    
    // Auto detect Bible verses so the user has immediate access
    esboco.blocks.forEach(block => {
      const verses = bibleService.detectReferencesInText(block.content);
      verses.forEach(v => {
        const cleanV = v.trim();
        if (!expandedVerses[cleanV]) {
          setExpandedVerses(prev => ({
            ...prev,
            [cleanV]: { text: '', isOpen: false, isLoading: false }
          }));
        }
      });
    });
    
    setCurrentTab('presentation');
  };

  const handleCreateNewEsboco = () => {
    const newEsboco: Esboco = {
      id: `esboco_${Date.now()}`,
      title: 'Novo Esboço Teocrático',
      speaker: 'Orador',
      duration: 15 * 60, // 15 min default
      congregation: congregation,
      lastSaved: new Date().toISOString(),
      blocks: [
        { id: 'eb_1', type: 'title', content: 'NOVO ESBOÇO TEOCRÁTICO' },
        { id: 'eb_2', type: 'heading', content: '1. Introdução da Parte', allocatedTime: 3 * 60 },
        { id: 'eb_3', type: 'paragraph', content: 'Digite o conteúdo principal aqui. Você pode citar textos bíblicos reais como Mateus 6:34 ou João 3:16 que o sistema irá detectá-los automaticamente!' }
      ]
    };
    setSelectedEsboco(newEsboco);
    setEditedTitle(newEsboco.title);
    setEditedSpeaker(newEsboco.speaker);
    setEditedDuration(15);
    setEditedBlocks([...newEsboco.blocks]);
    setCurrentTab('editor');
  };

  const handleSaveEsboco = async () => {
    if (!selectedEsboco) return;
    const esbocoToSave: Esboco = {
      ...selectedEsboco,
      title: editedTitle,
      speaker: editedSpeaker,
      duration: editedDuration * 60,
      blocks: editedBlocks,
      lastSaved: new Date().toISOString()
    };
    
    try {
      await esbocosService.saveEsboco(esbocoToSave);
      setSelectedEsboco(esbocoToSave);
      await loadEsbocos();
      alert('Esboço salvo com sucesso!');
    } catch (e) {
      alert('Erro ao salvar no Firestore. Verifique sua conexão.');
    }
  };

  const handleDeleteEsboco = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza de que deseja excluir este esboço permanentemente?')) return;
    try {
      await esbocosService.deleteEsboco(id);
      if (selectedEsboco?.id === id) {
        setSelectedEsboco(null);
      }
      await loadEsbocos();
    } catch (e) {
      alert('Erro ao excluir do Firestore.');
    }
  };

  // Auto Integration Module: Load current Active Schedule Item from the live Sync Timer
  const handleAutoLoadFromSync = () => {
    const activeItem = timerState.schedule.find(item => item.status === 'active') || 
                       timerState.schedule.find(item => item.status === 'pending');
    
    if (!activeItem) {
      alert('Nenhuma designação ativa ou pendente detectada no cronômetro do Sync no momento. Cadastre partes no painel de Controle primeiro!');
      return;
    }

    // Try to find if we already have an outline with a similar title or matching speaker
    const matchingEsboco = esbocos.find(e => 
      e.title.toLowerCase().includes(activeItem.partType.toLowerCase()) || 
      e.speaker.toLowerCase().includes(activeItem.name.toLowerCase())
    );

    if (matchingEsboco) {
      handleSelectEsboco(matchingEsboco);
      return;
    }

    // Otherwise, generate a perfect structured teocratic outline matching the part type!
    const generatedBlocks: EsbocoBlock[] = [
      { id: 'gb_1', type: 'title', content: activeItem.partType.toUpperCase() },
      { id: 'gb_2', type: 'heading', content: 'Introdução da Designação', allocatedTime: Math.round(activeItem.expectedTime * 0.2) },
      { id: 'gb_3', type: 'paragraph', content: `Tema da designação de ${activeItem.name}. É recomendável iniciar com uma pergunta cativante ou referência relevante. Veja Salmos 23:1.` },
      { id: 'gb_4', type: 'heading', content: 'Desenvolvimento e Pontos Principais', allocatedTime: Math.round(activeItem.expectedTime * 0.6) },
      { id: 'gb_5', type: 'paragraph', content: 'Desenvolva os pontos centrais da lição de forma simples e direta, incentivando a participação mental do público. Aplique o conselho de Mateus 6:34 para as ansiedades do cotidiano.' },
      { id: 'gb_6', type: 'comment', content: 'Nota de ajuda: Manter contato visual constante com o auditório e falar com entusiasmo.' },
      { id: 'gb_7', type: 'heading', content: 'Conclusão e Apelo', allocatedTime: Math.round(activeItem.expectedTime * 0.2) },
      { id: 'gb_8', type: 'paragraph', content: 'Faça um fechamento memorável, mostrando claramente como o auditório pode colocar em prática os conselhos bíblicos analisados hoje.' }
    ];

    const newEsboco: Esboco = {
      id: `esboco_sync_${activeItem.id}`,
      title: activeItem.partType,
      speaker: activeItem.name,
      duration: activeItem.expectedTime,
      congregation: congregation,
      lastSaved: new Date().toISOString(),
      blocks: generatedBlocks
    };

    setSelectedEsboco(newEsboco);
    setEditedTitle(newEsboco.title);
    setEditedSpeaker(newEsboco.speaker);
    setEditedDuration(Math.round(newEsboco.duration / 60));
    setEditedBlocks(generatedBlocks);
    
    // Pre-fill verses list
    generatedBlocks.forEach(b => {
      const verses = bibleService.detectReferencesInText(b.content);
      verses.forEach(v => {
        const cleanV = v.trim();
        setExpandedVerses(prev => ({
          ...prev,
          [cleanV]: { text: '', isOpen: false, isLoading: false }
        }));
      });
    });

    setCurrentTab('script');
    alert(`Sucesso! Carregada a designação "${activeItem.partType}" de ${activeItem.name} (${Math.round(activeItem.expectedTime / 60)} min) integrada diretamente ao Sync.`);
  };

  // Bible verse expansion toggle drawer
  const toggleVerse = async (verseRef: string) => {
    const cleanRef = verseRef.trim();
    const current = expandedVerses[cleanRef];

    if (!current) return;

    if (current.isOpen) {
      setExpandedVerses(prev => ({
        ...prev,
        [cleanRef]: { ...prev[cleanRef], isOpen: false }
      }));
      return;
    }

    if (current.text) {
      setExpandedVerses(prev => ({
        ...prev,
        [cleanRef]: { ...prev[cleanRef], isOpen: true }
      }));
      return;
    }

    // Fetch the verse
    setExpandedVerses(prev => ({
      ...prev,
      [cleanRef]: { ...prev[cleanRef], isLoading: true }
    }));

    try {
      const text = await bibleService.fetchVerseText(cleanRef);
      setExpandedVerses(prev => ({
        ...prev,
        [cleanRef]: { text, isOpen: true, isLoading: false }
      }));
    } catch (e) {
      setExpandedVerses(prev => ({
        ...prev,
        [cleanRef]: { text: '[Erro ao carregar versículo. Verifique sua conexão]', isOpen: true, isLoading: false }
      }));
    }
  };

  // Highlight references inline in text and return styled nodes
  const renderFormattedBlockText = (text: string) => {
    const regex = bibleService.getBibleReferenceRegex();
    const parts = text.split(regex);
    const matches = text.match(regex);

    if (!matches) return <span>{text}</span>;

    const elements: React.ReactNode[] = [];
    parts.forEach((part, index) => {
      elements.push(<span key={`text-${index}`}>{part}</span>);
      if (index < matches.length) {
        const ref = matches[index];
        const isExpanded = expandedVerses[ref.trim()]?.isOpen;
        elements.push(
          <span key={`ref-${index}`} className="inline-block mx-1">
            <button
              onClick={() => toggleVerse(ref)}
              className={`px-2 py-0.5 rounded-md text-xs font-black select-none tracking-wide transition-all border ${
                isExpanded 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-indigo-950/45 hover:bg-indigo-900/60 border-indigo-800/50 text-indigo-300'
              }`}
            >
              📖 {ref} {isExpanded ? '▲' : '▼'}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="block my-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm leading-relaxed text-left font-serif font-medium shadow-inner relative z-10"
                >
                  <span className="text-xs font-sans font-bold text-indigo-400 block mb-1">
                    Tradução do Novo Mundo:
                  </span>
                  {expandedVerses[ref.trim()]?.isLoading ? (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Carregando texto sagrado...
                    </span>
                  ) : (
                    expandedVerses[ref.trim()]?.text
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      }
    });

    return <div>{elements}</div>;
  };

  // Editor Blocks manipulation
  const handleAddBlock = () => {
    const newBlock: EsbocoBlock = {
      id: `eb_new_${Date.now()}`,
      type: currentBlockType,
      content: currentBlockContent || 'Conteúdo do bloco',
      allocatedTime: currentBlockType === 'heading' ? currentBlockAllocTime * 60 : undefined
    };
    
    setEditedBlocks(prev => [...prev, newBlock]);
    setCurrentBlockContent('');
    setSelectedBlockId(null);

    // Auto detect verses
    const verses = bibleService.detectReferencesInText(newBlock.content);
    verses.forEach(v => {
      const cleanV = v.trim();
      if (!expandedVerses[cleanV]) {
        setExpandedVerses(prev => ({
          ...prev,
          [cleanV]: { text: '', isOpen: false, isLoading: false }
        }));
      }
    });
  };

  const handleUpdateBlock = (id: string, updatedText: string) => {
    setEditedBlocks(prev => prev.map(b => b.id === id ? { ...b, content: updatedText } : b));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editedBlocks.length) return;
    
    const copy = [...editedBlocks];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setEditedBlocks(copy);
  };

  const handleRemoveBlock = (id: string) => {
    setEditedBlocks(prev => prev.filter(b => b.id !== id));
  };

  const getTimerProgressColor = () => {
    if (timerState.currentTime <= 0) return 'bg-red-500';
    if (timerState.currentTime < 60) return 'bg-amber-500 animate-pulse';
    return 'bg-emerald-500';
  };

  const formatSeconds = (totalSecs: number) => {
    const absSecs = Math.abs(totalSecs);
    const mins = Math.floor(absSecs / 60);
    const secs = absSecs % 60;
    const sign = totalSecs < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main header row */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md py-4 px-4 sm:px-6 sticky top-0 z-40 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          <SystemModuleReturnIcon onClick={onBack} />
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Porta-Esboço
              <span className="text-[10px] bg-indigo-550/10 text-indigo-300 border border-indigo-500/20 py-0.5 px-2 rounded-full font-bold">V1.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
              {congregation === 'default' ? 'AMBIENTE PADRÃO' : `CONGREGAÇÃO: ${congregation.toUpperCase()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {currentTab !== 'list' && (
            <button
              onClick={() => setCurrentTab('list')}
              className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:text-white text-slate-400 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            >
              Voltar ao Início
            </button>
          )}
          <button
            onClick={handleAutoLoadFromSync}
            className="py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-black rounded-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            title="Importa o tema e o tempo da designação ativa no cronômetro"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Puxar do Sync</span>
          </button>
        </div>
      </header>

      {/* Tabs Menu */}
      {selectedEsboco && (
        <div className="bg-slate-900/40 border-b border-slate-900 px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none">
          <span className="text-xs font-bold text-slate-500 pr-2 uppercase tracking-wider shrink-0">Módulos:</span>
          {[
            { id: 'presentation', label: 'Modo Apresentação', icon: Eye },
            { id: 'script', label: 'Modo Roteiro', icon: Layers },
            { id: 'editor', label: 'Editor de Esboço', icon: Edit3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 border ${
                  isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto pb-24">
        
        {/* TAB 1: LIST / SELECT OUTLINE */}
        {currentTab === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Meus Esboços e Discursos</h2>
                <p className="text-xs text-slate-450 mt-1">Selecione um esboço para pregar, ou crie/importe um novo integrado com as designações.</p>
              </div>
              <button
                onClick={handleCreateNewEsboco}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Criar Esboço em Branco
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-xs font-semibold">Buscando esboços do Firestore...</span>
              </div>
            ) : esbocos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/25 border border-slate-900 rounded-2xl text-center space-y-4">
                <BookOpen className="w-12 h-12 text-slate-700 animate-pulse" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-300">Nenhum Esboço Cadastrado</h3>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    Você ainda não possui esboços salvos nesta congregação. Comece criando um novo esboço ou puxe diretamente do Sync da reunião!
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateNewEsboco}
                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Criar Novo
                  </button>
                  <button
                    onClick={handleAutoLoadFromSync}
                    className="py-2 px-3 bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Puxar do Sync
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {esbocos.map((esboco) => (
                  <div
                    key={esboco.id}
                    onClick={() => handleSelectEsboco(esboco)}
                    className="group bg-slate-900/40 hover:bg-slate-900/90 border border-slate-900 hover:border-slate-800 rounded-2xl p-4.5 cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          {Math.round(esboco.duration / 60)} MINUTOS
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEsboco(esboco);
                              setCurrentTab('editor');
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEsboco(esboco.id, e)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {esboco.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-850 pt-3 text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Orador:</span>
                        <span className="text-slate-300 font-bold">{esboco.speaker}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <span>Atualizado:</span>
                        <span>{new Date(esboco.lastSaved).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PORTA-ESBOÇO EDITOR */}
        {currentTab === 'editor' && selectedEsboco && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Editor Ativo</span>
                <h2 className="text-lg font-black text-white">Refinar Esboço da Parte</h2>
              </div>
              <button
                onClick={handleSaveEsboco}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <Save className="w-4 h-4" />
                Salvar Esboço
              </button>
            </div>

            {/* Overall metadata fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/25 border border-slate-900 p-4 rounded-2xl">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tema do Discurso / Parte</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nome do Participante / Orador</label>
                <input
                  type="text"
                  value={editedSpeaker}
                  onChange={(e) => setEditedSpeaker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Duração Recomendada (Minutos)</label>
                <input
                  type="number"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* List of current blocks in editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-350">Estrutura de Blocos do Esboço</h3>
                <span className="text-[10px] text-slate-500 font-bold">{editedBlocks.length} blocos criados</span>
              </div>

              <div className="space-y-2">
                {editedBlocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                      block.type === 'title' ? 'bg-indigo-950/20 border-indigo-850/60' :
                      block.type === 'heading' ? 'bg-slate-900 border-slate-800' :
                      block.type === 'comment' ? 'bg-amber-950/10 border-amber-850/30 text-amber-300' :
                      block.type === 'script' ? 'bg-emerald-950/15 border-emerald-850/30 text-emerald-300' :
                      'bg-slate-900/40 border-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleMoveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveBlock(idx, 'down')}
                        disabled={idx === editedBlocks.length - 1}
                        className="text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          block.type === 'title' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40' :
                          block.type === 'heading' ? 'bg-slate-950 text-slate-400 border border-slate-850' :
                          block.type === 'comment' ? 'bg-amber-950 text-amber-400 border border-amber-800/20' :
                          block.type === 'script' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/20' :
                          'bg-slate-950 text-slate-500'
                        }`}>
                          {block.type === 'title' ? 'Tema / Título' :
                           block.type === 'heading' ? 'Cabeçalho / Seção' :
                           block.type === 'comment' ? 'Comentário / Nota' :
                           block.type === 'script' ? 'Ilustração / Roteiro' :
                           'Parágrafo de Texto'}
                        </span>
                        
                        {block.allocatedTime && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-950 py-0.5 px-2 rounded-md border border-slate-850">
                            ⏱️ {Math.round(block.allocatedTime / 60)} min
                          </span>
                        )}
                      </div>

                      <textarea
                        value={block.content}
                        rows={block.type === 'paragraph' ? 3 : 1}
                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                        className="w-full bg-transparent border-none text-xs leading-relaxed focus:outline-none font-sans font-medium text-slate-200 resize-none p-0"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1 text-slate-550 hover:text-red-400 cursor-pointer transition-colors pt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form to add a new block */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 mt-4 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Inserir Novo Bloco de Conteúdo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Estilo do Bloco</label>
                    <select
                      value={currentBlockType}
                      onChange={(e) => setCurrentBlockType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-white focus:outline-none"
                    >
                      <option value="title">Título Principal</option>
                      <option value="heading">Cabeçalho de Seção</option>
                      <option value="paragraph">Parágrafo / Ideias</option>
                      <option value="comment">Nota / Destaque visual</option>
                      <option value="script">Roteiro / Ilustração</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Tempo Alocado (Apenas Seções, em min)</label>
                    <input
                      type="number"
                      disabled={currentBlockType !== 'heading'}
                      value={currentBlockAllocTime}
                      onChange={(e) => setCurrentBlockAllocTime(parseInt(e.target.value) || 2)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-white focus:outline-none disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Texto / Conteúdo do Bloco</label>
                  <textarea
                    value={currentBlockContent}
                    onChange={(e) => setCurrentBlockContent(e.target.value)}
                    placeholder="Digite as notas ou ideias do discurso aqui..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer w-full"
                >
                  Confirmar e Adicionar Bloco
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MODO APRESENTAÇÃO */}
        {currentTab === 'presentation' && selectedEsboco && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5 select-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Modo Apresentação Ativo</span>
              <h2 className="text-2xl font-black text-white tracking-tight font-sans leading-none">{selectedEsboco.title}</h2>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <span>Orador: <strong className="text-white">{selectedEsboco.speaker}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Tempo da Parte: <strong className="text-white">{Math.round(selectedEsboco.duration / 60)} min</strong></span>
              </div>
            </div>

            {/* Immersive high contrast outline blocks */}
            <div className="space-y-6 bg-slate-900/15 border border-slate-900/60 p-6 rounded-3xl font-sans relative">
              {editedBlocks.map((block) => {
                if (block.type === 'title') {
                  return (
                    <h1 key={block.id} className="text-xl sm:text-2xl font-black text-center text-indigo-300 border-b border-slate-900 pb-3 tracking-wide">
                      {block.content}
                    </h1>
                  );
                }
                
                if (block.type === 'heading') {
                  return (
                    <h2 key={block.id} className="text-base sm:text-lg font-extrabold text-white tracking-tight border-l-4 border-indigo-500 pl-3 pt-4 first:pt-0 flex items-center justify-between">
                      <span>{block.content}</span>
                      {block.allocatedTime && (
                        <span className="text-[10px] font-bold text-slate-450 bg-slate-900 py-0.5 px-2 rounded-md border border-slate-850">
                          🎯 Sugestão: {Math.round(block.allocatedTime / 60)} min
                        </span>
                      )}
                    </h2>
                  );
                }

                if (block.type === 'comment') {
                  return (
                    <div key={block.id} className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-200/90 text-sm leading-relaxed font-semibold italic flex items-start gap-2.5">
                      <span className="text-lg">💡</span>
                      <div>{renderFormattedBlockText(block.content)}</div>
                    </div>
                  );
                }

                if (block.type === 'script') {
                  return (
                    <div key={block.id} className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-emerald-200/90 text-sm leading-relaxed font-semibold flex items-start gap-2.5">
                      <span className="text-lg">📢</span>
                      <div>{renderFormattedBlockText(block.content)}</div>
                    </div>
                  );
                }

                return (
                  <div key={block.id} className="text-slate-200 text-base leading-relaxed pl-1 font-medium select-text">
                    {renderFormattedBlockText(block.content)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MODO ROTEIRO / SPEECH BLOCKS TIMELINE */}
        {currentTab === 'script' && selectedEsboco && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5 select-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Modo Roteiro e Cronograma Ativo</span>
              <h2 className="text-xl font-black text-white leading-none">{selectedEsboco.title}</h2>
              <p className="text-xs text-slate-450">Cada ponto do discurso possui seu tempo ideal. O indicador avisará se estiver atrasado!</p>
            </div>

            {/* Timed Blocks Breakdown */}
            <div className="space-y-4">
              {editedBlocks
                .filter(b => b.type === 'heading' || b.type === 'title')
                .map((block, idx, arr) => {
                  const isTitle = block.type === 'title';
                  const isCurrent = activeBlockId === block.id;
                  
                  // Calculate timing info
                  const allocSecs = block.allocatedTime || 0;
                  const elapsedSecs = blockElapsedTimes[block.id] || 0;
                  const percent = allocSecs > 0 ? Math.min((elapsedSecs / allocSecs) * 100, 100) : 0;
                  const isOvertime = allocSecs > 0 && elapsedSecs > allocSecs;

                  return (
                    <div
                      key={block.id}
                      onClick={() => !isTitle && setActiveBlockId(isCurrent ? null : block.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        isTitle ? 'bg-indigo-950/20 border-indigo-900/50 cursor-default' :
                        isCurrent ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500 shadow-md' :
                        'bg-slate-900/40 border-slate-900/60 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping shrink-0" />}
                          <h3 className={`text-sm font-extrabold ${isTitle ? 'text-indigo-300' : 'text-white'}`}>
                            {block.content}
                          </h3>
                        </div>
                        
                        {!isTitle && block.allocatedTime && (
                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400">
                            <span>Sugerido: <strong className="text-white">{Math.round(block.allocatedTime / 60)} min</strong></span>
                            <span>•</span>
                            <span className={isOvertime ? 'text-red-400' : 'text-indigo-400'}>
                              Gasto: <strong>{formatSeconds(elapsedSecs)}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {!isTitle && block.allocatedTime ? (
                        <div className="w-full md:w-48 space-y-1.5 shrink-0">
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${isOvertime ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                            <span>Progresso</span>
                            <span className={isOvertime ? 'text-red-400 font-black' : 'text-slate-400'}>
                              {isOvertime ? 'Atrasado!' : `${Math.round(percent)}%`}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </main>

      {/* FLOATABLE / DRAGGABLE MINI SYNC PANEL */}
      <AnimatePresence>
        {selectedEsboco && isMiniTimerOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed bottom-6 right-6 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-md select-none touch-none"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            {/* Header / Grab Handle */}
            <div className="bg-slate-950 border-b border-slate-850 py-2 px-3 flex items-center justify-between cursor-move text-slate-450 hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">Painel Sincronizado</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMiniTimerCollapsed(!isMiniTimerCollapsed)}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                >
                  {isMiniTimerCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsMiniTimerOpen(false)}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Timer Panel Body */}
            <AnimatePresence>
              {!isMiniTimerCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4"
                >
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 block">
                      {timerState.activeId 
                        ? (timerState.schedule.find(s => s.id === timerState.activeId)?.partType || 'PARTE EM ANDAMENTO')
                        : 'CRONÔMETRO LIVRE'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block truncate max-w-xs">
                      Participante: {timerState.activeId 
                        ? (timerState.schedule.find(s => s.id === timerState.activeId)?.name || 'Nenhum')
                        : 'Reunião Betel'}
                    </span>
                    
                    {/* Giant clock */}
                    <div className="text-4xl font-mono font-black tracking-tighter text-white py-1">
                      {formatSeconds(timerState.currentTime)}
                    </div>

                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full transition-all duration-1000 ${getTimerProgressColor()}`}
                        style={{ 
                          width: `${Math.min((timerState.currentTime / (timerState.initialDuration || 1)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Remote Timer Sync controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={resetTimer}
                      className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:text-white rounded-xl cursor-pointer active:scale-90 transition-all text-slate-400"
                      title="Reiniciar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={timerState.isRunning ? pauseTimer : startTimer}
                      className={`p-3 text-white rounded-2xl cursor-pointer active:scale-90 transition-all shadow-lg ${
                        timerState.isRunning 
                          ? 'bg-amber-600 hover:bg-amber-550 shadow-amber-950/20' 
                          : 'bg-emerald-600 hover:bg-emerald-550 shadow-emerald-950/20'
                      }`}
                      title={timerState.isRunning ? 'Pausar' : 'Iniciar'}
                    >
                      {timerState.isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    {timerState.activeId && (
                      <button
                        onClick={() => completeScheduleItem(timerState.activeId!, timerState.elapsedTime)}
                        className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-indigo-400 hover:text-indigo-300 rounded-xl cursor-pointer active:scale-90 transition-all"
                        title="Concluir Parte Ativa"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 border-t border-slate-850 pt-2 px-1">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      {isConnected ? 'Sincronizado' : 'Offline'}
                    </span>
                    <span>Modo: {timerState.mode === 'regressive' ? 'Regressivo' : 'Progressivo'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Panel Re-opener */}
      {selectedEsboco && !isMiniTimerOpen && (
        <button
          onClick={() => setIsMiniTimerOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl hover:shadow-indigo-550/10 cursor-pointer active:scale-95 transition-all z-45"
          title="Abrir Painel Flutuante do Sync"
        >
          <Clock className="w-5 h-5" />
        </button>
      )}

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 z-10 select-none">
        <p>Sync & Porta-Esboço • Plataforma Integrada de Reuniões</p>
      </footer>

    </div>
  );
}
