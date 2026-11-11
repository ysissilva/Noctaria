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
          game.updateQuestStep(0);
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
          game.updateQuestStep(4);
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
        text: 'Não se atrase para o toque de recolher.',
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
        text: 'Pise com leveza, novato. Os tomos nesta ala respiram, e alguns não apreciam serem perturbados enquanto digerem a poeira dos séculos. O silêncio aqui é uma barreira de proteção. O que procura nos arquivos proibidos de Noctária?',
        options: [
          {
            text: 'Procuro informações sobre as Mil Portas e manuscritos de translocação.',
            nextNode: 'doors_lore'
          },
          {
            text: 'Apresentar a carta com o símbolo de treze estrelas.',
            nextNode: 'respect_emblem',
            effect: (state) => {
              state.player.relationships.vespera += 2;
            }
          },
          {
            text: 'Dizem que uma aluna chamada Seraphine pesquisava aqui antes de sumir.',
            nextNode: 'seraphine_inquiry'
          }
        ]
      },
      doors_lore: {
        text: 'As Mil Portas não são passagens comuns de madeira e ferro. São fendas abertas no tecido da realidade por rituais antigos dos fundadores. Quem as atravessa sem o domínio dos três feitiços capitais perde o retorno... ou a própria mente.',
        options: [
          {
            text: 'Quais são esses feitiços capitais?',
            nextNode: 'explain_three_spells'
          },
          {
            text: 'Mostrar a carta com o selo das treze estrelas.',
            nextNode: 'respect_emblem'
          }
        ]
      },
      seraphine_inquiry: {
        text: 'Seraphine... Uma mente brilhante demais para as sombras que rondam a Diretoria. Ela passava noites em claro na mesa astronômica, traçando linhas entre as constelações e as portas seladas. Quando tentaram apagar seus passos, ela deixou algo para trás.',
        options: [
          {
            text: 'O que ela deixou para trás?',
            nextNode: 'torn_manuscript'
          }
        ]
      },
      explain_three_spells: {
        text: 'REVELARE para enxergar o invisível e romper ilusões. APERTURA para quebrar fechos cósmicos. E MEMORIA para ancorar o tempo e impedir que sua essência se dissolva no vazio.',
        options: [
          {
            text: 'Onde encontro o primeiro desses encantamentos?',
            nextNode: 'torn_manuscript'
          }
        ]
      },
      respect_emblem: {
        text: 'O brasão das treze estrelas... Fazia quase meio século que não via esse selo autêntico. Quem quer que tenha lhe enviado essa carta esperava que você encontrasse o Manuscrito das Três Fases e terminasse o que foi interrompido.',
        options: [
          {
            text: 'Onde está o manuscrito agora?',
            nextNode: 'torn_manuscript'
          }
        ]
      },
      torn_manuscript: {
        text: 'Ele foi rasgado em três fragmentos quando a Ala Lacrada foi murada para conter o vazamento arcano. Um pedaço repousa na mesa astronômica, outro entre os fólios de alquimia e o terceiro na gaveta do púlpito central. Reúna-os com cautela e decifre o verso primordial.',
        options: [
          {
            text: 'Que feitiço está gravado nele?',
            nextNode: 'explain_revelare'
          }
        ]
      },
      explain_revelare: {
        text: 'O feitiço REVELARE. O encanto dos olhos verdadeiros. Ele quebra véus, revela passagens em pedras aparentemente sólidas e faz o invisível arder em luz violeta. Sem ele, você jamais ultrapassará as barreiras do laboratório e da ala antiga.',
        isEnd: true,
        onComplete: (game) => {
          game.flags.vesperaTalked = true;
          game.updateQuestStep(0);
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
          game.updateQuestStep(0);
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
          game.flags.firstDimensionalKeyObtained = true;
          game.flags.aperturaLearned = true;
          game.learnSpell('apertura');
          game.updateQuestStep(2);
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
          game.updateQuestStep(3);
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
          game.flags.morganaConfronted = true;
          game.updateQuestStep(0);
          game.updateQuestStep(1);
          game.openChimesPuzzle();
        }
      }
    }
  },

  // =========================================================================
  // FASE 5 — A ALA LACRADA (eco espectral das paredes)
  // =========================================================================
  sealed_wing_echo: {
    characterId: 'elias',
    nodes: {
      start: {
        text: 'Esta ala foi selada em 1923. Meu avô foi um dos últimos a atravessar este corredor. Ele descreveu pinturas que se moveriam quando o relógio de pêndulo no fundo tocasse meia-noite.',
        options: [
          {
            text: 'O que aconteceu com os alunos que moravam aqui?',
            nextNode: 'wing_lore'
          },
          {
            text: 'Por que Morgana selou exatamente este lugar?',
            nextNode: 'morgana_secret_wing'
          }
        ]
      },
      wing_lore: {
        text: 'Os registros dizem que eles simplesmente... pararam de aparecer nos refeitórios. Um por um. Suas camas estavam intactas, as velas ainda acesas. Apenas eles tinham evaporado como névoa ao amanhecer.',
        options: [
          {
            text: 'Algum rastro foi encontrado?',
            nextNode: 'portrait_clue'
          }
        ]
      },
      morgana_secret_wing: {
        text: 'Esta é a ala mais antiga da academia. Meu avô acreditava que a própria fundação desta parte do edifício foi erguida sobre um fragmento da fenda dimensional. Morgana não selou a ala para proteger os alunos — ela a selou para proteger o segredo.',
        options: [
          {
            text: 'Que segredo?',
            nextNode: 'portrait_clue'
          }
        ]
      },
      portrait_clue: {
        text: 'Os retratos da galeria registram os eventos em ordem cronológica. Se você os organizar corretamente, eles ativarão o espelho mágico central. O que ele mostrará, eu prefiro não adivinhar.',
        isEnd: true,
        onComplete: (game) => {
          game.showNotification('Examine os retratos da galeria e organize-os em ordem cronológica.', 'quest');
        }
      }
    }
  },

  // =========================================================================
  // FASE 6 — A GALERIA DAS MIL PORTAS
  // =========================================================================
  gallery_vespera: {
    characterId: 'vespera',
    nodes: {
      start: {
        text: 'Você chegou à Galeria das Mil Portas. Poucos iniciados alcançam este limiar. Cada portal nesta sala responde a uma frequência diferente — de estrelas, de relógios, de cinzas, de espinhos e de reflexos. Apenas uma delas leva ao Entretempo.',
        options: [
          {
            text: 'Como identificar qual porta é a certa?',
            nextNode: 'door_hint'
          },
          {
            text: 'Seraphine deixou algum rastro aqui antes de desaparecer?',
            nextNode: 'seraphine_trace'
          }
        ]
      },
      seraphine_trace: {
        text: 'Ela deixou o seu pingente estelar pendurado na maçaneta da porta correta. Uma âncora para que alguém a encontrasse. Procure o objeto pessoal dela entre os portais.',
        options: [
          {
            text: 'Vou examinar cada uma das cinco portas.',
            nextNode: 'door_hint'
          }
        ]
      },
      door_hint: {
        text: 'As inscrições em cada portal revelam sua natureza. A Porta das Estrelas ressoa com o feitiço APERTURA — foi selada com magia dimensional. Encontre o pingente de Seraphine e use o feitiço para abrir o caminho.',
        isEnd: true,
        onComplete: (game) => {
          game.showNotification('Examine os 5 portais dimensionais e encontre o pingente de Seraphine.', 'quest');
        }
      }
    }
  },

  // =========================================================================
  // EPÍLOGO — O OUTRO LADO
  // =========================================================================
  epilogue_reflection: {
    characterId: 'seraphine',
    nodes: {
      start: {
        text: 'A madrugada chegou. As torres de Noctária ainda estão em pé, mas algo mudou no ar desta noite — como se a academia tivesse exalado um suspiro depois de décadas presa. Obrigada... por me lembrar de que eu existia.',
        options: [
          {
            text: 'O que você vai fazer agora, Seraphine?',
            nextNode: 'seraphine_future'
          },
          {
            text: 'O que acontece com Noctária a partir de agora?',
            nextNode: 'noctaria_future'
          }
        ]
      },
      seraphine_future: {
        text: 'Vou reconstruir o que foi apagado. Cada nome nos registros, cada rosto nas pinturas, cada voz nos corredores que foi silenciada. Noctária me deve memórias — e eu cobrei apenas as minhas. Mas há outras almas esperando.',
        options: [
          {
            text: 'Esta carta que chegou esta manhã... você a enviou?',
            nextNode: 'new_letter'
          }
        ]
      },
      noctaria_future: {
        text: 'A fenda dimensional foi selada pelo alinhamento que você realizou. Mas selos envelhecem. E as mil portas que existem além deste plano... elas não desaparecem quando se fecha uma delas. Apenas adormecem.',
        options: [
          {
            text: 'Esta carta que chegou esta manhã... você a enviou?',
            nextNode: 'new_letter'
          }
        ]
      },
      new_letter: {
        text: 'Não. Essa carta com o novo selo de estrelas não veio de mim. Existem outras academias além desta. Outros limiares. Outras portas. E ao que parece... você tem o dom de cruzá-las.',
        isEnd: true,
        onComplete: (game) => {
          game.showNotification('Examine a nova carta e a Chave Prateada em sua escrivaninha.', 'quest');
        }
      }
    }
  }
};
