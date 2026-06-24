import React, { useState, useEffect } from 'react';
import { Database, CloudOff } from 'lucide-react';
import { configuracoesService, SystemConfig, DEFAULT_CONFIG } from '../services/configuracoesService';
import { sessionStore } from '../services/sessionStore';

export default function DatabaseStatusIndicator() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isDemo, setIsDemo] = useState(sessionStore.isDemo());

  useEffect(() => {
    // Listen for session/demo mode changes
    const handleSessionChanged = () => {
      setIsDemo(sessionStore.isDemo());
    };
    window.addEventListener('sessionTypeChanged', handleSessionChanged);

    // Subscribe to config changes
    const unsubscribe = configuracoesService.subscribeConfig((newConfig) => {
      setConfig(newConfig);
    });

    return () => {
      window.removeEventListener('sessionTypeChanged', handleSessionChanged);
      unsubscribe();
    };
  }, [isDemo]);

  // If in Demo Mode
  if (isDemo) {
    return (
      <div 
        title="Modo Simulação (Demo)" 
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(245,158,11,0.1)] shrink-0"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
        </span>
        Simulação
      </div>
    );
  }

  const isSaving = config.salvarReuniao !== false;

  if (isSaving) {
    return (
      <div 
        title="Gravação Ativa (Firebase)" 
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(16,185,129,0.1)] shrink-0"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <Database className="w-3 h-3" />
        Nuvem
      </div>
    );
  } else {
    return (
      <div 
        title="Sem Gravação (Modo Local)" 
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(236,72,153,0.1)] shrink-0"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
        </span>
        <CloudOff className="w-3 h-3" />
        Local (Não Salva)
      </div>
    );
  }
}
