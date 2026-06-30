import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ScheduleItem } from '../types';

export interface EcosystemDesignacao {
  id?: string;
  participante: string;
  tipoParte: string;
  tempoPrevisto: number; // em segundos
  avaliada?: boolean;
  brochuraId?: string | null;
  licaoNumero?: number | null;
  observacaoPresidente?: string;
}

export interface EcosystemAgenda {
  id: string;
  data: string; // YYYY-MM-DD
  congregacao: string;
  presidente: string;
  partes: EcosystemDesignacao[];
}

// Dias de reunião padrão para as congregações conhecidas (Exemplo: Reduto)
export const DIAS_REUNIAO_CONGREGACAO: Record<string, { dias: number[]; nomesDias: string[] }> = {
  reduto: {
    dias: [2, 6], // Terça-feira (2) e Sábado (6)
    nomesDias: ['Terça-feira', 'Sábado']
  },
  default: {
    dias: [2, 4, 6, 0], // Terça (2), Quinta (4), Sábado (6), Domingo (0) como padrão amplo
    nomesDias: ['Terça-feira', 'Quinta-feira', 'Sábado', 'Domingo']
  }
};

export const integracaoService = {
  // Detecta se hoje é dia de reunião da congregação
  isTodayMeetingDay(congregacao: string, date: Date = new Date()): { isMeetingDay: boolean; meetingType: 'vida_e_ministerio' | 'fim_de_semana' | null; dayName: string } {
    const sanitizedCongre = congregacao.toLowerCase().trim();
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, etc.
    
    const diasInfo = DIAS_REUNIAO_CONGREGACAO[sanitizedCongre] || DIAS_REUNIAO_CONGREGACAO.default;
    const isMeetingDay = diasInfo.dias.includes(dayOfWeek);
    
    let meetingType: 'vida_e_ministerio' | 'fim_de_semana' | null = null;
    if (isMeetingDay) {
      // Normalmente dias de semana (1, 2, 3, 4, 5) são Vida e Ministério
      // Finais de semana (6, 0) são Discurso e Sentinela
      meetingType = (dayOfWeek === 6 || dayOfWeek === 0) ? 'fim_de_semana' : 'vida_e_ministerio';
    }
    
    const nomesSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    return {
      isMeetingDay,
      meetingType,
      dayName: nomesSemana[dayOfWeek]
    };
  },

  // Gera dados modelo caso o Firestore ainda não tenha a coleção sincronizada
  getMockScheduleTemplate(meetingType: 'vida_e_ministerio' | 'fim_de_semana', congregacao: string): { presidente: string; partes: ScheduleItem[] } {
    const isReduto = congregacao.toLowerCase().includes('reduto');
    
    if (meetingType === 'vida_e_ministerio') {
      return {
        presidente: isReduto ? 'Leônidas Alves' : 'Não informado',
        partes: [
          {
            id: 'import_vm_1',
            name: isReduto ? 'Nathan Evangelista' : 'Orador 1',
            partType: 'Tesouros da Palavra de Deus (Joias)',
            expectedTime: 10 * 60,
            status: 'pending',
            completedTime: null
          },
          {
            id: 'import_vm_2',
            name: isReduto ? 'Moisés Werly' : 'Orador 2',
            partType: 'Joias Espirituais (Pesquisa)',
            expectedTime: 10 * 60,
            status: 'pending',
            completedTime: null
          },
          {
            id: 'import_vm_3',
            name: isReduto ? 'Alef Gall' : 'Estudante 1',
            partType: 'Leitura da Bíblia',
            expectedTime: 4 * 60,
            status: 'pending',
            completedTime: null,
            avaliada: true,
            brochuraId: 'melhore',
            licaoNumero: 5
          },
          {
            id: 'import_vm_4',
            name: isReduto ? 'Alice Werly' : 'Estudante 2',
            partType: 'Iniciando Conversas (Primeira Conversa)',
            expectedTime: 3 * 60,
            status: 'pending',
            completedTime: null,
            avaliada: true,
            brochuraId: 'melhore',
            licaoNumero: 1
          },
          {
            id: 'import_vm_5',
            name: isReduto ? 'Cynthia Marinho' : 'Estudante 3',
            partType: 'Cultivando o Interesse (Revisita)',
            expectedTime: 4 * 60,
            status: 'pending',
            completedTime: null,
            avaliada: true,
            brochuraId: 'melhore',
            licaoNumero: 4
          },
          {
            id: 'import_vm_6',
            name: isReduto ? 'Lucas Evangelista' : 'Orador 3',
            partType: 'Nossa Vida Cristã - Parte 1',
            expectedTime: 15 * 60,
            status: 'pending',
            completedTime: null
          },
          {
            id: 'import_vm_7',
            name: isReduto ? 'Rafael Barbosa' : 'Dirigente',
            partType: 'Estudo Bíblico de Congregação',
            expectedTime: 30 * 60,
            status: 'pending',
            completedTime: null
          }
        ]
      };
    } else {
      return {
        presidente: isReduto ? 'Marcus Vinícius' : 'Não informado',
        partes: [
          {
            id: 'import_fs_1',
            name: 'Reginaldo Moreira',
            partType: 'Discurso Público: Como a sabedoria de Deus nos beneficia?',
            expectedTime: 30 * 60,
            status: 'pending',
            completedTime: null
          },
          {
            id: 'import_fs_2',
            name: isReduto ? 'Leônidas Alves' : 'Leitor do Estudo',
            partType: 'Estudo de A Sentinela (Leitura e Perguntas)',
            expectedTime: 60 * 60,
            status: 'pending',
            completedTime: null
          }
        ]
      };
    }
  },

  // Busca a programação no Firestore do ecossistema compartilhado
  async fetchEcosystemSchedule(congregacao: string, dateStr: string): Promise<{ presidente: string; partes: ScheduleItem[] } | null> {
    const congreKey = congregacao.toLowerCase().trim();
    
    // Lista de coleções prováveis onde "Gerenciador" ou "Agenda Teocrática" salvam suas agendas
    const colecoesPossiveis = ['agenda_teocratica', 'designacoes', 'programacao', 'programas_reuniao'];
    
    for (const colecao of colecoesPossiveis) {
      try {
        // Tenta buscar por ID de documento combinado: "congre_data" (ex: "reduto_2026-06-30")
        const docId = `${congreKey}_${dateStr}`;
        const docRef = doc(db, colecao, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.partes)) {
            const mappedPartes: ScheduleItem[] = data.partes.map((p: any, idx: number) => ({
              id: p.id || `ecosystem_${colecao}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
              name: p.participante || p.name || 'Não informado',
              partType: p.tipoParte || p.partType || 'Parte',
              expectedTime: Number(p.tempoPrevisto || p.expectedTime || 240),
              status: 'pending',
              completedTime: null,
              avaliada: p.avaliada || false,
              brochuraId: p.brochuraId || null,
              licaoNumero: p.licaoNumero || null,
              observacaoPresidente: p.observacaoPresidente || ''
            }));
            
            return {
              presidente: data.presidente || '',
              partes: mappedPartes
            };
          }
        }
        
        // Segunda tentativa: Buscar por Query filters
        const colRef = collection(db, colecao);
        const q = query(
          colRef, 
          where('data', '==', dateStr), 
          where('congregacao', '==', congreKey)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const docDoc = qSnap.docs[0];
          const data = docDoc.data();
          if (data && Array.isArray(data.partes)) {
            const mappedPartes: ScheduleItem[] = data.partes.map((p: any, idx: number) => ({
              id: p.id || `ecosystem_${colecao}_query_${idx}_${Math.random().toString(36).substring(2, 7)}`,
              name: p.participante || p.name || 'Não informado',
              partType: p.tipoParte || p.partType || 'Parte',
              expectedTime: Number(p.tempoPrevisto || p.expectedTime || 240),
              status: 'pending',
              completedTime: null,
              avaliada: p.avaliada || false,
              brochuraId: p.brochuraId || null,
              licaoNumero: p.licaoNumero || null,
              observacaoPresidente: p.observacaoPresidente || ''
            }));
            
            return {
              presidente: data.presidente || '',
              partes: mappedPartes
            };
          }
        }
      } catch (e) {
        console.warn(`Tentativa de ler a coleção [${colecao}] do ecossistema falhou ou não existe:`, e);
      }
    }
    
    return null;
  }
};
