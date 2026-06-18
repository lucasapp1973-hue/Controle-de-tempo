import { useState, useEffect, FormEvent } from 'react';
import { Tv, Smartphone, Wifi, WifiOff, RefreshCw, Activity, Laptop, ClipboardList, Calendar, X, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useSocket } from './hooks/useSocket';
import DisplayView from './components/DisplayView';
import ControlView from './components/ControlView';
import HistoryView from './components/HistoryView';
import PresidentCompactView from './components/PresidentCompactView';
import { configuracoesService, SystemConfig, DEFAULT_CONFIG } from './services/configuracoesService';
import { sessionStore } from './services/sessionStore';
import { demoService } from './services/demoService';

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
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isDemo, setIsDemo] = useState(sessionStore.isDemo());
  const [litCard, setLitCard] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    const handleSessionChanged = () => {
      setIsDemo(sessionStore.isDemo());
    };
    window.addEventListener('sessionTypeChanged', handleSessionChanged);
    return () => {
      window.removeEventListener('sessionTypeChanged', handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    // Subscribe to configurations from Firestore or Demo Store based on current isDemo state
    const unsubscribe = configuracoesService.subscribeConfig((config) => {
      setSystemConfig(config);
    });
    return () => unsubscribe();
  }, [isDemo]);

  const isAuthorized = () => {
    const authTimestamp = localStorage.getItem('control_auth_timestamp');
    if (!authTimestamp) return false;
    const past = parseInt(authTimestamp, 10);
    const now = Date.now();
    // 2 hours corridas = 2 * 60 * 60 * 1000 = 7,200,000 milisegundos
    return (now - past) < 7200000;
  };

  const handlePortalCardClick = (mode: 'display' | 'control' | 'superintendent' | 'history', action: () => void) => {
    if (selectedCardId) return;
    setSelectedCardId(mode);
    setLitCard(mode);
    setTimeout(() => {
      action();
      // Reset transition state for when they go back to the portal
      setTimeout(() => {
        setSelectedCardId(null);
        setLitCard(null);
      }, 400);
    }, 550);
  };

  const handleControlClick = () => {
    if (isAuthorized()) {
      handlePortalCardClick('control', () => selectMode('control'));
    } else {
      setShowPasswordPrompt(true);
      setPassword('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === (systemConfig?.senhaControle || '2121')) {
      localStorage.setItem('control_auth_timestamp', Date.now().toString());
      setShowPasswordPrompt(false);
      handlePortalCardClick('control', () => selectMode('control'));
    } else {
      setPasswordError('Senha incorreta! Apenas irmãos autorizados têm acesso.');
    }
  };

  // Check for direct module booking or fall back to portal on initial load
  // Also add zoom prevention listeners to ensure zero zooming on desktop/mobile
  useEffect(() => {
    const url = new URL(window.location.href);
    const initialMode = url.searchParams.get('mode');
    
    if (initialMode === 'display') {
      setAppMode('display');
    } else if (initialMode === 'superintendent_compact' || initialMode === 'superintendent' || initialMode === 'president-compact' || url.pathname.includes('president-compact') || url.pathname.includes('superintendent')) {
      setAppMode('superintendent');
    } else {
      setAppMode('portal');
      if (url.searchParams.has('mode')) {
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url.toString());
      }
    }

    // Modern JS Gesture Zoom prevention (pinch to zoom)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // CTRL + Wheel zoom prevention
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Direct reload auto-fullscreen helper on first interaction
    const handleGlobalInteraction = () => {
      const currentUrl = new URL(window.location.href);
      const activeMode = currentUrl.searchParams.get('mode');
      if (activeMode && activeMode !== 'portal' && !document.fullscreenElement) {
        // Find documentElement and call requestFullscreen
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if ((docEl as any).webkitRequestFullscreen) {
          (docEl as any).webkitRequestFullscreen();
        }
      }
    };
    document.addEventListener('click', handleGlobalInteraction);
    document.addEventListener('touchstart', handleGlobalInteraction);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('click', handleGlobalInteraction);
      document.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, []);

  // Synchronize browser / system native back button (and back swipes) with App State
  useEffect(() => {
    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const m = currentUrl.searchParams.get('mode');
      if (m === 'display') {
        setAppMode('display');
      } else if (m === 'superintendent' || m === 'superintendent_compact' || m === 'president-compact') {
        setAppMode('superintendent');
      } else if (m === 'control') {
        setAppMode('control');
      } else if (m === 'history') {
        setAppMode('history');
      } else {
        setAppMode('portal');
        exitFullscreen();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Gesture Swipe Horizontal to return to portal (back interaction)
  useEffect(() => {
    if (appMode === 'portal') return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStartGlobal = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEndGlobal = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Horizontal swipe from left to right (diffX > 100px) with clean horizontal limit
      if (diffX > 100 && Math.abs(diffY) < 50) {
        handleBackToPortal();
      }
    };

    document.addEventListener('touchstart', handleTouchStartGlobal, { passive: true });
    document.addEventListener('touchend', handleTouchEndGlobal, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStartGlobal);
      document.removeEventListener('touchend', handleTouchEndGlobal);
    };
  }, [appMode]);

  const enterFullscreen = () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => {
          console.warn('Requisição de tela cheia rejeitada ou indisponível:', err);
        });
      } else if ((docEl as any).webkitRequestFullscreen) {
        (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        (docEl as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Erro ao habilitar tela cheia:', err);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (_) {}
  };

  // Update URL on state change to allow direct bookmarking
  const selectMode = (mode: 'display' | 'control' | 'superintendent' | 'history') => {
    setAppMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.pushState({}, '', url.toString());
    if (mode === 'display') {
      enterFullscreen();
    }
  };

  const handleBackToPortal = () => {
    setAppMode('portal');
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url.toString());
    exitFullscreen();
  };

  const renderDemoBanner = () => {
    if (!isDemo) return null;
    return (
      <div className="w-full bg-amber-500 text-slate-950 font-sans text-xs sm:text-sm font-extrabold py-2.5 px-4 flex justify-between items-center shadow-lg select-none sticky top-0 z-50 border-b border-amber-600">
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <span className="text-sm">🎬</span>
          <span className="truncate"><b>MODO DEMONSTRAÇÃO:</b> Ambiente de simulação. Dados reais protegidos.</span>
        </div>
        <button
          onClick={() => {
            demoService.clearDemoData();
            sessionStore.setSessionType('real');
            setAppMode('portal');
          }}
          className="bg-slate-950 hover:bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs uppercase tracking-wider font-black transition-all shadow-md flex items-center gap-1 cursor-pointer select-none shrink-0 active:scale-95 border border-slate-800"
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    );
  };

  // Render Display View
  if (appMode === 'display') {
    return (
      <motion.div
        className="fixed inset-0 w-screen h-screen h-[100dvh] overflow-hidden flex flex-col bg-black z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderDemoBanner()}
        <div className="flex-1 relative overflow-hidden">
          <DisplayView
            timerState={timerState}
            isConnected={isConnected}
            onBack={handleBackToPortal}
            systemConfig={systemConfig}
          />
        </div>
      </motion.div>
    );
  }

  // Render Control View
  if (appMode === 'control') {
    return (
      <motion.div
        className="fixed inset-0 w-screen h-screen h-[100dvh] overflow-hidden flex flex-col bg-slate-950 z-30"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
      >
        {renderDemoBanner()}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
            systemConfig={systemConfig}
          />
        </div>
      </motion.div>
    );
  }

  // Render President View (Presidente)
  if (appMode === 'superintendent') {
    return (
      <motion.div
        className="fixed inset-0 w-screen h-screen h-[100dvh] overflow-hidden flex flex-col bg-slate-950 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderDemoBanner()}
        <div className="flex-1 overflow-y-auto">
          <PresidentCompactView
            timerState={timerState}
            isConnected={isConnected}
            onBack={handleBackToPortal}
            systemConfig={systemConfig}
          />
        </div>
      </motion.div>
    );
  }

  // Render History View
  if (appMode === 'history') {
    return (
      <motion.div
        className="fixed inset-0 w-screen h-screen h-[100dvh] overflow-hidden flex flex-col bg-slate-950 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderDemoBanner()}
        <div className="flex-1 overflow-y-auto">
          <HistoryView
            timerState={timerState}
            isConnected={isConnected}
            onBack={handleBackToPortal}
            deleteMeeting={deleteMeeting}
            clearAllMeetings={clearAllMeetings}
          />
        </div>
      </motion.div>
    );
  }

  // Render Selection Portal
  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-950 text-slate-100 flex flex-col justify-between relative font-sans select-none">
      
      {/* Glow Effects in background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Decorative Matrix grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container Content */}
      <div className="w-full max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center space-y-10 relative z-10">
        
        {/* Header Branding */}
        <header className="text-center space-y-4 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-extrabold tracking-tight text-white flex flex-col items-center gap-1"
          >
            <span className="text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 inline-block font-sans font-medium">Sincronizador</span>
            <span className="text-[22px] sm:text-[26px] inline-block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.85)] tracking-widest uppercase mt-1 opacity-95">de Tempo</span>
          </motion.h1>
        </header>

        {/* Portal Options Section (Immersive Vertical Bento with Backlight & Expand Animations) */}
        <section
          onPointerMove={(e) => {
            if (selectedCardId) return;
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (!element) return;
            const card = element.closest('[data-card-id]');
            if (card) {
              setLitCard(card.getAttribute('data-card-id'));
            } else {
              setLitCard(null);
            }
          }}
          onPointerLeave={() => {
            if (!selectedCardId) setLitCard(null);
          }}
          onTouchMove={(e) => {
            if (selectedCardId) return;
            const touch = e.touches[0];
            if (!touch) return;
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return;
            const card = element.closest('[data-card-id]');
            if (card) {
              setLitCard(card.getAttribute('data-card-id'));
            } else {
              setLitCard(null);
            }
          }}
          onTouchEnd={() => {
            if (!selectedCardId) setLitCard(null);
          }}
          className="w-full max-w-sm mx-auto bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-2xl flex flex-col gap-4 relative overflow-visible"
        >
          {[
            {
              id: 'display',
              label: '. Display',
              action: () => selectMode('display'),
              icon: Tv,
              color: 'from-emerald-500/30 to-teal-500/30',
              iconColor: 'text-emerald-400',
              iconBg: 'bg-teal-950/40 border-teal-500/20'
            },
            {
              id: 'control',
              label: 'Controle',
              action: handleControlClick,
              icon: Smartphone,
              color: 'from-indigo-500/30 to-purple-500/30',
              iconColor: 'text-indigo-400',
              iconBg: 'bg-indigo-950/40 border-indigo-500/20'
            },
            {
              id: 'superintendent',
              label: '3. Presidente',
              action: () => selectMode('superintendent'),
              icon: User,
              color: 'from-blue-500/30 to-indigo-500/30',
              iconColor: 'text-indigo-400',
              iconBg: 'bg-indigo-950/40 border-indigo-550/20'
            },
            {
              id: 'history',
              label: '4. Histórico',
              action: () => selectMode('history'),
              icon: Calendar,
              color: 'from-amber-500/30 to-orange-500/30',
              iconColor: 'text-amber-400',
              iconBg: 'bg-amber-950/40 border-amber-500/20'
            }
          ].map((card) => {
            const isSelected = selectedCardId === card.id;
            const isAnySelected = selectedCardId !== null;
            const isLit = litCard === card.id;
            const CardIcon = card.icon;

            let animateValue = {};
            if (isAnySelected) {
              if (isSelected) {
                animateValue = {
                  scale: 1.15,
                  y: -15,
                  opacity: [1, 1, 0],
                  filter: 'blur(3px)',
                  transition: { duration: 0.5, ease: 'easeInOut' }
                };
              } else {
                animateValue = {
                  opacity: 0,
                  scale: 0.8,
                  x: card.id === 'display' || card.id === 'superintendent' ? -150 : 150,
                  transition: { duration: 0.45, ease: 'easeIn' }
                };
              }
            } else {
              animateValue = {
                opacity: 1,
                scale: 1,
                x: 0,
              };
            }

            return (
              <div key={card.id} className="relative overflow-visible" data-card-id={card.id}>
                {/* Backlight Glow */}
                <div
                  className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-r ${card.color} opacity-0 ${isLit ? 'opacity-50 blur-2xl scale-106' : ''} transition-all duration-300 pointer-events-none -z-10`}
                />

                <motion.div
                  animate={animateValue}
                  whileHover={!isAnySelected ? { scale: 1.02 } : undefined}
                  whileTap={!isAnySelected ? { scale: 0.98 } : undefined}
                  onClick={() => handlePortalCardClick(card.id as any, card.action)}
                  className={`relative flex items-center gap-4 bg-slate-950/65 hover:bg-slate-950 rounded-2xl p-3.5 shadow-md cursor-pointer transition-colors duration-300 border-none select-none overflow-hidden group`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg} shrink-0`}>
                    <CardIcon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-bold text-white tracking-wide group-hover:text-indigo-300 transition-colors uppercase">
                      {card.label}
                    </h2>
                  </div>
                  <span className="text-slate-600 group-hover:text-white transition-colors text-lg pr-1">→</span>
                </motion.div>
              </div>
            );
          })}
        </section>

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
        <p>Sincronizador de Tempo Real-time via Socket.IO • Latência Zero</p>
      </footer>

    </div>
  );
}
