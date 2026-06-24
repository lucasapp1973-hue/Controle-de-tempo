import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sessionStore } from './sessionStore';
import { demoService } from './demoService';

export interface SystemConfig {
  senhaControle: string;
  alertaSegundos: number;
  corTempoNormal: string;
  corTempoAlerta: string;
  corTempoEsgotado: string;
  modoPadraoCronometro: 'progressive' | 'regressive';
  salvarReuniao?: boolean;
}

export const DEFAULT_CONFIG: SystemConfig = {
  senhaControle: '2121',
  alertaSegundos: 20,
  corTempoNormal: '#22c55e', // Verde
  corTempoAlerta: '#eab308',  // Amarelo
  corTempoEsgotado: '#ef4444', // Vermelho
  modoPadraoCronometro: 'regressive',
  salvarReuniao: true,
};

const DOC_PATH = 'configuracoes/global';

let cachedConfig: SystemConfig | null = null;

export const configuracoesService = {
  getCurrentConfig(): SystemConfig {
    return cachedConfig || DEFAULT_CONFIG;
  },

  async fetchConfig(): Promise<SystemConfig> {
    if (sessionStore.isDemo()) {
      const cfg = demoService.getConfig();
      cachedConfig = cfg;
      return cfg;
    }
    try {
      const docRef = doc(db, 'configuracoes', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cfg = docSnap.data() as SystemConfig;
        cachedConfig = cfg;
        return cfg;
      } else {
        // Registra valores padrão caso o documento não exista
        await setDoc(docRef, DEFAULT_CONFIG);
        cachedConfig = DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, DOC_PATH);
      cachedConfig = DEFAULT_CONFIG;
      return DEFAULT_CONFIG;
    }
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    if (sessionStore.isDemo()) {
      const current = demoService.getConfig();
      const merged = { ...current, ...config };
      demoService.saveConfig(merged);
      cachedConfig = merged;
      window.dispatchEvent(new Event('demoConfigUpdated'));
      return;
    }
    try {
      const docRef = doc(db, 'configuracoes', 'global');
      await setDoc(docRef, config, { merge: true });
      if (cachedConfig) {
        cachedConfig = { ...cachedConfig, ...config };
      } else {
        cachedConfig = { ...DEFAULT_CONFIG, ...config };
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, DOC_PATH);
    }
  },

  subscribeConfig(callback: (config: SystemConfig) => void, onError?: (error: unknown) => void) {
    if (sessionStore.isDemo()) {
      const initial = demoService.getConfig();
      cachedConfig = initial;
      callback(initial);
      const handleDemoUpdate = () => {
        const updated = demoService.getConfig();
        cachedConfig = updated;
        callback(updated);
      };
      window.addEventListener('demoConfigUpdated', handleDemoUpdate);
      return () => {
        window.removeEventListener('demoConfigUpdated', handleDemoUpdate);
      };
    }
    const docRef = doc(db, 'configuracoes', 'global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cfg = docSnap.data() as SystemConfig;
          cachedConfig = cfg;
          callback(cfg);
        } else {
          setDoc(docRef, DEFAULT_CONFIG).catch(() => {});
          cachedConfig = DEFAULT_CONFIG;
          callback(DEFAULT_CONFIG);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.GET, DOC_PATH);
        }
      }
    );
  }
};

