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
      "Deixe as pessoas interessadas",
      "Deixe claro o assunto",
      "Mostre a importância"
    ],
    comoFazer: [
      {
        titulo: "Deixe as pessoas interessadas",
        descricao: "Faça uma pergunta, use uma história do dia a dia, fale sobre uma notícia, sobre a previsão do tempo, e assim por diante. Dica: Ao se preparar, pense em assuntos que preocupam ou interessam às pessoas e fale sobre isso."
      },
      {
        titulo: "Deixe claro o assunto",
        descricao: "As pessoas precisam saber qual é o assunto e por que você está falando sobre ele."
      },
      {
        titulo: "Mostre por que o assunto é importante",
        descricao: "Fale sobre algo que vai ajudar as pessoas no dia a dia. Elas precisam ver como o assunto pode ser útil para elas. Dica: Quando estiver preparando um discurso, pense: 'Que problemas os irmãos da congregação estão enfrentando?' Daí, ajuste o começo do discurso de acordo com as necessidades dos irmãos."
      },
      {
        titulo: "Na pregação",
        descricao: "Para descobrir o assunto que a pessoa gosta de falar, seja observador e pergunte-se: 'O que ela está fazendo? Como é o lugar em que ela mora? Ela tem filhos?', e coisas assim. Comece a conversa falando um pouco sobre isso."
      }
    ]
  },
  {
    numero: 2,
    titulo: "Fale de coração",
    objetivo: "Fale de modo natural e de coração, mostrando que o assunto é importante e que você se importa com as pessoas.",
    resumoCurto: [
      "Ore e prepare-se bem",
      "Fale de coração",
      "Olhe para as pessoas"
    ],
    comoFazer: [
      {
        titulo: "Ore e se prepare bem",
        descricao: "Ore para se concentrar na mensagem e não nas palavras que você vai falar. Guarde na memória só os pontos principais. Fale do seu jeito; não decore frases e não fale como se estivesse lendo. Dica: Se você vai ler a Bíblia ou uma publicação, primeiro leia e entenda o assunto e daí treine a leitura. Isso vai ajudar você a ler de um modo natural. Ao ler a fala de uma pessoa, leia com sentimento, mas sem exageros."
      },
      {
        titulo: "Fale de coração",
        descricao: "Quando você se concentra na mensagem e em como ela vai ajudar as pessoas, seu modo de agir se torna mais natural. As pessoas ficam mais à vontade porque sentem que você está sendo sincero. Dica: Falar de modo natural não significa falar de qualquer jeito. Lembre da importância da mensagem e fale de forma correta e fácil de entender."
      },
      {
        titulo: "Olhe para as pessoas",
        descricao: "Quando estiver falando, olhe para a pessoa. Ao fazer um discurso, não dê uma olhada geral para assistência, mas olhe para uma pessoa por vez."
      }
    ]
  },
  {
    numero: 3,
    titulo: "Faça perguntas",
    objetivo: "De modo educado, use perguntas para deixar a pessoa curiosa, fazê-la pensar no assunto e chamar atenção para os pontos principais.",
    resumoCurto: [
      "Deixe as pessoas curiosas",
      "Ajude a raciocinar",
      "Destaque os pontos principais"
    ],
    comoFazer: [
      {
        titulo: "Deixe as pessoas curiosas",
        descricao: "Use perguntas que façam as pessoas pensar sobre o assunto e querer saber mais."
      },
      {
        titulo: "Ajude as pessoas a raciocinar",
        descricao: "Faça várias perguntas para ajudar as pessoas a acompanhar a sequência de ideias e a entender o assunto."
      },
      {
        titulo: "Chame atenção para os pontos principais",
        descricao: "Se você quer chamar atenção para um ponto, faça perguntas antes de falar sobre ele. Se você quer relembrar um ponto, faça perguntas depois de falar sobre ele ou no final da apresentação. Dica: Depois de ler um texto da Bíblia, use perguntas para destacar a ideia principal."
      },
      {
        titulo: "Na pregação",
        descricao: "Peça a opinião da pessoa sobre o assunto e preste atenção na resposta dela. Pense em quais perguntas você pode fazer e qual é a melhor hora para isso, para não deixar a pessoa sem graça."
      }
    ]
  },
  {
    numero: 4,
    titulo: "Prepare as pessoas para entender o texto",
    objetivo: "Deixe claro o motivo de você ler um texto.",
    resumoCurto: [
      "Pense no ponto a destacar",
      "Mostre o fundamento bíblico",
      "Deixe a pessoa curiosa"
    ],
    comoFazer: [
      {
        titulo: "Pense no ponto que você quer destacar",
        descricao: "Antes de ler um texto, pense no ponto principal dele e diga algo que chame a atenção das pessoas para essa parte. Dica: Se você quiser mencionar mais detalhes do texto, dê informações exatas. Por exemplo, pense: 'Quem escreveu esse livro? Quem disse essas palavras?'"
      },
      {
        titulo: "Mostre que tudo o que você diz vem da Bíblia",
        descricao: "Ao falar com pessoas que acreditam em Deus, ajude-as a ver o que a Bíblia diz sobre um assunto em vez de dar sua opinião pessoal."
      },
      {
        titulo: "Deixe a pessoa curiosa",
        descricao: "Faça uma pergunta e mostre como o texto responde a essa pergunta; fale de um problema e mostre como o texto ajuda a resolvê-lo; ou fale de um princípio e mostre como o texto ensina a aplicar esse princípio. Dica: Leve em conta o que as pessoas já sabem sobre o assunto ou sobre o texto bíblico. Você pode chamar atenção para um detalhe interessante mesmo que o texto seja bem conhecido."
      }
    ]
  },
  {
    numero: 5,
    titulo: "Leia de modo correto",
    objetivo: "Leia exatamente o que está escrito.",
    resumoCurto: [
      "Prepare-se bem",
      "Pronuncie corretamente",
      "Fale de modo claro"
    ],
    comoFazer: [
      {
        titulo: "Prepare-se bem",
        descricao: "Pense na intenção das palavras que você vai ler. Leia grupos de palavras em vez de ler palavra por palavra. Tome cuidado para não acrescentar, pular ou trocar palavras. Preste atenção nas vírgulas, pontos finais e pontos de interrogação. Dica: Peça para um amigo ouvir sua leitura e dizer quais palavras você leu errado."
      },
      {
        titulo: "Fale cada palavra de modo correto",
        descricao: "Se você não souber como ler uma palavra, escute o áudio da publicação ou peça a ajuda de um bom leitor."
      },
      {
        titulo: "Fale de modo claro",
        descricao: "Pronuncie bem cada palavra, mantendo a cabeça erguida e abrindo bem a boca. Fale cada sílaba. Dica: Leia as palavras do mesmo modo que você fala no dia a dia."
      }
    ]
  },
  {
    numero: 6,
    titulo: "Explique por que você leu o texto",
    objetivo: "Leia o texto e explique o que ele tem a ver com o ponto antes de ir para a próxima ideia.",
    resumoCurto: [
      "Destaque as palavras-chave",
      "Descreva a conexão lógica",
      "Explique de modo simples"
    ],
    comoFazer: [
      {
        titulo: "Destaque as palavras-chave que estão relacionadas com o ponto principal",
        descricao: "Você pode fazer isso por repetir as palavras principais do texto. Também pode fazer perguntas que ajudem as pessoas a perceber quais são essas palavras. Dica: Se você repetir a ideia do texto usando suas próprias palavras, tome cuidado para não fugir da ideia principal; as pessoas têm que perceber que você ainda está falando do texto."
      },
      {
        titulo: "Destaque o ponto que você quer que as pessoas se lembrem",
        descricao: "Explique o que as palavras principais do texto têm a ver com o ponto. Dica: Depois de ler o texto, deixe sua Bíblia aberta. Assim as pessoas vão ver que o que você está explicando está relacionado ao texto."
      },
      {
        titulo: "Explique de modo simples",
        descricao: "Não fique falando de detalhes que não têm a ver com o ponto principal. Para decidir que informações são necessárias, pense no que as pessoas já sabem sobre o assunto."
      }
    ]
  },
  {
    numero: 7,
    titulo: "Use informações verdadeiras",
    objetivo: "Use informações verdadeiras para ajudar as pessoas a chegar à conclusão correta.",
    resumoCurto: [
      "Use fontes confiáveis",
      "Não altere as informações",
      "Use para raciocinar"
    ],
    comoFazer: [
      {
        titulo: "Use fontes de informação confiáveis",
        descricao: "Baseie o que você fala na Palavra de Deus, lendo na própria Bíblia quando possível. Se você usar uma informação científica, uma notícia, uma história ou outra informação, verifique se ela é confiável e se está atualizada."
      },
      {
        titulo: "Não altere as informações",
        descricao: "Explique o texto de acordo com o que a Bíblia e as publicações do 'escravo fiel e prudente' dizem sobre o assunto. (Mateus capítulo 24 versículo 45) Ao usar informações de outras fontes, não mude o sentido do que está escrito. Dica: Tome cuidado para não exagerar fatos e dados. 'Algumas pessoas' é diferente de 'a maioria das pessoas'; 'em alguns casos' é diferente de 'sempre'; e 'isso pode acontecer' é diferente de 'isso vai acontecer'."
      },
      {
        titulo: "Use as informações para raciocinar com as pessoas",
        descricao: "Depois de ler um texto ou citar uma informação, faça perguntas, dê exemplos ou use ilustrações que ajudem as pessoas a tirar suas próprias conclusões."
      },
      {
        titulo: "Na pregação",
        descricao: "Em sua preparação, imagine perguntas que podem surgir na conversa e pesquise sobre isso. Se alguém fizer uma pergunta que você não sabe responder, diga que vai pesquisar o assunto e depois voltar com a resposta."
      }
    ]
  },
  {
    numero: 8,
    titulo: "Ensine com ilustrações",
    objetivo: "Use ilustrações simples e bem pensadas para tornar seu ensino mais interessante e explicar pontos importantes.",
    resumoCurto: [
      "Escolha ilustrações simples",
      "Pense nas pessoas",
      "Concentre-se no ponto principal"
    ],
    comoFazer: [
      {
        titulo: "Escolha ilustrações simples",
        descricao: "Faça como Jesus: use coisas simples para explicar coisas difíceis. Não complique as ilustrações com detalhes desnecessários. Pense: 'Essa ilustração combina mesmo com o ponto que eu quero ensinar?' Detalhes que não têm a ver com o ponto podem confundir as pessoas. Dica: Crie um arquivo de ilustrações. Para isso, olhe o mundo ao seu redor, estude nossas publicações e preste atenção em instrutores experientes. Daí, anote ilustrações que você achar interessantes."
      },
      {
        titulo: "Pense nas pessoas",
        descricao: "Escolha ilustrações que tenham a ver com as atividades e interesses das pessoas. Tome cuidado para que suas ilustrações não deixem ninguém constrangido ou ofendido."
      },
      {
        titulo: "Concentre-se no ponto principal",
        descricao: "Use ilustrações para ensinar os pontos importantes e não os detalhes. As pessoas devem se lembrar não só da ilustração, mas também do que você ensinou com aquela ilustração."
      }
    ]
  },
  {
    numero: 9,
    titulo: "Use desenhos, fotos e vídeos",
    objetivo: "Use desenhos, fotos e vídeos para ensinar pontos importantes de maneira clara e fácil de lembrar.",
    resumoCurto: [
      "Escolha bem as imagens",
      "Garante a visibilidade",
      "Na pregação"
    ],
    comoFazer: [
      {
        titulo: "Escolha bem as imagens que você vai usar",
        descricao: "Use fotos, gráficos, diagramas, mapas e linhas do tempo para destacar os pontos importantes, não os detalhes. Ajude as pessoas a lembrar não só da imagem, mas também do que você ensinou com aquela imagem."
      },
      {
        titulo: "Use uma imagem que todos consigam ver",
        descricao: "Por exemplo, se você for usar uma imagem na reunião, ela deve ser grande o bastante para que todos consigam enxergar. Dica: Verifique com antecedência se a foto ou o vídeo que você vai mostrar está pronto para ser usado."
      },
      {
        titulo: "Na pregação",
        descricao: "Mostre para a pessoa um desenho ou uma foto em uma publicação e pergunte o que ela está vendo. Faça perguntas para ajudar a pessoa a entender os pontos importantes da imagem. Quando mostrar um vídeo, vire a tela do seu aparelho para a pessoa. Em geral, você não precisa falar enquanto o vídeo está passando."
      }
    ]
  },
  {
    numero: 10,
    titulo: "Mude o volume, a emoção e o ritmo durante a apresentação",
    objetivo: "Use volume, emoção e ritmo variados para transmitir de modo claro as ideias e os sentimentos.",
    resumoCurto: [
      "Varie o volume",
      "Varie a emoção",
      "Varie o ritmo"
    ],
    comoFazer: [
      {
        titulo: "Varie o volume",
        descricao: "Fale mais alto para destacar pontos principais, motivar as pessoas ou ao ler um texto que contém uma mensagem de condenação. Fale mais baixo para criar expectativa ou expressar medo e ansiedade. Dica: Não fale tão alto a ponto de parecer que você está repreendendo as pessoas. Não exagere nos sentimentos para não acabar chamando atenção para si mesmo."
      },
      {
        titulo: "Varie a emoção",
        descricao: "Mude a emoção da sua voz de acordo com o sentimento que você quer transmitir como, por exemplo, alegria, ansiedade ou tristeza."
      },
      {
        titulo: "Varie o ritmo",
        descricao: "Fale mais rápido para expressar empolgação. Fale mais devagar quando quiser destacar pontos importantes. Dica: Não mude o ritmo ou o volume de repente para não dar um susto nas pessoas. Não fale rápido demais, senão as pessoas não vão entender o que você diz."
      }
    ]
  },
  {
    numero: 11,
    titulo: "Fale de modo animado",
    objetivo: "Fale de modo animado para que seu entusiasmo motive e contagie as pessoas.",
    resumoCurto: [
      "Empolgue-se com o assunto",
      "Pense no seu público",
      "Dê vida à sua apresentação"
    ],
    comoFazer: [
      {
        titulo: "Empolgue-se com o assunto",
        descricao: "Enquanto prepara sua apresentação, pense na importância da sua mensagem. Você deve conhecer tão bem a matéria a ponto de conseguir se expressar em suas próprias palavras."
      },
      {
        titulo: "Pense no seu público",
        descricao: "Pense em como o assunto vai ajudar as pessoas. Imagine o que você pode fazer para que elas se interessem pelo assunto."
      },
      {
        titulo: "Dê vida à sua apresentação",
        descricao: "Fale de modo animado. Seus gestos e expressões faciais têm que ser naturais e espontâneos. Dica: Ter mania de fazer os mesmos gestos distrai as pessoas; tome cuidado para isso não acontecer. Faça gestos que tenham a ver com o que você está falando. Fale de modo animado principalmente quando quiser ensinar pontos importantes e motivar quem estiver ouvindo. Mas não abuse; fazer isso o tempo todo vai cansar as pessoas."
      }
    ]
  },
  {
    numero: 12,
    titulo: "Seja simpático e mostre que se importa",
    objetivo: "Mostre às pessoas que você se interessa por elas e quer ajudá-las.",
    resumoCurto: [
      "Pense nas pessoas",
      "Pense no efeito de suas palavras",
      "Fale de modo bondoso"
    ],
    comoFazer: [
      {
        titulo: "Pense nas pessoas",
        descricao: "Coloque-se no lugar das pessoas; imagine os problemas que elas enfrentam e como elas se sentem."
      },
      {
        titulo: "Pense no efeito de suas palavras",
        descricao: "Procure encorajar, consolar e fortalecer as pessoas. Não fale coisas que podem ofender. Não critique as pessoas que não adoram a Jeová nem fale mal das crenças delas."
      },
      {
        titulo: "Fale de modo bondoso",
        descricao: "Mostre que se importa com as pessoas pelo modo como você fala e por seus gestos e expressões faciais. Não se esqueça de sorrir. Dica: Não exagere nas emoções. Quando estiver lendo, expresse os sentimentos indicados pela passagem, sem chamar atenção para si mesmo. Seja sempre educado e amoroso."
      }
    ]
  },
  {
    numero: 13,
    titulo: "Mostre como colocar o assunto em prática",
    objetivo: "Ajude as pessoas a perceber como o assunto é útil para elas e mostre como colocar em prática o que aprenderam.",
    resumoCurto: [
      "Pense no seu público",
      "Mostre às pessoas o que fazer",
      "Na pregação"
    ],
    comoFazer: [
      {
        titulo: "Pense no seu público",
        descricao: "Pergunte-se: 'Por que essas pessoas precisam saber isso? Que parte do assunto vai ser mais útil para elas?'"
      },
      {
        titulo: "Mostre às pessoas o que fazer",
        descricao: "Elas devem perceber desde o início da apresentação que aquela informação serve para elas. Dê exemplos específicos de como colocar em prática os pontos principais. Dica: Mostre de modo bondoso como aplicar os princípios bíblicos. Fortaleça a fé e o amor das pessoas em vez de fazê-las se sentir culpadas. Confie que elas vão querer fazer o que é certo."
      },
      {
        titulo: "Na pregação",
        descricao: "Ao se preparar para a pregação, pense em notícias e assuntos que interessam às pessoas e fale sobre esses assuntos. Na conversa, faça perguntas educadas para descobrir os interesses e as preocupações da pessoa. Daí, adapte o assunto da conversa de acordo com as respostas dela."
      }
    ]
  },
  {
    numero: 14,
    titulo: "Chame atenção para os pontos principais",
    objetivo: "Ajude as pessoas a acompanhar a sequência de ideias do seu discurso e mostre como cada ponto principal está ligado com o objetivo e o tema.",
    resumoCurto: [
      "Pense no seu objetivo",
      "Chame atenção para o tema",
      "Deixe claro quais são os pontos principais"
    ],
    comoFazer: [
      {
        titulo: "Pense no seu objetivo",
        descricao: "Você quer informar, convencer ou motivar as pessoas? Pense nisso ao montar seu discurso e veja se todos os pontos principais ajudam você a chegar a esse objetivo. Dica: Pense nas dúvidas que as pessoas podem ter sobre o assunto. Qual seria a primeira pergunta que alguém faria? E a segunda? E a terceira? Daí, organize seu discurso nessa ordem para que as pessoas possam acompanhar a linha de raciocínio, entender e concordar com o que você diz."
      },
      {
        titulo: "Chame atenção para o tema",
        descricao: "Durante o discurso, você pode fazer isso por repetir as palavras do tema ou usar outras palavras que tenham o mesmo significado."
      },
      {
        titulo: "Deixe claro quais são os pontos principais",
        descricao: "Escolha só os pontos principais que tenham a ver com o tema e que você possa apresentar dentro do tempo. Use poucos pontos principais. Fale sobre um ponto e faça uma breve pausa antes de passar para o ponto seguinte. Dica: Você pode dizer quais são os pontos principais no início do discurso. Isso vai ajudar as pessoas a acompanhar a sequência de ideias. Também pode repetir os pontos principais no final para ajudá-las a se lembrar deles."
      }
    ]
  },
  {
    numero: 15,
    titulo: "Fale com convicção",
    objetivo: "Mostre que você tem certeza de que o que está dizendo é a verdade e é importante.",
    resumoCurto: [
      "Prepare-se bem",
      "Escolha palavras com convicção",
      "Mostre que tem certeza"
    ],
    comoFazer: [
      {
        titulo: "Prepare-se bem",
        descricao: "Estude o assunto até que você entenda quais são as ideias principais e como os textos comprovam essas ideias. Fale os pontos principais de forma simples e usando poucas palavras. Pense in como a matéria vai ajudar as pessoas. Antes de se preparar, ore pedindo espírito santo. Dica: Para conseguir falar com convicção, treine sua apresentação em voz alta."
      },
      {
        titulo: "Escolha palavras que mostrem convicção",
        descricao: "Em vez de repetir o que está escrito, fale em suas próprias palavras. Pense: 'Que palavras eu usaria para convencer uma pessoa?'"
      },
      {
        titulo: "Mostre que tem certeza",
        descricao: "Se for necessário, fale um pouco mais alto. Olhe para as pessoas quando estiver falando. Dica: Cuidado para não parecer que é dono da verdade ou que está obrigando as pessoas a aceitar o que você diz. Sempre fale de modo bondoso."
      }
    ]
  },
  {
    numero: 16,
    titulo: "Concentre-se em coisas positivas",
    objetivo: "Concentre-se na solução, não no problema. Fale de coisas que encorajem as pessoas.",
    resumoCurto: [
      "Veja o lado bom das pessoas",
      "Não fale de coisas negativas",
      "Use a Palavra de Deus"
    ],
    comoFazer: [
      {
        titulo: "Veja o lado bom das pessoas",
        descricao: "Os irmãos querem agradar a Jeová. Concentre-se no que eles têm de bom e os elogie, mesmo nas vezes em que você precisar dar um conselho. Dica: Não fique irritado, mas fale de modo bondoso. Sorria; isso deixa as pessoas à vontade."
      },
      {
        titulo: "Não fique falando de coisas negativas",
        descricao: "Sua apresentação sempre deve ser positiva e despertar bons sentimentos nas pessoas. Só fale de coisas negativas quando for necessário ilustrar um ponto."
      },
      {
        titulo: "Use a Palavra de Deus",
        descricao: "Chame atenção para o que Jeová fez, está fazendo e vai fazer pela humanidade. Isso dá esperança e coragem para as pessoas."
      },
      {
        titulo: "Na pregação",
        descricao: "Encare as pessoas de modo positivo. Imagine cada pessoa como um futuro irmão."
      }
    ]
  },
  {
    numero: 17,
    titulo: "Fale de modo fácil de entender",
    objetivo: "Seja simples e fale de um modo que as pessoas entendam.",
    resumoCurto: [
      "Estude bem a matéria",
      "Use frases curtas e simples",
      "Explique palavras difíceis"
    ],
    comoFazer: [
      {
        titulo: "Estude bem a matéria",
        descricao: "Entenda bem o assunto para conseguir explicar nas suas próprias palavras e de um jeito simples."
      },
      {
        titulo: "Use frases curtas e simples",
        descricao: "Embora você possa usar frases longas, é melhor usar frases curtas para explicar os pontos principais. Dica: Não use detalhes desnecessários. Isso pode confundir e cansar as pessoas. Use a linguagem do dia a dia e vá direto ao ponto."
      },
      {
        titulo: "Explique palavras difíceis",
        descricao: "Evite usar palavras que as pessoas não conhecem. Se você precisar mencionar uma palavra, personagem da Bíblia, medida ou costume desconhecidos, explique."
      }
    ]
  },
  {
    numero: 18,
    titulo: "Use informações interessantes",
    objetivo: "Faça as pessoas pensar sobre o assunto usando informações interessantes para elas.",
    resumoCurto: [
      "Leve em conta o que sabem",
      "Pesquise e medite",
      "Mostre a importância do assunto"
    ],
    comoFazer: [
      {
        titulo: "Leve em conta o que as pessoas já sabem",
        descricao: "Em vez de repetir uma informação que elas já conhecem, você pode chamar atenção para um detalhe interessante. Dica: Gaste mais tempo para falar de ideias novas e menos tempo com ideias conhecidas."
      },
      {
        titulo: "Pesquise e medite",
        descricao: "Use informações novas ou notícias interessantes para ilustrar as ideias principais. Pense: 'O que as informações que eu pesquisei têm a ver com o assunto?' Dica: Para ajudar você na sua preparação, faça a si mesmo perguntas como: o quê? quem? onde? quando? por quê? e como?. Seu ensino vai ficar mais interessante se você fizer algumas dessas perguntas e respondê-las durante sua apresentação."
      },
      {
        titulo: "Mostre a importância do assunto",
        descricao: "Explique como os textos bíblicos podem ajudar as pessoas no dia a dia. Fale sobre situações, sentimentos e atitudes que têm a ver com a realidade delas."
      }
    ]
  },
  {
    numero: 19,
    titulo: "Toque o coração das pessoas",
    objetivo: "Ajude as pessoas a entender a importância do que aprenderam e a agir de acordo com isso.",
    resumoCurto: [
      "Ajude a pensar sobre si mesmas",
      "Ajude a ter motivação correta",
      "Deixe que Jeová seja o foco"
    ],
    comoFazer: [
      {
        titulo: "Ajude as pessoas a pensar sobre si mesmas",
        descricao: "Faça perguntas que as ajudem a analisar seus sentimentos."
      },
      {
        titulo: "Ajude as pessoas a ter a motivação correta",
        descricao: "Incentive as pessoas a pensar em por que elas fazem coisas boas. Ajude-as a fazer o que é certo pelos motivos certos: por amor a Jeová, às outras pessoas e à Bíblia. Raciocine com elas, em vez de repreendê-las. No final de sua apresentação, elas não devem se sentir envergonhadas, mas sim encorajas e dispostas a dar o seu melhor."
      },
      {
        titulo: "Deixe que Jeová seja o foco",
        descricao: "Ajude as pessoas a ver as qualidades e o amor de Jeová nos princípios, leis e ensinos da Bíblia. Incentive as pessoas a levar em conta os sentimentos de Jeová e a querer fazer o que agrada a ele. Dica: Lembre-se que é Jeová quem atrai as pessoas. Por isso, use a Bíblia para motivá-las."
      },
      {
        titulo: "Na pregação",
        descricao: "Faça perguntas para descobrir o que a pessoa acredita. Preste atenção nas expressões faciais e no tom de voz dela para saber o que ela sente. Mas vá com calma. Vai ser mais fácil a pessoa se abrir com você se primeiro você ganhar a confiança dela."
      }
    ]
  },
  {
    numero: 20,
    titulo: "Faça uma boa conclusão",
    objetivo: "Relembre as ideias principais e incentive as pessoas a colocar em prática o que aprenderam.",
    resumoCurto: [
      "Conclusão de acordo com o tema",
      "Dê um incentivo",
      "Conclusão simples e breve"
    ],
    comoFazer: [
      {
        titulo: "Faça sua conclusão de acordo com seu tema",
        descricao: "Relembre os pontos principais e o tema da apresentação."
      },
      {
        titulo: "Dê um incentivo",
        descricao: "Lembre às pessoas o que fazer e por que isso é bom para elas. Fale com convicção."
      },
      {
        titulo: "Faça uma conclusão simples e breve",
        descricao: "Essa não é hora de apresentar novas ideias. Termine a apresentação usando poucas palavras e motivando as pessoas a agir. Dica: Não termine sua apresentação correndo. Diga as últimas frases com volume apropriado e em tom de conclusão."
      },
      {
        titulo: "Na pregação",
        descricao: "No fim da apresentação, diga de novo o ponto que você quer que a pessoa lembre. Se alguma coisa interromper a conversa, fale algo positivo antes de ir embora. Mesmo se a pessoa for mal-educada, seja gentil; assim você pode manter as portas abertas."
      }
    ]
  }
];

export const LICOES_AME_PESSOAS_DATA: {
  brochuraId: string;
  numero: number;
  titulo: string;
  ordem: number;
  conteudo: { tipo: 'titulo' | 'paragrafo' | 'bullet' | 'dica' | 'pregacao'; texto: string }[];
}[] = [
  {
    brochuraId: "ame_pessoas",
    numero: 1,
    titulo: "Interesse pelas pessoas — 3. Seja flexível",
    ordem: 1,
    conteudo: [
      { tipo: "paragrafo", texto: "Ao iniciar uma conversa, não insista em falar sobre um assunto que você tinha em mente. Comece falando sobre algo que as pessoas estão comentando atualmente. Pergunte-se:" },
      { tipo: "bullet", texto: "a. 'O que está nas notícias?'" },
      { tipo: "bullet", texto: "b. 'Sobre o que os meus vizinhos, colegas de trabalho ou de escola estão falando?'" }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 2,
    titulo: "Interesse pelas pessoas — 4. Seja observador",
    ordem: 2,
    conteudo: [
      { tipo: "paragrafo", texto: "Pergunte-se:" },
      { tipo: "bullet", texto: "a. 'O que a pessoa está fazendo no momento? No que ela deve estar pensando?'" },
      { tipo: "bullet", texto: "b. 'O que a roupa, a aparência ou a casa da pessoa revelam sobre suas crenças e sua cultura?'" },
      { tipo: "bullet", texto: "c. 'Será que esse é um bom momento para conversar com a pessoa?'" }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 3,
    titulo: "Interesse pelas pessoas — 5. Escute",
    ordem: 3,
    conteudo: [
      { tipo: "bullet", texto: "a. Não fale demais." },
      { tipo: "bullet", texto: "b. Incentive a pessoa a se expressar. Quando for apropriado, faça perguntas." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 4,
    titulo: "Naturalidade — 3. Seja observador",
    ordem: 4,
    conteudo: [
      { tipo: "paragrafo", texto: "As expressões faciais e a linguagem corporal de uma pessoa podem dizer muito sobre ela. A pessoa parece estar disposta a falar com você? Se estiver, você pode começar a falar sobre a Bíblia simplesmente perguntando: \"Você sabia que ... ?\" Mas, se perceber que a pessoa não está com vontade de falar, não force a conversa." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 5,
    titulo: "Naturalidade — 4. Seja paciente",
    ordem: 5,
    conteudo: [
      { tipo: "paragrafo", texto: "Não fique pensando que você precisa falar logo sobre a Bíblia. Espere um bom momento para poder falar da mensagem da Bíblia naturalmente. Isso talvez signifique esperar até a próxima conversa com a pessoa." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 6,
    titulo: "Naturalidade — 5. Seja adaptável",
    ordem: 6,
    conteudo: [
      { tipo: "paragrafo", texto: "Pode ser que a pessoa comece a falar sobre coisas que você não estava esperando. Esteja disposto a compartilhar um ponto que seja importante para a pessoa, mesmo que você tenha que falar sobre algo diferente do que tinha planejado." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 7,
    titulo: "Bondade — 3. Tenha empatia",
    ordem: 7,
    conteudo: [
      { tipo: "paragrafo", texto: "Tente se colocar no lugar da pessoa e imaginar como ela se sente." },
      { tipo: "bullet", texto: "a. Pergunte-se: 'Que preocupações ela talvez tenha? O que ela acharia útil e interessante?' Pensar nisso vai ajudar você a mostrar bondade de forma natural e sincera." },
      { tipo: "bullet", texto: "b. Mostre que você se importa com a pessoa por ouvir o que ela tem a dizer. Se uma pessoa disser como se sente sobre algo ou mencionar um problema que esteja enfrentando, não mude de assunto." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 8,
    titulo: "Bondade — 4. Fale com bondade e respeito",
    ordem: 8,
    conteudo: [
      { tipo: "paragrafo", texto: "Quando você sente compaixão pela pessoa e realmente quer ajudá-la, isso fica claro no seu jeito de falar. É importante escolher bem as palavras e pensar no seu tom de voz. Além disso, evite dizer coisas que possam ofender." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 9,
    titulo: "Bondade — 5. Seja prestativo",
    ordem: 9,
    conteudo: [
      { tipo: "paragrafo", texto: "Usando de bom senso, veja se você pode ajudar a pessoa de formas práticas. Atos de bondade podem abrir as portas para uma conversa." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 10,
    titulo: "Humildade — 3. Não fale com ar de superioridade",
    ordem: 10,
    conteudo: [
      { tipo: "paragrafo", texto: "Não dê a impressão de que você sabe tudo e a outra pessoa não sabe nada. Fale com ela de modo respeitoso." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 11,
    titulo: "Humildade — 4. Deixe claro que aquilo que você ensina vem da Bíblia",
    ordem: 11,
    conteudo: [
      { tipo: "paragrafo", texto: "A Palavra de Deus traz pensamentos que podem tocar o coração das pessoas. Quando usamos a Bíblia, ajudamos a pessoa a tener a base correta para desenvolver sua fé." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 12,
    titulo: "Humildade — 5. Mantenha a calma",
    ordem: 12,
    conteudo: [
      { tipo: "paragrafo", texto: "Não insista em provar que está certo. Não queremos discutir. Mostre humildade, continue calmo e saiba a hora de ir embora. (Provérbios capítulo 17 versículo 14; Tito capítulo 3 versículo 2) Se você falar com brandura, talvez deixe as portas abertas para uma boa conversa em outra ocasião." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 13,
    titulo: "Tato — 3. Escolha bem as palavras",
    ordem: 13,
    conteudo: [
      { tipo: "paragrafo", texto: "Por exemplo, ao conversar com alguém de uma religião não cristã, você talvez precise ajustar o modo de falar sobre a Bíblia ou de se referir a Jesus." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 14,
    titulo: "Tato — 4. Não corrija logo a pessoa",
    ordem: 14,
    conteudo: [
      { tipo: "paragrafo", texto: "Deixe a pessoa à vontade para se expressar. Se ela disser algo que vá contra o que a Bíblia ensina, resista à tentação de discutir. (Tiago capítulo 1 versículo 19) Quando escuta a pessoa, você consegue entender melhor o ponto de vista dela. - Provérbios capítulo 20 versículo 5." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 15,
    titulo: "Tato — 5. Sempre que possível, concorde com a pessoa e dê elogios",
    ordem: 15,
    conteudo: [
      { tipo: "paragrafo", texto: "Ela talvez acredite sinceramente que suas crenças religiosas estão corretas. Tente primeiro falar sobre algo que vocês concordam. Daí, aos poucos, ajude a pessoa a entender o que a Bíblia ensina." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 16,
    titulo: "Coragem — 3. Confie em Jeová",
    ordem: 16,
    conteudo: [
      { tipo: "paragrafo", texto: "Foi o espírito de Deus que deu poder para Jesus pregar, e esse espírito também pode ajudar você. (Mateus capítulo 10 versículos 19,20; Lucas capítulo 4 versículo 18) Se sentir medo de pregar para alguém, peça que Jeová lhe dê coragem. - Atos capítulo 4 versículo 29." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 17,
    titulo: "Coragem — 4. Não julgue as pessoas",
    ordem: 17,
    conteudo: [
      { tipo: "paragrafo", texto: "Talvez fiquemos com receio de falar com algumas pessoas por causa da sua aparência, condição econômica ou social, estilo de vida ou crenças religiosas. Mas lembre-se:" },
      { tipo: "bullet", texto: "a. Jeová e Jesus podem ler corações, nós não." },
      { tipo: "bullet", texto: "b. Ninguém está fora do alcance da misericórdia de Jeová." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 18,
    titulo: "Coragem — 5. Seja corajoso, mas tenha tato e cautela",
    ordem: 18,
    conteudo: [
      { tipo: "paragrafo", texto: "(Mateus capítulo 10 versículo 16) Não entre em discussões. Se a pessoa não quiser ouvir as boas novas ou se você sentir que a situação não é segura, encerre a conversa de modo educado. - Provérbios capítulo 17 versículo 14." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 19,
    titulo: "Perseverança — 3. Ajuste a sua programação",
    ordem: 19,
    conteudo: [
      { tipo: "paragrafo", texto: "Ajuste a sua programação para visitar a pessoa num horário que seja bom para ela. Pergunte-se: 'Quando é mais provável que eu encontre a pessoa? Quando e onde vai ser mais fácil para ela conversar comigo?' Mesmo que o horário não seja bom para você, esteja disposto a visitar a pessoa." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 20,
    titulo: "Perseverança — 4. Marque a próxima conversa",
    ordem: 20,
    conteudo: [
      { tipo: "paragrafo", texto: "No final de cada conversa, tente marcar um horário específico para vocês continuarem o assunto. Faça o possível para cumprir o que foi combinado." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 21,
    titulo: "Perseverança — 5. Não perca a esperança",
    ordem: 21,
    conteudo: [
      { tipo: "paragrafo", texto: "Não pense que a pessoa não está interessada só porque é difícil encontrá-la em casa ou porque ela está sempre ocupada. (Primeira Coríntios capítulo 13 versículo 4,7) Ao mesmo tempo, tenha equilíbrio. Continue perseverando, mas tente usar o tempo de modo sábio. - Primeira Coríntios capítulo 9 versículo 26." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 22,
    titulo: "Paciência — 3. Tente usar um método diferente",
    ordem: 22,
    conteudo: [
      { tipo: "paragrafo", texto: "Se a pessoa não aceitar logo um estudo bíblico, não a pressione. Quando for apropriado, use vídeos ou artigos para ajudá-la a entender como funciona um estudo bíblico e como ele seria bom para ela." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 23,
    titulo: "Paciência — 4. Não faça comparações",
    ordem: 23,
    conteudo: [
      { tipo: "paragrafo", texto: "Cada pessoa é diferente. Se um parente ou uma pessoa que você está revisitando não quer aceitar um estudo da Bíblia ou um ensinamento bíblico, tente entender qual pode ser o motivo. Será que a pessoa tem um apego emocional com algum ensinamento da religião dela? Ela está enfrentando pressão de parentes ou de vizinhos? Dê tempo para a pessoa pensar no que você falou e reconhecer o valor do que a Bíblia ensina." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 24,
    titulo: "Paciência — 5. Ore pela pessoa interessada",
    ordem: 24,
    conteudo: [
      { tipo: "paragrafo", texto: "Peça que Jeová ajude você a continuar positivo e respeitoso. Ore pedindo discernimento para saber quando deve parar de visitar uma pessoa que mostra pouco interesse. - Primeira Coríntios capítulo 9 versículo 26." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 25,
    titulo: "Empatia — 3. Escute com atenção",
    ordem: 25,
    conteudo: [
      { tipo: "paragrafo", texto: "Deixe que a pessoa se expresse. Não a interrompa nem ignore seus sentimentos, preocupações ou objeções. Quando você presta atenção, a pessoa percebe que você se importa com o que ela pensa." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 26,
    titulo: "Empatia — 4. Pense na pessoa interessada",
    ordem: 26,
    conteudo: [
      { tipo: "paragrafo", texto: "Lembrando das conversas que teve com ela, pergunte-se:" },
      { tipo: "bullet", texto: "a. 'Por que ela precisa ouvir as boas novas?'" },
      { tipo: "bullet", texto: "b. 'Como o estudo da Bíblia pode melhorar a vida dela agora e no futuro?'" }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 27,
    titulo: "Empatia — 5. Use informações que se encaixem nas necessidades da pessoa",
    ordem: 27,
    conteudo: [
      { tipo: "paragrafo", texto: "Use informações que se encaixem nas necessidades da pessoa. Assim que possível, mostre como o estudo da Bíblia pode responder às perguntas dela e ajudá-la a ter uma vida melhor." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 28,
    titulo: "Senso de compromisso — 3. Faça o estudo na hora e local ideal",
    ordem: 28,
    conteudo: [
      { tipo: "paragrafo", texto: "Faça o estudo na hora e no local que seja bom para o estudante. Ele talvez prefira estudar num dia ou num horário específico. Onde ele se sentiria mais à vontade para estudar: no trabalho, em casa ou em um lugar público? Dentro do possível, ajuste a sua programação para se adaptar às necessidades do estudante." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 29,
    titulo: "Senso de compromisso — 4. Estude regularmente",
    ordem: 29,
    conteudo: [
      { tipo: "paragrafo", texto: "Se você vai estar fora, não cancele o estudo. Em vez disso, pense:" },
      { tipo: "bullet", texto: "a. Será que você poderia dirigir o estudo em outro dia naquela semana?" },
      { tipo: "bullet", texto: "b. Será que você poderia fazer o estudo por telefone ou por videoconferência?" },
      { tipo: "bullet", texto: "c. Será que você poderia pedir para outro publicador dirigir o estudo?" }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 30,
    titulo: "Senso de compromisso — 5. Ore pela atitude certa",
    ordem: 30,
    conteudo: [
      { tipo: "paragrafo", texto: "Ore pedindo para ter a atitude certa. Peça que Jeová ajude você a não desistir de seu estudante, mesmo que ele não estude regularmente ou demore para colocar em prática o que aprende. (Filipenses capítulo 2 versículo 13) É bem provável que seu estudante tenha muitas qualidades. Ore pedindo ajuda para se concentrar nelas." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 31,
    titulo: "Simplicidade — 3. Não fale demais",
    ordem: 31,
    conteudo: [
      { tipo: "paragrafo", texto: "Em vez de falar tudo o que você sabe sobre um assunto, concentre-se na matéria que está na publicação de estudo. Depois de fazer uma pergunta, seja paciente e espere seu estudante responder. Se ele não souber a resposta ou disser algo contrário ao que a Bíblia ensina, faça perguntas adicionais para ajudá-lo a raciocinar sobre o assunto. Quando o estudante entender a ideia principal, passe para o próximo ponto." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 32,
    titulo: "Simplicidade — 4. Faça a ligação lógica",
    ordem: 32,
    conteudo: [
      { tipo: "paragrafo", texto: "Ajude seu estudante a fazer a ligação entre o que ele já aprendeu e o que se está aprendendo agora. Por exemplo, antes de começar a lição sobre a ressurreição, você pode recapitular brevemente o que o estudante já aprendeu sobre a condição dos mortos." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 33,
    titulo: "Simplicidade — 5. Saiba usar as ilustrações",
    ordem: 33,
    conteudo: [
      { tipo: "paragrafo", texto: "Antes de usar uma ilustração, pergunte-se:" },
      { tipo: "bullet", texto: "a. 'A ilustração é simples?'" },
      { tipo: "bullet", texto: "b. 'O meu estudante vai conseguir entendê-la facilmente?'" },
      { tipo: "bullet", texto: "c. 'Ela vai ajudar meu estudante a se lembrar do ponto principal? Ou ele vai se lembrar apenas da ilustração?'" }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 34,
    titulo: "Franqueza — 3. Ajude a alcançar alvos",
    ordem: 34,
    conteudo: [
      { tipo: "bullet", texto: "a. Use o quadro 'Tente o Seguinte' que aparece em cada lição de Seja Feliz para Sempre!." },
      { tipo: "bullet", texto: "b. Ajude seu estudante a identificar que passos ele precisa dar para alcançar alvos de curto e longo prazo." },
      { tipo: "bullet", texto: "c. Sempre elogie seu estudante pelo progresso que ele faz." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 35,
    titulo: "Franqueza — 4. Identifique desafios",
    ordem: 35,
    conteudo: [
      { tipo: "paragrafo", texto: "Identifique o que pode estar impedindo seu estudante de fazer progresso e tente ajudá-lo a vencer esses desafios. Pergunte-se:" },
      { tipo: "bullet", texto: "'O que pode estar impedindo meu estudante de progredir até o batismo?'" },
      { tipo: "bullet", texto: "'O que eu posso fazer para ajudá-lo?'" },
      { tipo: "paragrafo", texto: "Peça a Jeová a coragem para ser franco e amoroso ao falar com seu estudante sobre o que ele precisa fazer." }
    ]
  },
  {
    brochuraId: "ame_pessoas",
    numero: 36,
    titulo: "Franqueza — 5. Encerre estudos sem progresso",
    ordem: 36,
    conteudo: [
      { tipo: "paragrafo", texto: "Para saber se seu estudo bíblico é progressivo, pergunte-se:" },
      { tipo: "bullet", texto: "'Meu estudante está colocando em prática o que aprende?'" },
      { tipo: "bullet", texto: "'Ele assiste às reuniões e fala da verdade com outros?'" },
      { tipo: "bullet", texto: "'Depois de ter estudado a Bíblia por algum tempo, será que ele quer ser uma Testemunha de Jeová?'" },
      { tipo: "paragrafo", texto: "Se um estudante da Bíblia não dá sinais de que quer progredir:" },
      { tipo: "bullet", texto: "Peça que ele pense sobre o que pode estar impedindo o progresso dele." },
      { tipo: "bullet", texto: "Explique bondosamente por que você está encerrando o estudo." },
      { tipo: "bullet", texto: "Diga que coisas ele precisa fazer se quiser voltar a estudar no futuro." }
    ]
  }
];
