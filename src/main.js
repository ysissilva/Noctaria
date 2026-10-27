import { CHARACTERS, SPELLS_DATABASE, PHASES_CONFIG, INITIAL_STATE } from './data/gameState.js';
import { DIALOGUES } from './data/dialogues.js';
import { SCENE_BACKGROUNDS } from './data/sceneAssets.js';
import { PUZZLES } from './data/puzzles.js';

class NoctariaGame {
  constructor() {
    this.root = document.getElementById('game-root');
    this.notificationsRoot = document.getElementById('notifications');
    this.activeModal = null;
    this.activeDialogue = null;
    this.currentDialogueNode = null;
    this.textRevealInterval = null;
    this.activeSpell = null;

    // Temporary minigame states
    this.tempState = {
      manuscriptOrder: [],
      cauldronIngredients: [],
      portraitsSelected: [],
      chimesSelected: []
    };

    this.loadState();
  }

  // --- SAVE & LOAD SYSTEM ---
  loadState() {
    const saved = localStorage.getItem('noctaria_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = parsed;
        this.hasSave = true;
      } catch (e) {
        console.error('Falha ao restaurar save game, iniciando estado padrão:', e);
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.hasSave = false;
      }
    } else {
      this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
      this.hasSave = false;
    }
  }

  saveGame() {
    localStorage.setItem('noctaria_save', JSON.stringify(this.state));
    this.hasSave = true;
  }

  resetGame() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveGame();
    this.changeChapter('prologue');
    this.startDialogue('elias_arrival', 'start');
  }

  get flags() {
    return this.state.player.flags;
  }

  // --- NOTIFICAÇÕES & FEEDBACK ---
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'quest') toast.style.borderLeftColor = 'var(--color-luminous-purple)';
    if (type === 'item') toast.style.borderLeftColor = '#5376C8';
    if (type === 'clue') toast.style.borderLeftColor = '#e8e8f2';
    if (type === 'spell') toast.style.borderLeftColor = '#4ef0c4';

    toast.innerText = message;
    this.notificationsRoot.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // --- PROGRESSÃO DE FASES & CAPÍTULOS ---
  changeChapter(chapterId) {
    this.state.currentChapter = chapterId;
    const config = PHASES_CONFIG[chapterId];
    if (config) {
      this.state.currentScene = config.scene;
      if (!this.state.unlockedScenes.includes(config.scene)) {
        this.state.unlockedScenes.push(config.scene);
      }
    }
    this.saveGame();
    this.renderGameWorld();
  }

  changeScene(sceneId) {
    this.state.currentScene = sceneId;
    if (!this.state.unlockedScenes.includes(sceneId)) {
      this.state.unlockedScenes.push(sceneId);
    }
    this.saveGame();
    this.renderGameWorld();
  }

  updateQuestStep(stepIndex) {
    if (this.state.activeQuest && this.state.activeQuest.steps[stepIndex]) {
      this.state.activeQuest.steps[stepIndex].completed = true;
      this.state.activeQuest.currentStep = Math.max(this.state.activeQuest.currentStep, stepIndex + 1);
      this.saveGame();
      this.updateHudBadges();
    }
  }

  addInventoryItem(item) {
    if (!this.state.player.inventory.some(i => i.id === item.id)) {
      this.state.player.inventory.push(item);
      this.showNotification(`Item obtido: ${item.name}`, 'item');
      this.saveGame();
      this.updateHudBadges();
    }
  }

  addClue(clue) {
    if (!this.state.player.clues.some(c => c.id === clue.id)) {
      this.state.player.clues.push(clue);
      this.showNotification(`Nova pista revelada: ${clue.title}`, 'clue');
      this.saveGame();
      this.updateHudBadges();
    }
  }

  learnSpell(spellId) {
    if (!this.state.player.spells.includes(spellId)) {
      this.state.player.spells.push(spellId);
      const spell = SPELLS_DATABASE[spellId];
      this.showNotification(`✦ Novo Feitiço Aprendido: ${spell.name}! ✦`, 'spell');
      this.saveGame();
      this.renderGameWorld();
    }
  }

  completeCurrentPhase() {
    const current = this.state.currentChapter;
    if (this.state.activeQuest) {
      this.state.activeQuest.status = 'completed';
      this.state.completedQuests.push({ ...this.state.activeQuest });
    }

    let nextChapter = null;
    let title = '';
    let summary = '';

    if (current === 'prologue') {
      this.flags.prologueCompleted = true;
      nextChapter = 'phase_1';
      title = 'Prólogo Concluído';
      summary = 'O sino tocou treze vezes e a porta fantasma sussurrou antes de desaparecer. A investigação sobre Seraphine começa agora.';
      this.state.activeQuest = {
        id: 'quest_phase_1',
        name: 'Fase 1 — O Nome que Não Existe',
        description: 'Descubra a identidade da aluna apagada examinando o mural, o retrato e o livro de matrículas no Salão das Cinzas.',
        currentStep: 0,
        steps: [
          { text: 'Converse com Elias no Salão sobre os apagamentos.', completed: false },
          { text: 'Examine o retrato antigo raspado na parede leste.', completed: false },
          { text: 'Inspecione o livro de matrículas com páginas arrancadas.', completed: false },
          { text: 'Examine o mural de avisos para descobrir o nome Seraphine Ashford.', completed: false },
          { text: 'Converse novamente com Elias para desbloquear a Biblioteca Velada.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_1') {
      this.flags.phase1Completed = true;
      nextChapter = 'phase_2';
      title = 'Fase 1 Concluída';
      summary = 'Você comprovou que Seraphine Ashford existiu e foi deliberadamente arrancada da história. Acesso à Biblioteca Velada concedido!';
      this.state.activeQuest = {
        id: 'quest_phase_2',
        name: 'Fase 2 — A Biblioteca Velada',
        description: 'Reúna as três páginas do manuscrito rasgado nos arquivos proibidos e aprenda o feitiço Revelare.',
        currentStep: 0,
        steps: [
          { text: 'Converse com Madam Vespera sobre as Mil Portas.', completed: false },
          { text: 'Encontre os 3 fragmentos do manuscrito na Biblioteca.', completed: false },
          { text: 'Decifre a ordem dos símbolos arcanos para aprender REVELARE.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_2') {
      this.flags.phase2Completed = true;
      nextChapter = 'phase_3';
      title = 'Fase 2 Concluída';
      summary = 'Você dominou o feitiço REVELARE! O Laboratório de Alquimia das Sombras está aberto para sua pesquisa.';
      this.state.activeQuest = {
        id: 'quest_phase_3',
        name: 'Fase 3 — A Poção da Lembrança',
        description: 'Colete os 4 ingredientes e destile a Poção da Lembrança com o Prof. Octavian e Celeste.',
        currentStep: 0,
        steps: [
          { text: 'Converse com o Prof. Octavian Wren sobre a fórmula.', completed: false },
          { text: 'Colete os 4 reagentes alquímicos no laboratório.', completed: false },
          { text: 'Prepare a poção na ordem correta no caldeirão.', completed: false },
          { text: 'Decida quem deve ingerir o elixir para resgatar a visão de Seraphine.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_3') {
      this.flags.phase3Completed = true;
      nextChapter = 'phase_4';
      title = 'Fase 3 Concluída';
      summary = 'A visão revelou Seraphine diante da Porta das Estrelas! Agora é hora de desvendar a ligação de Elias Crowe com a academia.';
      this.state.activeQuest = {
        id: 'quest_phase_4',
        name: 'Fase 4 — O Segredo de Elias',
        description: 'Investigue os dormitórios, encontre o diário dos Crowe e obtenha a Primeira Chave Dimensional.',
        currentStep: 0,
        steps: [
          { text: 'Encontre a chave de bronze escondida na lareira do dormitório.', completed: false },
          { text: 'Abra o baú familiar e leia o diário secreto de Elias.', completed: false },
          { text: 'Confronte ou demonstre confiança a Elias para obter a Primeira Chave Dimensional.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_4') {
      this.flags.phase4Completed = true;
      nextChapter = 'phase_5';
      title = 'Fase 4 Concluída';
      summary = 'Você conquistou a Chave Dimensional dos Crowe e aprendeu APERTURA! A misteriosa Ala Lacrada aguarda sua entrada.';
      this.state.activeQuest = {
        id: 'quest_phase_5',
        name: 'Fase 5 — A Ala Lacrada',
        description: 'Explore a mansão original, desarme armadilhas com Revelare e recupere o segundo fragmento de chave.',
        currentStep: 0,
        steps: [
          { text: 'Use REVELARE para revelar as runas de proteção e desarmar a armadilha.', completed: false },
          { text: 'Resolva a sequência cronológica dos retratos na galeria esquecida.', completed: false },
          { text: 'Assista à gravação mágica de Morgana Vale e pegue o 2º fragmento de chave.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_5') {
      this.flags.phase5Completed = true;
      nextChapter = 'phase_6';
      title = 'Fase 5 Concluída';
      summary = 'A gravação comprovou a participação da Diretora no ritual proibido. O caminho para a Galeria das Mil Portas está aberto!';
      this.state.activeQuest = {
        id: 'quest_phase_6',
        name: 'Fase 6 — A Galeria das Mil Portas',
        description: 'Examine os cinco portais dimensionais e utilize APERTURA na Porta das Estrelas para entrar no Entretempo.',
        currentStep: 0,
        steps: [
          { text: 'Inspecione os 5 portais dimensionais para identificar a frequência estelar.', completed: false },
          { text: 'Encontre o pingente pessoal deixado por Seraphine.', completed: false },
          { text: 'Use APERTURA na Porta das Estrelas para abrir a passagem ao Entretempo.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_6') {
      this.flags.phase6Completed = true;
      nextChapter = 'phase_7';
      title = 'Fase 6 Concluída';
      summary = 'Você cruzou o limiar do vazio e penetrou na dimensão do Entretempo, onde o tempo foi estilhaçado!';
      this.state.activeQuest = {
        id: 'quest_phase_7',
        name: 'Fase 7 — O Reino Onde o Tempo Parou',
        description: 'Reconstrua os três fragmentos temporais com MEMORIA e liberte Seraphine antes do colapso do Entretempo.',
        currentStep: 0,
        steps: [
          { text: 'Reconstrua o Eco 1 (O Segredo do Ritual) usando MEMORIA.', completed: false },
          { text: 'Reconstrua o Eco 2 (A Traição de Morgana) usando MEMORIA.', completed: false },
          { text: 'Reconstrua o Eco 3 (O Selamento de Seraphine) usando MEMORIA.', completed: false },
          { text: 'Converse com Seraphine e fuja para a Câmara Central.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_7') {
      this.flags.phase7Completed = true;
      nextChapter = 'phase_8';
      title = 'Fase 7 Concluída';
      summary = 'Seraphine foi resgatada! Juntos, vocês retornam às entranhas de Noctária para o clímax decisivo.';
      this.state.activeQuest = {
        id: 'quest_phase_8',
        name: 'Fase 8 — O Ritual das Treze Badaladas',
        description: 'Enfrente Morgana Vale no altar cósmico, alinhe os pêndulos das 13 badaladas e decida o destino de Noctária.',
        currentStep: 0,
        steps: [
          { text: 'Deposite as Chaves Dimensionais no Altar Central.', completed: false },
          { text: 'Confronte a Diretora Morgana Vale sobre as almas apagadas.', completed: false },
          { text: 'Alinhe a sequência das 13 badaladas cósmicas.', completed: false },
          { text: 'Escolha um dos três destinos para o futuro de Noctária.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_8') {
      this.flags.phase8Completed = true;
      nextChapter = 'epilogue';
      title = 'A Grande Jornada Foi Concluída!';
      summary = 'O destino foi selado. Mas nas profundezas da madrugada, um novo mistério bate à porta.';
      this.state.activeQuest = {
        id: 'quest_epilogue',
        name: 'Epílogo — O Outro Lado',
        description: 'Examine a nova carta misteriosa e a Chave Prateada deixada na sua escrivaninha.',
        currentStep: 0,
        steps: [
          { text: 'Examine a nova carta sem remetente na escrivaninha.', completed: false },
          { text: 'Inspecione a Chave Prateada Impossível.', completed: false },
          { text: 'Consulte o balanço de sua jornada nas Crônicas de Noctária.', completed: false }
        ],
        status: 'active'
      };
    }

    this.saveGame();
    this.openQuestCompletionModal(title, summary, nextChapter);
  }

  // --- INIT APPLICATION ---
  start() {
    this.renderMainMenu();
  }

  // --- MENU PRINCIPAL ---
  renderMainMenu() {
    this.closeModal();
    const hasSavedGame = localStorage.getItem('noctaria_save') !== null;

    this.root.innerHTML = `
      <div class="menu-screen" id="menu-screen" style="background-image: url('/assets/images/menu_bg.jpg');">
        <div class="menu-overlay"></div>

        <header class="menu-header">
          <h1 class="game-title">NOCTÁRIA</h1>
          <h2 class="game-subtitle">A ACADEMIA DAS MIL PORTAS</h2>
          <p class="game-tagline">“A magia esqueceu seu nome. Você não esqueceu o dela.”</p>
        </header>

        <nav class="menu-actions" aria-label="Menu Principal">
          <button class="btn-gothic btn-primary" id="btn-start-game">
            <span>INICIAR AVENTURA</span>
            <span class="btn-icon">✦</span>
          </button>

          <button class="btn-gothic" id="btn-continue-game" ${hasSavedGame ? '' : 'disabled'}>
            <span>CONTINUAR</span>
            <span class="btn-icon">🕮</span>
          </button>

          <button class="btn-gothic" id="btn-characters">
            <span>PERSONAGENS</span>
            <span class="btn-icon">👥</span>
          </button>

          <button class="btn-gothic" id="btn-settings">
            <span>CONFIGURAÇÕES</span>
            <span class="btn-icon">⚙</span>
          </button>

          <button class="btn-gothic" id="btn-credits">
            <span>CRÉDITOS</span>
            <span class="btn-icon">📜</span>
          </button>
        </nav>
      </div>
    `;

    document.getElementById('btn-start-game').onclick = () => {
      if (hasSavedGame) {
        if (confirm('Existe uma jornada gravada neste navegador. Deseja reiniciar a história e sobrepor seu progresso?')) {
          this.resetGame();
        }
      } else {
        this.resetGame();
      }
    };

    const continueBtn = document.getElementById('btn-continue-game');
    if (continueBtn && hasSavedGame) {
      continueBtn.onclick = () => {
        this.loadState();
        this.renderGameWorld();
        this.showNotification('Jornada restaurada com sucesso!', 'info');
      };
    }

    document.getElementById('btn-characters').onclick = () => this.openCharactersModal();
    document.getElementById('btn-settings').onclick = () => this.openSettingsModal();
    document.getElementById('btn-credits').onclick = () => this.openCreditsModal();
  }

  // --- CENA JOGÁVEL E VIEWPORT ---
  renderGameWorld() {
    const sceneId = this.state.currentScene || 'courtyard';
    const bgGenerator = SCENE_BACKGROUNDS[sceneId] || SCENE_BACKGROUNDS.courtyard;
    const bgUrl = bgGenerator();
    const phaseCfg = PHASES_CONFIG[this.state.currentChapter] || PHASES_CONFIG.prologue;

    // Available spells from player progression
    const playerSpells = this.state.player.spells.map(id => SPELLS_DATABASE[id]).filter(Boolean);

    this.root.innerHTML = `
      <div class="game-viewport">
        <!-- Top HUD Bar -->
        <header class="game-topbar">
          <div class="topbar-location">
            <span class="loc-icon">🏛</span>
            <span class="loc-name">${phaseCfg.locationName}</span>
            <span class="map-card-phase" style="margin-left:12px; font-weight:bold;">${phaseCfg.title.split('—')[0]}</span>
          </div>
          <div class="topbar-nav">
            <button class="nav-btn" id="hud-map-btn" title="Mapa de Noctária e Viagem Rápida">
              <span>Mapa</span>
              <span class="badge-count">✦</span>
            </button>
            <button class="nav-btn" id="hud-journal-btn">
              <span>Diário</span>
              <span class="badge-count" id="journal-badge">${this.state.player.clues.length}</span>
            </button>
            <button class="nav-btn" id="hud-inventory-btn">
              <span>Inventário</span>
              <span class="badge-count" id="inventory-badge">${this.state.player.inventory.length}</span>
            </button>
            <button class="nav-btn" id="hud-characters-btn">
              <span>Personagens</span>
            </button>
            <button class="nav-btn" id="hud-menu-btn">
              <span>Menu</span>
            </button>
          </div>
        </header>

        <!-- Main Interactive Scene Container -->
        <main class="scene-container">
          <div class="scene-bg" id="scene-bg" style="background-image: url('${bgUrl}');"></div>
          <div class="scene-interactive-layer" id="interactive-layer"></div>

          <!-- Bottom Spell Bar -->
          <div class="spell-bar" id="spell-bar">
            ${playerSpells.length === 0 ? `
              <div style="font-size:0.85rem; color:var(--color-text-dim); padding:6px 14px; font-style:italic;">
                ✦ Nenhum feitiço dominado ainda. Investigue os manuscritos para aprender magia. ✦
              </div>
            ` : playerSpells.map(spell => `
              <button class="spell-btn ${this.activeSpell === spell.id ? 'active' : ''}" data-spell="${spell.id}" title="${spell.description}">
                <span>${spell.icon}</span>
                <span>${spell.name}</span>
              </button>
            `).join('')}
          </div>
        </main>
      </div>
    `;

    // Connect topbar buttons
    document.getElementById('hud-map-btn').onclick = () => this.openMapModal();
    document.getElementById('hud-journal-btn').onclick = () => this.openJournalModal();
    document.getElementById('hud-inventory-btn').onclick = () => this.openInventoryModal();
    document.getElementById('hud-characters-btn').onclick = () => this.openCharactersModal();
    document.getElementById('hud-menu-btn').onclick = () => this.renderMainMenu();

    // Connect spell buttons
    document.querySelectorAll('.spell-btn').forEach(btn => {
      btn.onclick = () => {
        const spellId = btn.getAttribute('data-spell');
        this.castSpell(spellId);
      };
    });

    this.renderSceneInteractiveElements();
  }

  updateHudBadges() {
    const jBadge = document.getElementById('journal-badge');
    const iBadge = document.getElementById('inventory-badge');
    if (jBadge) jBadge.innerText = this.state.player.clues.length;
    if (iBadge) iBadge.innerText = this.state.player.inventory.length;
  }

  // --- ELEMENTOS INTERATIVOS POR CENA / FASE ---
  renderSceneInteractiveElements() {
    const layer = document.getElementById('interactive-layer');
    if (!layer) return;
    layer.innerHTML = '';
    const scene = this.state.currentScene;
    const chapter = this.state.currentChapter;

    // 1. PRÓLOGO: COURTYARD / SAGUÃO
    if (scene === 'courtyard') {
      // Elias Crowe
      this.createHotspot(layer, '54%', '70%', 'Elias Crowe (Falar)', () => {
        this.startDialogue('elias_arrival', 'start');
      });

      // Carta caída perto da escadaria
      this.createHotspot(layer, '36%', '80%', 'Carta na Escadaria', () => {
        this.examinePrologueLetter();
      }, '#5376c8');

      // O Portão que Aparece com 13 badaladas
      if (this.flags.prologueChimeRang && !this.flags.phantomDoorVanished) {
        this.createHotspot(layer, '50%', '52%', 'Porta Fantasma (13ª Badaladas)', () => {
          this.interactPhantomDoor();
        }, '#a58ae8');
      }
    }

    // 2. FASE 1: SALÃO DAS CINZAS
    else if (scene === 'ashes_hall') {
      // Elias
      this.createHotspot(layer, '30%', '72%', 'Elias Crowe', () => {
        this.startDialogue('elias_phase1', 'start');
      });

      // Diretora Morgana Vale
      this.createHotspot(layer, '50%', '52%', 'Diretora Morgana Vale', () => {
        this.startDialogue('morgana_phase1', 'start');
      }, '#7650b8');

      // Mural de Avisos
      this.createHotspot(layer, '16%', '60%', 'Mural de Avisos Estudantis', () => {
        this.examineNoticeBoard();
      });

      // Retrato Raspado
      this.createHotspot(layer, '24%', '42%', 'Retrato Adulterado', () => {
        this.examineErasedPortrait();
      });

      // Livro de Matrículas Alterado
      this.createHotspot(layer, '76%', '76%', 'Livro de Matrículas Oficial', () => {
        this.examineAlteredLedger();
      });

      // Passagem para a Biblioteca se fase 1 concluída
      if (this.flags.phase1Completed) {
        this.createHotspot(layer, '86%', '58%', 'Entrada para a Biblioteca Velada', () => {
          this.changeChapter('phase_2');
        }, '#4ef0c4');
      }
    }

    // 3. FASE 2: A BIBLIOTECA VELADA
    else if (scene === 'library') {
      // Madam Vespera
      this.createHotspot(layer, '50%', '64%', 'Madam Vespera (Bibliotecária)', () => {
        this.startDialogue('vespera_library', 'start');
      }, '#7650b8');

      // 3 Fragmentos do Manuscrito
      if (!this.flags.fragment1Found) {
        this.createHotspot(layer, '22%', '50%', 'Fragmento A de Manuscrito', () => {
          this.flags.fragment1Found = true;
          this.addInventoryItem({ id: 'frag_a', name: 'Fragmento A de Manuscrito', icon: '📜', description: 'Página rasgada contendo a primeira linha do encantamento.' });
          this.updateQuestStep(1);
          this.checkManuscriptFragments();
          this.renderSceneInteractiveElements();
        });
      }

      if (!this.flags.fragment2Found) {
        this.createHotspot(layer, '78%', '50%', 'Fragmento B de Manuscrito', () => {
          this.flags.fragment2Found = true;
          this.addInventoryItem({ id: 'frag_b', name: 'Fragmento B de Manuscrito', icon: '📜', description: 'Página rasgada contendo a invocação do véu.' });
          this.updateQuestStep(1);
          this.checkManuscriptFragments();
          this.renderSceneInteractiveElements();
        });
      }

      if (!this.flags.fragment3Found) {
        this.createHotspot(layer, '50%', '82%', 'Fragmento C de Manuscrito', () => {
          this.flags.fragment3Found = true;
          this.addInventoryItem({ id: 'frag_c', name: 'Fragmento C de Manuscrito', icon: '📜', description: 'Página rasgada com a palavra de poder.' });
          this.updateQuestStep(1);
          this.checkManuscriptFragments();
          this.renderSceneInteractiveElements();
        });
      }

      // Mesa de Decifração do Manuscrito
      this.createHotspot(layer, '50%', '76%', 'Púlpito de Decifração Rúnica', () => {
        this.openManuscriptPuzzle();
      }, '#a58ae8');

      if (this.flags.revelareLearned) {
        this.createHotspot(layer, '88%', '68%', 'Acesso ao Laboratório de Alquimia', () => {
          this.changeChapter('phase_3');
        }, '#4ef0c4');
      }
    }

    // 4. FASE 3: LABORATÓRIO DE ALQUIMIA
    else if (scene === 'alchemy_lab') {
      // Prof. Octavian Wren
      this.createHotspot(layer, '34%', '62%', 'Prof. Octavian Wren', () => {
        this.startDialogue('octavian_alchemy', 'start');
      });

      // Celeste Veyra
      this.createHotspot(layer, '66%', '62%', 'Celeste Veyra', () => {
        this.startDialogue('celeste_alchemy', 'start');
      });

      // O Grande Caldeirão
      this.createHotspot(layer, '50%', '75%', 'Caldeirão das Lembranças', () => {
        this.openAlchemyPuzzle();
      }, '#4ef0c4');

      // Prateleiras de reagentes
      if (!this.flags.ingredientLunarDew) {
        this.createHotspot(layer, '18%', '36%', 'Frasco: Orvalho Lunar', () => {
          this.flags.ingredientLunarDew = true;
          this.showNotification('Coletado: Orvalho Lunar Destilado!', 'item');
          this.renderSceneInteractiveElements();
        });
      }
      if (!this.flags.ingredientAshRoot) {
        this.createHotspot(layer, '26%', '36%', 'Frasco: Raiz de Mandrágora', () => {
          this.flags.ingredientAshRoot = true;
          this.showNotification('Coletado: Raiz de Mandrágora de Cinzas!', 'item');
          this.renderSceneInteractiveElements();
        });
      }
      if (!this.flags.ingredientNightPhoenix) {
        this.createHotspot(layer, '74%', '36%', 'Frasco: Cinza de Fênix', () => {
          this.flags.ingredientNightPhoenix = true;
          this.showNotification('Coletado: Cinza de Fênix Noturna!', 'item');
          this.renderSceneInteractiveElements();
        });
      }
      if (!this.flags.ingredientEther) {
        this.createHotspot(layer, '82%', '36%', 'Frasco: Éter Rúnico', () => {
          this.flags.ingredientEther = true;
          this.showNotification('Coletado: Éter Rúnico Puro!', 'item');
          this.renderSceneInteractiveElements();
        });
      }

      if (this.flags.phase3Completed) {
        this.createHotspot(layer, '88%', '75%', 'Passagem para os Dormitórios', () => {
          this.changeChapter('phase_4');
        }, '#4ef0c4');
      }
    }

    // 5. FASE 4: DORMITÓRIO & PÁTIO DE ELIAS
    else if (scene === 'dormitory') {
      // Elias Crowe
      this.createHotspot(layer, '38%', '68%', 'Elias Crowe (Confrontar/Confiar)', () => {
        this.startDialogue('elias_confrontation', 'start');
      });

      // Baú com brasão dos Crowe
      this.createHotspot(layer, '78%', '76%', 'Baú Trancado dos Crowe', () => {
        this.examineCroweChest();
      }, '#5376c8');

      // Lareira com a chave oculta
      this.createHotspot(layer, '22%', '76%', 'Lareira de Pedra', () => {
        this.examineFireplace();
      });

      if (this.flags.firstDimensionalKeyObtained) {
        this.createHotspot(layer, '50%', '45%', 'Portal da Ala Lacrada (Usar Chave)', () => {
          this.changeChapter('phase_5');
        }, '#4ef0c4');
      }
    }

    // 6. FASE 5: A ALA LACRADA
    else if (scene === 'sealed_wing') {
      // Runas ocultas na parede (reveladas por REVELARE)
      this.createHotspot(layer, '50%', '35%', this.flags.wallRunesRevealed ? 'Runas Decifradas • Abertura' : 'Parede Suspeita (Use REVELARE)', () => {
        if (!this.flags.wallRunesRevealed) {
          this.showNotification('Use o feitiço REVELARE na barra inferior para manifestar as inscrições ocultas!', 'info');
        } else {
          this.showNotification('As runas arcanas estão visíveis e guiam o alinhamento das datas!', 'info');
        }
      }, '#a58ae8');

      // Galeria dos Retratos com Datas (1842, 1899, 1923)
      this.createHotspot(layer, '50%', '24%', 'Galeria Cronológica de Retratos', () => {
        this.openPortraitsPuzzle();
      }, '#5376c8');

      // Armadilha rúnica no chão
      this.createHotspot(layer, '50%', '82%', this.flags.trapDisarmed ? 'Armadilha Desarmada' : 'Círculo de Proteção Rúnica (Perigo!)', () => {
        this.interactRuneTrap();
      }, this.flags.trapDisarmed ? '#4ef0c4' : '#ff2a55');

      if (this.flags.secondKeyFragmentObtained) {
        this.createHotspot(layer, '88%', '55%', 'Acesso à Galeria das Mil Portas', () => {
          this.changeChapter('phase_6');
        }, '#4ef0c4');
      }
    }

    // 7. FASE 6: A GALERIA DAS MIL PORTAS
    else if (scene === 'gallery_doors') {
      PUZZLES.galleryDoors.doors.forEach((door, idx) => {
        const leftOffsets = ['14%', '30%', '50%', '70%', '86%'];
        const topOffsets = ['58%', '50%', '42%', '50%', '58%'];
        this.createHotspot(layer, leftOffsets[idx], topOffsets[idx], `${door.symbol} ${door.name}`, () => {
          this.inspectDimensionalDoor(door);
        }, door.id === 'stars' ? '#a58ae8' : '#b7b7c8');
      });

      // Pingente de Seraphine no chão flutuante
      if (!this.flags.seraphinePendantFound) {
        this.createHotspot(layer, '42%', '78%', 'Objeto no Chão do Vazio', () => {
          this.flags.seraphinePendantFound = true;
          this.addInventoryItem({ id: 'star_pendant', name: 'Pingente Estelar de Seraphine', icon: '✨', description: 'Um pingente de prata que ressoa intensamente perto da Porta das Estrelas.' });
          this.addClue({ id: 'clue_pendant', title: 'O Pingente Estelar', description: 'O pingente comprova que Seraphine atravessou a Porta das Estrelas rumo ao Entretempo.', location: 'Galeria das Mil Portas', date: 'Capítulo VI' });
          this.updateQuestStep(1);
          this.renderSceneInteractiveElements();
        });
      }
    }

    // 8. FASE 7: O REINO ONDE O TEMPO PAROU (ENTRETEMPO)
    else if (scene === 'timeless_realm') {
      // Seraphine Ashford
      this.createHotspot(layer, '50%', '64%', 'Seraphine Ashford (Resgatar)', () => {
        this.startDialogue('seraphine_meeting', 'start');
      }, '#4ef0c4');

      // Eco Temporal 1
      this.createHotspot(layer, '24%', '54%', this.flags.timelessEcho1Reconstructed ? 'Eco 1: O Segredo (Restaurado)' : 'Eco Temporal 1 (Use MEMORIA)', () => {
        this.interactEcho(1);
      }, '#5376c8');

      // Eco Temporal 2
      this.createHotspot(layer, '76%', '54%', this.flags.timelessEcho2Reconstructed ? 'Eco 2: O Ritual (Restaurado)' : 'Eco Temporal 2 (Use MEMORIA)', () => {
        this.interactEcho(2);
      }, '#5376c8');

      // Eco Temporal 3
      this.createHotspot(layer, '50%', '30%', this.flags.timelessEcho3Reconstructed ? 'Eco 3: A Fuga (Restaurado)' : 'Eco Temporal 3 (Use MEMORIA)', () => {
        this.interactEcho(3);
      }, '#5376c8');

      if (this.flags.ritualTruthRevealed) {
        this.createHotspot(layer, '50%', '85%', 'Fissura para a Câmara Central!', () => {
          this.changeChapter('phase_8');
        }, '#f72585');
      }
    }

    // 9. FASE 8: O RITUAL DAS TREZE BADALADAS
    else if (scene === 'central_chamber') {
      // Diretora Morgana Vale
      this.createHotspot(layer, '50%', '52%', 'Diretora Morgana Vale (Confronto)', () => {
        this.startDialogue('morgana_final', 'start');
      }, '#f72585');

      // Altar Central das 13 Badaladas
      this.createHotspot(layer, '50%', '76%', 'Altar Cósmico das 13 Badaladas', () => {
        this.openChimesPuzzle();
      }, '#4ef0c4');
    }

    // 10. EPÍLOGO: O OUTRO LADO
    else if (scene === 'epilogue_room') {
      // Nova carta na escrivaninha
      this.createHotspot(layer, '48%', '78%', 'Nova Carta sem Remetente', () => {
        this.examineEpilogueLetter();
      }, '#a58ae8');

      // A Chave Prateada Impossível
      this.createHotspot(layer, '56%', '78%', 'Chave Prateada Desconhecida', () => {
        this.examineEpilogueKey();
      }, '#d6e0ff');

      // Crônicas de Noctária (Balanço Final)
      this.createHotspot(layer, '50%', '64%', 'Crônicas de Noctária (Estatísticas Finais)', () => {
        this.openEpilogueSummaryModal();
      }, '#4ef0c4');
    }
  }

  createHotspot(parent, left, top, label, onClick, color = '#A58AE8') {
    const spot = document.createElement('div');
    spot.className = 'hotspot';
    spot.style.left = left;
    spot.style.top = top;
    spot.innerHTML = `
      <div class="hotspot-pulse"></div>
      <div class="hotspot-pin" style="background:${color};"></div>
      <div class="hotspot-label">${label}</div>
    `;
    spot.onclick = onClick;
    parent.appendChild(spot);
  }

  // --- INTERAÇÕES ESPECÍFICAS DE INVESTIGAÇÃO ---
  examinePrologueLetter() {
    this.flags.staircaseLetterExamined = true;
    this.openInspectModal(
      'Carta Caída na Escadaria',
      'Um envelope sem selo oficial de Noctária. A caligrafia é nervosa, traçada com tinta púrpura:\n\n“Quando o grande sino soar treze badaladas, não corra para as salas comuns. Procure a porta que não consta nos diagramas da fundação. Eles apagam o que não conseguem controlar.”',
      'Um primeiro indício vital foi gravado no seu diário de bordo.'
    );
    this.addClue({
      id: 'clue_thirteen_chimes_warning',
      title: 'O Aviso da Décima Terceira Badaladas',
      description: 'A carta misteriosa avisa sobre uma porta que se manifesta apenas quando o sino soa 13 badaladas.',
      location: 'Portões da Noite',
      date: 'Prólogo'
    });
    this.updateQuestStep(1);
    this.updateQuestStep(2);

    // Trigger 13 chimes sequence
    if (!this.flags.prologueChimeRang) {
      setTimeout(() => {
        this.triggerPrologueChimes();
      }, 800);
    }
  }

  triggerPrologueChimes() {
    this.flags.prologueChimeRang = true;
    this.saveGame();
    this.showNotification('🔔 DONG... DONG... O sino ancestral de Noctária toca TREZE vezes ecoando pela névoa!', 'quest');

    // Visual chime effect
    const fx = document.createElement('div');
    fx.className = 'spell-cast-fx';
    fx.style.background = 'radial-gradient(circle, rgba(165,138,232,0.8) 0%, rgba(8,12,29,0.9) 80%)';
    this.root.appendChild(fx);
    setTimeout(() => fx.remove(), 1600);

    this.renderSceneInteractiveElements();
  }

  interactPhantomDoor() {
    this.flags.phantomDoorVanished = true;
    this.saveGame();
    this.openInspectModal(
      'A Porta Fantasma',
      'Uma colossal moldura de pedra rúnica com entalhes de treze estrelas materializou-se no meio do saguão! Conforme você dá o primeiro passo em direção à maçaneta de prata, o ar vibra e a porta se dissolve no nada, deixando apenas cinzas flutuantes.',
      'O Prólogo foi concluído com sucesso. O Salão das Cinzas e o mistério de Seraphine aguardam você!'
    );
    this.updateQuestStep(3);
    this.completeCurrentPhase();
  }

  // --- FASE 1: INVESTIGAÇÕES ---
  examineNoticeBoard() {
    this.flags.noticeBoardExamined = true;
    this.openInspectModal(
      'Mural de Avisos dos Alunos',
      'Dezenas de panfletos sobre aulas de astrologia, duelos rúnicos e toques de recolher. No canto inferior, um aviso amarelado de mérito acadêmico teve o nome da aluna premiada riscado à tinta preta. Sob a luz inclinada, ainda é possível ler: "...phíne Ashf...d".',
      'Pista anotada: Parte do nome oculto foi resgatado.'
    );
    this.addClue({
      id: 'clue_mural_name',
      title: 'O Nome no Mural de Mérito',
      description: 'O mural menciona a estudante homenageada com as letras "...phíne Ashf...d".',
      location: 'Salão das Cinzas',
      date: 'Capítulo I'
    });
    this.checkPhase1Discovery();
  }

  examineErasedPortrait() {
    this.flags.erasedPhotoExamined = true;
    this.openInspectModal(
      'Retrato Adulterado',
      'Uma pintura a óleo da turma honorária de três anos atrás. O rosto da estudante que segura o astrolábio foi meticulosamente raspado com lâmina. No verso da moldura de mogno, uma inscrição a lápis diz: "S. A. — Turma 42".',
      'As iniciais batem exatamente com as letras encontradas no mural!'
    );
    this.addClue({
      id: 'clue_portrait_initials',
      title: 'As Iniciais S. A.',
      description: 'A aluna cujo rosto foi raspado assinava como S. A., pertencente à Turma 42.',
      location: 'Salão das Cinzas',
      date: 'Capítulo I'
    });
    this.checkPhase1Discovery();
  }

  examineAlteredLedger() {
    this.flags.alteredLedgerExamined = true;
    this.openInspectModal(
      'Livro de Matrículas Oficial de Noctária',
      'Um tomo solene encadernado em couro negro. Ao folhear as matrículas, você percebe que a folha referente ao número 42 foi arrancada à força rente à lombada. Alguém deixou um bilhete dobrado na fresta:\n\n“Ela não atravessou a porta sozinha.”',
      'A prova definitiva de que a aluna foi apagada dos registros públicos!'
    );
    this.addClue({
      id: 'clue_altered_ledger',
      title: 'A Página 42 Arrancada',
      description: 'O livro de matrículas confirma o apagamento oficial e traz o aviso: "Ela não atravessou a porta sozinha."',
      location: 'Salão das Cinzas',
      date: 'Capítulo I'
    });
    this.checkPhase1Discovery();
  }

  checkPhase1Discovery() {
    if (this.flags.noticeBoardExamined && this.flags.erasedPhotoExamined && this.flags.alteredLedgerExamined) {
      this.flags.seraphineNameDiscovered = true;
      this.updateQuestStep(3);
      this.addClue({
        id: 'clue_seraphine_revealed',
        title: 'Identidade Revelada: Seraphine Ashford',
        description: 'Cruzando as iniciais S.A., o mural de mérito e o fólio 42, você descobriu a identidade da estudante apagada: Seraphine Ashford!',
        location: 'Salão das Cinzas',
        date: 'Capítulo I'
      });
      this.showNotification('✦ Identidade Descoberta: Seraphine Ashford! Fale com Elias. ✦', 'quest');
      this.renderSceneInteractiveElements();
    }
  }

  // --- FASE 2: MANUSCRITO & PUZZLE ---
  checkManuscriptFragments() {
    if (this.flags.fragment1Found && this.flags.fragment2Found && this.flags.fragment3Found) {
      this.showNotification('Todos os 3 fragmentos foram recolhidos! Vá até o Púlpito de Decifração.', 'quest');
    }
  }

  openManuscriptPuzzle() {
    const f1 = this.flags.fragment1Found;
    const f2 = this.flags.fragment2Found;
    const f3 = this.flags.fragment3Found;

    if (!f1 || !f2 || !f3) {
      this.openInspectModal(
        'Púlpito de Decifração Rúnica',
        'O púlpito de veludo possui três encaixes para as páginas do manuscrito rasgado. Você ainda precisa encontrar todos os três fragmentos espalhados pela biblioteca.',
        `Fragmentos encontrados: ${(f1?1:0) + (f2?1:0) + (f3?1:0)} / 3`
      );
      return;
    }

    // Se já resolveu
    if (this.flags.manuscriptPuzzleSolved) {
      this.openInspectModal(
        'Manuscrito Decifrado',
        '“Quando as sombras cobrirem os olhos dos mundanos, rasgue o véu das pedras com a palavra ancestral e o que foi apagado clamará em luz violeta: REVELARE.”',
        'O feitiço REVELARE já foi dominado e repousa na sua barra de magias!'
      );
      return;
    }

    const frags = PUZZLES.manuscript.fragments;
    this.tempState.manuscriptOrder = [];

    const html = `
      <div class="puzzle-box">
        <div class="puzzle-header">
          <h3 class="puzzle-title">Reconstituição do Manuscrito Ancestral</h3>
          <p class="puzzle-desc">Ordene as páginas rasgadas para reconstruir a invocação completa do feitiço proibido.</p>
        </div>
        <div class="fragments-list" id="manuscript-frags-list">
          ${frags.map(f => `
            <div class="fragment-card" data-frag-id="${f.id}">
              <span class="fragment-text">“${f.text}”</span>
              <span class="fragment-badge" id="badge-${f.id}">Clique para selecionar</span>
            </div>
          `).join('')}
        </div>
        <div style="background:rgba(8,12,29,0.6); padding:12px; border-radius:4px; margin-bottom:16px;">
          <strong style="color:var(--color-luminous-purple); font-size:0.85rem;">Sequência Selecionada:</strong>
          <div id="manuscript-seq-display" style="color:#fff; font-style:italic; margin-top:6px;">Nenhum fragmento posicionado.</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn-gothic" id="btn-manuscript-hint" style="font-size:0.85rem;">Pedir Dica</button>
          <div style="display:flex; gap:10px;">
            <button class="btn-gothic" id="btn-manuscript-reset">Limpar</button>
            <button class="btn-gothic btn-primary" id="btn-manuscript-confirm">Decifrar Feitiço</button>
          </div>
        </div>
      </div>
    `;

    this.openModal('Enigma da Biblioteca Velada', html);

    const updateDisplay = () => {
      const display = document.getElementById('manuscript-seq-display');
      if (this.tempState.manuscriptOrder.length === 0) {
        display.innerText = 'Nenhum fragmento posicionado.';
      } else {
        display.innerText = this.tempState.manuscriptOrder.map((id, idx) => {
          const item = frags.find(f => f.id === id);
          return `${idx + 1}. “${item.text}”`;
        }).join(' → ');
      }
    };

    document.querySelectorAll('.fragment-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-frag-id');
        if (!this.tempState.manuscriptOrder.includes(id)) {
          this.tempState.manuscriptOrder.push(id);
          card.classList.add('selected');
          const badge = document.getElementById(`badge-${id}`);
          badge.innerText = `Posição ${this.tempState.manuscriptOrder.length}`;
          updateDisplay();
        }
      };
    });

    document.getElementById('btn-manuscript-reset').onclick = () => {
      this.tempState.manuscriptOrder = [];
      document.querySelectorAll('.fragment-card').forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.fragment-badge').innerText = 'Clique para selecionar';
      });
      updateDisplay();
    };

    document.getElementById('btn-manuscript-hint').onclick = () => {
      alert(PUZZLES.manuscript.hint);
    };

    document.getElementById('btn-manuscript-confirm').onclick = () => {
      // Correct order is frag_a (0), frag_b (1), frag_c (2)
      if (this.tempState.manuscriptOrder.length !== 3) {
        alert('Selecione todos os 3 fragmentos para compor o verso!');
        return;
      }
      if (this.tempState.manuscriptOrder[0] === 'frag_a' &&
          this.tempState.manuscriptOrder[1] === 'frag_b' &&
          this.tempState.manuscriptOrder[2] === 'frag_c') {
        this.flags.manuscriptPuzzleSolved = true;
        this.flags.revelareLearned = true;
        this.learnSpell('revelare');
        this.updateQuestStep(2);
        this.closeModal();
        this.openInspectModal(
          '✦ Feitiço REVELARE Aprendido! ✦',
          'As palavras arcanas ressoam na sua mente em harmonia perfeita:\n\n“Quando as sombras cobrirem os olhos dos mundanos, rasgue o véu das pedras com a palavra ancestral e o que foi apagado clamará em luz violeta: REVELARE.”\n\nAgora você pode ativar o feitiço REVELARE na barra inferior a qualquer momento para expor runas invisíveis e passagens seladas!',
          'O Laboratório de Alquimia foi destrancado!'
        );
        this.completeCurrentPhase();
      } else {
        alert('A sequência rúnica emitiu fumaça negra... Os versos não se encaixam harmoniosamente. Tente novamente!');
        document.getElementById('btn-manuscript-reset').click();
      }
    };
  }

  // --- FASE 3: CALDEIRÃO DE ALQUIMIA ---
  openAlchemyPuzzle() {
    const p3 = PUZZLES.alchemy;
    const hasAll = this.flags.ingredientLunarDew && this.flags.ingredientAshRoot && this.flags.ingredientNightPhoenix && this.flags.ingredientEther;

    if (!hasAll) {
      this.openInspectModal(
        'Caldeirão das Lembranças',
        'O caldeirão de ferro fundido queima em brasa violeta fria. Você ainda precisa coletar os quatro ingredientes nas prateleiras do laboratório:\n\n• Orvalho Lunar Destilado\n• Raiz de Mandrágora de Cinzas\n• Cinza de Fênix Noturna\n• Éter Rúnico Puro',
        'Converse com o Prof. Octavian e pegue os frascos nas estantes antes de misturar.'
      );
      return;
    }

    if (this.flags.potionBrewed) {
      this.openInspectModal(
        'Poção da Lembrança Pronta',
        'O elixir brilha com uma tonalidade azul-cobalto luminescente. A poção já foi destilada com sucesso!',
        'A visão sobre Seraphine e a Chave Dimensional já foi gravada em seu diário.'
      );
      return;
    }

    this.tempState.cauldronIngredients = [];

    const html = `
      <div class="puzzle-box">
        <div class="puzzle-header">
          <h3 class="puzzle-title">Destilação da Poção da Lembrança</h3>
          <p class="puzzle-desc">Adicione os ingredientes no caldeirão na ordem alquímica exata para recuperar a memória fragmentada.</p>
        </div>

        <div class="alchemy-cauldron-view">
          <div class="cauldron-steam">♨</div>
          <div class="cauldron-pot"></div>
          <div class="cauldron-state-tray" id="cauldron-state-tray">
            <span style="color:var(--color-text-dim); font-size:0.85rem;">Caldeirão vazio. Adicione o primeiro reagente.</span>
          </div>
        </div>

        <div class="alchemy-shelf">
          ${p3.ingredients.map(ing => `
            <button class="ingredient-btn" data-ing-id="${ing.id}">
              <span style="font-size:1.8rem;">🧪</span>
              <strong style="color:${ing.color}; font-size:0.9rem;">${ing.name}</strong>
              <span style="font-size:0.75rem; color:var(--color-text-dim); text-align:center;">${ing.desc}</span>
            </button>
          `).join('')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn-gothic" id="btn-alchemy-hint" style="font-size:0.85rem;">Consultar Celeste</button>
          <div style="display:flex; gap:10px;">
            <button class="btn-gothic" id="btn-alchemy-reset">Esvaziar Caldeirão</button>
            <button class="btn-gothic btn-primary" id="btn-alchemy-brew">Concluir Infusão</button>
          </div>
        </div>
      </div>
    `;

    this.openModal('Bancada Alquímica de Lembranças', html);

    const updateCauldronTray = () => {
      const tray = document.getElementById('cauldron-state-tray');
      if (this.tempState.cauldronIngredients.length === 0) {
        tray.innerHTML = '<span style="color:var(--color-text-dim); font-size:0.85rem;">Caldeirão vazio. Adicione o primeiro reagente.</span>';
      } else {
        tray.innerHTML = this.tempState.cauldronIngredients.map((id, idx) => {
          const item = p3.ingredients.find(i => i.id === id);
          return `<span class="added-pill" style="background:${item.color}; color:#080c1d; font-weight:bold;">${idx + 1}. ${item.name}</span>`;
        }).join('');
      }
    };

    document.querySelectorAll('.ingredient-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-ing-id');
        if (!this.tempState.cauldronIngredients.includes(id)) {
          this.tempState.cauldronIngredients.push(id);
          btn.disabled = true;
          updateCauldronTray();
        }
      };
    });

    document.getElementById('btn-alchemy-reset').onclick = () => {
      this.tempState.cauldronIngredients = [];
      document.querySelectorAll('.ingredient-btn').forEach(b => b.disabled = false);
      updateCauldronTray();
    };

    document.getElementById('btn-alchemy-hint').onclick = () => {
      alert('Celeste sussurra: "Primeiro a base líquida (Orvalho Lunar), depois a âncora de memórias (Raiz de Mandrágora), inflame o tempo (Cinza de Fênix) e estabilize com o Éter Rúnico!"');
    };

    document.getElementById('btn-alchemy-brew').onclick = () => {
      if (this.tempState.cauldronIngredients.length !== 4) {
        alert('Adicione todos os 4 ingredientes antes de concluir a infusão!');
        return;
      }

      const expected = p3.correctOrder;
      const actual = this.tempState.cauldronIngredients;
      const isCorrect = expected.every((val, idx) => val === actual[idx]);

      if (isCorrect) {
        this.flags.potionBrewed = true;
        this.addInventoryItem({
          id: 'memory_potion',
          name: 'Poção da Lembrança Destilada',
          icon: '🧪',
          description: 'Um elixir brilhante capaz de reacender memórias que foram apagadas do tecido do tempo.'
        });
        this.updateQuestStep(2);
        this.closeModal();
        this.openPotionConsumptionChoice();
      } else {
        alert('O caldeirão ferveu em tom lamacento e emitiu cheiro de enxofre... A ordem dos ingredientes estava errada! Celeste rapidamente esvazia a mistura para evitar acidentes.');
        document.getElementById('btn-alchemy-reset').click();
      }
    };
  }

  openPotionConsumptionChoice() {
    const html = `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:3rem; margin-bottom:12px;">🧪</div>
        <h3 style="font-family:var(--font-title); font-size:1.4rem; color:var(--color-luminous-purple); margin-bottom:12px;">Quem Deve Ingerir a Poção da Lembrança?</h3>
        <p style="color:var(--color-lunar-white); font-size:1rem; margin-bottom:24px; line-height:1.6;">
          O frasco vibra em suas mãos. Ingerir o elixir abrirá os olhos para as memórias impregnadas nas pedras de Noctária. Você deve beber pessoalmente ou pedir que Elias Crowe tome a poção?
        </p>
        <div style="display:flex; flex-direction:column; gap:12px; max-width:480px; margin:0 auto;">
          <button class="btn-gothic btn-primary" id="choice-drink-self">
            <span>Beber Pessoalmente a Poção</span>
          </button>
          <button class="btn-gothic" id="choice-drink-elias">
            <span>Pedir que Elias Crowe Beba</span>
          </button>
        </div>
      </div>
    `;
    this.openModal('Decisão de Lembrança', html);

    document.getElementById('choice-drink-self').onclick = () => {
      this.state.player.choices.potionDrinker = 'self';
      this.showMemoryVision('Você bebe o líquido frio como a noite. Seus olhos são inundados por visões do passado: Seraphine Ashford corre desesperada pelos corredores, segurando uma chave de ébano e encarando a Porta das Estrelas com o mesmo selo da sua carta de convocação!');
    };

    document.getElementById('choice-drink-elias').onclick = () => {
      this.state.player.choices.potionDrinker = 'elias';
      this.state.player.relationships.elias += 2;
      this.showMemoryVision('Elias hesita, mas bebe a poção por você. Ele cambaleia, segurando a cabeça, e exclama: "Eu me lembro agora! Minha família escondia a chave de ébano... e Seraphine me pediu para guardá-la antes de correr para a Porta das Estrelas!"');
    };
  }

  showMemoryVision(text) {
    this.flags.memoryVisionSeen = true;
    this.addClue({
      id: 'clue_vision_star_door',
      title: 'A Visão da Porta das Estrelas',
      description: 'A memória revelou Seraphine segurando a Chave de Ébano diante da monumental Porta das Estrelas.',
      location: 'Laboratório de Alquimia',
      date: 'Capítulo III'
    });
    this.updateQuestStep(3);
    this.closeModal();
    this.openInspectModal(
      'Visão de Memória Recuperada',
      text,
      'Fase 3 Concluída! Agora você precisa confrontar Elias no Dormitório da Noite.'
    );
    this.completeCurrentPhase();
  }

  // --- FASE 4: O SEGREDO DE ELIAS ---
  examineFireplace() {
    if (!this.flags.dormitoryKeyFound) {
      this.flags.dormitoryKeyFound = true;
      this.addInventoryItem({
        id: 'crowe_chest_key',
        name: 'Chave de Ferro da Família Crowe',
        icon: '🗝',
        description: 'Uma chave de ferro antiga ornamentada com o símbolo de um corvo pousado sobre uma fechadura.'
      });
      this.updateQuestStep(0);
      this.openInspectModal(
        'Lareira do Dormitório',
        'Atrás de um tijolo falso na base da chaminé, você encontra uma chave de ferro negra, escondida longe dos olhares da diretoria.',
        'Essa chave parece pertencer ao baú gravado no canto do quarto!'
      );
    } else {
      this.openInspectModal('Lareira de Pedra', 'As brasas continuam crepitando suavemente. A chave do baú já foi recolhida daqui.');
    }
  }

  examineCroweChest() {
    if (!this.flags.dormitoryKeyFound) {
      this.showNotification('O baú está trancado com o selo do corvo. Procure pela chave no quarto!', 'info');
      return;
    }

    if (!this.flags.eliasDiaryRead) {
      this.flags.eliasDiaryRead = true;
      this.addInventoryItem({
        id: 'elias_diary',
        name: 'Diário Secreto dos Crowe',
        icon: '🕮',
        description: 'Registros confessionais da família Crowe sobre as Mil Portas e o ritual proibido.'
      });
      this.addClue({
        id: 'clue_crowe_lineage',
        title: 'O Legado dos Guardiões Crowe',
        description: 'O diário comprova que a família de Elias foi designada para proteger a Chave Dimensional contra a Diretora Morgana.',
        location: 'Dormitório da Noite',
        date: 'Capítulo IV'
      });
      this.updateQuestStep(1);
      this.openInspectModal(
        'Diário Secreto da Linhagem Crowe',
        'Você abre o pesado baú de ferro e encontra o diário de couro gasto de Elias:\n\n“A Diretora Morgana planeja consumir a memória de mais sete estudantes para manter a galeria estável. Seraphine me implorou para esconder a Chave de Ébano. Se ela for capturada, caberá a mim entregar a chave àquele que carregar a carta das treze estrelas.”',
        'Você agora possui a prova necessária para conversar com Elias!'
      );
      this.renderSceneInteractiveElements();
    } else {
      this.openInspectModal('Baú dos Crowe', 'O diário de Elias já foi retirado. As páginas detalham os rituais das Mil Portas.');
    }
  }

  // --- FASE 5: ALA LACRADA & RETRATOS ---
  openPortraitsPuzzle() {
    if (this.flags.portraitPuzzleSolved) {
      this.openInspectModal(
        'Galeria dos Retratos Harmonizada',
        'A sequência cronológica correta (1842 → 1899 → 1923) desativou o selamento da porta e revelou o espelho espectral da Diretora Morgana!',
        'O fragmento de chave já foi recolhido.'
      );
      return;
    }

    this.tempState.portraitsSelected = [];
    const html = `
      <div class="puzzle-box">
        <div class="puzzle-header">
          <h3 class="puzzle-title">Alinhamento Cronológico dos Fundadores</h3>
          <p class="puzzle-desc">Ordene as pinturas da galeria segundo a cronologia histórica dos acontecimentos proibidos.</p>
        </div>
        <div class="fragments-list">
          <div class="fragment-card" data-date="1899">
            <span class="fragment-text"><strong>Ano 1899:</strong> O Grande Incêndio Rúnico e o primeiro selamento das Mil Portas.</span>
            <span class="fragment-badge" id="date-badge-1899">Selecionar</span>
          </div>
          <div class="fragment-card" data-date="1842">
            <span class="fragment-text"><strong>Ano 1842:</strong> Fundação da Ala Oeste pelo Primeiro Arquivista Crowe.</span>
            <span class="fragment-badge" id="date-badge-1842">Selecionar</span>
          </div>
          <div class="fragment-card" data-date="1923">
            <span class="fragment-text"><strong>Ano 1923:</strong> O Conclave Secreto da Diretora Morgana Vale antes do isolamento definitivo.</span>
            <span class="fragment-badge" id="date-badge-1923">Selecionar</span>
          </div>
        </div>
        <div style="background:rgba(8,12,29,0.6); padding:12px; border-radius:4px; margin-bottom:16px;">
          <strong style="color:var(--color-luminous-purple); font-size:0.85rem;">Ordem Escolhida:</strong>
          <div id="portrait-order-display" style="color:#fff; margin-top:4px;">Nenhuma data selecionada.</div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn-gothic" id="btn-portrait-reset">Limpar</button>
          <button class="btn-gothic btn-primary" id="btn-portrait-confirm">Alinhar Retratos</button>
        </div>
      </div>
    `;
    this.openModal('Enigma dos Retratos da Mansão', html);

    const updateDisplay = () => {
      const disp = document.getElementById('portrait-order-display');
      if (this.tempState.portraitsSelected.length === 0) {
        disp.innerText = 'Nenhuma data selecionada.';
      } else {
        disp.innerText = this.tempState.portraitsSelected.join(' → ');
      }
    };

    document.querySelectorAll('.fragment-card').forEach(card => {
      card.onclick = () => {
        const d = card.getAttribute('data-date');
        if (!this.tempState.portraitsSelected.includes(d)) {
          this.tempState.portraitsSelected.push(d);
          card.classList.add('selected');
          document.getElementById(`date-badge-${d}`).innerText = `Ordem ${this.tempState.portraitsSelected.length}`;
          updateDisplay();
        }
      };
    });

    document.getElementById('btn-portrait-reset').onclick = () => {
      this.tempState.portraitsSelected = [];
      document.querySelectorAll('.fragment-card').forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.fragment-badge').innerText = 'Selecionar';
      });
      updateDisplay();
    };

    document.getElementById('btn-portrait-confirm').onclick = () => {
      if (this.tempState.portraitsSelected.length !== 3) {
        alert('Selecione todos os três retratos em ordem cronológica!');
        return;
      }
      if (this.tempState.portraitsSelected[0] === '1842' &&
          this.tempState.portraitsSelected[1] === '1899' &&
          this.tempState.portraitsSelected[2] === '1923') {
        this.flags.portraitPuzzleSolved = true;
        this.flags.secondKeyFragmentObtained = true;
        this.addInventoryItem({
          id: 'second_key_fragment',
          name: 'Segundo Fragmento da Chave Dimensional',
          icon: '🗝',
          description: 'A metade complementar da Chave de Ébano necessária para desbloquear a Galeria das Mil Portas.'
        });
        this.addClue({
          id: 'clue_morgana_ritual_proof',
          title: 'A Gravação Secreta de Morgana',
          description: 'O espelho espectral revelou a Diretora Morgana conduzindo o ritual proibido do Vazio em 1923.',
          location: 'A Ala Lacrada',
          date: 'Capítulo V'
        });
        this.updateQuestStep(1);
        this.updateQuestStep(2);
        this.closeModal();
        this.openInspectModal(
          '✦ Gravação Mágica Manifestada! ✦',
          'Um espectro prateado se ergue do espelho trincado:\n\nA figura jovem da Diretora Morgana Vale entoa o cântico proibido enquanto almas de alunos se dissipam em fumaça violeta. Ela diz:\n\n“Que o sacrifício mantenha o limiar fechado. Que ninguém nunca saiba o que repousa do outro lado.”\n\nCom o alinhamento, o Segundo Fragmento de Chave caiu sobre o pedestal!',
          'A Galeria das Mil Portas foi desbloqueada!'
        );
        this.completeCurrentPhase();
      } else {
        alert('Os retratos vibraram em vermelho... A ordem histórica está incorreta! Lembre-se de organizar do ano mais antigo para o mais recente.');
        document.getElementById('btn-portrait-reset').click();
      }
    };
  }

  interactRuneTrap() {
    if (this.flags.trapDisarmed) {
      this.showNotification('O círculo de armadilha já foi neutralizado com REVELARE.', 'info');
      return;
    }
    if (!this.flags.wallRunesRevealed) {
      this.showNotification('⚠️ A armadilha estala com eletricidade mágica letal! Use REVELARE para identificar os pontos de escape!', 'info');
    } else {
      this.flags.trapDisarmed = true;
      this.updateQuestStep(0);
      this.saveGame();
      this.showNotification('✦ As runas de segurança foram ativadas! Armadilha mágica desarmada com sucesso! ✦', 'quest');
      this.renderSceneInteractiveElements();
    }
  }

  // --- FASE 6: GALERIA DAS MIL PORTAS ---
  inspectDimensionalDoor(door) {
    if (door.id === 'stars') {
      this.flags.doorsExamined.stars = true;
      this.openInspectModal(
        door.name,
        `${door.desc}\n\nSom ressonante: ${door.sound}\n\nA Chave de Ébano ressoa fervorosamente no seu bolso! Use o feitiço APERTURA para quebrar o selo da Porta das Estrelas!`,
        'Esta é a porta que conduz à dimensão do Entretempo!'
      );
    } else {
      this.flags.doorsExamined[door.id] = true;
      this.openInspectModal(
        door.name,
        `${door.desc}\n\nSom emitido: ${door.sound}`,
        'As chaves em seu bolso permanecem frias. Esta porta leva a dimensões perigosas ou desabitadas.'
      );
    }
  }

  // --- FASE 7: ECOS TEMPORAIS NO ENTRETEMPO ---
  interactEcho(echoNumber) {
    const flagKey = `timelessEcho${echoNumber}Reconstructed`;
    if (this.flags[flagKey]) {
      this.showNotification(`O Eco ${echoNumber} já foi resgatado com MEMORIA.`, 'info');
      return;
    }

    if (this.activeSpell !== 'memoria') {
      this.showNotification(`⚠️ Ative o feitiço MEMORIA na barra inferior para reconstruir este eco espectral!`, 'info');
      return;
    }

    this.flags[flagKey] = true;
    this.updateQuestStep(echoNumber - 1);

    if (echoNumber === 1) {
      this.openInspectModal(
        'Eco Temporal 1: O Segredo do Ritual',
        'O feitiço MEMORIA materializa o eco de Seraphine nos arquivos proibidos:\n\n“Eles mentiram para todos nós... A academia não é apenas um santuário de magia; é uma prisão construída sobre a garganta de uma criatura cósmica. O ritual das treze badaladas precisa das nossas memórias como alimento!”'
      );
    } else if (echoNumber === 2) {
      this.openInspectModal(
        'Eco Temporal 2: A Traição de Morgana',
        'O eco mostra a Diretora Morgana selando as portas:\n\n“Sinto muito, Seraphine. Você era a mais promissora. Mas se você revelar isso aos alunos, o pânico quebrará os pilares de contenção antes do solstício.”'
      );
    } else if (echoNumber === 3) {
      this.openInspectModal(
        'Eco Temporal 3: O Selamento de Seraphine',
        'Seraphine grava sua última mensagem na carta antes de ser sugada pelo portal:\n\n“Não poderei voltar... mas deixarei a carta nos portões da entrada. Um dia, outro estudante com olhos atentos encontrará o caminho.”'
      );
    }

    // Check if all 3 echoes reconstructed
    if (this.flags.timelessEcho1Reconstructed && this.flags.timelessEcho2Reconstructed && this.flags.timelessEcho3Reconstructed) {
      this.flags.ritualTruthRevealed = true;
      this.saveGame();
      this.showNotification('✦ Todos os 3 Ecos foram reconstruídos! Seraphine despertou da estase temporal! ✦', 'quest');
      this.renderSceneInteractiveElements();
    }
  }

  // --- FASE 8: ALINHAMENTO DAS 13 BADALADAS & FINAIS ---
  openChimesPuzzle() {
    if (this.flags.endingReached) {
      this.openInspectModal(
        'O Altar Cósmico Selado',
        'O ritual das treze badaladas foi concluído e o destino de Noctária já foi definido nesta jornada.',
        'Visite seus aposentos no Epílogo para examinar a nova mensagem do além.'
      );
      return;
    }

    this.tempState.chimesSelected = [];

    const html = `
      <div class="puzzle-box">
        <div class="puzzle-header">
          <h3 class="puzzle-title">Alinhamento das Treze Badaladas Cósmicas</h3>
          <p class="puzzle-desc">Ative as 4 badaladas mestras na ordem sagrada revelada pelas pistas (1 → 3 → 7 → 13) para desbloquear a decisão suprema.</p>
        </div>

        <div class="chimes-grid" id="chimes-grid-container">
          ${Array.from({ length: 13 }, (_, i) => i + 1).map(num => `
            <button class="chime-btn" data-chime="${num}">${num}</button>
          `).join('')}
        </div>

        <div style="background:rgba(8,12,29,0.7); padding:14px; border-radius:6px; margin-bottom:16px;">
          <strong style="color:var(--color-luminous-purple); font-size:0.85rem;">Frequências Acionadas:</strong>
          <div id="chimes-display" style="color:#fff; font-size:1.1rem; margin-top:4px;">Nenhuma badalada acionada.</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn-gothic" id="btn-chimes-reset">Silenciar Pêndulos</button>
          <button class="btn-gothic btn-primary" id="btn-chimes-confirm">Consagrar Alinhamento</button>
        </div>
      </div>
    `;

    this.openModal('O Ritual das Treze Badaladas', html);

    const updateDisplay = () => {
      const disp = document.getElementById('chimes-display');
      if (this.tempState.chimesSelected.length === 0) {
        disp.innerText = 'Nenhuma badalada acionada.';
      } else {
        disp.innerText = this.tempState.chimesSelected.join(' 🔔 → ') + ' 🔔';
      }
    };

    document.querySelectorAll('.chime-btn').forEach(btn => {
      btn.onclick = () => {
        const num = parseInt(btn.getAttribute('data-chime'));
        if (!this.tempState.chimesSelected.includes(num)) {
          this.tempState.chimesSelected.push(num);
          btn.classList.add('active');
          updateDisplay();
        }
      };
    });

    document.getElementById('btn-chimes-reset').onclick = () => {
      this.tempState.chimesSelected = [];
      document.querySelectorAll('.chime-btn').forEach(b => b.classList.remove('active'));
      updateDisplay();
    };

    document.getElementById('btn-chimes-confirm').onclick = () => {
      const expected = PUZZLES.thirteenChimes.correctSequence;
      const actual = this.tempState.chimesSelected;
      const isMatch = expected.length === actual.length && expected.every((val, i) => val === actual[i]);

      if (isMatch) {
        this.flags.thirteenChimesSolved = true;
        this.closeModal();
        this.openFinalChoicesModal();
      } else {
        alert('As badaladas ressoaram em dissonância estridente... A sequência harmônica descrita nas pistas deve ser exatamente: 1 (início), 3 (véus), 7 (chaves) e 13 (a porta). Tente novamente!');
        document.getElementById('btn-chimes-reset').click();
      }
    };
  }

  openFinalChoicesModal() {
    const relElias = this.state.player.relationships.elias || 0;
    const relSeraphine = this.state.player.relationships.seraphine || 0;

    const html = `
      <div class="endings-modal-view">
        <h2 style="font-family:var(--font-title); font-size:1.6rem; color:#fff; margin-bottom:8px;">O Destino de Noctária</h2>
        <p style="color:var(--color-text-dim); margin-bottom:24px;">
          O Altar Cósmico vibra em uníssono. As Chaves Dimensionais respondem à sua alma. Seraphine, Elias e Morgana aguardam a sua decisão irreversível.
        </p>

        <div class="ending-choice-card" id="choice-ending-1">
          <div class="ending-choice-title">
            <span>🛡</span>
            <span>Final 1 — As Portas Seladas</span>
          </div>
          <p class="ending-choice-desc">
            Encerre definitivamente o ritual. Quebre as Chaves Dimensionais e feche para sempre os portais para o Vazio. Seraphine é salva e as almas dos estudantes são libertadas, mas a academia perderá grande parte de sua magia antiga para se tornar um refúgio seguro.
          </p>
        </div>

        <div class="ending-choice-card" id="choice-ending-2">
          <div class="ending-choice-title">
            <span>👑</span>
            <span>Final 2 — O Novo Guardião</span>
          </div>
          <p class="ending-choice-desc">
            Afaste Morgana Vale e assuma pessoalmente o posto de Grão-Mestre e Guardião das Mil Portas. Ao lado de Seraphine e Elias, você governará Noctária sob uma nova ordem de equilíbrio, sem sacrificar a mente dos inocentes.
          </p>
        </div>

        <div class="ending-choice-card" id="choice-ending-3">
          <div class="ending-choice-title">
            <span>🌀</span>
            <span>Final 3 — A Porta Proibida</span>
          </div>
          <p class="ending-choice-desc">
            Altere a matriz cósmica do ritual e escancare a 13ª porta desconhecida. Um manancial infinito de poder arcano inunda Noctária. O mistério é desvendado na totalidade, mas uma entidade dimensional antiga cruza o limiar para o mundo real.
          </p>
        </div>
      </div>
    `;

    this.openModal('O Julgamento das Treze Badaladas', html);

    document.getElementById('choice-ending-1').onclick = () => {
      this.triggerEnding('sealed');
    };
    document.getElementById('choice-ending-2').onclick = () => {
      this.triggerEnding('guardian');
    };
    document.getElementById('choice-ending-3').onclick = () => {
      this.triggerEnding('forbidden');
    };
  }

  triggerEnding(endingType) {
    this.state.player.choices.endingChosen = endingType;
    this.flags.endingReached = true;
    this.closeModal();

    let title = '';
    let cinematicText = '';

    if (endingType === 'sealed') {
      title = 'FINAL 1 — AS PORTAS SELADAS';
      cinematicText = `
        Com um golpe firme das chaves no altar de obsidiana, os selos dimensionais colapsam em uma onda de choque que extingue as tochas violetas.
        
        As fissuras cósmicas se fecham uma a uma. Seraphine cai de joelhos, respirando o ar puro do mundo real sem a ameaça do apagamento. Elias descansa a mão sobre seu ombro, aliviado por sua família finalmente ser libertada de seu fardo de séculos.
        
        A Diretora Morgana aceita a derrota em silêncio. Noctária perdeu seus portais sobrenaturais e parte de seu esplendor mítico, mas nenhuma alma jamais será sacrificada à escuridão novamente.
      `;
    } else if (endingType === 'guardian') {
      title = 'FINAL 2 — O NOVO GUARDIÃO';
      cinematicText = `
        Você canaliza o poder do alinhamento das 13 badaladas através do seu próprio espírito. A coroa de névoa violeta repousa sobre a sua cabeça. Morgana curva a cabeça em reverência e entrega o bastão de Grã-Mestra.
        
        Seraphine assume os Arquivos Proibidos, restaurando a memória de todos os que foram apagados. Elias Crowe torna-se o Capitão dos Portões da Noite.
        
        Sob sua liderança, as Mil Portas permanecem vivas e ativas, vigiadas por aqueles que conhecem o valor da verdade e a força da união.
      `;
    } else if (endingType === 'forbidden') {
      title = 'FINAL 3 — A PORTA PROIBIDA';
      cinematicText = `
        Você gira as chaves no sentido oposto às estrelas, rasgando o próprio tecido que separava o mundo mortal da 13ª dimensão proibida.
        
        Uma luz ofuscante além de qualquer espectro conhecido banha a câmara subterrânea. Poder absoluto e conhecimentos esquecidos inundam a mente de todos em Noctária.
        
        Mas no centro da galeria, uma silhueta colossal de olhos estelares atravessa o portal aberto e pisa na pedra... O mundo jamais será o mesmo.
      `;
    }

    const html = `
      <div style="text-align:center; padding:16px 0;">
        <div style="font-size:3.5rem; color:#4ef0c4; margin-bottom:12px;">✦ ✦ ✦</div>
        <h2 style="font-family:var(--font-title); font-size:1.8rem; color:#fff; margin-bottom:16px;">${title}</h2>
        <div style="background:rgba(8,12,29,0.85); border:1px solid var(--color-arcane-purple); padding:20px; border-radius:6px; max-width:680px; margin:0 auto 24px auto; text-align:left; line-height:1.8; color:var(--color-lunar-white); font-size:1.05rem;">
          ${cinematicText.replace(/\n\n/g, '<br><br>')}
        </div>
        <button class="btn-gothic btn-primary" id="btn-proceed-epilogue">
          Avançar para o Epílogo
        </button>
      </div>
    `;

    this.openModal('Desfecho da Grande Jornada', html);

    document.getElementById('btn-proceed-epilogue').onclick = () => {
      this.closeModal();
      this.completeCurrentPhase();
    };
  }

  // --- EPÍLOGO: O OUTRO LADO ---
  examineEpilogueLetter() {
    this.flags.epilogueLetterRead = true;
    this.updateQuestStep(0);
    this.openInspectModal(
      'A Nova Carta sem Remetente',
      'A luz suave da alvorada entra pela janela do seu aposento em Noctária. Sobre a escrivaninha de mogno, uma nova carta de pergaminho negro repousa ao lado da vela apagada.\n\nO selo de cera violeta traz novamente o brasão de treze estrelas... Mas agora a inscrição em tinta prateada viva diz:\n\n“O limiar foi apenas o primeiro passo. As Mil Portas agora conhecem o seu reflexo. O que despertou do outro lado aguarda o seu chamado.”',
      'Um convite para as fronteiras desconhecidas que existem além do mapa de Noctária.'
    );
  }

  examineEpilogueKey() {
    this.flags.epilogueKeyExamined = true;
    this.updateQuestStep(1);
    this.openInspectModal(
      'A Chave Prateada Impossível',
      'Uma chave forjada em prata cósmica, fria ao toque e incrivelmente leve. Suas ranhuras têm uma geometria tridimensional impossível que parece mudar de forma conforme a luz do amanhecer incide sobre ela.\n\nEla não se encaixa em nenhuma fechadura da academia existente na Terra...',
      'Esta chave foi adicionada permanentemente às suas relíquias arcanas.'
    );
    this.addInventoryItem({
      id: 'impossible_silver_key',
      name: 'Chave Prateada Impossível',
      icon: '🗝',
      description: 'Uma chave de geometria mutável que pertence a um reino além das Mil Portas conhecidas.'
    });
  }

  openEpilogueSummaryModal() {
    this.updateQuestStep(2);
    const endingNames = {
      sealed: 'Final 1 — As Portas Seladas',
      guardian: 'Final 2 — O Novo Guardião',
      forbidden: 'Final 3 — A Porta Proibida'
    };
    const endingText = endingNames[this.state.player.choices.endingChosen] || 'Jornada Concluída';

    const html = `
      <div style="line-height:1.8; color:var(--color-lunar-white);">
        <div style="text-align:center; margin-bottom:20px;">
          <h3 style="font-family:var(--font-title); font-size:1.6rem; color:var(--color-luminous-purple);">Crônicas de Noctária • Relatório Final</h3>
          <p style="color:var(--color-text-dim); font-size:0.95rem;">Resumo de sua jornada pela Academia das Mil Portas</p>
        </div>

        <div style="background:rgba(8,12,29,0.7); border:1px solid rgba(183,183,200,0.25); border-radius:6px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <strong style="color:var(--color-luminous-purple);">Desfecho Conquistado:</strong>
            <span style="font-weight:bold; color:#4ef0c4;">${endingText}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <strong style="color:var(--color-luminous-purple);">Pistas Investigadas:</strong>
            <span>${this.state.player.clues.length} pistas catalogadas</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <strong style="color:var(--color-luminous-purple);">Feitiços Dominados:</strong>
            <span>${this.state.player.spells.length} (REVELARE, APERTURA, MEMORIA)</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <strong style="color:var(--color-luminous-purple);">Relíquias Coletadas:</strong>
            <span>${this.state.player.inventory.length} itens arcanos</span>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <h4 style="font-family:var(--font-title); color:var(--color-aged-silver); margin-bottom:8px;">Afinidades com Companheiros</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div style="background:rgba(16,23,47,0.8); padding:8px 12px; border-radius:4px;">
              Elias Crowe: <strong style="color:#4ef0c4;">+${this.state.player.relationships.elias || 0}</strong>
            </div>
            <div style="background:rgba(16,23,47,0.8); padding:8px 12px; border-radius:4px;">
              Seraphine Ashford: <strong style="color:#4ef0c4;">+${this.state.player.relationships.seraphine || 0}</strong>
            </div>
            <div style="background:rgba(16,23,47,0.8); padding:8px 12px; border-radius:4px;">
              Prof. Octavian: <strong style="color:#4ef0c4;">+${this.state.player.relationships.octavian || 0}</strong>
            </div>
            <div style="background:rgba(16,23,47,0.8); padding:8px 12px; border-radius:4px;">
              Diretora Morgana: <strong style="color:#a58ae8;">${this.state.player.relationships.morgana || 0}</strong>
            </div>
          </div>
        </div>

        <div style="text-align:center; padding:12px; background:rgba(165,138,232,0.1); border-radius:6px; border:1px dashed var(--color-arcane-purple);">
          <strong style="color:#fff; font-family:var(--font-title);">“Noctária nunca dorme. A porta está aberta.”</strong>
          <p style="font-size:0.85rem; color:var(--color-text-dim); margin-top:4px;">Parabéns por desvendar todos os segredos das Mil Portas!</p>
        </div>

        <div style="text-align:right; margin-top:20px;">
          <button class="btn-gothic" id="summary-back-btn">Fechar Crônica</button>
        </div>
      </div>
    `;

    this.openModal('Crônicas de Noctária • Conclusão', html);
    document.getElementById('summary-back-btn').onclick = () => this.closeModal();
  }

  // --- MAPA E VIAGEM RÁPIDA ENTRE CENÁRIOS DESBLOQUEADOS ---
  openMapModal() {
    const scenes = this.state.unlockedScenes;
    const chapters = Object.values(PHASES_CONFIG);

    const html = `
      <div>
        <p style="color:var(--color-text-dim); margin-bottom:14px; font-style:italic;">
          Consulte as alas e dimensões de Noctária exploradas durante a sua jornada. Você pode se deslocar livremente entre qualquer cenário destrancado.
        </p>
        <div class="map-locations-grid">
          ${chapters.map(ch => {
            const isUnlocked = scenes.includes(ch.scene);
            const isCurrent = this.state.currentScene === ch.scene;
            return `
              <div class="map-card ${isUnlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''}" data-scene="${ch.scene}" data-chapter="${ch.id}">
                <div class="map-card-phase">${ch.title.split('—')[0]}</div>
                <div class="map-card-name">${ch.locationName}</div>
                <div style="font-size:0.75rem; color:${isCurrent ? '#4ef0c4' : (isUnlocked ? 'var(--color-text-dim)' : '#ff6b6b')};">
                  ${isCurrent ? '● Localização Atual' : (isUnlocked ? '✦ Clique para Viajar' : '🔒 Bloqueado nesta fase')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.openModal('Mapa dos Portais de Noctária', html);

    document.querySelectorAll('.map-card:not(.locked)').forEach(card => {
      card.onclick = () => {
        const sc = card.getAttribute('data-scene');
        const ch = card.getAttribute('data-chapter');
        this.closeModal();
        this.changeScene(sc);
        this.showNotification(`Você viajou para: ${PHASES_CONFIG[ch].locationName}`, 'info');
      };
    });
  }

  // --- SISTEMA DE FEITIÇOS ---
  castSpell(spellId) {
    this.activeSpell = spellId;
    this.renderGameWorld();

    // Trigger visual spell animation effect
    const fx = document.createElement('div');
    fx.className = 'spell-cast-fx';
    if (spellId === 'revelare') fx.style.background = 'radial-gradient(circle, rgba(165,138,232,0.6) 0%, rgba(83,118,200,0.3) 60%, transparent 80%)';
    if (spellId === 'memoria') fx.style.background = 'radial-gradient(circle, rgba(83,118,200,0.6) 0%, rgba(118,80,184,0.3) 60%, transparent 80%)';
    if (spellId === 'apertura') fx.style.background = 'radial-gradient(circle, rgba(232,232,242,0.6) 0%, rgba(78,240,196,0.3) 60%, transparent 80%)';
    this.root.appendChild(fx);
    setTimeout(() => fx.remove(), 1200);

    // Efeitos contextuais por feitiço
    if (spellId === 'revelare') {
      if (this.state.currentScene === 'sealed_wing') {
        if (!this.flags.wallRunesRevealed) {
          this.flags.wallRunesRevealed = true;
          this.saveGame();
          this.showNotification('✦ REVELARE rasga o véu arcano! As runas da parede e as fraquezas da armadilha se iluminaram! ✦', 'spell');
          this.renderSceneInteractiveElements();
        } else {
          this.showNotification('REVELARE brilha forte, revelando marcas ocultas na pedra.', 'info');
        }
      } else {
        this.showNotification('REVELARE ressoa no ar, varrendo o espaço em busca de ilusões.', 'info');
      }
    } else if (spellId === 'apertura') {
      if (this.state.currentScene === 'gallery_doors') {
        if (this.flags.doorsExamined.stars) {
          this.flags.correctStarDoorOpened = true;
          this.saveGame();
          this.showNotification('🗝 APERTURA ressoa nas treze estrelas! O portal para o Entretempo se abre em um vórtice estelar! ✦', 'quest');
          this.completeCurrentPhase();
        } else {
          this.showNotification('APERTURA vibra, mas você precisa primeiro identificar a porta correta!', 'info');
        }
      } else if (this.state.currentScene === 'dormitory' && !this.flags.firstDimensionalKeyObtained) {
        this.showNotification('APERTURA ressoa suavemente perto do baú trancado.', 'info');
      } else {
        this.showNotification('APERTURA estala com faíscas azuis, pronta para destrancar selos arcanos.', 'info');
      }
    } else if (spellId === 'memoria') {
      if (this.state.currentScene === 'timeless_realm') {
        this.showNotification('✦ O feitiço MEMORIA vibra com força total no Entretempo! Clique nos ecos suspensos para reconstruí-los. ✦', 'spell');
      } else {
        this.showNotification('MEMORIA resgata murmúrios das pedras antigas de Noctária.', 'info');
      }
    }
  }

  // --- DIALOGUE SYSTEM ---
  startDialogue(dialogueKey, nodeId = 'start') {
    const dialogue = DIALOGUES[dialogueKey];
    if (!dialogue) return;

    this.activeDialogue = dialogue;
    this.renderDialogueNode(dialogue.nodes[nodeId]);
  }

  renderDialogueNode(node) {
    this.currentDialogueNode = node;
    const character = CHARACTERS[this.activeDialogue.characterId] || { name: 'Desconhecido', title: '', avatarSvg: '' };

    const availableOptions = (node.options || []).filter(opt => {
      if (opt.condition && typeof opt.condition === 'function') {
        return opt.condition(this.state);
      }
      return true;
    });

    let existingOverlay = document.getElementById('dialogue-overlay');
    if (!existingOverlay) {
      existingOverlay = document.createElement('div');
      existingOverlay.id = 'dialogue-overlay';
      existingOverlay.className = 'dialogue-overlay';
      this.root.appendChild(existingOverlay);
    }

    existingOverlay.innerHTML = `
      <div class="dialogue-portrait-col">
        <div class="portrait-wrapper">
          ${character.image ? `<img src="${character.image}" alt="${character.name}" class="portrait-art">` : character.avatarSvg}
        </div>
        <div class="speaker-title">${character.title}</div>
      </div>
      <div class="dialogue-content-col">
        <div>
          <h3 class="speaker-name">${character.name}</h3>
          <p class="dialogue-text" id="dialogue-text-body"></p>
        </div>
        <div class="dialogue-options" id="dialogue-options-list"></div>
      </div>
    `;

    const textEl = document.getElementById('dialogue-text-body');
    const optionsContainer = document.getElementById('dialogue-options-list');

    if (this.textRevealInterval) clearInterval(this.textRevealInterval);
    const fullText = node.text;
    let charIndex = 0;
    textEl.innerText = '';

    const showOptions = () => {
      optionsContainer.innerHTML = '';
      if (node.isEnd) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialogue-opt-btn';
        closeBtn.innerHTML = `<span class="dialogue-opt-marker">✦</span> Continuar jornada`;
        closeBtn.onclick = () => {
          if (node.onComplete) node.onComplete(this);
          existingOverlay.remove();
        };
        optionsContainer.appendChild(closeBtn);
      } else {
        availableOptions.forEach((opt, idx) => {
          const btn = document.createElement('button');
          btn.className = 'dialogue-opt-btn';
          btn.innerHTML = `<span class="dialogue-opt-marker">${String.fromCharCode(65 + idx)}.</span> ${opt.text}`;
          btn.onclick = () => {
            if (opt.effect) opt.effect(this.state);
            this.saveGame();
            if (opt.nextNode) {
              this.renderDialogueNode(this.activeDialogue.nodes[opt.nextNode]);
            }
          };
          optionsContainer.appendChild(btn);
        });
      }
    };

    if (this.state.settings.textSpeed === 'instant') {
      textEl.innerText = fullText;
      showOptions();
    } else {
      this.textRevealInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          textEl.innerText += fullText[charIndex];
          charIndex++;
        } else {
          clearInterval(this.textRevealInterval);
          showOptions();
        }
      }, 16);

      textEl.onclick = () => {
        clearInterval(this.textRevealInterval);
        textEl.innerText = fullText;
        showOptions();
      };
    }
  }

  // --- MODALS (DIÁRIO, INVENTÁRIO, PERSONAGENS, INSPECT, SETTINGS, CRÉDITOS) ---
  openModal(title, contentHtml) {
    this.closeModal();
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'active-modal';
    modalBackdrop.innerHTML = `
      <div class="gothic-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close-btn" id="modal-close-x" aria-label="Fechar">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
      </div>
    `;
    this.root.appendChild(modalBackdrop);
    document.getElementById('modal-close-x').onclick = () => this.closeModal();
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) this.closeModal();
    };
    this.activeModal = modalBackdrop;
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }

  openJournalModal() {
    const quest = this.state.activeQuest;
    const clues = this.state.player.clues;

    const html = `
      <div class="tab-row">
        <button class="tab-btn active" id="tab-quests-btn">Missão Ativa</button>
        <button class="tab-btn" id="tab-clues-btn">Diário de Pistas (${clues.length})</button>
        <button class="tab-btn" id="tab-chars-btn">Relações & Afinidades</button>
      </div>
      <div id="tab-content-area">
        <div class="quest-box">
          <h3 class="quest-title">${quest ? quest.name : 'Nenhuma missão em andamento'}</h3>
          <p style="color:var(--color-text-dim); margin-bottom:14px;">${quest ? quest.description : ''}</p>
          <div>
            ${quest ? quest.steps.map((step, idx) => `
              <div class="step-item ${step.completed ? 'completed' : ''}">
                <span class="step-check">${step.completed ? '✓' : '○'}</span>
                <span>${step.text}</span>
              </div>
            `).join('') : ''}
          </div>
        </div>

        ${this.state.completedQuests.length > 0 ? `
          <div style="margin-top:20px;">
            <h4 style="font-family:var(--font-title); color:var(--color-aged-silver); margin-bottom:8px;">Fases e Missões Concluídas (${this.state.completedQuests.length})</h4>
            ${this.state.completedQuests.map(q => `
              <div style="padding:10px 14px; background:rgba(8,12,29,0.5); border-left:3px solid #4ef0c4; margin-bottom:8px; border-radius:3px;">
                <strong style="color:#fff; font-family:var(--font-title);">${q.name}</strong>
                <p style="font-size:0.85rem; color:var(--color-text-dim); margin-top:2px;">${q.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    this.openModal('Diário de Bordo Arcano', html);

    document.getElementById('tab-quests-btn').onclick = () => this.openJournalModal();
    document.getElementById('tab-clues-btn').onclick = () => {
      const area = document.getElementById('tab-content-area');
      document.getElementById('tab-quests-btn').classList.remove('active');
      document.getElementById('tab-clues-btn').classList.add('active');
      if (clues.length === 0) {
        area.innerHTML = `<p style="color:var(--color-text-dim); font-style:italic;">Nenhuma pista anotada ainda. Explore os cenários e converse com os personagens.</p>`;
      } else {
        area.innerHTML = clues.map(clue => `
          <div style="background:rgba(8,12,29,0.7); border:1px solid rgba(183,183,200,0.2); padding:14px; border-radius:4px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="color:var(--color-luminous-purple); font-family:var(--font-title);">${clue.title}</strong>
              <span style="font-size:0.75rem; color:var(--color-text-dim);">${clue.location} • ${clue.date}</span>
            </div>
            <p style="font-size:0.95rem; color:var(--color-lunar-white); line-height:1.5;">${clue.description}</p>
          </div>
        `).join('');
      }
    };
    document.getElementById('tab-chars-btn').onclick = () => {
      const area = document.getElementById('tab-content-area');
      document.getElementById('tab-quests-btn').classList.remove('active');
      document.getElementById('tab-clues-btn').classList.remove('active');
      document.getElementById('tab-chars-btn').classList.add('active');
      area.innerHTML = this.renderCharactersGalleryHtml();
    };
  }

  renderCharactersGalleryHtml() {
    const chars = Object.values(CHARACTERS);
    return `
      <div class="character-gallery-grid">
        ${chars.map(char => {
          const rel = (this.state.player.relationships && this.state.player.relationships[char.id]) || 0;
          return `
            <div class="character-card ${char.image ? 'has-custom-photo' : ''}">
              <div class="character-card-visual">
                ${char.image 
                  ? `<img src="${char.image}" alt="${char.name}" class="character-card-photo" />`
                  : `<div class="character-card-svg">${char.avatarSvg}</div>`
                }
                <div class="character-card-overlay">
                  <span class="character-badge-role">${char.title}</span>
                </div>
              </div>
              <div class="character-card-info">
                <h3 class="character-card-name">${char.name}</h3>
                <div class="character-card-subtitle">${char.role}</div>
                <p class="character-card-desc">${char.description}</p>
                <div class="character-card-footer">
                  <span class="char-affinity-label">Afinidade:</span>
                  <div class="affinity-meter">
                    <span class="affinity-val">${rel >= 0 ? '+' : ''}${rel}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  openCharactersModal() {
    const html = `
      <div class="characters-modal-layout">
        <p style="color:var(--color-text-dim); margin-bottom:18px; font-style:italic;">
          Personagens notáveis e figuras espectrais de Noctária com as quais você interage durante a progressão.
        </p>
        ${this.renderCharactersGalleryHtml()}
      </div>
    `;
    this.openModal('Crônicas de Noctária • Personagens', html);
  }

  openInventoryModal() {
    const items = this.state.player.inventory;
    const html = `
      <div class="inventory-grid">
        ${items.length === 0 ? '<p style="color:var(--color-text-dim); font-style:italic; grid-column:1/-1;">Sua bolsa de iniciado está vazia no momento.</p>' : ''}
        ${items.map(item => `
          <div class="inventory-card" data-item-id="${item.id}">
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
          </div>
        `).join('')}
      </div>
    `;
    this.openModal('Inventário Arcano', html);

    document.querySelectorAll('.inventory-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-item-id');
        const item = items.find(i => i.id === id);
        if (item) {
          this.openInspectModal(item.name, item.description, 'Item catalogado no inventário do jogador.');
        }
      };
    });
  }

  openInspectModal(title, text, subtext = '') {
    const html = `
      <div class="letter-parchment">
        <p style="margin-bottom:14px; white-space:pre-line;">${text}</p>
        ${subtext ? `<p style="font-size:0.9rem; color:var(--color-aged-silver); border-top:1px dashed rgba(183,183,200,0.3); padding-top:10px;">${subtext}</p>` : ''}
      </div>
      <div style="margin-top:20px; text-align:right;">
        <button class="btn-gothic" id="inspect-back-btn" style="display:inline-flex;">Fechar</button>
      </div>
    `;
    this.openModal(title, html);
    document.getElementById('inspect-back-btn').onclick = () => this.closeModal();
  }

  openQuestCompletionModal(questName, summary, nextChapterId = null) {
    const nextCfg = nextChapterId ? PHASES_CONFIG[nextChapterId] : null;
    const html = `
      <div style="text-align:center; padding:20px 0;">
        <div style="font-size:3.5rem; color:var(--color-luminous-purple); margin-bottom:10px;">✦</div>
        <h3 style="font-family:var(--font-title); font-size:1.6rem; color:#fff; margin-bottom:8px;">ETAPA CONCLUÍDA!</h3>
        <h4 style="font-family:var(--font-title); font-size:1.2rem; color:var(--color-luminous-purple); margin-bottom:16px;">${questName}</h4>
        <p style="font-size:1.05rem; color:var(--color-lunar-white); margin-bottom:24px; max-width:600px; margin-left:auto; margin-right:auto; line-height:1.6;">
          ${summary}
        </p>
        ${nextCfg ? `
          <div style="background:rgba(8,12,29,0.7); border:1px solid var(--color-arcane-purple); padding:14px; border-radius:4px; max-width:480px; margin:0 auto 24px auto;">
            <span style="color:var(--color-aged-silver); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.1em;">PRÓXIMA ETAPA DESBLOQUEADA</span>
            <p style="color:#fff; font-family:var(--font-title); font-size:1.15rem; margin-top:4px;">${nextCfg.title}</p>
          </div>
        ` : ''}
        <button class="btn-gothic btn-primary" id="quest-congrats-btn" style="margin:0 auto; display:inline-flex;">
          Continuar Jornada
        </button>
      </div>
    `;
    this.openModal('Progresso Narrativo', html);
    document.getElementById('quest-congrats-btn').onclick = () => {
      this.closeModal();
      if (nextChapterId) {
        this.changeChapter(nextChapterId);
      }
    };
  }

  openSettingsModal() {
    const s = this.state.settings;
    const html = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div class="setting-row">
          <label class="setting-label" for="music-vol">Volume da Música</label>
          <input type="range" id="music-vol" min="0" max="100" value="${s.musicVolume}" style="accent-color:var(--color-luminous-purple); cursor:pointer;">
        </div>
        <div class="setting-row">
          <label class="setting-label" for="sfx-vol">Volume dos Efeitos Sonoros</label>
          <input type="range" id="sfx-vol" min="0" max="100" value="${s.sfxVolume}" style="accent-color:var(--color-luminous-purple); cursor:pointer;">
        </div>
        <div class="setting-row">
          <label class="setting-label" for="speed-select">Velocidade do Texto</label>
          <select id="speed-select" style="background:var(--color-night-dark); color:#fff; border:1px solid var(--color-aged-silver); padding:6px 12px; border-radius:4px;">
            <option value="normal" ${s.textSpeed === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="fast" ${s.textSpeed === 'fast' ? 'selected' : ''}>Rápida</option>
            <option value="instant" ${s.textSpeed === 'instant' ? 'selected' : ''}>Instantânea</option>
          </select>
        </div>
        <div class="setting-row">
          <label class="setting-label" for="fullscreen-toggle">Modo Tela Cheia</label>
          <button class="btn-gothic" id="fullscreen-toggle" style="padding:6px 14px; font-size:0.85rem;">Alternar</button>
        </div>
        <div style="margin-top:20px; display:flex; justify-content:flex-end;">
          <button class="btn-gothic btn-primary" id="save-settings-btn">Salvar Configurações</button>
        </div>
      </div>
    `;
    this.openModal('Configurações', html);

    document.getElementById('fullscreen-toggle').onclick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    document.getElementById('save-settings-btn').onclick = () => {
      this.state.settings.musicVolume = parseInt(document.getElementById('music-vol').value);
      this.state.settings.sfxVolume = parseInt(document.getElementById('sfx-vol').value);
      this.state.settings.textSpeed = document.getElementById('speed-select').value;
      this.saveGame();
      this.closeModal();
      this.showNotification('Configurações salvas!', 'info');
    };
  }

  openCreditsModal() {
    const html = `
      <div style="line-height:1.8; color:var(--color-lunar-white);">
        <h3 style="font-family:var(--font-title); color:var(--color-luminous-purple); font-size:1.3rem; margin-bottom:12px;">NOCTÁRIA: A ACADEMIA DAS MIL PORTAS</h3>
        <p style="margin-bottom:10px;"><strong>Estrutura Completa da Campanha:</strong> Prólogo, 8 Fases Principais e Epílogo com 3 Finais Distintos.</p>
        <p style="margin-bottom:10px;"><strong>Engine Web Própria:</strong> JavaScript ES Modules, HTML5, CSS3 Custom Tokens, Vite.</p>
        <p style="margin-bottom:10px;"><strong>Mecânicas Jogáveis:</strong> Pistas contextuais, caldeirão alquímico, ordenação de manuscritos, desativação de armadilhas com Revelare, ressonância de portas dimensionais e alinhamento das 13 badaladas.</p>
        <p style="margin-bottom:10px;"><strong>Estética & Direção de Arte:</strong> Fantasia gótica realista, paleta noturna cinematográfica, tipografia Cinzel e Lora.</p>
        <p style="margin-bottom:20px;"><strong>Armazenamento:</strong> Save game contínuo em LocalStorage com preservação de escolhas narrativas.</p>
        <div style="text-align:right;">
          <button class="btn-gothic" id="credits-close-btn" style="display:inline-flex;">Voltar ao Menu</button>
        </div>
      </div>
    `;
    this.openModal('Créditos & Recursos', html);
    document.getElementById('credits-close-btn').onclick = () => this.closeModal();
  }
}

// Inicializar jogo quando a DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  const game = new NoctariaGame();
  game.start();
});
