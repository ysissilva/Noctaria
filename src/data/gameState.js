/**
 * Game Data Structures & State for NOCTÁRIA: A Academia das Mil Portas
 * Supports full narrative progression across Prologue, 8 Phases, and Epilogue.
 */

export const CHARACTERS = {
  elias: {
    id: 'elias',
    name: 'Elias Crowe',
    title: 'Estudante da Noite',
    role: 'Estudante veterano e guardião familiar',
    description: 'Sarcástico, perspicaz e cauteloso. Possui cabelo preto rebelde e olhar intenso. Sua linhagem guardava uma das antigas Chaves das Mil Portas.',
    portraitIcon: 'crow',
    image: '/assets/images/characters/elias_crowe.jpg',
    avatarSvg: `<img src="/assets/images/characters/elias_crowe.jpg" alt="Elias Crowe" class="portrait-art">`
  },
  morgana: {
    id: 'morgana',
    name: 'Morgana Vale',
    title: 'Diretora da Academia',
    role: 'Diretora e Grã-Mestra de Noctária',
    description: 'Elegante, solene e misteriosa. Carrega chaves de prata e acredita que o sacrifício de memórias é o único escudo contra o Vazio Cósmico.',
    portraitIcon: 'key',
    image: '/assets/images/characters/morgana_vale.jpg',
    avatarSvg: `<img src="/assets/images/characters/morgana_vale.jpg" alt="Morgana Vale" class="portrait-art">`
  },
  octavian: {
    id: 'octavian',
    name: 'Prof. Octavian Wren',
    title: 'Curador dos Arquivos & Alquimia',
    role: 'Mestre Historiador e Pesquisador de Lembranças',
    description: 'Sábio solene de olhar perspicaz. Especialista em alquimia e memórias, dividido entre ajudar o protagonista e proteger seus próprios segredos.',
    portraitIcon: 'book',
    image: '/assets/images/characters/octavian_wren.jpg',
    avatarSvg: `<img src="/assets/images/characters/octavian_wren.jpg" alt="Prof. Octavian Wren" class="portrait-art">`
  },
  celeste: {
    id: 'celeste',
    name: 'Celeste Veyra',
    title: 'Alquimista das Sombras',
    role: 'Estudante de Essências e Selos Arcanos',
    description: 'Curiosa, destemida e genial na manipulação de caldeirões. Auxilia na decodificação de anomalias dimensionais e no refino de elixires.',
    portraitIcon: 'flask',
    image: '/assets/images/characters/celeste_veyra.jpg',
    avatarSvg: `<img src="/assets/images/characters/celeste_veyra.jpg" alt="Celeste Veyra" class="portrait-art">`
  },
  seraphine: {
    id: 'seraphine',
    name: 'Seraphine Ashford',
    title: 'A Estudante Apagada',
    role: 'Pesquisadora brilhante presa no Entretempo',
    description: 'Curiosa, determinada e brilhante. Descobriu a verdade sobre o ritual das 13 badaladas e deixou pistas antes de ser banida para o tempo congelado.',
    portraitIcon: 'ghost',
    image: '/assets/images/characters/seraphine_ashford.jpg',
    avatarSvg: `<img src="/assets/images/characters/seraphine_ashford.jpg" alt="Seraphine Ashford" class="portrait-art">`
  },
  vespera: {
    id: 'vespera',
    name: 'Madam Vespera',
    title: 'A Bibliotecária Velada',
    role: 'Guardiã dos Manuscritos Proibidos',
    description: 'Figura serena de olhos vendados por seda rúnica. Conhece cada tomo vivo e guarda os segredos contidos nos arquivos proibidos.',
    portraitIcon: 'scroll',
    image: '/assets/images/characters/madam_vespera.jpg',
    avatarSvg: `<img src="/assets/images/characters/madam_vespera.jpg" alt="Madam Vespera" class="portrait-art">`
  }
};

export const SPELLS_DATABASE = {
  revelare: {
    id: 'revelare',
    name: 'REVELARE',
    color: '#A58AE8',
    description: 'Feitiço de clarividência. Rasga o véu arcano para revelar inscrições ocultas, objetos invisíveis e portas seladas.',
    icon: '✦',
    unlockedAtPhase: 'phase_2'
  },
  apertura: {
    id: 'apertura',
    name: 'APERTURA',
    color: '#B7B7C8',
    description: 'Encantamento ancestral de destrancamento rúnico. Ativa mecanismos mágicos e chaves dimensionais.',
    icon: '🗝',
    unlockedAtPhase: 'phase_4'
  },
  memoria: {
    id: 'memoria',
    name: 'MEMORIA',
    color: '#5376C8',
    description: 'Resgata fragmentos de memórias, ecos congelados no tempo e reconstrói eventos passados.',
    icon: '🕮',
    unlockedAtPhase: 'phase_6'
  }
};

export const PHASES_CONFIG = {
  prologue: {
    id: 'prologue',
    number: 0,
    title: 'Prólogo — A Carta sem Remetente',
    scene: 'courtyard',
    locationName: 'Pátio dos Portões da Noite',
    description: 'Uma carta sem remetente traz o protagonista à monumental Academia de Noctária.'
  },
  phase_1: {
    id: 'phase_1',
    number: 1,
    title: 'Fase 1 — O Nome que Não Existe',
    scene: 'ashes_hall',
    locationName: 'Salão das Cinzas • Ala Central',
    description: 'Seraphine Ashford foi apagada dos registros da academia. Investigue o mural e o retrato adulterado.'
  },
  phase_2: {
    id: 'phase_2',
    number: 2,
    title: 'Fase 2 — A Biblioteca Velada',
    scene: 'library',
    locationName: 'A Biblioteca Velada • Arquivo Restrito',
    description: 'Decifre manuscritos com símbolos arcanos mutáveis para descobrir o primeiro feitiço: Revelare.'
  },
  phase_3: {
    id: 'phase_3',
    number: 3,
    title: 'Fase 3 — A Poção da Lembrança',
    scene: 'alchemy_lab',
    locationName: 'Laboratório de Alquimia das Sombras',
    description: 'Ajude o Prof. Octavian a colher ingredientes e destilar a poção capaz de quebrar o esquecimento.'
  },
  phase_4: {
    id: 'phase_4',
    number: 4,
    title: 'Fase 4 — O Segredo de Elias',
    scene: 'dormitory',
    locationName: 'Dormitório da Noite & Pátio Interno',
    description: 'Descubra a verdade sobre a linhagem de Elias Crowe e obtenha a Primeira Chave Dimensional.'
  },
  phase_5: {
    id: 'phase_5',
    number: 5,
    title: 'Fase 5 — A Ala Lacrada',
    scene: 'sealed_wing',
    locationName: 'A Ala Lacrada • Mansão Primitiva',
    description: 'Desarme armadilhas rúnicas, ordene os retratos cronológicos e recupere o segundo fragmento de chave.'
  },
  phase_6: {
    id: 'phase_6',
    number: 6,
    title: 'Fase 6 — A Galeria das Mil Portas',
    scene: 'gallery_doors',
    locationName: 'A Galeria Impossível das Mil Portas',
    description: 'Examine cinco portais dimensionais e encontre a passagem estelar para o reino do Entretempo.'
  },
  phase_7: {
    id: 'phase_7',
    number: 7,
    title: 'Fase 7 — O Reino Onde o Tempo Parou',
    scene: 'timeless_realm',
    locationName: 'Dimensão do Entretempo • Ecos Congelados',
    description: 'Reconstrua as 3 memórias com o feitiço Memoria e resgate Seraphine antes do colapso temporal.'
  },
  phase_8: {
    id: 'phase_8',
    number: 8,
    title: 'Fase 8 — O Ritual das Treze Badaladas',
    scene: 'central_chamber',
    locationName: 'Câmara Central Subterrânea • Altar Cósmico',
    description: 'Confronte a Diretora Morgana Vale, alinhe os 13 pêndulos e decida o destino final de Noctária.'
  },
  epilogue: {
    id: 'epilogue',
    number: 9,
    title: 'Epílogo — O Outro Lado',
    scene: 'epilogue_room',
    locationName: 'Aposentos do Protagonista • Madrugada',
    description: 'A calmaria após a tempestade traz uma nova carta inexplicável e uma chave para o além.'
  }
};

export const INITIAL_STATE = {
  version: '2.0.0',
  currentChapter: 'prologue', // 'prologue' | 'phase_1' .. 'phase_8' | 'epilogue'
  currentScene: 'courtyard',
  unlockedScenes: ['courtyard'],
  player: {
    name: 'Iniciado',
    inventory: [
      {
        id: 'initial_letter',
        name: 'Carta com Símbolo de Estrelas',
        icon: '✉',
        description: 'Um convite sem remetente impresso em pergaminho azul-escuro com o símbolo de uma porta cercada por treze estrelas.'
      }
    ],
    spells: [], // Unlocked progressively: 'revelare', 'apertura', 'memoria'
    clues: [
      {
        id: 'clue_invitation',
        title: 'O Convite Sem Nome',
        description: 'A carta convidando você para Noctária trazia apenas um brasão: uma porta entre estrelas e treze pontos cardeais.',
        location: 'Portões da Noite',
        date: 'Prólogo'
      }
    ],
    relationships: {
      elias: 0,
      morgana: 0,
      octavian: 0,
      celeste: 0,
      seraphine: 0,
      vespera: 0
    },
    choices: {
      eliasTrust: 'none', // 'trusted' | 'confronted'
      potionDrinker: 'none', // 'self' | 'elias'
      endingChosen: 'none' // 'sealed' | 'guardian' | 'forbidden'
    },
    flags: {
      // Prologue
      courtyardEliasMet: false,
      staircaseLetterExamined: false,
      prologueChimeRang: false,
      phantomDoorVanished: false,
      prologueCompleted: false,

      // Phase 1
      phase1TalkedElias: false,
      noticeBoardExamined: false,
      erasedPhotoExamined: false,
      alteredLedgerExamined: false,
      seraphineNameDiscovered: false,
      phase1Completed: false,

      // Phase 2
      vesperaTalked: false,
      fragment1Found: false,
      fragment2Found: false,
      fragment3Found: false,
      manuscriptPuzzleSolved: false,
      revelareLearned: false,
      phase2Completed: false,

      // Phase 3
      octavianTalked: false,
      celesteTalked: false,
      ingredientLunarDew: false,
      ingredientAshRoot: false,
      ingredientNightPhoenix: false,
      ingredientEther: false,
      potionBrewed: false,
      potionAdministered: false,
      memoryVisionSeen: false,
      phase3Completed: false,

      // Phase 4
      dormitoryKeyFound: false,
      eliasDiaryRead: false,
      eliasConfrontationDone: false,
      croweSecretRevealed: false,
      firstDimensionalKeyObtained: false,
      aperturaLearned: false,
      phase4Completed: false,

      // Phase 5
      sealedWingPassageFound: false,
      wallRunesRevealed: false,
      portraitPuzzleSolved: false,
      trapDisarmed: false,
      memoryRecordingSeen: false,
      secondKeyFragmentObtained: false,
      phase5Completed: false,

      // Phase 6
      examinedDoorsCount: 0,
      doorsExamined: {
        mirror: false,
        clock: false,
        stars: false,
        ashes: false,
        thorns: false
      },
      seraphinePendantFound: false,
      correctStarDoorOpened: false,
      phase6Completed: false,

      // Phase 7
      timelessEcho1Reconstructed: false,
      timelessEcho2Reconstructed: false,
      timelessEcho3Reconstructed: false,
      seraphineRescued: false,
      ritualTruthRevealed: false,
      phase7Completed: false,

      // Phase 8
      centralKeysPlaced: false,
      morganaConfronted: false,
      thirteenChimesSolved: false,
      endingReached: false,
      phase8Completed: false,

      // Epilogue
      epilogueLetterRead: false,
      epilogueKeyExamined: false
    }
  },
  activeQuest: {
    id: 'quest_prologue',
    name: 'Prólogo — A Carta sem Remetente',
    description: 'Explore a chegada a Noctária, converse com Elias Crowe e investigue a escadaria do saguão.',
    currentStep: 0,
    steps: [
      { text: 'Converse com Elias Crowe diante dos portões da academia.', completed: false },
      { text: 'Examine a carta misteriosa caída perto da escadaria.', completed: false },
      { text: 'Registre o primeiro indício no seu diário de bordo.', completed: false },
      { text: 'Presencie o sino soar treze vezes e a aparição da porta fantasma.', completed: false }
    ],
    status: 'active'
  },
  completedQuests: [],
  settings: {
    musicVolume: 70,
    sfxVolume: 80,
    reducedMotion: false,
    textSpeed: 'normal'
  }
};
