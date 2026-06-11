import { Participant } from './participantesService';
import { FirestoreReuniao } from './reunioesService';
import { SystemConfig, DEFAULT_CONFIG } from './configuracoesService';

const KEY_PARTICIPANTES = 'demo_participantes';
const KEY_REUNIOES = 'demo_reunioes';
const KEY_CONFIG = 'demo_config';

export const MOCK_PARTICIPANTES: Participant[] = [
  { id: 'part_1', nome: 'Carlos Oliveira', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Presidente de Hoje' },
  { id: 'part_2', nome: 'João Silva', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Leitura da Bíblia' },
  { id: 'part_3', nome: 'Maria Souza', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Primeira Conversa' },
  { id: 'part_4', nome: 'Pedro Santos', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Revisita' },
  { id: 'part_5', nome: 'Ana Costa', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Estudo Bíblico' },
  { id: 'part_6', nome: 'Roberto Lima', ativo: true, criadoEm: '2026-06-01T12:00:00.000Z', observacoes: 'Joias Espirituais' },
];

export const MOCK_REUNIOES: FirestoreReuniao[] = [
  {
    id: 'meet_demo_1',
    data: '2026-06-05',
    presidente: 'Carlos Oliveira',
    criadaEm: '2026-06-05T20:00:00.000Z',
    status: 'concluida',
    partes: [
      { id: 'dp_1', participante: 'João Silva', tipoParte: 'Leitura da Bíblia', tempoPrevisto: 240, tempoRealizado: 235, diferenca: -5, observacao: '', concluida: true, registradoEm: '2026-06-05T20:10:00.000Z' },
      { id: 'dp_2', participante: 'Maria Souza', tipoParte: 'Primeira Conversa', tempoPrevisto: 180, tempoRealizado: 172, diferenca: -8, observacao: '', concluida: true, registradoEm: '2026-06-05T20:20:00.000Z' },
      { id: 'dp_3', participante: 'Pedro Santos', tipoParte: 'Revisita', tempoPrevisto: 300, tempoRealizado: 310, diferenca: 10, observacao: '', concluida: true, registradoEm: '2026-06-05T20:30:00.000Z' },
      { id: 'dp_4', participante: 'Ana Costa', tipoParte: 'Estudo Bíblico', tempoPrevisto: 300, tempoRealizado: 290, diferenca: -10, observacao: '', concluida: true, registradoEm: '2026-06-05T20:40:00.000Z' }
    ]
  },
  {
    id: 'meet_demo_2',
    data: '2026-06-12',
    presidente: 'Carlos Oliveira',
    criadaEm: '2026-06-12T20:00:00.000Z',
    status: 'concluida',
    partes: [
      { id: 'dp_5', participante: 'Roberto Lima', tipoParte: 'Joias Espirituais', tempoPrevisto: 600, tempoRealizado: 615, diferenca: 15, observacao: '', concluida: true, registradoEm: '2026-06-12T20:15:00.000Z' },
      { id: 'dp_6', participante: 'Pedro Santos', tipoParte: 'Revisita', tempoPrevisto: 300, tempoRealizado: 295, diferenca: -5, observacao: '', concluida: true, registradoEm: '2026-06-12T20:30:00.000Z' },
      { id: 'dp_7', participante: 'Maria Souza', tipoParte: 'Primeira Conversa', tempoPrevisto: 180, tempoRealizado: 195, diferenca: 15, observacao: '', concluida: true, registradoEm: '2026-06-12T20:45:00.000Z' }
    ]
  },
  {
    id: 'meet_demo_3',
    data: '2026-06-19',
    presidente: 'Carlos Oliveira',
    criadaEm: '2026-06-19T20:00:00.000Z',
    status: 'concluida',
    partes: [
      { id: 'dp_8', participante: 'Ana Costa', tipoParte: 'Estudo Bíblico', tempoPrevisto: 300, tempoRealizado: 305, diferenca: 5, observacao: '', concluida: true, registradoEm: '2026-06-19T20:15:00.000Z' },
      { id: 'dp_9', participante: 'João Silva', tipoParte: 'Leitura da Bíblia', tempoPrevisto: 240, tempoRealizado: 240, diferenca: 0, observacao: '', concluida: true, registradoEm: '2026-06-19T20:30:00.000Z' },
      { id: 'dp_10', participante: 'Roberto Lima', tipoParte: 'Joias Espirituais', tempoPrevisto: 600, tempoRealizado: 580, diferenca: -20, observacao: '', concluida: true, registradoEm: '2026-06-19T20:45:00.000Z' }
    ]
  }
];

export const demoService = {
  getParticipantes(): Participant[] {
    const val = sessionStorage.getItem(KEY_PARTICIPANTES);
    if (!val) {
      sessionStorage.setItem(KEY_PARTICIPANTES, JSON.stringify(MOCK_PARTICIPANTES));
      return MOCK_PARTICIPANTES;
    }
    return JSON.parse(val);
  },

  saveParticipantes(list: Participant[]) {
    sessionStorage.setItem(KEY_PARTICIPANTES, JSON.stringify(list));
  },

  getReunioes(): FirestoreReuniao[] {
    const val = sessionStorage.getItem(KEY_REUNIOES);
    if (!val) {
      sessionStorage.setItem(KEY_REUNIOES, JSON.stringify(MOCK_REUNIOES));
      return MOCK_REUNIOES;
    }
    return JSON.parse(val);
  },

  saveReunioes(list: FirestoreReuniao[]) {
    sessionStorage.setItem(KEY_REUNIOES, JSON.stringify(list));
  },

  getConfig(): SystemConfig {
    const val = sessionStorage.getItem(KEY_CONFIG);
    if (!val) {
      sessionStorage.setItem(KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return JSON.parse(val);
  },

  saveConfig(config: SystemConfig) {
    sessionStorage.setItem(KEY_CONFIG, JSON.stringify(config));
  },

  clearDemoData() {
    sessionStorage.removeItem(KEY_PARTICIPANTES);
    sessionStorage.removeItem(KEY_REUNIOES);
    sessionStorage.removeItem(KEY_CONFIG);
  }
};
