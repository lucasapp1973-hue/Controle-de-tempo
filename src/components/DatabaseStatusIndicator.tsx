import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff } from 'lucide-react';
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

  // Determine if it is saving to Firebase
  const isSaving = !isDemo && (config.salvarReuniao !== false);

  if (isSaving) {
    return (
      <Cloud 
        title="Gravação Ativa (Firebase)" 
        className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)] select-none cursor-help transition-all duration-300"
      />
    );
  } else {
    return (
      <CloudOff 
        title={isDemo ? "Modo Simulação (Não salva no Firebase)" : "Sem Gravação (Modo Local)"} 
        className="w-5 h-5 text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.4)] select-none cursor-help transition-all duration-300"
      />
    );
  }
}
