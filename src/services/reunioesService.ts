import { collection, doc, addDoc, setDoc, deleteDoc, getDocs, doc as firestoreDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sessionStore } from './sessionStore';
import { demoService } from './demoService';

export interface FirestoreParte {
  id?: string;
  participante: string;
  tipoParte: string;
  tempoPrevisto: number;
  tempoRealizado: number;
  diferenca: number;
  observacao: string;
  concluida: boolean;
  registradoEm: string;
}

export interface FirestoreReuniao {
  id: string; // Document ID
  data: string; // YYYY-MM-DD
  presidente: string;
  criadaEm: string;
  status: 'em_andamento' | 'concluida' | 'arquivada';
  partes?: FirestoreParte[];
}

const COLL_PATH = 'reunioes';

export const reunioesService = {
  async fetchReunioes(): Promise<FirestoreReuniao[]> {
    if (sessionStore.isDemo()) {
      return demoService.getReunioes();
    }
    try {
      const collRef = collection(db, COLL_PATH);
      const q = query(collRef, orderBy('data', 'desc'));
      const qSnap = await getDocs(q);
      
      const reunioes: FirestoreReuniao[] = [];
      
      for (const d of qSnap.docs) {
        const reuniaoData = d.data() as Omit<FirestoreReuniao, 'id'>;
        const reuniaoId = d.id;
        
        // Fetch subcollection partes
        const partesRef = collection(db, `${COLL_PATH}/${reuniaoId}/partes`);
        const partesSnap = await getDocs(partesRef);
        const partes: FirestoreParte[] = partesSnap.docs.map(pDoc => ({
          id: pDoc.id,
          ...pDoc.data()
        })) as FirestoreParte[];
        
        reunioes.push({
          id: reuniaoId,
          ...reuniaoData,
          partes
        });
      }
      
      return reunioes;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLL_PATH);
      return [];
    }
  },

  async createReuniao(data: { data: string; presidente: string; status?: 'em_andamento' | 'concluida' | 'arquivada' }): Promise<string> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const newId = 'demo_meet_' + Math.random().toString(36).substring(2, 9);
      const newItem: FirestoreReuniao = {
        id: newId,
        data: data.data,
        presidente: data.presidente,
        criadaEm: new Date().toISOString(),
        status: data.status || 'em_andamento',
        partes: []
      };
      demoService.saveReunioes([newItem, ...list]);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return newId;
    }
    try {
      const collRef = collection(db, COLL_PATH);
      const docRef = await addDoc(collRef, {
        data: data.data,
        presidente: data.presidente,
        criadaEm: new Date().toISOString(),
        status: data.status || 'em_andamento',
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLL_PATH);
      return '';
    }
  },

  async addParteToReuniao(reuniaoId: string, parte: Omit<FirestoreParte, 'registradoEm'>): Promise<string> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const newId = 'demo_parte_' + Math.random().toString(36).substring(2, 9);
      const updated = list.map(m => {
        if (m.id === reuniaoId) {
          const partes = m.partes || [];
          const novaParte: FirestoreParte = {
            ...parte,
            id: newId,
            registradoEm: new Date().toISOString()
          };
          return { ...m, partes: [...partes, novaParte] };
        }
        return m;
      });
      demoService.saveReunioes(updated);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return newId;
    }
    const subCollPath = `${COLL_PATH}/${reuniaoId}/partes`;
    try {
      const partesRef = collection(db, subCollPath);
      const docRef = await addDoc(partesRef, {
        ...parte,
        registradoEm: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, subCollPath);
      return '';
    }
  },

  async updateReuniaoStatus(reuniaoId: string, status: 'em_andamento' | 'concluida' | 'arquivada'): Promise<void> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const updated = list.map(m => m.id === reuniaoId ? { ...m, status } : m);
      demoService.saveReunioes(updated);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return;
    }
    try {
      const docRef = doc(db, COLL_PATH, reuniaoId);
      await setDoc(docRef, { status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${reuniaoId}`);
    }
  },

  async updateReuniao(reuniaoId: string, data: Partial<Omit<FirestoreReuniao, 'id'>>): Promise<void> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const updated = list.map(m => m.id === reuniaoId ? { ...m, ...data } : m);
      demoService.saveReunioes(updated);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return;
    }
    try {
      const docRef = doc(db, COLL_PATH, reuniaoId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${reuniaoId}`);
    }
  },

  async fetchPartes(reuniaoId: string): Promise<FirestoreParte[]> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const m = list.find(reuniao => reuniao.id === reuniaoId);
      return m?.partes || [];
    }
    try {
      const partesRef = collection(db, `${COLL_PATH}/${reuniaoId}/partes`);
      const snap = await getDocs(partesRef);
      return snap.docs.map(pDoc => ({
        id: pDoc.id,
        ...pDoc.data()
      })) as FirestoreParte[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLL_PATH}/${reuniaoId}/partes`);
      return [];
    }
  },

  async deleteReuniao(reuniaoId: string): Promise<void> {
    if (sessionStore.isDemo()) {
      const list = demoService.getReunioes();
      const filtered = list.filter(m => m.id !== reuniaoId);
      demoService.saveReunioes(filtered);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return;
    }
    try {
      // 1. Delete all parts subcollection first to avoid orphaned records
      const partesRef = collection(db, `${COLL_PATH}/${reuniaoId}/partes`);
      const partesSnap = await getDocs(partesRef);
      for (const pDoc of partesSnap.docs) {
        await deleteDoc(doc(db, `${COLL_PATH}/${reuniaoId}/partes`, pDoc.id));
      }
      // 2. Delete parent meeting document
      const docRef = doc(db, COLL_PATH, reuniaoId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLL_PATH}/${reuniaoId}`);
    }
  },

  async clearAllReunioes(): Promise<void> {
    if (sessionStore.isDemo()) {
      demoService.saveReunioes([]);
      window.dispatchEvent(new Event('demoReunioesUpdated'));
      return;
    }
    try {
      const collRef = collection(db, COLL_PATH);
      const qSnap = await getDocs(collRef);
      for (const d of qSnap.docs) {
        await this.deleteReuniao(d.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLL_PATH);
    }
  }
};
