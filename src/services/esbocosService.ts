import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sessionStore, congregationStore } from './sessionStore';
import { Esboco, EsbocoBlock } from '../types';

const COLL_PATH = 'esbocos';

// Modelos padrão de esboços teocráticos reais
export const MODELOS_ESBOCOS: Esboco[] = [
  {
    id: 'modelo_discurso_1',
    title: 'Como a sabedoria de Deus nos beneficia?',
    speaker: 'Reginaldo Moreira',
    duration: 30 * 60, // 30 minutos
    congregation: 'reduto',
    lastSaved: new Date().toISOString(),
    blocks: [
      {
        id: 'b1_1',
        type: 'title',
        content: 'COMO A SABEDORIA DE DEUS NOS BENEFICIA?'
      },
      {
        id: 'b1_2',
        type: 'heading',
        content: '1. O que é a verdadeira sabedoria?',
        allocatedTime: 5 * 60
      },
      {
        id: 'b1_3',
        type: 'paragraph',
        content: 'O mundo hoje exalta a sabedoria intelectual, mas a Bíblia ensina que a sabedoria divina começa com o temor de Jeová. Veja o texto de Provérbios 9:10.'
      },
      {
        id: 'b1_4',
        type: 'comment',
        content: 'Destaque: Mostrar a diferença entre conhecimento (acumular fatos) e sabedoria (saber aplicar os fatos para o bem).'
      },
      {
        id: 'b1_5',
        type: 'heading',
        content: '2. Aplicação prática na família e na vida diária',
        allocatedTime: 12 * 60
      },
      {
        id: 'b1_6',
        type: 'paragraph',
        content: 'A sabedoria divina nos protege de decisões impulsivas e melhora o relacionamento familiar. Mateus 6:34 nos incentiva a não andarmos ansiosos pelo amanhã. Ao aplicar a sabedoria, evitamos as armadilhas do materialismo.'
      },
      {
        id: 'b1_7',
        type: 'script',
        content: 'Ilustração: Comparar a sabedoria de Deus a um GPS que recalcula a rota para evitar perigos no trânsito urbano.'
      },
      {
        id: 'b1_8',
        type: 'heading',
        content: '3. Benefícios eternos de seguir os conselhos divinos',
        allocatedTime: 10 * 60
      },
      {
        id: 'b1_9',
        type: 'paragraph',
        content: 'O maior benefício de viver segundo as leis de Deus é a paz mental agora e a perspectiva de vida eterna descrita em João 3:16 e Salmos 37:29.'
      },
      {
        id: 'b1_10',
        type: 'comment',
        content: 'Apelo final: Incentivar os ouvintes a continuarem estudando as Escrituras diariamente.'
      },
      {
        id: 'b1_11',
        type: 'heading',
        content: 'Conclusão',
        allocatedTime: 3 * 60
      },
      {
        id: 'b1_12',
        type: 'paragraph',
        content: 'A sabedoria é uma árvore de vida para quem a segura. Sigamos firmes neste caminho!'
      }
    ]
  },
  {
    id: 'modelo_vida_ministerio_1',
    title: 'Estudo Bíblico de Congregação',
    speaker: 'Rafael Barbosa',
    duration: 30 * 60, // 30 minutos
    congregation: 'reduto',
    lastSaved: new Date().toISOString(),
    blocks: [
      {
        id: 'b2_1',
        type: 'title',
        content: 'O Reino de Deus já Governa! - Capítulo 12'
      },
      {
        id: 'b2_2',
        type: 'heading',
        content: 'Introdução e parágrafos 1 a 5',
        allocatedTime: 7 * 60
      },
      {
        id: 'b2_3',
        type: 'paragraph',
        content: 'Nesta seção, analisamos como as mudanças organizacionais ajudaram no desenvolvimento da pregação mundial. A leitura das escrituras apóia nossa lealdade. Veja Mateus 24:14.'
      },
      {
        id: 'b2_4',
        type: 'comment',
        content: 'Nota de ajuda: Incentivar comentários breves e objetivos de vários irmãos.'
      },
      {
        id: 'b2_5',
        type: 'heading',
        content: 'Análise dos parágrafos 6 a 12 (Organização e Ajustes)',
        allocatedTime: 15 * 60
      },
      {
        id: 'b2_6',
        type: 'paragraph',
        content: 'Ajustes na liderança congregacional. Passamos de diretores para corpos de anciãos, promovendo a humildade cristã em conformidade com 1 Pedro 5:2.'
      },
      {
        id: 'b2_7',
        type: 'heading',
        content: 'Parágrafos 13 a 18 e Conclusão',
        allocatedTime: 8 * 60
      },
      {
        id: 'b2_8',
        type: 'paragraph',
        content: 'O Reino de Deus refina continuamente o seu povo. Expressamos gratidão por fazer parte desta obra divina, perseverando até o fim.'
      }
    ]
  }
];

export const esbocosService = {
  // Busca esboços salvos para a congregação ativa
  async fetchEsbocos(): Promise<Esboco[]> {
    const isDemo = sessionStore.isDemo();
    const congregation = congregationStore.getCongregation().toLowerCase().trim();

    if (isDemo) {
      const local = localStorage.getItem(`esbocos_demo_${congregation}`);
      if (local) {
        return JSON.parse(local);
      }
      // Retorna os modelos padrão filtrados ou todos
      return MODELOS_ESBOCOS.map(m => ({ ...m, congregation }));
    }

    try {
      const colRef = collection(db, COLL_PATH);
      const q = query(colRef, where('congregation', '==', congregation));
      const qSnap = await getDocs(q);
      
      if (qSnap.empty) {
        // Se estiver vazio no Firebase, salva os modelos padrão para esta congregação começar
        const defaultEsbocos = MODELOS_ESBOCOS.map(m => ({
          ...m,
          id: `${m.id}_${congregation}`,
          congregation
        }));
        
        for (const esboco of defaultEsbocos) {
          await this.saveEsboco(esboco);
        }
        return defaultEsbocos;
      }

      const list: Esboco[] = [];
      qSnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Esboco);
      });
      return list;
    } catch (e) {
      console.warn('Erro ao carregar esboços do Firestore. Retornando padrão local:', e);
      return MODELOS_ESBOCOS.map(m => ({ ...m, congregation }));
    }
  },

  // Busca um esboço específico por ID
  async fetchEsbocoById(id: string): Promise<Esboco | null> {
    const isDemo = sessionStore.isDemo();
    const congregation = congregationStore.getCongregation().toLowerCase().trim();

    if (isDemo) {
      const all = await this.fetchEsbocos();
      return all.find(e => e.id === id) || null;
    }

    try {
      const docRef = doc(db, COLL_PATH, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Esboco;
      }
      return null;
    } catch (e) {
      console.error('Erro ao buscar esboço por ID:', e);
      return null;
    }
  },

  // Salva ou edita um esboço
  async saveEsboco(esboco: Esboco): Promise<void> {
    const isDemo = sessionStore.isDemo();
    const congregation = congregationStore.getCongregation().toLowerCase().trim();
    const esbocoToSave = {
      ...esboco,
      congregation,
      lastSaved: new Date().toISOString()
    };

    if (isDemo) {
      const all = await this.fetchEsbocos();
      const index = all.findIndex(e => e.id === esboco.id);
      if (index >= 0) {
        all[index] = esbocoToSave;
      } else {
        all.push(esbocoToSave);
      }
      localStorage.setItem(`esbocos_demo_${congregation}`, JSON.stringify(all));
      return;
    }

    try {
      const docRef = doc(db, COLL_PATH, esboco.id);
      await setDoc(docRef, esbocoToSave);
    } catch (e) {
      console.error('Erro ao salvar esboço no Firestore:', e);
      throw e;
    }
  },

  // Exclui um esboço
  async deleteEsboco(id: string): Promise<void> {
    const isDemo = sessionStore.isDemo();
    const congregation = congregationStore.getCongregation().toLowerCase().trim();

    if (isDemo) {
      const all = await this.fetchEsbocos();
      const filtered = all.filter(e => e.id !== id);
      localStorage.setItem(`esbocos_demo_${congregation}`, JSON.stringify(filtered));
      return;
    }

    try {
      const docRef = doc(db, COLL_PATH, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Erro ao excluir esboço no Firestore:', e);
      throw e;
    }
  }
};
