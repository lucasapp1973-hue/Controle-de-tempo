export type TimerMode = 'progressive' | 'regressive';

export interface Brochura {
  id: string; // e.g. "melhore", "ame_pessoas"
  nome: string;
  ativa: boolean;
}

export interface LicaoConteudoNode {
  tipo: 'titulo' | 'paragrafo' | 'bullet' | 'dica' | 'pregacao';
  texto: string;
}

export interface Licao {
  id?: string;
  brochuraId: string;
  numero: number;
  titulo: string;
  ordem: number;
  conteudo: LicaoConteudoNode[];
}

export interface ScheduleItem {
  id: string;
  name: string;
  partType: string;
  expectedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
  completedTime?: number | null; // in seconds actually taken
  avaliada?: boolean;
  brochuraId?: string | null;
  licaoNumero?: number | null;
  observacaoPresidente?: string;
  conselhoAplicado?: boolean | null;
}

export interface CompletedMeeting {
  id: string;
  date: string; // e.g. "2026-06-10"
  title: string;
  schedule: ScheduleItem[];
}

export interface TimerState {
  isRunning: boolean;
  mode: TimerMode;
  initialDuration: number; // in seconds
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
  schedule: ScheduleItem[];
  activeId: string | null; // ID of the currently active schedule participant
  elapsedTime: number; // actual seconds spent on the current active participant
  meetings?: CompletedMeeting[];
  isStopped?: boolean;
}

export interface TimerConfig {
  minutes: number;
  seconds: number;
  mode: TimerMode;
}

