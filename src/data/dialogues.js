/**
 * Comprehensive Dialogue Trees for NOCTÁRIA: A Academia das Mil Portas
 * Covers Prologue, Phases 1 to 8, and Epilogue with branching choices and narrative consequences.
 */

export const DIALOGUES = {
  // =========================================================================
  // PRÓLOGO — A CARTA SEM REMETENTE
  // =========================================================================
  elias_arrival: {
    characterId: 'elias',
    nodes: {
      start: {
        text: 'Você... é o novo convocado? Estranho. Eu sinto como se já tivesse visto o formato dos seus passos antes, embora saiba com certeza que nunca nos cruzamos. Os portões de Noctária não costumam se abrir para qualquer um.',
        options: [
          {
            text: 'Recebi uma carta com o selo de uma porta e treze estrelas.',
            nextNode: 'knows_letter',
            effect: (state) => {
              state.player.relationships.elias += 1;
            }
          },
          {
            text: 'Como assim você sente que já me viu? Que lugar é esse?',
            nextNode: 'suspicious_welcome',
            effect: (state) => {
              // Neutral
            }
          },
          {
            text: 'Prefiro guardar minhas respostas para mim.',
            nextNode: 'guarded_welcome',
            effect: (state) => {
              state.player.relationships.elias -= 1;
            }
          }
        ]
      },
      knows_letter: {
        text: 'Treze estrelas... Há anos esse selo não via a luz do dia. Guarde bem essa carta e não a mostre à Diretora Morgana. Os corredores aqui são escuros, os vitrais guardam olhos e as portas... bem, algumas portas têm vontade própria.',
        options: [
          {
            text: 'Por onde devo começar a exploração?',
            nextNode: 'guide_hall'
          }
        ]
      },
      suspicious_welcome: {
        text: 'Noctária é a academia onde as artes esquecidas são estudadas. Ou onde são enterradas para que ninguém mais as encontre. Venha, a escadaria principal leva ao Salão das Cinzas.',
        options: [
          {
            text: 'Vou até a escadaria.',
            nextNode: 'guide_hall'
          }
        ]
      },
      guarded_welcome: {
        text: 'Cautela é uma virtude rara por aqui. A maioria chega deslumbrada pelas torres e acaba perdendo a voz nos arquivos. Vá até a escadaria do saguão.',
        options: [
          {
            text: 'Seguir para a escadaria.',
            nextNode: 'guide_hall'
          }
        ]
      },
      guide_hall: {
        text: 'Fique atento ao som das correntes e ao chão de pedra. Há algo caído perto da escadaria que parece não pertencer aos alunos comuns.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.courtyardEliasMet = true;
          game.updateQuestStep(0);
          game.showNotification('Objetivo atualizado: Examine a escadaria do saguão.', 'quest');
        }
      }
    }
  },

  // =========================================================================
  // FASE 1 — O NOME QUE NÃO EXISTE
  // =========================================================================
  elias_phase1: {
    characterId: 'elias',
    nodes: {
      start: {
        text: 'Você encontrou aquela fotografia no mural, não foi? Vi você encarando a tela como se tentasse lembrar de algo arrancado da sua mente.',
        options: [
          {
            text: 'Por que o rosto dessa estudante foi raspado com uma navalha?',
            nextNode: 'erased_explanation'
          },
          {
            text: 'O registro do livro de matrículas pula diretamente da página 41 para a 43.',
            nextNode: 'ledger_clue',
            condition: (state) => state.player.flags.alteredLedgerExamined
          },
          {
            text: 'Você sabe quem era Seraphine Ashford?',
            nextNode: 'seraphine_whisper',
            condition: (state) => state.player.flags.seraphineNameDiscovered
          }
        ]
      },
      erased_explanation: {
        text: 'Quando Noctária decide que alguém nunca existiu, eles não se limitam a expulsar a pessoa. Eles raspam os nomes das pedras, os rostos das telas a óleo e as páginas dos anais.',
        options: [
          {
            text: 'E os alunos simplesmente esquecem?',
            nextNode: 'memory_drain'
          }
        ]
      },
      ledger_clue: {
        text: 'A página 42 continha a matrícula da turma de três anos atrás. Ela investigava a mesma coisa que você: a porta que surge durante a 13ª badalada.',
        options: [
          {
            text: 'Como descubro o nome completo dela?',
            nextNode: 'mural_hint'
          }
        ]
      },
      mural_hint: {
        text: 'Verifique o aviso de honra estudantil atrás do vitral do Salão. Nem todas as cinzas conseguem apagar a tinta prateada antiga.',
        options: [
          {
            text: 'Vou investigar o vitral e o mural imediatamente.',
            nextNode: 'end_hint'
          }
        ]
      },
      memory_drain: {
        text: 'Eles não esquecem por vontade própria. Algo nesta academia se alimenta das memórias. Se você continuar cavando, certifique-se de manter seu diário bem escondido.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.phase1TalkedElias = true;
        }
      },
      seraphine_whisper: {
        text: 'Não pronuncie esse nome tão alto perto dos bustos dos fundadores! Sim... Seraphine Ashford. A aluna mais brilhante do departamento de translocação. Ela deixou uma mensagem em código antes de desaparecer: "Ela não atravessou a porta sozinha."',
        options: [
          {
            text: 'Onde encontro os registros restantes da pesquisa dela?',
            nextNode: 'library_unlocked'
          }
        ]
      },
      library_unlocked: {
        text: 'A passagem leste leva à Biblioteca Velada. A Bibliotecária Madam Vespera não responde a curiosos, mas se você mencionar o símbolo das treze estrelas, ela terá que deixá-lo passar.',
        isEnd: true,
        onComplete: (game) => {
          game.completeCurrentPhase();
        }
      },
      end_hint: {
        text: 'Seja rápido. A Diretora Morgana costuma inspecionar os corredores quando as tochas começam a piscar em azul.',
        isEnd: true
      }
    }
  },

  morgana_phase1: {
    characterId: 'morgana',
    nodes: {
      start: {
        text: 'Iniciado. Vejo que tem perambulado pelo Salão das Cinzas com perguntas demais no olhar. Em Noctária, a curiosidade desmedida é a forma mais rápida de se tornar poeira entre as pedras.',
        options: [
          {
            text: 'Diretora, havia uma aluna chamada Seraphine Ashford nesta academia?',
            nextNode: 'deny_seraphine',
            effect: (state) => {
              state.player.relationships.morgana -= 2;
            }
          },
          {
            text: 'Apenas admirando a arquitetura imponente das fundações.',
            nextNode: 'cold_approval',
            effect: (state) => {
              state.player.relationships.morgana += 1;
            }
          }
        ]
      },
      deny_seraphine: {
        text: 'Nenhum estudante sob este teto atendeu ou atenderá por esse nome. Os registros oficiais são infalíveis. Recomendo que volte seus estudos para a geometria básica e esqueça murmúrios dos corredores.',
        options: [
          {
            text: 'Compreendo, Diretora.',
            nextNode: 'end_morgana'
          }
        ]
      },
      cold_approval: {
        text: 'A disciplina é a única virtude que separa um mago de um louco consumido pelas trevas. Dedique-se às suas lições.',
        options: [
          {
            text: 'Sim, Senhora.',
            nextNode: 'end_morgana'
          }
        ]
      },
      end_morgana: {
        text: 'Não se atrase para o toque do toque de recolher.',
        isEnd: true
      }
    }
  },

  // =========================================================================
  // FASE 2 — A BIBLIOTECA VELADA
  // =========================================================================
  vespera_library: {
    characterId: 'vespera',
    nodes: {
      start: {
        text: 'Pise com leveza, novato. Os livros nesta ala respiram, e alguns não apreciam serem perturbados enquanto digerem a poeira dos séculos. O que procura no arquivo proibido?',
        options: [
          {
            text: 'Procuro informações sobre as Mil Portas e manuscritos de translocação.',
            nextNode: 'torn_manuscript'
          },
          {
            text: 'Apresentar a carta com o símbolo de treze estrelas.',
            nextNode: 'respect_emblem',
            effect: (state) => {
              state.player.relationships.vespera += 2;
            }
          }
        ]
      },
      respect_emblem: {
        text: 'O brasão das treze estrelas... Fazia quase meio século que não via esse selo. Quem quer que tenha lhe enviado essa carta esperava que você encontrasse o Manuscrito das Três Fases.',
        options: [
          {
            text: 'Onde está o manuscrito?',
            nextNode: 'torn_manuscript'
          }
        ]
      },
      torn_manuscript: {
        text: 'Ele foi rasgado em três fragmentos quando a Ala Lacrada foi murada. Um pedaço repousa na mesa astronômica, outro entre os fólios de alquimia e o terceiro na gaveta do púlpito central. Reúna-os e decifre o feitiço primordial.',
        options: [
          {
            text: 'Que feitiço está gravado nele?',
            nextNode: 'explain_revelare'
          }
        ]
      },
      explain_revelare: {
        text: 'O feitiço REVELARE. O encanto dos olhos verdadeiros. Ele quebra véus, revela passagens em paredes sólidas e faz o invisível arder em luz violeta.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.vesperaTalked = true;
          game.showNotification('Explore a Biblioteca para encontrar os 3 fragmentos do manuscrito!', 'quest');
        }
      }
    }
  },

  // =========================================================================
  // FASE 3 — A POÇÃO DA LEMBRANÇA
  // =========================================================================
  octavian_alchemy: {
    characterId: 'octavian',
    nodes: {
      start: {
        text: 'Ah, o jovem estudante de passos cautelosos! Bem-vindo ao laboratório das transmutações psíquicas. Ouvi dizer que você decifrou o manuscrito na biblioteca. Você busca memórias que o tempo engoliu?',
        options: [
          {
            text: 'Professor Wren, Seraphine Ashford desapareceu e quero saber o que ela descobriu.',
            nextNode: 'octavian_confession',
            effect: (state) => {
              state.player.relationships.octavian += 2;
            }
          },
          {
            text: 'Como funciona a Poção da Lembrança?',
            nextNode: 'explain_potion'
          }
        ]
      },
      octavian_confession: {
        text: 'Seraphine era minha orientanda mais talentosa... Quando ela descobriu que a academia drenava ecos dos alunos, tentou me avisar. Mas a Diretoria agiu antes. A poção que pesquiso pode reativar a memória gravada na própria atmosfera de Noctária.',
        options: [
          {
            text: 'Quais ingredientes são necessários?',
            nextNode: 'explain_potion'
          }
        ]
      },
      explain_potion: {
        text: 'Precisamos de quatro essências fundamentais: Orvalho Lunar colhido nos jardins, Raiz de Mandrágora de Cinzas, Cinza de Fênix Noturna e Éter Rúnico. A ordem no caldeirão deve respeitar o fluxo alquímico estrito.',
        options: [
          {
            text: 'Celeste Veyra pode nos ajudar na preparação?',
            nextNode: 'celeste_intro'
          }
        ]
      },
      celeste_intro: {
        text: 'Celeste conhece a temperatura exata do fogo violeta. Fale com ela junto à bancada leste para reunir os frascos e dar início à destilação.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.octavianTalked = true;
          game.showNotification('Converse com Celeste Veyra para preparar a Poção da Lembrança.', 'quest');
        }
      }
    }
  },

  celeste_alchemy: {
    characterId: 'celeste',
    nodes: {
      start: {
        text: 'Você trouxe os ingredientes? O caldeirão já está aquecido com chama rúnica fria. Se errarmos a ordem dos componentes, o vapor pode nos fazer esquecer até o próprio nome!',
        options: [
          {
            text: 'Vamos iniciar o preparo da Poção da Lembrança.',
            nextNode: 'brew_instructions'
          },
          {
            text: 'Qual é o segredo para estabilizar o elixir?',
            nextNode: 'alchemy_tip',
            effect: (state) => {
              state.player.relationships.celeste += 1;
            }
          }
        ]
      },
      alchemy_tip: {
        text: 'O segredo é começar pelo Orvalho Lunar para formar a base líquida, adicionar a Raiz para ancorar o tempo, incandecer com a Cinza de Fênix e por fim verter o Éter Rúnico límpido para selar o composto.',
        options: [
          {
            text: 'Perfeito. Vamos adicionar os frascos.',
            nextNode: 'brew_instructions'
          }
        ]
      },
      brew_instructions: {
        text: 'Vá até o caldeirão e adicione os reagentes na sequência correta. Estarei ao seu lado para monitorar a cor da fumaça.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.celesteTalked = true;
          game.openAlchemyPuzzle();
        }
      }
    }
  },

  // =========================================================================
  // FASE 4 — O SEGREDO DE ELIAS
  // =========================================================================
  elias_confrontation: {
    characterId: 'elias',
    nodes: {
      start: {
        text: 'Você revistou meus aposentos... Viu o brasão da família Crowe entalhado naquele baú de ferro. O que você quer de mim?',
        options: [
          {
            text: 'Eu confio em você, Elias. Só quero entender por que sua família escondeu a chave.',
            nextNode: 'trust_path',
            effect: (state) => {
              state.player.relationships.elias += 3;
              state.player.choices.eliasTrust = 'trusted';
            }
          },
          {
            text: 'Você esteve mentindo o tempo todo! Estava trabalhando com a Diretoria?',
            nextNode: 'confront_path',
            effect: (state) => {
              state.player.relationships.elias -= 2;
              state.player.choices.eliasTrust = 'confronted';
            }
          }
        ]
      },
      trust_path: {
        text: 'Ninguém nunca me disse isso aqui dentro... Minha família foi a primeira guardiã de Noctária. Quando a Diretora Morgana começou a abrir portais para sugar o tempo de outras dimensões, meu avô escondeu a Primeira Chave das Mil Portas para impedir o cataclismo.',
        options: [
          {
            text: 'E onde está essa primeira chave?',
            nextNode: 'give_key'
          }
        ]
      },
      confront_path: {
        text: 'Trabalhando para a Diretoria?! Se ela soubesse que estou com a Chave de Ébano, eu já teria sido transformado em névoa nas masmorras! Mas se você precisa de provas em vez de acusações, olhe para isto.',
        options: [
          {
            text: 'Mostre-me a chave.',
            nextNode: 'give_key'
          }
        ]
      },
      give_key: {
        text: 'Aqui está: a Primeira Chave Dimensional. E tome este tomo: ele contém o feitiço APERTURA. Com ele, fechaduras cósmicas e selos arcanos respondem ao seu comando. Seraphine me pediu para entregar isso àquele que demonstrasse coragem para cruzar a Ala Lacrada.',
        options: [
          {
            text: 'Aceitar a Chave Dimensional e aprender o feitiço APERTURA.',
            nextNode: 'end_elias_key'
          }
        ]
      },
      end_elias_key: {
        text: 'A passagem para a Ala Lacrada está na parede norte do saguão. Tome cuidado com os retratos da galeria abandonada... Eles têm memória própria.',
        isEnd: true,
        onComplete: (game) => {
          game.completeCurrentPhase();
        }
      }
    }
  },

  // =========================================================================
  // FASE 7 — O REINO ONDE O TEMPO PAROU (ENTRETEMPO)
  // =========================================================================
  seraphine_meeting: {
    characterId: 'seraphine',
    nodes: {
      start: {
        text: 'Você... conseguiu atravessar a Porta das Estrelas? Eu sinto calor humano pela primeira vez em séculos... Ou talvez tenham sido apenas alguns meses? Neste lugar, os ponteiros dos relógios foram assassinados.',
        options: [
          {
            text: 'Seraphine! Eu vim resgatá-la. Toda a sua história foi apagada em Noctária.',
            nextNode: 'seraphine_truth',
            effect: (state) => {
              state.player.relationships.seraphine += 3;
            }
          },
          {
            text: 'O que é esta dimensão e por que Morgana a trancou aqui?',
            nextNode: 'seraphine_ritual_truth'
          }
        ]
      },
      seraphine_truth: {
        text: 'Eu sabia que a carta que enviei através da fresta do portal encontraria alguém capaz! Morgana pensa que manter as portas abertas exige o sacrifício de memórias... Mas o que ela realmente teme é o que habita além da 13ª badalada.',
        options: [
          {
            text: 'O que habita além da 13ª badalada?',
            nextNode: 'seraphine_ritual_truth'
          }
        ]
      },
      seraphine_ritual_truth: {
        text: 'O Vazio Ancestral. A academia foi construída sobre uma fenda primordial. Para mantê-la selada, Morgana sacrifica a identidade dos alunos mais brilhantes. Mas esse ciclo está desgastando a realidade. O Entretempo já está ruindo!',
        options: [
          {
            text: 'Como quebramos a sua estase temporal para voltarmos?',
            nextNode: 'use_memoria'
          }
        ]
      },
      use_memoria: {
        text: 'Use o feitiço MEMORIA nos três ecos suspensos ao redor desta sala. Eles reconstruirão a minha âncora existencial e abrirão o caminho direto para a Câmara Central!',
        isEnd: true,
        onComplete: (game) => {
          game.flags.seraphineRescued = true;
          game.showNotification('✦ Use o feitiço MEMORIA nos três fragmentos temporais para libertar Seraphine! ✦', 'quest');
        }
      }
    }
  },

  // =========================================================================
  // FASE 8 — O RITUAL DAS TREZE BADALADAS (CONFRONTO FINAL)
  // =========================================================================
  morgana_final: {
    characterId: 'morgana',
    nodes: {
      start: {
        text: 'Então você trouxe Seraphine de volta do abismo... e uniu as Chaves Dimensionais. Você acredita que sou o monstro desta história, não é mesmo? Mas você não viu o que espreita além da 13ª badalada quando o portal oscila.',
        options: [
          {
            text: 'Roubar a vida e a memória dos alunos nunca foi a resposta, Morgana!',
            nextNode: 'morgana_defense',
            effect: (state) => {
              state.player.relationships.morgana -= 1;
            }
          },
          {
            text: 'Explique-me suas razões antes que decidamos o destino de Noctária.',
            nextNode: 'morgana_rational',
            effect: (state) => {
              state.player.relationships.morgana += 2;
            }
          }
        ]
      },
      morgana_defense: {
        text: 'Sem o ritual, a barreira cósmica desmorona em questão de horas. O mundo além dos nossos muros seria devorado por sombras famintas que não conhecem tempo ou piedade!',
        options: [
          {
            text: 'Há outras maneiras de canalizar o poder sem destruir almas.',
            nextNode: 'ritual_decision'
          }
        ]
      },
      morgana_rational: {
        text: 'Durante três gerações, os mestres sustentaram o portal através do conhecimento esquecido. Se o ritual for interrompido sem um selamento perfeito, nada sobreviverá. Mas você carrega as chaves e o alinhamento das 13 badaladas está em suas mãos.',
        options: [
          {
            text: 'Estou pronto para fazer a escolha definitiva.',
            nextNode: 'ritual_decision'
          }
        ]
      },
      ritual_decision: {
        text: 'O Altar das Treze Badaladas está diante de você. Os pêndulos rúnicos aguardam a frequência correta: 1, 3, 7 e 13. Uma vez alinhados, a decisão sobre o futuro deste mundo pertencerá exclusivamente a você.',
        isEnd: true,
        onComplete: (game) => {
          game.openChimesPuzzle();
        }
      }
    }
  }
};
