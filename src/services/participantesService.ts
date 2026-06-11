import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sessionStore } from './sessionStore';
import { demoService } from './demoService';

export interface Participant {
  id?: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
  observacoes?: string;
}

const COLL_PATH = 'participantes';

export const participantesService = {
  async fetchParticipantes(): Promise<Participant[]> {
    if (sessionStore.isDemo()) {
      return demoService.getParticipantes();
    }
    try {
      const collRef = collection(db, COLL_PATH);
      const q = query(collRef, orderBy('nome', 'asc'));
      const qSnap = await getDocs(q);
      return qSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Participant[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLL_PATH);
      return [];
    }
  },

  async addParticipante(nome: string, observacoes: string = ''): Promise<string> {
    if (sessionStore.isDemo()) {
      const list = demoService.getParticipantes();
      const newId = 'demo_part_' + Math.random().toString(36).substring(2, 9);
      const newItem: Participant = {
        id: newId,
        nome,
        ativo: true,
        criadoEm: new Date().toISOString(),
        observacoes,
      };
      demoService.saveParticipantes([...list, newItem]);
      window.dispatchEvent(new Event('demoParticipantesUpdated'));
      return newId;
    }
    try {
      const collRef = collection(db, COLL_PATH);
      const docRef = await addDoc(collRef, {
        nome,
        ativo: true,
        criadoEm: new Date().toISOString(),
        observacoes,
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLL_PATH);
      return '';
    }
  },

  async updateParticipante(id: string, data: Partial<Participant>): Promise<void> {
    if (sessionStore.isDemo()) {
      const list = demoService.getParticipantes();
      const updated = list.map(p => p.id === id ? { ...p, ...data } : p);
      demoService.saveParticipantes(updated);
      window.dispatchEvent(new Event('demoParticipantesUpdated'));
      return;
    }
    try {
      const docRef = doc(db, COLL_PATH, id);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${id}`);
    }
  },

  async deleteParticipante(id: string): Promise<void> {
    if (sessionStore.isDemo()) {
      const list = demoService.getParticipantes();
      const filtered = list.filter(p => p.id !== id);
      demoService.saveParticipantes(filtered);
      window.dispatchEvent(new Event('demoParticipantesUpdated'));
      return;
    }
    try {
      const docRef = doc(db, COLL_PATH, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLL_PATH}/${id}`);
    }
  },

  subscribeParticipantes(callback: (participantes: Participant[]) => void, onError?: (error: unknown) => void) {
    if (sessionStore.isDemo()) {
      callback(demoService.getParticipantes());
      const handleDemoUpdate = () => {
        callback(demoService.getParticipantes());
      };
      window.addEventListener('demoParticipantesUpdated', handleDemoUpdate);
      return () => {
        window.removeEventListener('demoParticipantesUpdated', handleDemoUpdate);
      };
    }
    const collRef = collection(db, COLL_PATH);
    const q = query(collRef, orderBy('nome', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const participantes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
        callback(participantes);
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.LIST, COLL_PATH);
        }
      }
    );
  }
};

