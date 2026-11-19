import { CHARACTERS, SPELLS_DATABASE, PHASES_CONFIG, INITIAL_STATE } from './data/gameState.js';
import { DIALOGUES } from './data/dialogues.js';
import { SCENE_BACKGROUNDS } from './data/sceneAssets.js';
import { PUZZLES } from './data/puzzles.js';
import { World3DManager } from './systems/World3DManager.js';

class NoctariaGame {
  constructor() {
    this.root = document.getElementById('game-root');
    this.notificationsRoot = document.getElementById('notifications');
    this.activeModal = null;
    this.activeDialogue = null;
    this.currentDialogueNode = null;
    this.textRevealInterval = null;
    this.activeSpell = null;
    this.world3D = null;

    // Temporary minigame states
    this.tempState = {
      manuscriptOrder: [],
      cauldronIngredients: [],
      portraitsSelected: [],
      chimesSelected: []
    };

    this.inspectedObjects = new Set();
    this.activeParticleAnimation = null;

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
    if (this.state.currentScene) {
      this.state.previousScene = this.state.currentScene;
    }
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
    if (this.state.currentScene && this.state.currentScene !== sceneId) {
      this.state.previousScene = this.state.currentScene;
    }
    const sceneContainer = document.querySelector('.scene-container');
    if (sceneContainer) {
      sceneContainer.classList.add('scene-transition-fade');
      setTimeout(() => {
        this.state.currentScene = sceneId;
        if (!this.state.unlockedScenes.includes(sceneId)) {
          this.state.unlockedScenes.push(sceneId);
        }
        this.saveGame();
        this.renderGameWorld();
      }, 350);
    } else {
      this.state.currentScene = sceneId;
      if (!this.state.unlockedScenes.includes(sceneId)) {
        this.state.unlockedScenes.push(sceneId);
      }
      this.saveGame();
      this.renderGameWorld();
    }
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

  learnSpell(spellId, shouldRerender = true) {
    if (!this.state.player.spells.includes(spellId)) {
      this.state.player.spells.push(spellId);
      const spell = SPELLS_DATABASE[spellId];
      this.showNotification(`✦ Novo Feitiço Aprendido: ${spell.name}! ✦`, 'spell');
      this.saveGame();
      if (shouldRerender) {
        this.renderGameWorld();
      }
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
      this.flags.ch2MissionStage = 1;
      nextChapter = 'phase_2';
      title = 'Capítulo 1 Concluído — O Nome que Não Existe';
      summary = 'Você comprovou que Seraphine Ashford existiu e encontrou referências a experimentos ligados à memória na antiga Sala de Alquimia.';
      this.state.activeQuest = {
        id: 'quest_ch2_m1',
        name: 'Capítulo 2 • Missão 1 — A Sala Esquecida',
        description: 'Investigue a antiga Sala de Alquimia para encontrar registros dos experimentos de memória de Seraphine.',
        currentStep: 0,
        steps: [
          { text: 'Examinar os livros antigos de alquimia.', completed: false },
          { text: 'Encontrar uma fórmula incompleta nos pergaminhos.', completed: false },
          { text: 'Descobrir uma anotação assinada por Seraphine.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_2') {
      this.flags.phase2Completed = true;
      this.flags.phase3Completed = true;
      if (!this.state.unlockedScenes.includes('library')) {
        this.state.unlockedScenes.push('library');
      }
      nextChapter = 'phase_4';
      title = 'Capítulo 2 Concluído — Fragmentos de Memória';
      summary = 'A Poção da Lembrança revelou uma visão decisiva de Seraphine: antes de desaparecer, ela confiou um objeto sagrado a Elias Crowe no Dormitório da Noite.';
      this.state.activeQuest = {
        id: 'quest_phase_4',
        name: 'Capítulo 3 — A Chave de Elias',
        description: 'Investigue o Dormitório da Noite, encontre o diário dos Crowe e descubra a chave deixada com Elias.',
        currentStep: 0,
        steps: [
          { text: 'Encontre a chave de ferro escondida na lareira do dormitório.', completed: false },
          { text: 'Abra o baú familiar e leia o diário secreto de Elias.', completed: false },
          { text: 'Confronte ou demonstre confiança a Elias para obter a Primeira Chave Dimensional.', completed: false }
        ],
        status: 'active'
      };
    } else if (current === 'phase_3') {
      this.flags.phase3Completed = true;
      nextChapter = 'phase_4';
      title = 'Arquivo Concluído';
      summary = 'Você dominou os segredos da Biblioteca Velada! Agora é hora de desvendar a ligação de Elias Crowe com a academia.';
      this.state.activeQuest = {
        id: 'quest_phase_4',
        name: 'Capítulo 3 — A Chave de Elias',
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

    // ── CORREÇÃO DE PROGRESSÃO: actualizar o estado IMEDIATAMENTE ──
    // Assim o jogador não fica preso mesmo que feche o modal pelo X.
    if (nextChapter) {
      this.state.currentChapter = nextChapter;
      const nextConfig = PHASES_CONFIG[nextChapter];
      if (nextConfig) {
        this.state.currentScene = nextConfig.scene;
        if (!this.state.unlockedScenes.includes(nextConfig.scene)) {
          this.state.unlockedScenes.push(nextConfig.scene);
        }
      }
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
    const currentLocCfg = Object.values(PHASES_CONFIG).find(p => p.scene === sceneId) || phaseCfg;

    // Available spells from player progression
    const playerSpells = this.state.player.spells.map(id => SPELLS_DATABASE[id]).filter(Boolean);

    this.root.innerHTML = `
      <div class="game-viewport">
        <!-- Top HUD Bar -->
        <header class="game-topbar">
          <div class="topbar-location">
            <span class="loc-icon">🏛</span>
            <div class="topbar-title-group">
              <span class="loc-name">${currentLocCfg.locationName}</span>
              <span class="loc-category-badge">${currentLocCfg.category || 'Recinto Sagrado'}</span>
            </div>
          </div>
          <div class="topbar-nav">
            <button class="nav-btn nav-btn-primary" id="hud-map-btn" title="Mapa de Noctária e Viagem Rápida">
              <span class="nav-icon">🗺</span>
              <span>Mapa Arcano</span>
              <span class="badge-count">${this.state.unlockedScenes.length}/10</span>
            </button>
            <button class="nav-btn" id="hud-journal-btn" title="Diário de Pistas e Missões">
              <span class="nav-icon">📖</span>
              <span>Diário</span>
              <span class="badge-count" id="journal-badge">${this.state.player.clues.length}</span>
            </button>
            <button class="nav-btn" id="hud-inventory-btn" title="Inventário de Relíquias">
              <span class="nav-icon">🗝</span>
              <span>Inventário</span>
              <span class="badge-count" id="inventory-badge">${this.state.player.inventory.length}</span>
            </button>
            <button class="nav-btn" id="hud-characters-btn" title="Relações e Arquivos de Personagens">
              <span class="nav-icon">👥</span>
              <span>Personagens</span>
            </button>
            <button class="nav-btn nav-btn-subtle" id="hud-menu-btn" title="Menu Principal">
              <span class="nav-icon">⚙</span>
              <span>Menu</span>
            </button>
          </div>
        </header>

        <!-- Exploration Info Banner (Atmosphere & Clues) -->
        <aside class="scene-ambient-bar">
          <div class="ambient-status">
            <span class="status-dot"></span>
            <span class="ambient-text">“${currentLocCfg.atmosphere || 'Uma quietude gótica paira no ambiente de pedra.'}”</span>
          </div>
          <div class="scene-actions-pills">
            ${this.state.previousScene && this.state.previousScene !== sceneId ? `
              <button class="scene-pill-btn scene-pill-back" id="btn-scene-back" title="Retornar ao ambiente anterior (${PHASES_CONFIG[Object.keys(PHASES_CONFIG).find(k => PHASES_CONFIG[k].scene === this.state.previousScene)]?.locationName || 'Local Anterior'})">
                <span>⮌ Retornar</span>
              </button>
            ` : ''}
            <button class="scene-pill-btn" id="btn-scene-observe" title="Examinar detalhes arquitetônicos e atmosfera da ala">
              <span>👁 Examinar Ambiente</span>
            </button>
            <button class="scene-pill-btn" id="btn-scene-quickmap" title="Ver no Mapa Arcano">
              <span>🧭 Cartografia</span>
            </button>
          </div>
        </aside>

        <!-- Main Interactive Scene Container -->
        <main class="scene-container">
          <div class="scene-bg" id="scene-bg" style="background-image: url('${bgUrl}');"></div>
          
          <!-- Atmospheric lighting and living particles layer -->
          <div class="scene-atmospheric-vignette"></div>
          <canvas id="ambient-dust-canvas" class="scene-dust-canvas"></canvas>
          <div class="torch-ambient-flicker torch-left"></div>
          <div class="torch-ambient-flicker torch-right"></div>

          <!-- Hotspots & Clickable World Layer -->
          <div class="scene-interactive-layer" id="interactive-layer"></div>

          <!-- Bottom Spell Bar -->
          <div class="spell-bar" id="spell-bar">
            ${playerSpells.length === 0 ? `
              <div class="spell-bar-empty">
                <span class="spell-sparkle">✦</span>
                <span>Nenhum feitiço dominado ainda. Investigue os manuscritos para aprender magia.</span>
                <span class="spell-sparkle">✦</span>
              </div>
            ` : playerSpells.map(spell => `
              <button class="spell-btn ${this.activeSpell === spell.id ? 'active' : ''}" data-spell="${spell.id}" title="${spell.description}">
                <span class="spell-icon">${spell.icon}</span>
                <span class="spell-title">${spell.name}</span>
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

    // Scene ambient buttons
    const btnBack = document.getElementById('btn-scene-back');
    if (btnBack && this.state.previousScene) {
      btnBack.onclick = () => {
        this.changeScene(this.state.previousScene);
      };
    }

    const btnObserve = document.getElementById('btn-scene-observe');
    if (btnObserve) {
      btnObserve.onclick = () => {
        this.openInspectModal(
          currentLocCfg.locationName,
          `${currentLocCfg.description}\n\nAtmosfera local: ${currentLocCfg.atmosphere}\n\nIndícios notáveis nesta ala:\n• ${(currentLocCfg.cluesHere || ['Segredos ocultos sob o véu']).join('\n• ')}`,
          'A exploração detalhada ajuda a desvendar enigmas e descobrir caminhos.'
        );
      };
    }

    const btnQuickMap = document.getElementById('btn-scene-quickmap');
    if (btnQuickMap) {
      btnQuickMap.onclick = () => this.openMapModal();
    }

    // Connect spell buttons
    document.querySelectorAll('.spell-btn').forEach(btn => {
      btn.onclick = () => {
        const spellId = btn.getAttribute('data-spell');
        this.castSpell(spellId);
      };
    });

    this.initLivingAtmosphere();
    this.renderSceneInteractiveElements();

    // Introdução cinematográfica automática ao entrar no Capítulo 2 pela primeira vez
    if (this.state.currentScene === 'alchemy_lab' && this.state.currentChapter === 'phase_2' && !this.flags.chapter2IntroSeen) {
      this.renderChapter2Intro();
    }
  }

  // --- ATMOSFERA VIVA (PARTÍCULAS DE POEIRA ARCANA & BRILHOS) ---
  initLivingAtmosphere() {
    const canvas = document.getElementById('ambient-dust-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.offsetHeight || window.innerHeight;

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: -Math.random() * 0.45 - 0.15,
        hue: Math.random() > 0.6 ? 265 : 220
      });
    }

    if (this.activeParticleAnimation) {
      cancelAnimationFrame(this.activeParticleAnimation);
    }

    const animate = () => {
      if (!document.getElementById('ambient-dust-canvas')) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsl(${p.hue}, 90%, 70%)`;
        ctx.fill();
      });

      this.activeParticleAnimation = requestAnimationFrame(animate);
    };

    animate();
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
        this.createHotspot(layer, '50%', '52%', 'Porta Fantasma (13ª Badalada)', () => {
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

    // CAPÍTULO 2: FRAGMENTOS DE MEMÓRIA — SALA DE ALQUIMIA
    else if (scene === 'alchemy_lab') {
      // Octavian Wren (junto ao candelabro e armário esquerdo)
      this.createHotspot(layer, '24%', '58%', 'Octavian Wren', () => {
        if ((this.flags.ch2MissionStage || 1) < 2 && !this.flags.ch2FormulaFound) {
          this.startDialogue('chapter2_intro_octavian', 'start');
        } else {
          this.startDialogue('octavian_alchemy', 'start');
        }
      }, '#f7b267');

      // Missão 1 — Livros antigos de alquimia (sobre a mesa direita)
      this.createHotspot(layer, '86%', '76%', 'Livros Antigos de Alquimia', () => {
        this.examineCh2AlchemyBooks();
      }, '#a58ae8');

      // Missão 1 — Pergaminho com fórmula incompleta (mesa central)
      this.createHotspot(layer, '63%', '75%', 'Pergaminho de Fórmula Incompleta', () => {
        this.examineCh2IncompleteFormula();
      }, '#a58ae8');

      // Missão 1 — Anotação assinada por Seraphine (balança e instrumentos à esquerda)
      this.createHotspot(layer, '41%', '60%', 'Instrumentos Antigos e Anotação', () => {
        this.examineCh2SeraphineNote();
      }, '#a58ae8');

      // Missão 3 — Alambique / Bancada de Destilação
      this.createHotspot(layer, '58%', '55%', 'Alambique das Lembranças', () => {
        this.openAlchemyPuzzle();
      }, '#4ef0c4');

      // Missão 2 — Armários Antigos e Estantes de Frascos (4 ingredientes)
      if (!this.flags.ingredientLunarDew) {
        this.createHotspot(layer, '33%', '44%', 'Armário de Madeira Escura', () => {
          this.inspectAlchemyCabinet('lunarDew');
        }, '#5376c8');
      }
      if (!this.flags.ingredientAshRoot) {
        this.createHotspot(layer, '48%', '38%', 'Estante Azul da Janela', () => {
          this.inspectAlchemyCabinet('ashRoot');
        }, '#5376c8');
      }
      if (!this.flags.ingredientNightPhoenix) {
        this.createHotspot(layer, '69%', '39%', 'Estante de Frascos Violetas', () => {
          this.inspectAlchemyCabinet('nightPhoenix');
        }, '#5376c8');
      }
      if (!this.flags.ingredientEther) {
        this.createHotspot(layer, '88%', '39%', 'Armário Superior Direito', () => {
          this.inspectAlchemyCabinet('ether');
        }, '#5376c8');
      }

      // Missão 4 — Fragmento de Memória manifestado após ativar a poção
      if (this.flags.ch2PotionActivated && !this.flags.ch2FinalDiscoveryLogged) {
        this.createHotspot(layer, '50%', '46%', 'Fragmento de Memória de Seraphine', () => {
          this.startDialogue('ch2_memory_investigation', 'start');
        }, '#4ef0c4');
      }

      if (this.flags.phase2Completed || this.flags.phase3Completed) {
        this.createHotspot(layer, '14%', '66%', 'Seguir para A Chave de Elias', () => {
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
      // Elias Crowe — eco espectral
      this.createHotspot(layer, '20%', '62%', 'Elias Crowe (Eco Espectral)', () => {
        this.startDialogue('sealed_wing_echo', 'start');
      }, '#a58ae8');

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
      // Madam Vespera — guardiã da galeria
      this.createHotspot(layer, '82%', '62%', 'Madam Vespera (A Guardiã)', () => {
        this.startDialogue('gallery_vespera', 'start');
      }, '#a58ae8');

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
      // Seraphine — conversa final
      this.createHotspot(layer, '28%', '60%', 'Seraphine Ashford (Reflexão Final)', () => {
        this.startDialogue('epilogue_reflection', 'start');
      }, '#4ef0c4');

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
    const isCharacter = label.includes('Crowe') || label.includes('Morgana') || label.includes('Vespera') || label.includes('Octavian') || label.includes('Celeste') || label.includes('Seraphine');
    const isPuzzle = label.includes('Enigma') || label.includes('Decifração') || label.includes('Caldeirão') || label.includes('Retratos') || label.includes('Badaladas');
    const isSpellObject = label.includes('REVELARE') || label.includes('MEMORIA') || label.includes('APERTURA') || label.includes('Runas');
    const isEntrance = label.includes('Entrada') || label.includes('Passagem') || label.includes('Portal') || label.includes('Acesso') || label.includes('Fissura');
    
    let kindClass = 'kind-investigate';
    let badgeText = 'Examinar';

    if (isCharacter) {
      kindClass = 'kind-dialogue';
      badgeText = 'Conversar';
    } else if (isPuzzle) {
      kindClass = 'kind-puzzle';
      badgeText = 'Enigma';
    } else if (isSpellObject) {
      kindClass = 'kind-spell';
      badgeText = 'Arcano';
    } else if (isEntrance) {
      kindClass = 'kind-travel';
      badgeText = 'Avançar';
    }

    const stateKey = `${this.state.currentScene}_${label}`;
    const isInvestigated = this.inspectedObjects.has(stateKey);

    spot.className = `hotspot ${kindClass} ${isInvestigated ? 'is-investigated' : 'is-unexplored'}`;
    spot.style.left = left;
    spot.style.top = top;
    spot.setAttribute('role', 'button');
    spot.setAttribute('tabindex', '0');
    spot.setAttribute('aria-label', label);

    spot.innerHTML = `
      <div class="hotspot-core-spark" style="--spark-color:${color};"></div>
      <div class="hotspot-badge-tag">
        <span class="badge-cat">${badgeText}</span>
        <span class="badge-name">${label}</span>
        <span class="badge-status">${isInvestigated ? '✓ Conhecido' : '● Interagir'}</span>
      </div>
    `;

    spot.onclick = (e) => {
      e.stopPropagation();
      this.inspectedObjects.add(stateKey);
      spot.classList.remove('is-unexplored');
      spot.classList.add('is-investigated');
      const statusEl = spot.querySelector('.badge-status');
      if (statusEl) statusEl.innerText = '✓ Conhecido';

      // Visual click ripple
      const ripple = document.createElement('div');
      ripple.className = 'hotspot-click-fx';
      spot.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      onClick();
    };

    parent.appendChild(spot);
  }

  // --- INTERAÇÕES ESPECÍFICAS DE INVESTIGAÇÃO ---
  examinePrologueLetter() {
    this.flags.staircaseLetterExamined = true;
    this.openInspectModal(
      'Carta Caída na Escadaria',
      'Um envelope sem selo oficial de Noctária. A caligrafia é nervosa, traçada com tinta púrpura:\n\n“Quando o grande sino soar treze badaladas, não corra para as salas comuns. Procure a porta que não consta nos diagramas da fundação. Eles apagam o que não conseguem controlar.”',
      'Um primeiro indício vital foi gravado no seu diário de bordo.',
      '/assets/images/objects/letter.jpg'
    );
    this.addClue({
      id: 'clue_thirteen_chimes_warning',
      title: 'O Aviso da Décima Terceira Badalada',
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
      'O Prólogo foi concluído com sucesso. O Salão das Cinzas e o mistério de Seraphine aguardam você!',
      null,
      () => this.completeCurrentPhase()
    );
    this.updateQuestStep(3);
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
    this.updateQuestStep(1);
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
    this.updateQuestStep(2);
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

  // --- CAPÍTULO 2: FRAGMENTOS DE MEMÓRIA (INTRO, MISSÕES 1 A 4, CONCLUSÃO) ---
  renderChapter2Intro() {
    if (document.getElementById('chapter-intro-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'chapter-intro-overlay';
    overlay.className = 'chapter-intro-overlay';
    overlay.innerHTML = `
      <div class="chapter-intro-card">
        <span class="chapter-intro-eyebrow">NOCTÁRIA • CONTINUIDADE NARRATIVA</span>
        <h2 class="chapter-intro-title">CAPÍTULO II</h2>
        <h3 class="chapter-intro-subtitle">FRAGMENTOS DE MEMÓRIA</h3>
        <div class="chapter-intro-divider"></div>
        <p class="chapter-intro-text">
          Após confirmar que o nome de Seraphine Ashford foi apagado dos registros do Salão das Cinzas, você descobriu referências a experimentos ligados à memória humana. Os vestígios apontam para a antiga Sala de Alquimia da academia — onde velas douradas e reflexos azulados ainda guardam segredos que alguém tentou trancar no silêncio.
        </p>
        <button class="btn-gothic btn-primary chapter-intro-btn" id="btn-enter-ch2">
          <span>Adentrar a Sala de Alquimia</span>
          <span class="btn-icon">✦</span>
        </button>
      </div>
    `;
    this.root.appendChild(overlay);

    document.getElementById('btn-enter-ch2').onclick = () => {
      this.flags.chapter2IntroSeen = true;
      this.saveGame();
      overlay.classList.add('chapter-intro-fade-out');
      setTimeout(() => {
        overlay.remove();
        this.startDialogue('chapter2_intro_octavian', 'start');
      }, 450);
    };
  }

  examineCh2AlchemyBooks() {
    this.flags.ch2BooksExamined = true;
    this.addClue({
      id: 'clue_ch2_alchemy_books',
      title: 'Tratados de Transmutação Mnemônica',
      description: 'Os livros antigos da Sala de Alquimia detalham elixires capazes de restaurar lembranças arrancadas pelo véu de Noctária — e mencionam o encantamento REVELARE.',
      location: 'Sala de Alquimia',
      date: 'Capítulo II'
    });
    if (!this.state.player.spells.includes('revelare')) {
      this.learnSpell('revelare', false);
    }
    if ((this.flags.ch2MissionStage || 1) === 1) {
      this.updateQuestStep(0);
    }
    this.openInspectModal(
      'Livros Antigos de Alquimia',
      'Volumes encadernados em couro envelhecido repousam sobre a madeira escura. Nas margens de um tratado sobre memória e tempo, alguém sublinhou passagens inteiras a tinta violeta:\n\n“Quando a academia apaga um nome, a lembrança não morre — ela se dissolve no ar da sala onde foi vivida. Apenas um elixir de ancoragem temporal e o olhar de REVELARE podem condensá-la novamente.”',
      'Pista registrada no diário. Os tratados confirmam que experimentos de memória foram conduzidos nesta sala.'
    );
    this.checkCh2Mission1Complete();
    this.renderSceneInteractiveElements();
  }

  examineCh2IncompleteFormula() {
    this.flags.ch2FormulaFound = true;
    this.addInventoryItem({
      id: 'incomplete_memory_formula',
      name: 'Fórmula Incompleta da Lembrança',
      icon: '📜',
      description: 'Pergaminho alquímico antigo com quatro espaços de reagentes raspados e instruções parciais sobre destilação de memórias.'
    });
    this.addClue({
      id: 'clue_ch2_incomplete_formula',
      title: 'A Fórmula Incompleta',
      description: 'O pergaminho sobre a bancada descreve a Poção da Lembrança, mas os nomes dos quatro reagentes foram parcialmente apagados.',
      location: 'Sala de Alquimia',
      date: 'Capítulo II'
    });
    if ((this.flags.ch2MissionStage || 1) === 1) {
      this.updateQuestStep(1);
    }
    this.openInspectModal(
      'Pergaminho com Fórmula Incompleta',
      'Desenrolado sob a luz das velas, o pergaminho exibe diagramas de alambiques e círculos alquímicos precisos:\n\n“Para despertar o eco congelado: 1º [rasurado], 2º [rasurado], 3º [rasurado], 4º [rasurado]. Não alterar a ordem sob risco de colapso mnemônico.”\n\nAlguém interrompeu esta fórmula às pressas.',
      'A fórmula incompleta foi guardada em seu inventário e registrada no diário.'
    );
    this.checkCh2Mission1Complete();
  }

  examineCh2SeraphineNote() {
    this.flags.ch2SeraphineNoteFound = true;
    this.addClue({
      id: 'clue_ch2_seraphine_note',
      title: 'Anotação Assinada por Seraphine',
      description: 'Bilhete escondido sob a balança de latão: “Se minhas memórias forem arrancadas pelas badaladas, a resposta repousa na destilação do tempo. — Seraphine Ashford.”',
      location: 'Sala de Alquimia',
      date: 'Capítulo II'
    });
    if ((this.flags.ch2MissionStage || 1) === 1) {
      this.updateQuestStep(2);
    }
    this.openInspectModal(
      'Anotação Oculta sob os Instrumentos',
      'Preso sob a base da balança antiga de latão, você encontra um fragmento de papel dobrado com caligrafia firme e apressada:\n\n“Octavian sabe dos riscos, mas a Diretoria vigia cada passo. Dividi os reagentes pelos armários. Se minhas memórias forem arrancadas pelas badaladas, a resposta repousa na destilação do tempo.\n— Seraphine Ashford”',
      'Você comprovou que Seraphine conduziu os experimentos nesta sala!'
    );
    this.checkCh2Mission1Complete();
  }

  checkCh2Mission1Complete() {
    if (
      this.flags.ch2BooksExamined &&
      this.flags.ch2FormulaFound &&
      this.flags.ch2SeraphineNoteFound &&
      (this.flags.ch2MissionStage || 1) < 2
    ) {
      if (this.state.activeQuest && this.state.activeQuest.id === 'quest_ch2_m1') {
        this.state.activeQuest.status = 'completed';
        this.state.completedQuests.push({ ...this.state.activeQuest });
      }
      this.flags.ch2MissionStage = 2;
      this.state.activeQuest = {
        id: 'quest_ch2_m2',
        name: 'Capítulo 2 • Missão 2 — A Fórmula Perdida',
        description: 'Converse com Octavian Wren para descobrir os ingredientes faltantes e investigue os armários da Sala de Alquimia.',
        currentStep: 0,
        steps: [
          { text: 'Conversar com Octavian Wren.', completed: Boolean(this.flags.octavianTalked) },
          { text: 'Descobrir quais ingredientes estão faltando.', completed: Boolean(this.flags.ch2MissingIngredientsKnown) },
          { text: 'Investigar os armários antigos da sala.', completed: Boolean(this.flags.ch2CabinetsInvestigated) },
          { text: 'Encontrar todos os ingredientes necessários.', completed: false }
        ],
        status: 'active'
      };
      this.saveGame();
      this.showNotification('✦ Missão 1 concluída! Missão 2 — A Fórmula Perdida iniciada. Converse com Octavian Wren. ✦', 'quest');
      this.checkCh2Mission2Complete();
    }
  }

  onOctavianRevealedFormula() {
    this.flags.octavianTalked = true;
    this.flags.ch2MissingIngredientsKnown = true;
    if ((this.flags.ch2MissionStage || 1) === 2) {
      this.updateQuestStep(0);
      this.updateQuestStep(1);
    }
    this.addClue({
      id: 'clue_ch2_octavian_ingredients',
      title: 'Os Quatro Reagentes da Lembrança',
      description: 'Octavian Wren revelou a sequência exata: Orvalho Lunar Destilado, Raiz de Mandrágora de Cinzas, Cinza de Fênix Noturna e Éter Rúnico Puro.',
      location: 'Sala de Alquimia',
      date: 'Capítulo II'
    });
    this.showNotification('Objetivo atualizado: Investigue os armários antigos para reunir os 4 ingredientes.', 'quest');
    this.checkCh2Mission2Complete();
  }

  inspectAlchemyCabinet(reagentKey) {
    if ((this.flags.ch2MissionStage || 1) < 2) {
      this.openInspectModal(
        'Armário Antigo de Madeira Escura',
        'Os armários guardam dezenas de frascos rotulados com símbolos alquímicos arcaicos. Sem saber quais componentes pertencem à fórmula de Seraphine, abrir os recipientes ao acaso seria arriscado.',
        'Conclua a investigação inicial sobre a mesa antes de procurar reagentes.'
      );
      return;
    }

    if (!this.flags.ch2MissingIngredientsKnown) {
      this.openInspectModal(
        'Frascos Alquímicos Selados',
        'Há frascos luminosos em tons de azul, âmbar e violeta por trás das portas de vidro, mas você ainda não identificou quais ingredientes faltam na fórmula incompleta.',
        'Converse com Octavian Wren para descobrir os reagentes necessários.'
      );
      return;
    }

    this.flags.ch2CabinetsInvestigated = true;
    if (this.flags.ch2MissionStage === 2) {
      this.updateQuestStep(2);
    }

    const map = {
      lunarDew: {
        flag: 'ingredientLunarDew',
        item: { id: 'lunar_dew', name: 'Orvalho Lunar Destilado', icon: '💧', description: 'Essência azulada colhida sob a lua cheia.' },
        msg: 'Você destranca o armário de madeira escura e encontra o frasco cintilante de Orvalho Lunar Destilado!'
      },
      ashRoot: {
        flag: 'ingredientAshRoot',
        item: { id: 'ash_root', name: 'Raiz de Mandrágora de Cinzas', icon: '🌿', description: 'Raiz seca que ancora fragmentos de memória.' },
        msg: 'Na estante banhada pela luz azul da janela, você recolhe um recipiente com Raiz de Mandrágora de Cinzas!'
      },
      nightPhoenix: {
        flag: 'ingredientNightPhoenix',
        item: { id: 'night_phoenix', name: 'Cinza de Fênix Noturna', icon: '🔥', description: 'Cinza violeta incandescente que desperta lembranças.' },
        msg: 'Entre os frascos violetas você encontra o pó luminoso de Cinza de Fênix Noturna!'
      },
      ether: {
        flag: 'ingredientEther',
        item: { id: 'rune_ether', name: 'Éter Rúnico Puro', icon: '✨', description: 'Solvente límpido que estabiliza o elixir.' },
        msg: 'No armário superior direito repousa o frasco selado de Éter Rúnico Puro!'
      }
    };

    const entry = map[reagentKey];
    if (entry && !this.flags[entry.flag]) {
      this.flags[entry.flag] = true;
      this.addInventoryItem(entry.item);
      this.showNotification(entry.msg, 'item');
      this.checkCh2Mission2Complete();
      this.renderSceneInteractiveElements();
    }
  }

  checkCh2Mission2Complete() {
    const hasAll =
      this.flags.ingredientLunarDew &&
      this.flags.ingredientAshRoot &&
      this.flags.ingredientNightPhoenix &&
      this.flags.ingredientEther;

    if (
      (this.flags.ch2MissionStage || 1) === 2 &&
      this.flags.octavianTalked &&
      this.flags.ch2MissingIngredientsKnown &&
      this.flags.ch2CabinetsInvestigated &&
      hasAll
    ) {
      this.updateQuestStep(3);
      if (this.state.activeQuest && this.state.activeQuest.id === 'quest_ch2_m2') {
        this.state.activeQuest.status = 'completed';
        this.state.completedQuests.push({ ...this.state.activeQuest });
      }
      this.flags.ch2MissionStage = 3;
      this.state.activeQuest = {
        id: 'quest_ch2_m3',
        name: 'Capítulo 2 • Missão 3 — A Poção da Lembrança',
        description: 'Organize os ingredientes no alambique seguindo as instruções do manuscrito e ative a Poção da Lembrança.',
        currentStep: 0,
        steps: [
          { text: 'Organizar os ingredientes na bancada alquímica.', completed: false },
          { text: 'Seguir as instruções do manuscrito.', completed: false },
          { text: 'Completar o experimento no alambique.', completed: false },
          { text: 'Ativar a Poção da Lembrança.', completed: false }
        ],
        status: 'active'
      };
      this.saveGame();
      this.showNotification('✦ Missão 2 concluída! Missão 3 — A Poção da Lembrança iniciada. Aproxime-se do Alambique! ✦', 'quest');
    }
  }

  activateMemoryPotion() {
    this.flags.ch2PotionActivated = true;
    this.flags.potionAdministered = true;
    this.flags.memoryVisionSeen = true;
    if ((this.flags.ch2MissionStage || 1) === 3) {
      this.updateQuestStep(3);
      if (this.state.activeQuest && this.state.activeQuest.id === 'quest_ch2_m3') {
        this.state.activeQuest.status = 'completed';
        this.state.completedQuests.push({ ...this.state.activeQuest });
      }
      this.flags.ch2MissionStage = 4;
      this.state.activeQuest = {
        id: 'quest_ch2_m4',
        name: 'Capítulo 2 • Missão 4 — O Último Registro',
        description: 'Investigue o fragmento de memória manifestado na Sala de Alquimia e descubra a pista deixada por Seraphine.',
        currentStep: 0,
        steps: [
          { text: 'Investigar a lembrança revelada pela poção.', completed: false },
          { text: 'Identificar o local mostrado na visão.', completed: false },
          { text: 'Encontrar a nova pista ligada a Elias.', completed: false },
          { text: 'Registrar a descoberta no diário.', completed: false }
        ],
        status: 'active'
      };
    }
    this.saveGame();

    const fx = document.createElement('div');
    fx.className = 'spell-cast-fx';
    fx.style.background = 'radial-gradient(circle, rgba(83,118,200,0.75) 0%, rgba(165,138,232,0.4) 55%, transparent 80%)';
    this.root.appendChild(fx);
    setTimeout(() => fx.remove(), 1400);

    this.showNotification('✦ A Poção da Lembrança foi ativada! Um fragmento de memória de Seraphine surgiu na sala! ✦', 'quest');
    this.renderSceneInteractiveElements();
    setTimeout(() => {
      this.startDialogue('ch2_memory_investigation', 'start');
    }, 650);
  }

  completeChapter2FinalDiscovery() {
    this.flags.ch2MemoryInvestigated = true;
    this.flags.ch2LocationIdentified = true;
    this.flags.ch2EliasClueFound = true;
    this.flags.ch2FinalDiscoveryLogged = true;
    this.addClue({
      id: 'clue_ch2_elias_key_ref',
      title: 'A Chave Confiada a Elias',
      description: 'A lembrança de Seraphine mostrou o Dormitório da Noite e revelou uma chave de ferro com o brasão dos Crowe entregue a Elias antes do desaparecimento.',
      location: 'Sala de Alquimia',
      date: 'Capítulo II'
    });
    if ((this.flags.ch2MissionStage || 1) === 4) {
      this.updateQuestStep(0);
      this.updateQuestStep(1);
      this.updateQuestStep(2);
      this.updateQuestStep(3);
    }
    this.completeCurrentPhase();
  }

  checkPhase3Reagents() {
    this.checkCh2Mission2Complete();
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
        this.learnSpell('revelare', false);
        this.updateQuestStep(2);
        this.closeModal();
        this.openInspectModal(
          '✦ Feitiço REVELARE Aprendido! ✦',
          'As palavras arcanas ressoam na sua mente em harmonia perfeita:\n\n"Quando as sombras cobrirem os olhos dos mundanos, rasgue o véu das pedras com a palavra ancestral e o que foi apagado clamará em luz violeta: REVELARE."\n\nAgora você pode ativar o feitiço REVELARE na barra inferior a qualquer momento para expor runas invisíveis e passagens seladas!',
          'O Laboratório de Alquimia foi destrancado!',
          null,
          () => this.completeCurrentPhase()
        );
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
      if (!this.flags.ch2PotionActivated) {
        this.openPotionConsumptionChoice();
        return;
      }
      this.openInspectModal(
        'Poção da Lembrança Ativada',
        'O elixir já foi destilado e ativado no alambique. Um fragmento de memória de Seraphine manifestou-se na Sala de Alquimia.',
        'Investigue o Fragmento de Memória na sala para concluir o capítulo.'
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
      alert('Instruções do Manuscrito: "Primeiro a base líquida (Orvalho Lunar), depois a âncora de memórias (Raiz de Mandrágora), inflame o tempo (Cinza de Fênix) e estabilize com o Éter Rúnico!"');
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
        this.flags.ch2IngredientsOrganized = true;
        this.flags.ch2InstructionsFollowed = true;
        this.flags.potionBrewed = true;
        this.addInventoryItem({
          id: 'memory_potion',
          name: 'Poção da Lembrança Destilada',
          icon: '🧪',
          image: '/assets/images/objects/potion.jpg',
          description: 'Um elixir brilhante capaz de reacender memórias que foram apagadas do tecido do tempo.'
        });
        if ((this.flags.ch2MissionStage || 1) === 3) {
          this.updateQuestStep(0);
          this.updateQuestStep(1);
          this.updateQuestStep(2);
        } else {
          this.updateQuestStep(2);
        }
        this.saveGame();
        this.closeModal();
        this.openPotionConsumptionChoice();
      } else {
        alert('O alambique ferveu em tom turvo... A ordem dos ingredientes não corresponde ao manuscrito de Seraphine. Reorganize seguindo as instruções!');
        document.getElementById('btn-alchemy-reset').click();
      }
    };
  }

  openPotionConsumptionChoice() {
    const html = `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:2.6rem; margin-bottom:12px;">✦</div>
        <h3 style="font-family:var(--font-title); font-size:1.4rem; color:var(--color-luminous-purple); margin-bottom:12px;">Ativar a Poção da Lembrança</h3>
        <p style="color:var(--color-lunar-white); font-size:1rem; margin-bottom:24px; line-height:1.6;">
          O elixir azulado pulsa dentro do frasco de vidro. Ativá-lo condensará os ecos de Seraphine Ashford impregnados no ar da Sala de Alquimia. Como deseja ativar a reação?
        </p>
        <div style="display:flex; flex-direction:column; gap:12px; max-width:500px; margin:0 auto;">
          <button class="btn-gothic btn-primary" id="choice-activate-vapor">
            <span>Ativar a Poção sobre o Alambique (Manifestar Lembrança)</span>
          </button>
          <button class="btn-gothic" id="choice-drink-self">
            <span>Provar Uma Gota do Elixir (Visão Direta)</span>
          </button>
        </div>
      </div>
    `;
    this.openModal('Experimento Concluído — Poção da Lembrança', html);

    document.getElementById('choice-activate-vapor').onclick = () => {
      this.state.player.choices.potionDrinker = 'vapor';
      this.closeModal();
      this.activateMemoryPotion();
    };

    document.getElementById('choice-drink-self').onclick = () => {
      this.state.player.choices.potionDrinker = 'self';
      this.closeModal();
      this.activateMemoryPotion();
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
      'Fase 3 Concluída! Agora você precisa confrontar Elias no Dormitório da Noite.',
      null,
      () => this.completeCurrentPhase()
    );
  }

  // --- FASE 4: O SEGREDO DE ELIAS ---
  examineFireplace() {
    if (!this.flags.dormitoryKeyFound) {
      this.flags.dormitoryKeyFound = true;
      this.addInventoryItem({
        id: 'crowe_chest_key',
        name: 'Chave de Ferro da Família Crowe',
        icon: '🗝',
        image: '/assets/images/objects/key.jpg',
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
        image: '/assets/images/objects/diary.jpg',
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
          'Um espectro prateado se ergue do espelho trincado:\n\nA figura jovem da Diretora Morgana Vale entoa o cântico proibido enquanto almas de alunos se dissipam em fumaça violeta. Ela diz:\n\n"Que o sacrifício mantenha o limiar fechado. Que ninguém nunca saiba o que repousa do outro lado."\n\nCom o alinhamento, o Segundo Fragmento de Chave caiu sobre o pedestal!',
          'A Galeria das Mil Portas foi desbloqueada!',
          null,
          () => this.completeCurrentPhase()
        );
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
    if (!this.flags.doorsExamined) {
      this.flags.doorsExamined = { mirror: false, clock: false, stars: false, ashes: false, thorns: false };
    }

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

    const examinedCount = Object.values(this.flags.doorsExamined).filter(Boolean).length;
    this.flags.examinedDoorsCount = examinedCount;
    if (examinedCount >= 3) {
      this.updateQuestStep(0);
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
        this.updateQuestStep(2);
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
    this.updateQuestStep(3);
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

  // --- MAPA INTERATIVO ARQUITETÔNICO & CARTOGRAFIA DE NOCTÁRIA ---
  openMapModal() {
    const scenes = this.state.unlockedScenes;
    const chapters = Object.values(PHASES_CONFIG);
    const currentScene = this.state.currentScene || 'courtyard';
    const currentPhaseCfg = Object.values(PHASES_CONFIG).find(p => p.scene === currentScene) || PHASES_CONFIG.prologue;
    const activeQuest = this.state.activeQuest;

    // Identify current quest destination phase
    const questPhaseCfg = PHASES_CONFIG[this.state.currentChapter] || currentPhaseCfg;

    // Default selected preview on map
    let selectedChapter = questPhaseCfg || currentPhaseCfg;

    const html = `
      <div class="gothic-map-interface">
        <!-- Map header with compass & lore -->
        <div class="map-top-legend">
          <div class="map-legend-item"><span class="legend-dot dot-current"></span> Setor Atual</div>
          <div class="map-legend-item"><span class="legend-dot dot-quest"></span> Objetivo Ativo</div>
          <div class="map-legend-item"><span class="legend-dot dot-unlocked"></span> Ala Desbloqueada</div>
          <div class="map-legend-item"><span class="legend-dot dot-locked"></span> Selo Dimensional Ativo</div>
          <div class="map-compass-symbol">✦ NOCTÁRIA • SÉCULO XIX ✦</div>
        </div>

        <div class="map-split-view">
          <!-- Interactive Map Canvas / Blueprint Stage -->
          <div class="map-viewport-stage" id="map-viewport-stage">
            <!-- Architectural Background Texture -->
            <div class="map-blueprint-grid"></div>
            
            <!-- Noctaria Academy Castle Silhouette & Path Network -->
            <svg class="map-connections-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <!-- Connecting Ley Lines -->
              <line x1="18" y1="78" x2="38" y2="68" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="38" y1="68" x2="58" y2="62" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="38" y1="68" x2="25" y2="46" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="58" y1="62" x2="42" y2="44" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="42" y1="44" x2="74" y2="48" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="74" y1="48" x2="50" y2="30" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="50" y1="30" x2="70" y2="20" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="70" y1="20" x2="50" y2="12" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="50" y1="12" x2="84" y2="80" stroke="rgba(165,138,232,0.4)" stroke-width="1.2" stroke-dasharray="2 2" />
            </svg>

            <!-- Map Location Nodes -->
            <div class="map-nodes-layer">
              ${chapters.map(ch => {
                const isUnlocked = scenes.includes(ch.scene);
                const isCurrent = currentScene === ch.scene;
                const isQuestTarget = questPhaseCfg && questPhaseCfg.id === ch.id;
                const coords = ch.coordinates || { x: 50, y: 50 };
                const bgGen = SCENE_BACKGROUNDS[ch.scene] || SCENE_BACKGROUNDS.courtyard;
                const pinImg = bgGen();
                const iconLabel = isCurrent ? '✦' : (isUnlocked ? String(ch.number + 1) : '🔒');
                return `
                  <button class="map-node-pin ${isUnlocked ? 'is-open' : 'is-sealed'} ${isCurrent ? 'is-active' : ''} ${isQuestTarget ? 'is-quest-target' : ''}" 
                          style="left:${coords.x}%; top:${coords.y}%;"
                          data-chapter-id="${ch.id}"
                          data-scene-id="${ch.scene}"
                          title="${ch.locationName}">
                    <div class="pin-halo"></div>
                    ${isQuestTarget ? `<span class="pin-quest-badge" title="Objetivo da Missão Atual">✦ Missão</span>` : ''}
                    <div class="pin-thumb-preview" style="background-image: url('${pinImg}');">
                      <div class="pin-core-overlay">${iconLabel}</div>
                    </div>
                    <span class="pin-hover-tooltip">
                      <span class="tooltip-num">Fase ${ch.number} ${isQuestTarget ? '• Missão Ativa' : ''}</span>
                      <span class="tooltip-name">${ch.locationName}</span>
                      <span class="tooltip-status">${isCurrent ? '(Você está aqui)' : (isUnlocked ? 'Clique para inspecionar / viajar' : 'Bloqueado')}</span>
                    </span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Location Inspector & Fast Travel Details Panel -->
          <div class="map-details-sidebar" id="map-details-sidebar">
            <div class="map-preview-card" id="map-preview-card">
              <!-- Dynamically populated by updateMapPreview() -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.openModal('Cartografia & Portais Arcanos de Noctária', html);

    const updateMapPreview = (chapter) => {
      selectedChapter = chapter;
      const isUnlocked = scenes.includes(chapter.scene);
      const isCurrent = currentScene === chapter.scene;
      const isQuestTarget = questPhaseCfg && questPhaseCfg.id === chapter.id;
      const bgGenerator = SCENE_BACKGROUNDS[chapter.scene] || SCENE_BACKGROUNDS.courtyard;
      const previewBg = bgGenerator();

      const previewContainer = document.getElementById('map-preview-card');
      if (!previewContainer) return;

      previewContainer.innerHTML = `
        <div class="preview-thumbnail" style="background-image: url('${previewBg}');">
          <div class="preview-badge-status ${isCurrent ? 'status-current' : (isUnlocked ? 'status-open' : 'status-locked')}">
            ${isCurrent ? '● Localização Atual' : (isUnlocked ? '✓ Acesso Liberado' : '🔒 Selado Nesta Fase')}
          </div>
          ${isQuestTarget ? `<div class="preview-badge-quest">✦ Alvo da Missão</div>` : ''}
          <span class="preview-category">${chapter.category || 'Ala Arcana'}</span>
        </div>

        <div class="preview-body">
          <span class="preview-phase-tag">${chapter.title}</span>
          <h3 class="preview-title">${chapter.locationName}</h3>
          
          <div class="preview-atmosphere">
            <strong>Atmosfera do Local:</strong>
            <p>“${chapter.atmosphere}”</p>
          </div>

          <p class="preview-description">${chapter.description}</p>

          ${!isUnlocked ? `
            <div class="preview-lock-box">
              <div class="lock-box-header">
                <span class="lock-icon">🔒</span>
                <strong>Motivo do Bloqueio:</strong>
              </div>
              <p class="lock-reason-text">${chapter.lockReason || 'O selo dimensional desta ala responde apenas ao progresso dos mistérios de Noctária.'}</p>
              <div class="lock-requirement-note">
                <strong>Como desbloquear:</strong> ${chapter.unlockRequirement || 'Conclua os enigmas da fase anterior.'}
              </div>
            </div>
          ` : ''}

          <div class="preview-clues-section">
            <span class="preview-clues-title">✦ Pontos Notáveis & Pistas:</span>
            <ul class="preview-clues-list">
              ${(chapter.cluesHere || ['Segredos ocultos sob as sombras']).map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>

          <div class="preview-actions">
            ${isCurrent ? `
              <button class="btn-gothic btn-disabled" disabled style="width:100%;">
                <span>Você já está nesta ala</span>
              </button>
            ` : isUnlocked ? `
              <button class="btn-gothic btn-primary" id="btn-travel-confirm" style="width:100%;">
                <span>✦ Viajar para esta Ala</span>
              </button>
            ` : `
              <button class="btn-gothic btn-locked" id="btn-travel-locked" style="width:100%;">
                <span>🔒 Acesso Bloqueado</span>
              </button>
            `}
            <button class="btn-gothic btn-subtle" id="btn-map-close-footer" style="width:100%; margin-top:8px;">
              <span>Fechar Mapa</span>
            </button>
          </div>
        </div>
      `;

      const travelBtn = document.getElementById('btn-travel-confirm');
      if (travelBtn) {
        travelBtn.onclick = () => {
          this.closeModal();
          this.changeScene(chapter.scene);
          this.showNotification(`Transição dimensional: Você adentrou ${chapter.locationName}`, 'info');
        };
      }

      const lockedBtn = document.getElementById('btn-travel-locked');
      if (lockedBtn) {
        lockedBtn.onclick = () => {
          this.showNotification(`⚠️ ${chapter.locationName} está trancada: ${chapter.lockReason || 'Cumpra a missão correspondente para desbloquear.'}`, 'quest');
        };
      }

      const closeMapBtn = document.getElementById('btn-map-close-footer');
      if (closeMapBtn) {
        closeMapBtn.onclick = () => this.closeModal();
      }
    };

    // Initialize preview with active quest or current chapter
    updateMapPreview(selectedChapter);

    // Node click interactions: single click to preview, double click to travel if open
    document.querySelectorAll('.map-node-pin').forEach(pin => {
      const chId = pin.getAttribute('data-chapter-id');
      const targetCh = PHASES_CONFIG[chId];

      pin.onclick = () => {
        if (targetCh) {
          document.querySelectorAll('.map-node-pin').forEach(p => p.classList.remove('is-selected'));
          pin.classList.add('is-selected');
          updateMapPreview(targetCh);
        }
      };

      pin.ondblclick = () => {
        if (targetCh && scenes.includes(targetCh.scene) && currentScene !== targetCh.scene) {
          this.closeModal();
          this.changeScene(targetCh.scene);
          this.showNotification(`Viagem rápida: ${targetCh.locationName}`, 'info');
        }
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
        if (this.flags.doorsExamined && this.flags.doorsExamined.stars) {
          this.flags.correctStarDoorOpened = true;
          this.updateQuestStep(2);
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
      existingOverlay.className = 'dialogue-overlay vn-dialogue-frame';
      
      // Scrim background for cinematic focus
      const scrim = document.createElement('div');
      scrim.className = 'dialogue-cinematic-scrim';
      scrim.id = 'dialogue-scrim';
      this.root.appendChild(scrim);
      this.root.appendChild(existingOverlay);
    }

    existingOverlay.innerHTML = `
      <!-- Character Stance Column with Gothic Arch Filigree -->
      <div class="dialogue-portrait-col">
        <div class="portrait-arch-frame">
          <div class="portrait-wrapper">
            ${character.image ? `<img src="${character.image}" alt="${character.name}" class="portrait-art">` : character.avatarSvg}
          </div>
          <div class="portrait-runic-glow"></div>
        </div>
        <div class="speaker-role-card">
          <span class="speaker-role-tag">${character.title}</span>
          <span class="speaker-affinity-tag">Afinidade: +${this.state.player.relationships[character.id] || 0}</span>
        </div>
      </div>

      <!-- Dialogue Content Box -->
      <div class="dialogue-content-col">
        <div class="dialogue-header-bar">
          <div class="speaker-badge-title">
            <span class="speaker-ornament">✧</span>
            <h3 class="speaker-name">${character.name}</h3>
            <span class="speaker-ornament">✧</span>
          </div>
          <div class="dialogue-skip-hint">Clique para avançar texto</div>
        </div>

        <div class="dialogue-body-area">
          <p class="dialogue-text" id="dialogue-text-body"></p>
          <div class="dialogue-continuation-cursor" id="dialogue-cursor" style="display:none;">▼</div>
        </div>

        <!-- Choice Options -->
        <div class="dialogue-options-wrapper">
          <div class="dialogue-options-label" id="dialogue-options-header" style="display:none;">
            ✦ Respostas & Decisões Disponíveis:
          </div>
          <div class="dialogue-options" id="dialogue-options-list"></div>
        </div>
      </div>
    `;

    const textEl = document.getElementById('dialogue-text-body');
    const optionsContainer = document.getElementById('dialogue-options-list');
    const optionsHeader = document.getElementById('dialogue-options-header');
    const cursorEl = document.getElementById('dialogue-cursor');
    const scrimEl = document.getElementById('dialogue-scrim');

    if (this.textRevealInterval) clearInterval(this.textRevealInterval);
    const fullText = node.text;
    let charIndex = 0;
    textEl.innerText = '';

    const showOptions = () => {
      if (cursorEl) cursorEl.style.display = 'block';
      if (optionsHeader) optionsHeader.style.display = 'block';
      optionsContainer.innerHTML = '';

      if (node.isEnd) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialogue-opt-btn opt-continue-btn';
        closeBtn.innerHTML = `
          <span class="dialogue-opt-marker">✦</span>
          <span class="opt-label-text">Prosseguir com a investigação</span>
          <span class="opt-arrow">⟶</span>
        `;
        closeBtn.onclick = () => {
          if (node.onComplete) node.onComplete(this);
          existingOverlay.classList.add('dialogue-slide-down');
          if (scrimEl) scrimEl.classList.add('scrim-fade-out');
          setTimeout(() => {
            existingOverlay.remove();
            if (scrimEl) scrimEl.remove();
          }, 250);
        };
        optionsContainer.appendChild(closeBtn);
      } else {
        availableOptions.forEach((opt, idx) => {
          const btn = document.createElement('button');
          btn.className = 'dialogue-opt-btn';
          btn.innerHTML = `
            <span class="dialogue-opt-marker">${String.fromCharCode(65 + idx)}.</span>
            <span class="opt-label-text">${opt.text}</span>
            <span class="opt-arrow">⟶</span>
          `;
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
      const speedDelay = this.state.settings.textSpeed === 'fast' ? 8 : 16;
      this.textRevealInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          textEl.innerText += fullText[charIndex];
          charIndex++;
        } else {
          clearInterval(this.textRevealInterval);
          showOptions();
        }
      }, speedDelay);

      existingOverlay.onclick = (e) => {
        if (e.target.closest('button')) return;
        if (charIndex < fullText.length) {
          clearInterval(this.textRevealInterval);
          textEl.innerText = fullText;
          showOptions();
        }
      };
    }
  }

  // --- MODALS (SISTEMA GÓTICO ORNAMENTADO COM CONTEÚDO DINÂMICO) ---
  buildModalBodyHtml(contentOrOptions) {
    if (typeof contentOrOptions === 'string') {
      return contentOrOptions;
    }
    const opts = contentOrOptions || {};
    if (opts.html) return opts.html;

    const imageHtml = opts.image
      ? `<div class="modal-dynamic-image-wrap"><img src="${opts.image}" alt="${opts.title || 'Imagem'}" class="modal-dynamic-image"></div>`
      : '';
    const textHtml = opts.text
      ? `<div class="modal-dynamic-text">${String(opts.text).replace(/\n/g, '<br>')}</div>`
      : '';
    const buttonsHtml = Array.isArray(opts.buttons) && opts.buttons.length > 0
      ? `<div class="modal-dynamic-actions">${opts.buttons.map((b, i) => `
          <button class="btn-gothic ${b.variant === 'primary' ? 'btn-primary' : ''}" data-modal-btn-idx="${i}">
            <span>${b.label || 'Confirmar'}</span>
          </button>
        `).join('')}</div>`
      : '';

    return `<div class="modal-dynamic-layout">${imageHtml}${textHtml}${buttonsHtml}</div>`;
  }

  getGothicRoseSvg() {
    return `
      <svg viewBox="0 0 64 64" class="gothic-rose-svg" aria-hidden="true">
        <defs>
          <radialGradient id="roseGrad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="45%" stop-color="#4c1d95"/>
            <stop offset="100%" stop-color="#170b2b"/>
          </radialGradient>
        </defs>
        <path d="M32 8 C42 8, 52 16, 52 28 C52 44, 40 54, 32 54 C24 54, 12 44, 12 28 C12 16, 22 8, 32 8 Z" fill="url(#roseGrad)" stroke="#9ca3af" stroke-width="1.2"/>
        <path d="M32 14 C39 14, 46 20, 45 29 C44 38, 37 45, 32 45 C27 45, 20 38, 19 29 C18 20, 25 14, 32 14 Z" fill="#2e1065" stroke="#a58ae8" stroke-width="1"/>
        <path d="M32 19 C36 19, 40 23, 39 29 C38 34, 35 37, 32 37 C29 37, 26 34, 25 29 C24 23, 28 19, 32 19 Z" fill="#5b21b6" stroke="#c4b5fd" stroke-width="0.9"/>
        <path d="M32 23 C34 23, 36 25, 35 28 C34 31, 30 31, 29 28 C28 25, 30 23, 32 23 Z" fill="#a78bfa"/>
        <path d="M16 42 Q10 48 6 46 Q12 38 18 36 Z M48 42 Q54 48 58 46 Q52 38 46 36 Z" fill="#1e1b2e" stroke="#9ca3af" stroke-width="1"/>
      </svg>
    `;
  }

  getAcademyCrestSvg() {
    return `
      <svg viewBox="0 0 220 90" class="gothic-crest-svg" aria-hidden="true">
        <defs>
          <linearGradient id="crestSilver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e5e7eb"/>
            <stop offset="50%" stop-color="#9ca3af"/>
            <stop offset="100%" stop-color="#4b5563"/>
          </linearGradient>
          <linearGradient id="crestPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c4b5fd"/>
            <stop offset="100%" stop-color="#6d28d9"/>
          </linearGradient>
        </defs>
        <!-- Crescent Moon -->
        <path d="M110 6 A11 11 0 1 0 120 22 A8.5 8.5 0 1 1 110 6 Z" fill="#d8b4fe" stroke="#e5e7eb" stroke-width="0.8"/>
        <!-- Gothic Academy Silhouette -->
        <path d="M62 70 L62 48 L70 32 L78 48 L78 42 L88 24 L98 42 L98 34 L110 18 L122 34 L122 42 L132 24 L142 42 L142 48 L150 32 L158 48 L158 70 Z"
              fill="#111324" stroke="url(#crestSilver)" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Glowing Windows & Portal -->
        <rect x="86" y="46" width="4" height="10" rx="2" fill="url(#crestPurple)"/>
        <rect x="130" y="46" width="4" height="10" rx="2" fill="url(#crestPurple)"/>
        <path d="M106 70 L106 50 Q110 43 114 50 L114 70 Z" fill="url(#crestPurple)"/>
        <rect x="70" y="52" width="3" height="8" rx="1.5" fill="#8b5cf6"/>
        <rect x="147" y="52" width="3" height="8" rx="1.5" fill="#8b5cf6"/>
        <!-- Ornate Filigree Wings -->
        <path d="M24 72 Q60 66 95 74 L110 82 L125 74 Q160 66 196 72 Q165 78 130 78 L110 87 L90 78 Q55 78 24 72 Z"
              fill="#181a2e" stroke="url(#crestSilver)" stroke-width="1.3"/>
        <!-- Center 4-point Luminous Star -->
        <polygon points="110,67 113,75 121,78 113,81 110,89 107,81 99,78 107,75" fill="#c4b5fd" stroke="#fff" stroke-width="0.6"/>
      </svg>
    `;
  }

  openModal(title, contentOrOptions) {
    // Immediate cleanup if another modal is already open to avoid race conditions
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
    if (this._modalEscHandler) {
      document.removeEventListener('keydown', this._modalEscHandler);
      this._modalEscHandler = null;
    }

    const bodyHtml = this.buildModalBodyHtml(contentOrOptions);
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'active-modal';
    modalBackdrop.innerHTML = `
      <div class="gothic-modal gothic-modal-image-frame" role="dialog" aria-modal="true" aria-labelledby="gothic-modal-title">
        <!-- Close Button aligned over the ornate X in the top-right corner of the frame -->
        <button class="modal-close-btn" id="modal-close-x" aria-label="Fechar" title="Fechar">&times;</button>

        <div class="modal-inner-frame">
          <div class="modal-header">
            <h2 class="modal-title" id="gothic-modal-title">${title}</h2>
          </div>
          <div class="modal-body" id="gothic-modal-body">
            ${bodyHtml}
          </div>
        </div>
      </div>
    `;

    this.root.appendChild(modalBackdrop);

    // Bind dynamic buttons if options object was passed
    if (contentOrOptions && typeof contentOrOptions === 'object' && Array.isArray(contentOrOptions.buttons)) {
      contentOrOptions.buttons.forEach((btnCfg, idx) => {
        const el = modalBackdrop.querySelector(`[data-modal-btn-idx="${idx}"]`);
        if (el && typeof btnCfg.onClick === 'function') {
          el.onclick = () => btnCfg.onClick(this);
        }
      });
    }

    document.getElementById('modal-close-x').onclick = () => this.closeModal();
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) this.closeModal();
    };

    this._modalEscHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._modalEscHandler);

    this.activeModal = modalBackdrop;
  }

  updateModalContent(title, contentOrOptions) {
    if (!this.activeModal) {
      this.openModal(title, contentOrOptions);
      return;
    }
    const titleEl = document.getElementById('gothic-modal-title');
    const bodyEl = document.getElementById('gothic-modal-body');
    if (titleEl && title !== undefined && title !== null) {
      titleEl.innerHTML = title;
    }
    if (bodyEl) {
      bodyEl.innerHTML = this.buildModalBodyHtml(contentOrOptions);
      if (contentOrOptions && typeof contentOrOptions === 'object' && Array.isArray(contentOrOptions.buttons)) {
        contentOrOptions.buttons.forEach((btnCfg, idx) => {
          const el = bodyEl.querySelector(`[data-modal-btn-idx="${idx}"]`);
          if (el && typeof btnCfg.onClick === 'function') {
            el.onclick = () => btnCfg.onClick(this);
          }
        });
      }
    }
  }

  closeModal() {
    if (this._modalEscHandler) {
      document.removeEventListener('keydown', this._modalEscHandler);
      this._modalEscHandler = null;
    }
    if (this.activeModal) {
      const closingEl = this.activeModal;
      this.activeModal = null;
      closingEl.classList.add('is-closing');
      setTimeout(() => {
        if (closingEl && closingEl.parentNode) {
          closingEl.remove();
        }
      }, 220);
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
            ${item.image ? `
              <div class="item-image-thumb">
                <img src="${item.image}" alt="${item.name}">
              </div>
            ` : `
              <div class="item-icon">${item.icon}</div>
            `}
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
          this.openInspectModal(item.name, item.description, 'Item catalogado no inventário do jogador.', item.image || null);
        }
      };
    });
  }

  openInspectModal(title, text, subtext = '', imageUrl = null, onClose = null) {
    const html = `
      <div class="inspect-modal-layout ${imageUrl ? 'has-inspect-image' : ''}">
        ${imageUrl ? `
          <div class="inspect-image-wrapper">
            <img src="${imageUrl}" alt="${title}" class="inspect-object-image">
            <div class="inspect-image-frame-glow"></div>
          </div>
        ` : ''}
        <div class="letter-parchment inspect-text-wrapper">
          <p style="margin-bottom:14px; white-space:pre-line;">${text}</p>
          ${subtext ? `<p style="font-size:0.9rem; color:var(--color-aged-silver); border-top:1px dashed rgba(183,183,200,0.3); padding-top:10px;">${subtext}</p>` : ''}
        </div>
      </div>
      <div style="margin-top:20px; text-align:right;">
        <button class="btn-gothic" id="inspect-back-btn" style="display:inline-flex;">Fechar</button>
      </div>
    `;
    this.openModal(title, html);
    document.getElementById('inspect-back-btn').onclick = () => {
      this.closeModal();
      if (typeof onClose === 'function') onClose();
    };
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
      // O estado já foi actualizado em completeCurrentPhase().
      // Apenas re-renderizamos o mundo para reflectir o novo capítulo.
      this.renderGameWorld();
    };
  }

  openSettingsModal() {
    this.closeModal();
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
    if (this._modalEscHandler) {
      document.removeEventListener('keydown', this._modalEscHandler);
      this._modalEscHandler = null;
    }

    const s = this.state.settings;
    const isCurrentlyFullscreen = Boolean(document.fullscreenElement);

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'active-modal';
    modalBackdrop.innerHTML = `
      <div class="settings-modal-shell" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="settings-rose settings-rose-tl" aria-hidden="true">${this.getGothicRoseSvg()}</div>
        <div class="settings-rose settings-rose-br" aria-hidden="true">${this.getGothicRoseSvg()}</div>

        <button type="button" class="settings-close-x" id="settings-close-x" aria-label="Fechar e cancelar alterações" title="Fechar">✕</button>

        <div class="settings-modal-header">
          <span class="settings-title-star" aria-hidden="true">✦</span>
          <h2 class="settings-modal-title" id="settings-modal-title">CONFIGURAÇÕES</h2>
        </div>

        <div class="settings-modal-body">
          <div class="settings-row">
            <label class="settings-row-label" for="music-vol">
              <span class="settings-row-icon" aria-hidden="true">♫</span>
              <span>VOLUME DA MÚSICA</span>
            </label>
            <div class="settings-row-control settings-slider-group">
              <input type="range" class="settings-range" id="music-vol" min="0" max="100" value="${s.musicVolume}">
              <span class="settings-vol-icon" aria-hidden="true">🔊</span>
            </div>
          </div>

          <div class="settings-row">
            <label class="settings-row-label" for="sfx-vol">
              <span class="settings-row-icon" aria-hidden="true">🔊</span>
              <span>VOLUME DOS EFEITOS SONOROS</span>
            </label>
            <div class="settings-row-control settings-slider-group">
              <input type="range" class="settings-range" id="sfx-vol" min="0" max="100" value="${s.sfxVolume}">
              <span class="settings-vol-icon" aria-hidden="true">🔊</span>
            </div>
          </div>

          <div class="settings-row">
            <label class="settings-row-label" for="speed-select">
              <span class="settings-row-icon" aria-hidden="true">⌨</span>
              <span>VELOCIDADE DO TEXTO</span>
            </label>
            <div class="settings-row-control">
              <select class="settings-select" id="speed-select">
                <option value="normal" ${s.textSpeed === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="fast" ${s.textSpeed === 'fast' ? 'selected' : ''}>Rápida</option>
                <option value="instant" ${s.textSpeed === 'instant' ? 'selected' : ''}>Instantânea</option>
              </select>
            </div>
          </div>

          <div class="settings-row">
            <label class="settings-row-label" for="screen-mode-select">
              <span class="settings-row-icon" aria-hidden="true">⚙</span>
              <span>MODO TELA</span>
            </label>
            <div class="settings-row-control">
              <select class="settings-select" id="screen-mode-select">
                <option value="windowed" ${!isCurrentlyFullscreen ? 'selected' : ''}>Modo Janela</option>
                <option value="fullscreen" ${isCurrentlyFullscreen ? 'selected' : ''}>Tela Cheia</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-bottom-divider" aria-hidden="true">
          <span class="settings-divider-line"></span>
          <span class="settings-divider-star">✦</span>
          <span class="settings-divider-line"></span>
        </div>

        <div class="settings-modal-actions">
          <button type="button" class="settings-btn settings-btn-cancel" id="settings-cancel-btn">Cancelar</button>
          <button type="button" class="settings-btn settings-btn-confirm" id="settings-confirm-btn">Confirmar</button>
        </div>
      </div>
    `;

    this.root.appendChild(modalBackdrop);
    this.activeModal = modalBackdrop;

    // Mesma função para X, Cancelar, ESC e clique fora: fecha imediatamente sem aplicar nem salvar alterações
    const cancelAndClose = () => {
      this.closeModal();
    };

    document.getElementById('settings-close-x').onclick = (e) => {
      e.stopPropagation();
      cancelAndClose();
    };

    document.getElementById('settings-cancel-btn').onclick = () => {
      cancelAndClose();
    };

    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) cancelAndClose();
    };

    this._modalEscHandler = (e) => {
      if (e.key === 'Escape') cancelAndClose();
    };
    document.addEventListener('keydown', this._modalEscHandler);

    document.getElementById('settings-confirm-btn').onclick = () => {
      this.state.settings.musicVolume = parseInt(document.getElementById('music-vol').value, 10);
      this.state.settings.sfxVolume = parseInt(document.getElementById('sfx-vol').value, 10);
      this.state.settings.textSpeed = document.getElementById('speed-select').value;

      const selectedScreenMode = document.getElementById('screen-mode-select').value;
      if (selectedScreenMode === 'fullscreen' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (selectedScreenMode === 'windowed' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      this.saveGame();
      this.closeModal();
      this.showNotification('Configurações salvas e aplicadas!', 'info');
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
