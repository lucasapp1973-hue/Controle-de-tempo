import { collection, doc, addDoc, setDoc, deleteDoc, getDocs, doc as firestoreDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
    try {
      const docRef = doc(db, COLL_PATH, reuniaoId);
      await setDoc(docRef, { status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${reuniaoId}`);
    }
  },

  async updateReuniao(reuniaoId: string, data: Partial<Omit<FirestoreReuniao, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, COLL_PATH, reuniaoId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${reuniaoId}`);
    }
  },

  async fetchPartes(reuniaoId: string): Promise<FirestoreParte[]> {
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
