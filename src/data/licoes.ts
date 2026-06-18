export interface LicaoMelhore {
  numero: number;
  titulo: string;
  objetivo: string;
  resumoCurto: string[];
  comoFazer: {
    titulo: string;
    descricao: string;
  }[];
}

export const LICOES_MELHORE_DATA: LicaoMelhore[] = [
  {
    numero: 1,
    titulo: "Comece bem",
    objetivo: "Logo de início, fale algo que chame a atenção das pessoas, deixe claro qual é o assunto e mostre por que o assunto é importante para elas.",
    resumoCurto: [
      "Chame atenção",
      "Mostre o assunto",
      "Mostre utilidade"
    ],
    comoFazer: [
      {
        titulo: "Deixe as pessoas interessadas",
        descricao: "Faça uma pergunta, use uma história do dia a dia, fale sobre uma notícia, sobre a previsão do tempo, e assim por diante."
      },
      {
        titulo: "Deixe claro o assunto",
        descricao: "As pessoas precisam saber qual é o assunto e por que você está falando sobre ele."
      },
      {
        titulo: "Mostre por que o assunto é importante",
        descricao: "Fale sobre algo que vai ajudar as pessoas no dia a dia. Elas precisam ver como o assunto pode ser útil para elas."
      }
    ]
  },
  {
    numero: 2,
    titulo: "Naturalidade",
    objetivo: "Fale de uma maneira espontânea, sincera e que mostre que você acredita naquilo que está dizendo.",
    resumoCurto: [
      "Seja espontâneo",
      "Fale com sinceridade",
      "Mostre convicção"
    ],
    comoFazer: [
      {
        titulo: "Não tente imitar outra pessoa",
        descricao: "Fale do seu próprio jeito. Suas palavras e tom de voz devem mostrar quem você realmente é."
      },
      {
        titulo: "Olhe para as pessoas",
        descricao: "Se for apropriado, olhe nos olhos das pessoas com quem está conversando. Isso transmite confiança."
      },
      {
        titulo: "Fale do coração",
        descricao: "Sua entonação deve refletir seus sentimentos e a importância da mensagem."
      }
    ]
  },
  {
    numero: 3,
    titulo: "Uso de perguntas",
    objetivo: "Use perguntas para ajudar as pessoas a raciocinar, despertar o interesse e avaliar o entendimento.",
    resumoCurto: [
      "Desperte curiosidade",
      "Ajude a raciocinar",
      "Avalie o entendimento"
    ],
    comoFazer: [
      {
        titulo: "Faça perguntas de opinião",
        descricao: "Pergunte de forma amigável o que a pessoa acha sobre determinado assunto para iniciar a conversa."
      },
      {
        titulo: "Use perguntas retóricas",
        descricao: "Use perguntas que guiem o ouvinte a chegar a uma conclusão lógica."
      },
      {
        titulo: "Evite deixar o ouvinte sem graça",
        descricao: "Não faça perguntas difíceis ou que façam a pessoa se sentir ignorante."
      }
    ]
  },
  {
    numero: 4,
    titulo: "Uso de textos bíblicos",
    objetivo: "Introduza, leia e aplique os textos das Escrituras de modo a destacar a autoridade da Palavra de Deus.",
    resumoCurto: [
      "Introduza claramente",
      "Leia com boa ênfase",
      "Aplique de forma lógica"
    ],
    comoFazer: [
      {
        titulo: "Introduza com expectativa",
        descricao: "Ajude os ouvintes a focar no motivo pelo qual você está lendo o texto sagrado."
      },
      {
        titulo: "Enfatize as palavras certas",
        descricao: "Destaque na leitura apenas as palavras que apoiam a sua linha de raciocínio."
      },
      {
        titulo: "Explique a aplicação",
        descricao: "Mostre de maneira simples como o texto se relaciona diretamente com o ponto que você está defendendo."
      }
    ]
  },
  {
    numero: 5,
    titulo: "Leitura precisa",
    objetivo: "Leia o texto impresso ou digital de forma exata, fluida e com a pronúncia correta.",
    resumoCurto: [
      "Evite hesitações",
      "Pronuncie corretamente",
      "Respeite a pontuação"
    ],
    comoFazer: [
      {
        titulo: "Prepare-se com antecedência",
        descricao: "Pratique a leitura em voz alta várias vezes para se familiarizar com palavras difíceis."
      },
      {
        titulo: "Respeite as pausas gramaticais",
        descricao: "Use pontos, vírgulas e pontos de interrogação para dar sentido natural à leitura."
      },
      {
        titulo: "Não pule palavras",
        descricao: "Mantenha o foco visual para ler exatamente o que está escrito, sem aditamentos ou omissões."
      }
    ]
  },
  {
    numero: 6,
    titulo: "Bom uso de ilustrações",
    objetivo: "Use ilustrações simples e fáceis de entender para reforçar ideias principais ou simplificar pontos difíceis.",
    resumoCurto: [
      "Use analogias simples",
      "Destaque pontos sérios",
      "Evite detalhes excessivos"
    ],
    comoFazer: [
      {
        titulo: "Escolha exemplos familiares",
        descricao: "Use coisas do dia a dia ou conceitos que a maioria das pessoas conhece muito bem."
      },
      {
        titulo: "Faça a aplicação da ilustração",
        descricao: "Não deixe a ilustração solta; explique claramente o paralelo entre o exemplo e a verdade bíblica."
      },
      {
        titulo: "Mantenha a simplicidade",
        descricao: "Ilustrações longas e complicadas desviam a atenção do assunto principal."
      }
    ]
  },
  {
    numero: 7,
    titulo: "Entonação e volume",
    objetivo: "Fale com volume adequado e varie o tom de voz para transmitir a importância e o sentimento do que diz.",
    resumoCurto: [
      "Ajuste ao ambiente",
      "Transmita entusiasmo",
      "Ajuste ao sentimento"
    ],
    comoFazer: [
      {
        titulo: "Varie o volume",
        descricao: "Aumente o volume para dar ênfase e diminua-o para criar expectativa ou prender a atenção."
      },
      {
        titulo: "Varie o ritmo e a velocidade",
        descricao: "Fale um pouco mais rápido para demonstrar emoção e desacelere para expressar pontos sérios."
      },
      {
        titulo: "Ajuste o tom de voz",
        descricao: "Seu tom de voz deve corresponder aos sentimentos descritos nas palavras (alegria, seriedade, urgência, etc)."
      }
    ]
  },
  {
    numero: 8,
    titulo: "Argumentação convincente",
    objetivo: "Apresente razões lógicas e provas bíblicas sólidas para ajudar as pessoas a chegarem a uma conclusão correta.",
    resumoCurto: [
      "Use fatos inegáveis",
      "Faça conexões lógicas",
      "Siga uma ordem clara"
    ],
    comoFazer: [
      {
        titulo: "Use raciocínios com base comum",
        descricao: "Comece com pontos em que você e a pessoa estão de acordo para construir pontes de entendimento."
      },
      {
        titulo: "Apresente provas bíblicas sólidas",
        descricao: "Enfatize o que a Bíblia ensina em vez de dar apenas conselhos pessoais ou opiniões."
      },
      {
        titulo: "Faça perguntas reflexivas",
        descricao: "Ajude o ouvinte a pensar racionalmente sobre as consequências de suas escolhas."
      }
    ]
  },
  {
    numero: 9,
    titulo: "Gestos e contato visual",
    objetivo: "Utilize expressões faciais, gestos naturais e faça contato visual constante para se comunicar com eficácia.",
    resumoCurto: [
      "Use gestos naturais",
      "Olhe sincera e diretamente",
      "Mantenha postura digna"
    ],
    comoFazer: [
      {
        titulo: "Olhe nos olhos dos ouvintes",
        descricao: "Distribua o olhar por todo o auditório ou converse olhando o morador diretamente nos olhos."
      },
      {
        titulo: "Frua de gestos espontâneos",
        descricao: "Movimente as mãos e a cabeça de forma natural para acompanhar e descrever ideias ou sentimentos."
      },
      {
        titulo: "Sorria calorosamente",
        descricao: "Seu rosto deve transmitir simpatia, amizade e interesse verdadeiro pela pessoa."
      }
    ]
  },
  {
    numero: 10,
    titulo: "Conclusão eficaz",
    objetivo: "Termine seu discurso ou conversa incentivando claramente a ação e resumindo os pontos fundamentais.",
    resumoCurto: [
      "Faça um apelo à ação",
      "Resuma os pontos-chave",
      "Seja encorajador"
    ],
    comoFazer: [
      {
        titulo: "Diga exatamente o que fazer",
        descricao: "Deixe claro qual deve ser a atitude ou ação prática que o ouvinte deve tomar a seguir."
      },
      {
        titulo: "Revise os pontos principais",
        descricao: "Reforce brevemente na mente dos ouvintes as ideias principais que eles devem guardar."
      },
      {
        titulo: "Fale com entusiasmo final",
        descricao: "Seu apelo final deve ser positivo, alegre e transmitir plena fé no benefício da aplicação."
      }
    ]
  },
  {
    numero: 11,
    titulo: "Modulação",
    objetivo: "Varie o volume, o ritmo e o tom de voz de modo a destacar ideias específicas e manter o interesse dos ouvintes.",
    resumoCurto: [
      "Mude de velocidade",
      "Varie o tom de voz",
      "Evite tom monótone"
    ],
    comoFazer: [
      {
        titulo: "Acelere e desacelere",
        descricao: "Acelere para expressar excitação e desacelere para frisar pontos importantes ou conclusões sérias."
      },
      {
        titulo: "Mude o tom",
        descricao: "Suba o tom para expressar entusiasmo ou perguntas, e baixe o tom para sentimentos solenes."
      },
      {
        titulo: "Combine com as palavras",
        descricao: "Fale de forma vibrante ao ler relatos alegres e mude para um tom afetuoso ao ler sobre consolo."
      }
    ]
  },
  {
    numero: 12,
    titulo: "Ênfase no assunto",
    objetivo: "Destaque o tema central do seu discurso por repetir e associar as ideias principais a ele.",
    resumoCurto: [
      "Mencione o tema principal",
      "Conecte cada parte",
      "Destaque frases corretas"
    ],
    comoFazer: [
      {
        titulo: "Diga o assunto claramente",
        descricao: "Durante a sua apresentação, use as palavras-chave do tema ou sinônimos claros."
      },
      {
        titulo: "Use tópicos de apoio",
        descricao: "Cada argumento ou passagem deve ser lido com a finalidade de provar e iluminar o tema principal."
      },
      {
        titulo: "Sublinhe conclusões temáticas",
        descricao: "Mostre com clareza como cada lição aprendida se conecta diretamente ao assunto de hoje."
      }
    ]
  },
  {
    numero: 13,
    titulo: "Aplicação prática clara",
    objetivo: "Aponte com clareza o valor prático daquilo que ensina e ajude os ouvintes a verem na prática o que fazer.",
    resumoCurto: [
      "Aponte o valor útil",
      "Responda ao 'porquê'",
      "Seja prático e direto"
    ],
    comoFazer: [
      {
        titulo: "Responda à pergunta oculta 'E daí?'",
        descricao: "Ajude as pessoas a entenderem como aplicar o ensinamento em sua rotina diária e moral."
      },
      {
        titulo: "Use exemplos de conduta",
        descricao: "Mostre o contraste real na vida de quem aplica tais conselhos no casamento, trabalho ou escola."
      },
      {
        titulo: "Dê opções realistas",
        descricao: "Sugira formas viáveis de aplicar a regra bíblica de acordo com a circunstância de cada ouvinte."
      }
    ]
  },
  {
    numero: 14,
    titulo: "Pausas para efeito",
    objetivo: "Use silêncio calculado antes e após pontos importantes, e de transição entre seções para melhor reflexão.",
    resumoCurto: [
      "Silencie para focar",
      "Permita reflexão profunda",
      "Transite com pausas"
    ],
    comoFazer: [
      {
        titulo: "Use uma pausa pontual",
        descricao: "Faça uma pausa logo antes de dar o clímax da sua conversa para elevar a expectativa."
      },
      {
        titulo: "Pausa após uma declaração",
        descricao: "Fique em silêncio por um breve instante depois de ler um texto profundo para a ideia assentar na mente."
      },
      {
        titulo: "Use para mudar de assunto",
        descricao: "Separe uma seção argumentativa da outra com uma pausa nítida, permitindo oxigenação do encadeamento mental."
      }
    ]
  },
  {
    numero: 15,
    titulo: "Ensino com convicção",
    objetivo: "Apresente as informações com entusiasmo e certeza incontestáveis, refletindo plena fé no tema.",
    resumoCurto: [
      "Seja firme e calmo",
      "Transmita plena certeza",
      "Demonstre fé absoluta"
    ],
    comoFazer: [
      {
        titulo: "Fale com vigor e entusiasmo",
        descricao: "Demonstre no olhar, movimentos e expressões faciais que você dá muito valor real a esses conselhos."
      },
      {
        titulo: "Evite termos de incertezas",
        descricao: "Use termos conclusivos em vez de expressões vagas como 'talvez seja assim' ou 'quem sabe se'."
      },
      {
        titulo: "Fale com base de verdade",
        descricao: "Compreenda bem as ideias estudadas de modo que o auditor sinta que suas afirmações são inabaláveis."
      }
    ]
  }
];
