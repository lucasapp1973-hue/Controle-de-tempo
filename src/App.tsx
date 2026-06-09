import { useState, useEffect } from 'react';
import { Tv, Smartphone, Wifi, WifiOff, RefreshCw, Activity, Laptop, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';
import { useSocket } from './hooks/useSocket';
import DisplayView from './components/DisplayView';
import ControlView from './components/ControlView';
import SuperintendentView from './components/SuperintendentView';

export default function App() {
  const {
    isConnected,
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
  } = useSocket();

  // App mode: portal (selection), display, control, or superintendent
  const [appMode, setAppMode] = useState<'portal' | 'display' | 'control' | 'superintendent'>('portal');

  // Handle initial routing via URL search params (e.g., ?mode=display)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'display' || modeParam === 'control' || modeParam === 'superintendent') {
      setAppMode(modeParam as any);
    }
  }, []);

  // Update URL on state change to allow direct bookmarking
  const selectMode = (mode: 'display' | 'control' | 'superintendent') => {
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

  // Render Superintendent View
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Sincronização Socket.IO de Baixa Latência
          </motion.div>

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
        <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
          
          {/* Card 1: Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            onClick={() => selectMode('display')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-emerald-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
                  1. Display
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={() => selectMode('control')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-indigo-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">
                  2. Controle
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Cadastre participantes, reordene-os e controle o cronômetro em tempo real do seu smartphone, PC ou tablet de controle.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <span>Abrir Controle</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
            </div>
          </motion.div>

          {/* Card 3: Superintendent */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            onClick={() => selectMode('superintendent')}
            className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:shadow-indigo-500/5 transition-all text-left flex flex-col justify-between h-full min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">
                  3. Superintendente
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Acompanhe a reunião, partes, alertas visuais, estourou de tempo e o histórico consolidado com as diferenças em tempo real (Leitura-Única).
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <span>Abrir Supervisão</span>
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

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-900/50 bg-slate-950/80 text-center text-xs text-slate-500 z-10 select-none">
        <p>Cronômetro Multiponto Real-time via Socket.IO • Latência Zero</p>
      </footer>

    </div>
  );
}
