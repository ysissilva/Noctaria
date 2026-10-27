/**
 * Interactive Puzzles & Minigames for NOCTÁRIA: A Academia das Mil Portas
 */

export const PUZZLES = {
  // --- FASE 2: ENIGMA DO MANUSCRITO RASGADO ---
  manuscript: {
    fragments: [
      { id: 'frag_b', order: 1, text: '...rasgue o véu das pedras com a palavra ancestral...' },
      { id: 'frag_a', order: 0, text: 'Quando as sombras cobrirem os olhos dos mundanos...' },
      { id: 'frag_c', order: 2, text: '...e o que foi apagado clamará em luz violeta: REVELARE.' }
    ],
    hint: 'Dica da Bibliotecária: O verso começa reconhecendo o ocultamento pelas sombras e culmina na palavra que rasga o véu.'
  },

  // --- FASE 3: RECEITA DA POÇÃO DA LEMBRANÇA ---
  alchemy: {
    correctOrder: ['lunar_dew', 'ash_root', 'night_phoenix', 'rune_ether'],
    ingredients: [
      { id: 'lunar_dew', name: 'Orvalho Lunar Destilado', desc: 'Gotas de orvalho colhidas sob a lua cheia nos jardins de Noctária.', color: '#5376c8' },
      { id: 'ash_root', name: 'Raiz de Mandrágora de Cinzas', desc: 'Raiz ancestral que ancora memórias fragmentadas à consciência.', color: '#b7b7c8' },
      { id: 'night_phoenix', name: 'Cinza de Fênix Noturna', desc: 'Cinza incandescente que reacende fagulhas do tempo pretérito.', color: '#a58ae8' },
      { id: 'rune_ether', name: 'Éter Rúnico Puro', desc: 'Solvente límpido que estabiliza elixires de transmutação psíquica.', color: '#4ef0c4' }
    ]
  },

  // --- FASE 5: ENIGMA DOS RETRATOS E DATAS ---
  portraits: {
    sequence: ['1842', '1899', '1923'],
    descriptions: {
      '1842': 'Fundação da Ala Oeste pelo Primeiro Arquivista Crowe.',
      '1899': 'O Grande Incêndio Rúnico e o primeiro selamento das Mil Portas.',
      '1923': 'O Conclave Secreto da Diretora Morgana Vale antes do isolamento definitivo.'
    }
  },

  // --- FASE 6: RESSONÂNCIA DAS 5 PORTAS DIMENSIONAIS ---
  galleryDoors: {
    correctDoor: 'stars',
    doors: [
      {
        id: 'mirror',
        name: 'Porta dos Espelhos',
        symbol: '🪞',
        sound: 'Um tilintar cristalino de vidro partido.',
        desc: 'Sua superfície reflete você de costas, caminhando para longe.',
        safe: false
      },
      {
        id: 'clock',
        name: 'Porta do Pêndulo',
        symbol: '⚙',
        sound: 'Engrenagens pesadas moendo segundos enferrujados.',
        desc: 'Marcada com engrenagens de bronze girando em sentido anti-horário.',
        safe: false
      },
      {
        id: 'stars',
        name: 'Porta das Estrelas (Entretempo)',
        symbol: '✦',
        sound: 'O ressoar mudo de um sino marcando treze badaladas cósmicas.',
        desc: 'A moldura irradia luminescência violeta com a constelação idêntica à carta sem remetente.',
        safe: true
      },
      {
        id: 'ashes',
        name: 'Porta das Cinzas',
        symbol: '♨',
        sound: 'O crepitar de brasas adormecidas sob cinzas frias.',
        desc: 'Poeira cinzenta escorre por baixo do batente de pedra.',
        safe: false
      },
      {
        id: 'thorns',
        name: 'Porta dos Espinhos',
        symbol: '⚔',
        sound: 'O sibilar de correntes de ferro farpado vibrando no vazio.',
        desc: 'Fechada com rosas de ferro pontiagudas forjadas na escuridão.',
        safe: false
      }
    ]
  },

  // --- FASE 8: O RITUAL DAS TREZE BADALADAS ---
  thirteenChimes: {
    correctSequence: [1, 3, 7, 13],
    clueRef: 'As quatro badaladas mestras mencionadas no Livro de Geometria Sagrada e no Relógio Astronômico: a primeira batida da criação (1), a trindade dos véus (3), as sete chaves antigas (7) e a décima terceira hora do portal (13).'
  }
};
