import { collection, getDocs, addDoc, query, where, writeBatch, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sessionStore } from './sessionStore';
import { Brochura, Licao, LicaoConteudoNode } from '../types';
import { LICOES_MELHORE_DATA } from '../data/licoes';

let cachedBrochuras: Brochura[] | null = null;
let cachedLicoesByBrochura: Record<string, Licao[]> = {};

const COLL_BROCHURAS = 'brochuras';
const COLL_LICOES = 'licoes';

export const licoesService = {
  /**
   * Fetches the brochures list. In demo mode or if collection is empty,
   * it seeds standard brochures ('melhore' and 'ame_pessoas').
   */
  async fetchBrochuras(): Promise<Brochura[]> {
    if (cachedBrochuras && cachedBrochuras.length > 0) {
      return cachedBrochuras;
    }

    const defaultBrochuras: Brochura[] = [
      { id: 'melhore', nome: 'Brochura Melhore', ativa: true },
      { id: 'ame_pessoas', nome: 'Ame as Pessoas — Faça Discípulos', ativa: true }
    ];

    if (sessionStore.isDemo()) {
      cachedBrochuras = defaultBrochuras;
      return cachedBrochuras;
    }

    try {
      const collRef = collection(db, COLL_BROCHURAS);
      const qSnap = await getDocs(collRef);

      if (qSnap.empty) {
        // Automatically seed the brochures
        console.log('Seeding brochures collection...');
        const list: Brochura[] = [];
        for (const b of defaultBrochuras) {
          const docRef = doc(db, COLL_BROCHURAS, b.id);
          await setDoc(docRef, b);
          list.push(b);
        }
        cachedBrochuras = list;
        return cachedBrochuras;
      }

      const list: Brochura[] = qSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id || data.id,
          nome: data.nome,
          ativa: data.ativa !== false
        } as Brochura;
      });

      cachedBrochuras = list;
      return cachedBrochuras;
    } catch (e) {
      console.warn('Failed to fetch brochures from firestore, loading defaults:', e);
      cachedBrochuras = defaultBrochuras;
      return cachedBrochuras;
    }
  },

  /**
   * Fetches all lessons for a specific brochure. Uses cache for superb performance.
   * If database is empty and brochure is 'melhore', seeds using default 'melhore' lessons.
   */
  async fetchLicoesByBrochura(brochuraId: string): Promise<Licao[]> {
    if (cachedLicoesByBrochura[brochuraId] && cachedLicoesByBrochura[brochuraId].length > 0) {
      return cachedLicoesByBrochura[brochuraId];
    }

    if (sessionStore.isDemo()) {
      if (brochuraId === 'melhore') {
        const list = this._getSeedMelhoreLicoes();
        cachedLicoesByBrochura[brochuraId] = list;
        return list;
      }
      return [];
    }

    try {
      const collRef = collection(db, COLL_LICOES);
      const q = query(collRef, where('brochuraId', '==', brochuraId));
      const qSnap = await getDocs(q);

      if (qSnap.empty) {
        if (brochuraId === 'melhore') {
          // Auto-seed melhore in "licoes"
          console.log('Seeding licoes schema for Melhore brochure...');
          const list = this._getSeedMelhoreLicoes();
          for (const lic of list) {
            await addDoc(collRef, lic);
          }
          cachedLicoesByBrochura[brochuraId] = list.sort((a, b) => a.numero - b.numero);
          return cachedLicoesByBrochura[brochuraId];
        }
        return [];
      }

      const list: Licao[] = qSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          brochuraId: data.brochuraId,
          numero: Number(data.numero),
          titulo: data.titulo,
          ordem: Number(data.ordem ?? data.numero),
          conteudo: data.conteudo || []
        } as Licao;
      });

      const sortedList = list.sort((a, b) => a.numero - b.numero);
      cachedLicoesByBrochura[brochuraId] = sortedList;
      return sortedList;
    } catch (e) {
      console.warn(`Failed to fetch licoes for ${brochuraId}, loading defaults if melhore:`, e);
      if (brochuraId === 'melhore') {
        return this._getSeedMelhoreLicoes();
      }
      return [];
    }
  },

  /**
   * Helper to convert basic LICOES_MELHORE_DATA to our new Licao model.
   */
  _getSeedMelhoreLicoes(): Licao[] {
    return LICOES_MELHORE_DATA.map(lm => {
      const nodes: LicaoConteudoNode[] = [
        { tipo: 'paragrafo', texto: lm.objetivo }
      ];

      lm.resumoCurto.forEach(rc => {
        nodes.push({ tipo: 'bullet', texto: rc });
      });

      lm.comoFazer.forEach(cf => {
        nodes.push({ tipo: 'titulo', texto: cf.titulo });
        nodes.push({ tipo: 'dica', texto: cf.descricao });
      });

      return {
        brochuraId: 'melhore',
        numero: lm.numero,
        titulo: lm.titulo,
        ordem: lm.numero,
        conteudo: nodes
      };
    });
  },

  /**
   * Automatic import of unstructured text to Licoes.
   * Rule-based parse of "Lição X", Bullet markers (•, -, *, ✦), "Dica:", and "Na pregação:".
   */
  async importLicoesFromText(brochuraId: string, rawText: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const lines = rawText.split('\n');
      const parsedLicoes: Licao[] = [];
      let currentLicao: Licao | null = null;
      let orderCounter = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Pattern matching: "Lição X"
        // Also captures optional title on same line or handles next lines
        const licaoMatch = line.match(/^Lição\s+(\d+)(?:\s*[:-]\s*(.*))?/i);
        if (licaoMatch) {
          const num = parseInt(licaoMatch[1], 10);
          const rest = (licaoMatch[2] || '').trim();

          currentLicao = {
            brochuraId,
            numero: num,
            titulo: rest || `Lição ${num}`,
            ordem: num || orderCounter++,
            conteudo: []
          };
          parsedLicoes.push(currentLicao);
          continue;
        }

        // If we don't have a lesson yet, ignore or assign to a default temporary first lesson
        if (!currentLicao) {
          currentLicao = {
            brochuraId,
            numero: 1,
            titulo: `Introdução`,
            ordem: orderCounter++,
            conteudo: []
          };
          parsedLicoes.push(currentLicao);
        }

        // Check node types
        // Bullet
        const bulletMatch = line.match(/^[-*•✦]\s*(.*)/);
        if (bulletMatch) {
          currentLicao.conteudo.push({
            tipo: 'bullet',
            texto: bulletMatch[1].trim()
          });
          continue;
        }

        // Dica
        const dicaMatch = line.match(/^Dica:\s*(.*)/i);
        if (dicaMatch) {
          currentLicao.conteudo.push({
            tipo: 'dica',
            texto: dicaMatch[1].trim()
          });
          continue;
        }

        // Na pregação
        const pregacaoMatch = line.match(/^Na pregação:\s*(.*)/i);
        if (pregacaoMatch) {
          currentLicao.conteudo.push({
            tipo: 'pregacao',
            texto: pregacaoMatch[1].trim()
          });
          continue;
        }

        // Titulo
        const tituloMatch = line.match(/^Título:\s*(.*)/i);
        if (tituloMatch) {
          currentLicao.conteudo.push({
            tipo: 'titulo',
            texto: tituloMatch[1].trim()
          });
          continue;
        }

        // If it's a short text starting with sub-header pattern or if the lesson title was default, we can set lesson title
        if (currentLicao.titulo === `Lição ${currentLicao.numero}` && line.length < 100 && !line.includes('.') && parsedLicoes.length > 0) {
          currentLicao.titulo = line;
          continue;
        }

        // Standard paragraph
        currentLicao.conteudo.push({
          tipo: 'paragrafo',
          texto: line
        });
      }

      if (parsedLicoes.length === 0) {
        return { success: false, count: 0, error: 'Nenhuma Lição encontrada no texto fornecido. Use a marcação "Lição X" para definir início de lições.' };
      }

      // Save to Firebase (prevent duplicates relative to current collection)
      if (sessionStore.isDemo()) {
        const existing = cachedLicoesByBrochura[brochuraId] || [];
        const merged = [...existing];
        
        parsedLicoes.forEach(lic => {
          const idx = merged.findIndex(l => l.numero === lic.numero);
          if (idx >= 0) {
            merged[idx] = lic; // Overwrite
          } else {
            merged.push(lic);
          }
        });

        cachedLicoesByBrochura[brochuraId] = merged.sort((a, b) => a.numero - b.numero);
        return { success: true, count: parsedLicoes.length };
      }

      const collRef = collection(db, COLL_LICOES);
      
      // Get existing ones to prevent double duplicates
      const q = query(collRef, where('brochuraId', '==', brochuraId));
      const qSnap = await getDocs(q);
      const existingDocsMap = new Map<number, string>(); // number -> docId
      qSnap.docs.forEach(docSnap => {
        existingDocsMap.set(Number(docSnap.data().numero), docSnap.id);
      });

      let insertedCount = 0;
      for (const lic of parsedLicoes) {
        const doubleCheckDocId = existingDocsMap.get(lic.numero);
        if (doubleCheckDocId) {
          // Avoid duplicate, skip or let's update it!
          const docRef = doc(db, COLL_LICOES, doubleCheckDocId);
          await setDoc(docRef, lic, { merge: true });
        } else {
          await addDoc(collRef, lic);
        }
        insertedCount++;
      }

      // Invalidate memory cache so next retrieval is fresh
      delete cachedLicoesByBrochura[brochuraId];

      return { success: true, count: insertedCount };
    } catch (e: any) {
      console.error('Failed to import source lessons:', e);
      return { success: false, count: 0, error: e.message || String(e) };
    }
  },

  /**
   * Safely get a single lesson by brochureId and lesson number.
   * Instant fallback if offline/uncached.
   */
  getLicao(brochuraId: string, number: number): Licao | undefined {
    const list = cachedLicoesByBrochura[brochuraId];
    if (list) {
      return list.find(l => l.numero === number);
    }
    // Fallback search inside mock if melhore
    if (brochuraId === 'melhore') {
      const seeds = this._getSeedMelhoreLicoes();
      return seeds.find(l => l.numero === number);
    }
    return undefined;
  },

  /**
   * Get brochure name by ID.
   */
  getBrochuraNome(brochuraId: string): string {
    const defaultMap: Record<string, string> = {
      'melhore': 'Brochura Melhore',
      'ame_pessoas': 'Ame as Pessoas — Faça Discípulos'
    };

    if (cachedBrochuras) {
      const match = cachedBrochuras.find(b => b.id === brochuraId);
      if (match) return match.nome;
    }

    return defaultMap[brochuraId] || brochuraId;
  }
};
