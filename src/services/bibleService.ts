export interface BibleVerse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: string;
}

// Dicionário local offline de textos bíblicos reais em Português altamente citados em reuniões
export const BIBLE_DICTIONARY_PT: Record<string, string> = {
  'mateus 6:34': 'Portanto, nunca fiquem ansiosos por causa do amanhã, pois o amanhã terá suas próprias ansiedades. Bastam a cada dia suas próprias dificuldades.',
  'mateus 24:14': 'E estas boas novas do Reino serão pregadas em toda a terra habitada, em testemunho a todas as nações, e então virá o fim.',
  'joão 3:16': 'Porque Deus amou tanto o mundo, que deu o seu Filho unigênito, para que todo aquele que nele exercer fé não seja destruído, mas tenha vida eterna.',
  'salmos 23:1': 'Jeová é o meu Pastor. Nada me faltará.',
  'salmos 37:29': 'Os justos possuirão a terra e viverão nela para sempre.',
  'salmos 37:11': 'Mas os mansos possuirão a terra e se deleitarão na abundância de paz.',
  'provérbios 3:5': 'Confie em Jeová de todo o seu coração e não se apoie no seu próprio entendimento.',
  'provérbios 3:6': 'Lembre-se dele em todos os seus caminhos, e ele endireitará as suas veredas.',
  'provérbios 9:10': 'O temor de Jeová é o início da sabedoria, e o conhecimento do Santíssimo é o entendimento.',
  'apocalipse 21:4': 'Ele enxugará dos seus olhos toda lágrima, e não haverá mais morte, nem haverá mais tristeza, nem choro, nem dor. As coisas anteriores já passaram.',
  'revelação 21:4': 'Ele enxugará dos seus olhos toda lágrima, e não haverá mais morte, nem haverá mais tristeza, nem choro, nem dor. As coisas anteriores já passaram.',
  'romanos 12:2': 'E parem de se amoldar a este sistema de coisas, mas transformem-se, renovando a sua mente, para provar a si mesmos a boa, aceitável e perfeita vontade de Deus.',
  'romanos 15:4': 'Pois todas as coisas escritas anteriormente foram escritas para a nossa instrução, a fim de que, por meio da nossa perseverança e do consolo das Escrituras, tenhamos esperança.',
  'tiago 1:5': 'Se algum de vocês tiver falta de sabedoria, continue a pedi-la a Deus, pois ele dá a todos generosamente, sem censurar; e ela lhe será dada.',
  '1 pedro 5:2': 'Pastoreiem o rebanho de Deus, que está aos seus cuidados, servindo como superintendentes, não por obrigação, mas de livre vontade perante Deus; não por amor ao ganho desonesto, mas com entusiasmo.',
  '1 pedro 5:7': 'Ao mesmo tempo que lançam sobre ele toda a sua ansiedade, porque ele cuida de vocês.',
  '2 timóteo 3:1': 'Mas saiba disto: nos últimos dias haverá tempos críticos, difíceis de suportar.',
  '2 timóteo 3:16': 'Toda a Escritura é inspirada por Deus e proveitosa para ensinar, para repreender, para endireitar as coisas, para disciplinar em justiça,',
  '2 timóteo 3:17': 'a fim de que o homem de Deus seja plenamente competente, completamente equipado para toda boa obra.',
  'gênesis 1:1': 'No princípio Deus criou os céus e a terra.',
  'josué 1:9': 'Não lhe ordenei eu? Seja corajoso e forte. Não fique apavorado nem desanimado, pois Jeová, seu Deus, estará com você por onde quer que você for.',
  'isaías 40:29': 'Ele dá poder ao cansado e enche de vigor aquele que está sem forças.',
  'isaías 40:31': 'Mas os que esperam em Jeová recuperarão as forças. Subirão com asas como águias. Correrão e não ficarão exaustos; andarão e não se cansarão.',
  'isaías 41:10': 'Não tenha medo, pois estou com você. Não fique ansioso, pois eu sou o seu Deus. Vou fortalecê-lo, sim, vou ajudá-lo. Vou segurá-lo firmemente com a minha mão direita de justiça.',
  'filipenses 4:6': 'Não fiquem ansiosos por causa de coisa alguma, mas em tudo, por orações e súplicas, junto com agradecimentos, tornem os seus pedidos conhecidos a Deus;',
  'filipenses 4:7': 'e a paz de Deus, que está além de toda compreensão, guardará o seu coração e a sua mente por meio de Cristo Jesus.',
  'filipenses 4:13': 'Para todas as coisas tenho forças graças àquele que me dá poder.',
  'hebreus 10:24': 'E pensemos uns nos outros para nos estimular ao amor e às boas obras,',
  'hebreus 10:25': 'não deixando de nos reunir, como é costume de alguns, mas encorajando uns aos outros, e ainda mais ao passo que vocês veem aproximar-se o dia.'
};

export const bibleService = {
  // Regex inteligente para identificar referências bíblicas em português
  // Exemplos compatíveis: Mateus 6:34, 1 Pedro 5:7, Salmos 37:11, 2 Timóteo 3:16-17
  getBibleReferenceRegex(): RegExp {
    return /(?:[123]\s+)?(?:[A-Z][a-zÀ-ÿ]+(?:\s+de\s+[A-Z][a-zÀ-ÿ]+)?)\s+\d+:\d+(?:-\d+)?/g;
  },

  // Normaliza a string de referência para busca fácil (remover espaços duplos, converter para minúscula)
  normalizeRef(ref: string): string {
    return ref.toLowerCase().trim().replace(/\s+/g, ' ');
  },

  // Retorna o texto do versículo (busca localmente ou tenta API pública)
  async fetchVerseText(reference: string): Promise<string> {
    const cleanRef = this.normalizeRef(reference);
    
    // 1. Tenta encontrar no dicionário estático (completamente offline e instantâneo)
    if (BIBLE_DICTIONARY_PT[cleanRef]) {
      return BIBLE_DICTIONARY_PT[cleanRef];
    }

    // Se a referência contiver um intervalo de versículos, ex: "2 timóteo 3:16-17", tenta quebrar e buscar o primário
    if (cleanRef.includes('-')) {
      const basePart = cleanRef.split('-')[0];
      if (BIBLE_DICTIONARY_PT[basePart]) {
        return BIBLE_DICTIONARY_PT[basePart] + " [Continua no versículo seguinte]";
      }
    }

    // 2. Busca na API internacional (com fallback)
    try {
      const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=almeida`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn('API de Bíblia indisponível ou offline. Usando fallback inteligente:', e);
    }

    // 3. Fallback dinâmico e amigável para qualquer versículo não listado
    return `[Texto de ${reference} disponível nas Escrituras. Toque para ler em sua Bíblia física ou app oficial JW Library.]`;
  },

  // Escaneia um texto em busca de citações e retorna uma lista de marcações encontradas
  detectReferencesInText(text: string): string[] {
    const regex = this.getBibleReferenceRegex();
    const matches = text.match(regex);
    if (!matches) return [];
    
    // Filtra duplicados mantendo a ordem original
    return Array.from(new Set(matches));
  }
};
