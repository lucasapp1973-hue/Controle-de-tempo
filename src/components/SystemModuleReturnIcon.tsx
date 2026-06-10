import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SystemModuleReturnIconProps {
  onClick: () => void;
}

export default function SystemModuleReturnIcon({ onClick }: SystemModuleReturnIconProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % 4);
    }, 2500); // smooth rotation between modules
    return () => clearInterval(interval);
  }, []);

  const renderIcon = () => {
    switch (index) {
      case 0: // Display
        return (
          <motion.svg
            key="display"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-5 h-5 text-indigo-400 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </motion.svg>
        );
      case 1: // Controle
        return (
          <motion.svg
            key="controle"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-5 h-5 text-indigo-400 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <circle cx="12" cy="17.5" r="1" fill="currentColor" />
            <line x1="9" y1="5" x2="15" y2="5" />
          </motion.svg>
        );
      case 2: // Presidente
        return (
          <motion.svg
            key="presidente"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-5 h-5 text-indigo-400 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 11 2 2 4-4" />
          </motion.svg>
        );
      case 3: // Histórico
        return (
          <motion.svg
            key="historico"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-5 h-5 text-indigo-400 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </motion.svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-11 h-11 bg-slate-900 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all duration-300 group shadow-md active:scale-90"
      title="Voltar para Seleção de Módulos"
    >
      <motion.div
        animate={{
          borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 50% 50%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors pointer-events-none rounded-xl border border-dashed border-indigo-500/15 group-hover:border-indigo-500/30"
      />
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {renderIcon()}
        </AnimatePresence>
      </div>
    </button>
  );
}

interface AnalogueClockProps {
  type: 'controle' | 'presidente' | 'historico';
}

export function AnalogueClock({ type }: AnalogueClockProps) {
  const colors = {
    controle: 'text-indigo-400',
    presidente: 'text-emerald-400',
    historico: 'text-amber-400',
  };

  const strokeColor = colors[type] || colors.controle;

  return (
    <div className={`relative w-4.5 h-4.5 rounded-full border border-current flex items-center justify-center opacity-90 ${strokeColor}`}>
      {/* Center dot */}
      <span className="absolute w-1 h-1 rounded-full bg-current opacity-80" />
      {/* Sweeping minute hand */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <span className="w-0.5 h-1.8 bg-current rounded-full -translate-y-0.8" />
      </motion.div>
    </div>
  );
}
