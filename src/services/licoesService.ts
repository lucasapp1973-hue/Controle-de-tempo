import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sessionStore } from './sessionStore';
import { LicaoMelhore, LICOES_MELHORE_DATA } from '../data/licoes';

let cachedLicoes: LicaoMelhore[] | null = null;

const COLL_PATH = 'licoes_melhore';

export const licoesService = {
  /**
   * Fetches the lessons from the Firestore 'licoes_melhore' collection.
   * If the collection is empty, it automatically seeds it with the standard 15 lessons.
   * Leverages caching to query Firestore only once.
   */
  async fetchLicoes(): Promise<LicaoMelhore[]> {
    // If cached, return instantly
    if (cachedLicoes && cachedLicoes.length > 0) {
      return cachedLicoes;
    }

    if (sessionStore.isDemo()) {
      cachedLicoes = [...LICOES_MELHORE_DATA];
      return cachedLicoes;
    }

    try {
      const collRef = collection(db, COLL_PATH);
      const qSnap = await getDocs(collRef);

      if (qSnap.empty) {
        // Automatically seed the collection since it's empty
        console.log('Seeding licoes_melhore collection...');
        const seededList: LicaoMelhore[] = [];
        for (const licao of LICOES_MELHORE_DATA) {
          await addDoc(collRef, licao);
          seededList.push(licao);
        }
        cachedLicoes = seededList.sort((a, b) => a.numero - b.numero);
        return cachedLicoes;
      }

      const licoes: LicaoMelhore[] = qSnap.docs.map(doc => {
        const data = doc.data();
        return {
          numero: data.numero,
          titulo: data.titulo,
          objetivo: data.objetivo,
          resumoCurto: data.resumoCurto || [],
          comoFazer: data.comoFazer || []
        } as LicaoMelhore;
      });

      cachedLicoes = licoes.sort((a, b) => a.numero - b.numero);
      return cachedLicoes;
    } catch (error) {
      console.warn('Failed to retrieve lessons from Firestore, loading local fallback:', error);
      // Fallback safely to offline data to respect "Continuar funcionando mesmo se perder conexão"
      cachedLicoes = [...LICOES_MELHORE_DATA];
      return cachedLicoes;
    }
  },

  /**
   * Get single cached lesson by number.
   */
  getLicaoByNumero(numero: number): LicaoMelhore | undefined {
    const list = cachedLicoes || LICOES_MELHORE_DATA;
    return list.find(l => l.numero === numero);
  }
};
