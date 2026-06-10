import { useState, useEffect, FormEvent } from 'react';
import { Tv, Smartphone, Wifi, WifiOff, RefreshCw, Activity, Laptop, ClipboardList, Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useSocket } from './hooks/useSocket';
import DisplayView from './components/DisplayView';
import ControlView from './components/ControlView';
import SuperintendentView from './components/SuperintendentView';
import HistoryView from './components/HistoryView';

export default function App() {
  const {
    isConnected,
    isReconnecting,
    reconnect,
    timerState,
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
    registerMeeting,
    deleteMeeting,
    clearAllMeetings,
  } = useSocket();

  // App mode: portal (selection), display, control, superintendent (presidente), or history
  const [appMode, setAppMode] = useState<'portal' | 'display' | 'control' | 'superintendent' | 'history'>('portal');
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isAuthorized = () => {
    const authTimestamp = localStorage.getItem('control_auth_timestamp');
    if (!authTimestamp) return false;
    const past = parseInt(authTimestamp, 10);
    const now = Date.now();
    // 2 hours corridas = 2 * 60 * 60 * 1000 = 7,200,000 milisegundos
    return (now - past) < 7200000;
  };

  const handleControlClick = () => {
    if (isAuthorized()) {
      selectMode('control');
    } else {
      setShowPasswordPrompt(true);
      setPassword('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === '2121') {
      localStorage.setItem('control_auth_timestamp', Date.now().toString());
      setShowPasswordPrompt(false);
      selectMode('control');
    } else {
      setPasswordError('Senha incorreta! Apenas irmãos autorizados têm acesso.');
    }
  };

  // Always start at portal on initial load and clear any mode query param to ensure fresh start
  useEffect(() => {
    setAppMode('portal');
    const url = new URL(window.location.href);
    if (url.searchParams.has('mode')) {
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Update URL on state change to allow direct bookmarking
  const selectMode = (mode: 'display' | 'control' | 'superintendent' | 'history') => {
    setAppMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.pushState({}, '', url.toString());
  };

  const handleBackToPortal = () => {
    setAppMode('portal');
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url.toString());
  };

  // Render Display View
  if (appMode === 'display') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DisplayView
          timerState={timerState}
          isConnected={isConnected}
          onBack={handleBackToPortal}
        />
      </motion.div>
    );
  }

  // Render Control View
  if (appMode === 'control') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
      >
        <ControlView
          timerState={timerState}
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          reconnect={reconnect}
          registerMeeting={registerMeeting}
          onBack={handleBackToPortal}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resumeTimer={resumeTimer}
          resetTimer={resetTimer}
          setTimer={setTimer}
          addScheduleItem={addScheduleItem}
          editScheduleItem={editScheduleItem}
          removeScheduleItem={removeScheduleItem}
          reorderSchedule={reorderSchedule}
          activateScheduleItem={activateScheduleItem}
          completeScheduleItem={completeScheduleItem}
          resetSchedule={resetSchedule}
        />
      </motion.div>
    );
  }

  // Render Superintendent View (Presidente)
  if (appMode === 'superintendent') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SuperintendentView
          timerState={timerState}
          isConnected={isConnected}
          onBack={handleBackToPortal}
        />
      </motion.div>
    );
  }

  // Render History View
  if (appMode === 'history') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <HistoryView
          timerState={timerState}
          isConnected={isConnected}
          onBack={handleBackToPortal}
          deleteMeeting={deleteMeeting}
          clearAllMeetings={clearAllMeetings}
        />
      </motion.div>
    );
  }

  // Render Selection Portal
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Glow Effects in background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Decorative Matrix grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container Content */}
      <div className="w-full max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center space-y-12 relative z-10">
        
        {/* Header Branding */}
        <header className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
          >
            Cronômetro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Sincronizado</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed"
          >
            Conecte múltiplos dispositivos na mesma rede em tempo real. Use um smartphone para controlar o display gigante do computador, notebook ou tablet.
          </motion.p>
        </header>

        {/* Dynamic Connected Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-6 bg-slate-900/50 border border-slate-800/80 rounded-xl px-5 py-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-400'}`} />
              <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                Servidor: {isConnected ? 'Conectado' : 'Carregando...'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Portal Options Section */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
          
          {/* Card 1: Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            onClick={() => selectMode('display')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-emerald-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase">
                  1. Display
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Mostra o cronômetro com números extremamente gigantes em tela cheia. Perfeito para projetores de estúdio, TV ou tablets suspensos na parede.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <span>Iniciar Monitor</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
            </div>
          </motion.div>

          {/* Card 2: Control */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            onClick={handleControlClick}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-indigo-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase">
                  2. Controle
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Cadastre participantes, reordene-os e controle o cronômetro em tempo real do seu smartphone, PC ou tablet de controle.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <span>Abrir Controle</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
            </div>
          </motion.div>

          {/* Card 3: Presidente */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={() => selectMode('superintendent')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-indigo-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase">
                  3. Presidente
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Acompanhe a parte ativa em tempo real com cronômetro grande, ou visualize imediatamente os resultados consolidados assim que concluídas.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <span>Abrir Painel</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
            </div>
          </motion.div>

          {/* Card 4: Historico */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            onClick={() => selectMode('history')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-indigo-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase">
                  4. Histórico
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Consulte todas as reuniões já realizadas com os indicadores estatísticos detalhados de cada orador e tabelas com cores dinâmicas.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <span>Abrir Histórico</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
            </div>
          </motion.div>

        </section>

        {/* Bottom Local Info / Instruction Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/20 border border-slate-850/60 rounded-xl p-4 max-w-2xl mx-auto text-xs text-slate-500 space-y-2 leading-relaxed"
        >
          <div className="font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
            Como usar em tela dupla?
          </div>
          <p className="text-center">
            Compartilhe a URL desta página ou abra em outro dispositivo. Configure o primeiro dispositivo como <b>Monitor</b> e o segundo como <b>Controle</b>. Ao realizar comandos no controle, o display reagirá instantaneamente!
          </p>
        </motion.div>

      </div>

      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative"
          >
            <button
              onClick={() => setShowPasswordPrompt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Acesso Restrito</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Insira a senha de operador para garantir acesso autorizado ao painel de controle.
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordError && (
                  <p className="text-[10px] text-red-400 text-center font-semibold mt-1">
                    {passwordError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95"
              >
                Confirmar Senha
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-900/50 bg-slate-950/80 text-center text-xs text-slate-500 z-10 select-none">
        <p>Cronômetro Multiponto Real-time via Socket.IO • Latência Zero</p>
      </footer>

    </div>
  );
}
