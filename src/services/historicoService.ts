import { reunioesService, FirestoreReuniao, FirestoreParte } from './reunioesService';
import { participantesService, Participant } from './participantesService';

export interface ParticipantStats {
  nome: string;
  totalPartes: number;
  tempoMedioRealizado: number;
  diferencaMedia: number;
  percentualDentroTempo: number; // diferenca <= 0 && diferenca >= -30
  percentualAcimaTempo: number;  // diferenca > 0
  percentualAbaixoTempo: number; // diferenca < -30
}

export interface MeetingStats {
  id: string;
  data: string;
  title: string;
  totalParticipantes: number;
  totalPartes: number;
  tempoMedioRealizado: number;
  diferencaMedia: number;
}

export interface PresidentStats {
  presidente: string;
  totalReunioes: number;
  totalPartesAcompanhadas: number;
  diferencaMediaGeral: number;
}

export const historicoService = {
  async fetchAllHistorico() {
    const [reunioes, participantes] = await Promise.all([
      reunioesService.fetchReunioes(),
      participantesService.fetchParticipantes()
    ]);
    return { reunioes, participantes };
  },

  calculateStatistics(reunioes: FirestoreReuniao[]): {
    porParticipante: ParticipantStats[];
    porReuniao: MeetingStats[];
    porPresidente: PresidentStats[];
  } {
    const participantMap: Record<string, { total: number; tempos: number[]; diferencas: number[]; dentro: number; acima: number; abaixo: number }> = {};
    const presidentMap: Record<string, { reunioesCount: Set<string>; partesCount: number; diferencas: number[] }> = {};
    const porReuniao: MeetingStats[] = [];

    reunioes.forEach(reuniao => {
      const partes = reuniao.partes || [];
      let totalPartesReuniao = 0;
      let somaTempoRealizadoReuniao = 0;
      let somaDiferencaReuniao = 0;
      const participantesReuniao = new Set<string>();

      partes.forEach(parte => {
        if (!parte.participante) return;
        
        totalPartesReuniao++;
        somaTempoRealizadoReuniao += parte.tempoRealizado;
        somaDiferencaReuniao += parte.diferenca;
        participantesReuniao.add(parte.participante);

        // Por Participante
        if (!participantMap[parte.participante]) {
          participantMap[parte.participante] = {
            total: 0,
            tempos: [],
            diferencas: [],
            dentro: 0,
            acima: 0,
            abaixo: 0
          };
        }
        const pState = participantMap[parte.participante];
        pState.total++;
        pState.tempos.push(parte.tempoRealizado);
        pState.diferencas.push(parte.diferenca);

        if (parte.diferenca > 0) {
          pState.acima++;
        } else if (parte.diferenca < -30) {
          pState.abaixo++;
        } else {
          pState.dentro++;
        }

        // Por Presidente
        if (reuniao.presidente) {
          if (!presidentMap[reuniao.presidente]) {
            presidentMap[reuniao.presidente] = {
              reunioesCount: new Set<string>(),
              partesCount: 0,
              diferencas: []
            };
          }
          const presState = presidentMap[reuniao.presidente];
          presState.reunioesCount.add(reuniao.id);
          presState.partesCount++;
          presState.diferencas.push(parte.diferenca);
        }
      });

      // Por Reunião
      porReuniao.push({
        id: reuniao.id,
        data: reuniao.data,
        title: reuniao.presidente ? `Presidida por ${reuniao.presidente}` : `Reunião ${reuniao.data}`,
        totalParticipantes: participantesReuniao.size,
        totalPartes: totalPartesReuniao,
        tempoMedioRealizado: totalPartesReuniao > 0 ? Math.round(somaTempoRealizadoReuniao / totalPartesReuniao) : 0,
        diferencaMedia: totalPartesReuniao > 0 ? Math.round(somaDiferencaReuniao / totalPartesReuniao) : 0
      });
    });

    // Formatar Participantes
    const porParticipante = Object.entries(participantMap).map(([nome, data]) => {
      const avgTempo = data.tempos.length > 0 ? Math.round(data.tempos.reduce((a, b) => a + b, 0) / data.tempos.length) : 0;
      const avgDif = data.diferencas.length > 0 ? Math.round(data.diferencas.reduce((a, b) => a + b, 0) / data.diferencas.length) : 0;
      return {
        nome,
        totalPartes: data.total,
        tempoMedioRealizado: avgTempo,
        diferencaMedia: avgDif,
        percentualDentroTempo: data.total > 0 ? Math.round((data.dentro / data.total) * 100) : 0,
        percentualAcimaTempo: data.total > 0 ? Math.round((data.acima / data.total) * 100) : 0,
        percentualAbaixoTempo: data.total > 0 ? Math.round((data.abaixo / data.total) * 100) : 0,
      };
    });

    // Formatar Presidentes
    const porPresidente = Object.entries(presidentMap).map(([presidente, data]) => {
      const avgDifGeral = data.diferencas.length > 0 ? Math.round(data.diferencas.reduce((a, b) => a + b, 0) / data.diferencas.length) : 0;
      return {
        presidente,
        totalReunioes: data.reunioesCount.size,
        totalPartesAcompanhadas: data.partesCount,
        diferencaMediaGeral: avgDifGeral
      };
    });

    return {
      porParticipante,
      porReuniao,
      porPresidente
    };
  }
};
