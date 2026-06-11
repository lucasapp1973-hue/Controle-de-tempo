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
}

export const DEFAULT_CONFIG: SystemConfig = {
  senhaControle: '2121',
  alertaSegundos: 20,
  corTempoNormal: '#22c55e', // Verde
  corTempoAlerta: '#eab308',  // Amarelo
  corTempoEsgotado: '#ef4444', // Vermelho
  modoPadraoCronometro: 'regressive',
};

const DOC_PATH = 'configuracoes/global';

export const configuracoesService = {
  async fetchConfig(): Promise<SystemConfig> {
    if (sessionStore.isDemo()) {
      return demoService.getConfig();
    }
    try {
      const docRef = doc(db, 'configuracoes', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SystemConfig;
      } else {
        // Registra valores padrão caso o documento não exista
        await setDoc(docRef, DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, DOC_PATH);
      return DEFAULT_CONFIG;
    }
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    if (sessionStore.isDemo()) {
      const current = demoService.getConfig();
      const merged = { ...current, ...config };
      demoService.saveConfig(merged);
      window.dispatchEvent(new Event('demoConfigUpdated'));
      return;
    }
    try {
      const docRef = doc(db, 'configuracoes', 'global');
      await setDoc(docRef, config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, DOC_PATH);
    }
  },

  subscribeConfig(callback: (config: SystemConfig) => void, onError?: (error: unknown) => void) {
    if (sessionStore.isDemo()) {
      callback(demoService.getConfig());
      const handleDemoUpdate = () => {
        callback(demoService.getConfig());
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
          callback(docSnap.data() as SystemConfig);
        } else {
          setDoc(docRef, DEFAULT_CONFIG).catch(() => {});
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

