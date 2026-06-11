import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
    try {
      const docRef = doc(db, COLL_PATH, id);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_PATH}/${id}`);
    }
  },

  async deleteParticipante(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLL_PATH, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLL_PATH}/${id}`);
    }
  },

  subscribeParticipantes(callback: (participantes: Participant[]) => void, onError?: (error: unknown) => void) {
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
