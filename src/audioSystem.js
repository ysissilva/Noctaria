/**
 * NOCTÁRIA SOUND ENGINE (AudioSystem)
 * 
 * Gerencia a reprodução espacial, controle de canais (Master, Music, SFX, Human/Voice, Ambience),
 * variação anti-repetição para passos e respirações, crossfading de trilhas sonoras,
 * e suporte à API de síntese e Web Audio nativa para realismo e baixa latência.
 */

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    
    // Configurações e Volumes (0 a 100)
    this.volumes = {
      master: 85,
      music: 70,
      sfx: 80,
      human: 75,
      ambience: 65,
      voices: 80
    };

    // Canais de Ganho Web Audio
    this.gainNodes = {};

    // Tracks ativas
    this.currentMusicAudio = null;
    this.currentAmbienceAudio = null;
    this.currentMusicId = null;
    this.currentAmbienceId = null;

    // Buffers / Variação de passos e respiração
    this.lastFootstepIndex = -1;
    this.lastBreathIndex = -1;

    // Estado do jogador para simulação sonora dinâmica (passos, respiração)
    this.isTense = false;
    this.breathingInterval = null;

    this.loadPreferences();
    this.initAudioContext();
  }

  // Inicializa contexto de áudio após interação do usuário (política do navegador)
  initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupGainNodes();
      }
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupGainNodes() {
    if (!this.ctx) return;
    
    // Master Gain
    this.gainNodes.master = this.ctx.createGain();
    this.gainNodes.master.connect(this.ctx.destination);

    // Sub gains
    const channels = ['music', 'sfx', 'human', 'ambience', 'voices'];
    channels.forEach(ch => {
      this.gainNodes[ch] = this.ctx.createGain();
      this.gainNodes[ch].connect(this.gainNodes.master);
    });

    this.applyVolumes();
  }

  applyVolumes() {
    const m = this.isMuted ? 0 : (this.volumes.master / 100);
    if (this.gainNodes.master && this.ctx) {
      this.gainNodes.master.gain.setValueAtTime(m, this.ctx.currentTime);
    }

    ['music', 'sfx', 'human', 'ambience', 'voices'].forEach(ch => {
      if (this.gainNodes[ch] && this.ctx) {
        const val = this.isMuted ? 0 : (this.volumes[ch] / 100);
        this.gainNodes[ch].gain.setValueAtTime(val, this.ctx.currentTime);
      }
    });

    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = (this.volumes.master / 100) * (this.volumes.music / 100) * (this.isMuted ? 0 : 1);
    }
    if (this.currentAmbienceAudio) {
      this.currentAmbienceAudio.volume = (this.volumes.master / 100) * (this.volumes.ambience / 100) * (this.isMuted ? 0 : 1);
    }
  }

  // --- PERSISTÊNCIA DAS CONFIGURAÇÕES ---
  loadPreferences() {
    try {
      const saved = localStorage.getItem('noctaria_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.volumes = { ...this.volumes, ...parsed.volumes };
        this.isMuted = !!parsed.isMuted;
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de áudio:', e);
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('noctaria_audio_settings', JSON.stringify({
        volumes: this.volumes,
        isMuted: this.isMuted
      }));
    } catch (e) {
      console.warn('Erro ao salvar preferências de áudio:', e);
    }
  }

  resetDefaultPreferences() {
    this.volumes = {
      master: 85,
      music: 70,
      sfx: 80,
      human: 75,
      ambience: 65,
      voices: 80
    };
    this.isMuted = false;
    this.savePreferences();
    this.applyVolumes();
  }

  // --- REPRODUÇÃO DE TRILHA SONORA COM CROSSFADE ---
  playMusic(musicId, fadeDuration = 1.5) {
    if (this.currentMusicId === musicId && this.currentMusicAudio && !this.currentMusicAudio.paused) {
      return;
    }

    const musicMap = {
      menu: '/assets/audio/music/menu_theme.wav',
      exploration: '/assets/audio/music/exploration_theme.wav',
      tension: '/assets/audio/music/tension_theme.wav'
    };

    const targetSrc = musicMap[musicId];
    if (!targetSrc) return;

    this.currentMusicId = musicId;
    const oldAudio = this.currentMusicAudio;

    // Fade out antiga música
    if (oldAudio) {
      let currentVol = oldAudio.volume;
      const step = currentVol / (fadeDuration * 20);
      const fadeInterval = setInterval(() => {
        currentVol = Math.max(0, currentVol - step);
        oldAudio.volume = currentVol;
        if (currentVol <= 0.01) {
          clearInterval(fadeInterval);
          oldAudio.pause();
          oldAudio.currentTime = 0;
        }
      }, 50);
    }

    // Criar e iniciar nova música
    const newAudio = new Audio(targetSrc);
    newAudio.loop = true;
    const targetVolume = (this.volumes.master / 100) * (this.volumes.music / 100) * (this.isMuted ? 0 : 1);
    newAudio.volume = 0;
    
    newAudio.play().then(() => {
      let vol = 0;
      const step = targetVolume / (fadeDuration * 20);
      const fadeInInterval = setInterval(() => {
        vol = Math.min(targetVolume, vol + step);
        newAudio.volume = vol;
        if (vol >= targetVolume) {
          clearInterval(fadeInInterval);
        }
      }, 50);
    }).catch(err => {
      console.log('Autoplay bloqueado pelo navegador até o primeiro clique:', err.message);
    });

    this.currentMusicAudio = newAudio;
  }

  stopMusic(fadeDuration = 1.0) {
    if (!this.currentMusicAudio) return;
    const audio = this.currentMusicAudio;
    let vol = audio.volume;
    const step = vol / (fadeDuration * 20);
    const fadeOut = setInterval(() => {
      vol = Math.max(0, vol - step);
      audio.volume = vol;
      if (vol <= 0.01) {
        clearInterval(fadeOut);
        audio.pause();
        audio.currentTime = 0;
      }
    }, 50);
    this.currentMusicId = null;
  }

  // --- AMBIÊNCIA CONTÍNUA ---
  playAmbience(ambienceId = 'corridor') {
    if (this.currentAmbienceId === ambienceId && this.currentAmbienceAudio) return;

    const ambienceMap = {
      corridor: '/assets/audio/sfx/ambience/corridor_wind_loop.wav',
      creaks: '/assets/audio/sfx/ambience/old_wood_creaks.wav'
    };

    const src = ambienceMap[ambienceId] || ambienceMap.corridor;
    if (this.currentAmbienceAudio) {
      this.currentAmbienceAudio.pause();
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = (this.volumes.master / 100) * (this.volumes.ambience / 100) * (this.isMuted ? 0 : 1);
    audio.play().catch(() => {});
    this.currentAmbienceAudio = audio;
    this.currentAmbienceId = ambienceId;
  }

  // --- REPRODUTOR DE EFEITOS SONOROS (SFX COM ÁUDIO ESPACIAL ESTÉREO) ---
  playSfx(path, channel = 'sfx', pan = 0.0, volumeScale = 1.0) {
    this.resumeContext();
    if (this.isMuted) return;

    const audio = new Audio(path);
    const chanVol = (this.volumes[channel] !== undefined ? this.volumes[channel] : this.volumes.sfx) / 100;
    const masterVol = this.volumes.master / 100;
    audio.volume = Math.max(0, Math.min(1.0, masterVol * chanVol * volumeScale));

    // Efeito espacial estéreo simples usando Web Audio se disponível
    if (this.ctx && this.gainNodes[channel]) {
      try {
        const source = this.ctx.createMediaElementSource(audio);
        const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        if (panner) {
          panner.pan.value = Math.max(-1, Math.min(1, pan));
          source.connect(panner);
          panner.connect(this.gainNodes[channel]);
        } else {
          source.connect(this.gainNodes[channel]);
        }
      } catch (e) {
        // Fallback caso mídia já conectada
      }
    }

    audio.play().catch(() => {});
    return audio;
  }

  // --- PASSOS DINÂMICOS COM ANTI-REPETIÇÃO ---
  playFootstep(isRunning = false, surface = 'stone', pan = 0.0) {
    const walkSounds = [
      '/assets/audio/sfx/footsteps/step_walk_1.wav',
      '/assets/audio/sfx/footsteps/step_walk_2.wav',
      '/assets/audio/sfx/footsteps/step_walk_3.wav',
      '/assets/audio/sfx/footsteps/step_walk_4.wav'
    ];
    const runSounds = [
      '/assets/audio/sfx/footsteps/step_run_1.wav',
      '/assets/audio/sfx/footsteps/step_run_2.wav',
      '/assets/audio/sfx/footsteps/step_run_3.wav'
    ];

    const pool = isRunning ? runSounds : walkSounds;
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * pool.length);
    } while (nextIdx === this.lastFootstepIndex && pool.length > 1);

    this.lastFootstepIndex = nextIdx;
    this.playSfx(pool[nextIdx], 'human', pan, isRunning ? 1.0 : 0.85);
  }

  // --- RESPIRAÇÃO DINÂMICA (CALMA OU OFEGANTE) ---
  startBreathingLoop() {
    if (this.breathingInterval) return;

    const playCycle = () => {
      if (this.isTense) {
        const tensePool = [
          '/assets/audio/sfx/human/breath_tense_1.wav',
          '/assets/audio/sfx/human/breath_tense_2.wav'
        ];
        const idx = Math.floor(Math.random() * tensePool.length);
        this.playSfx(tensePool[idx], 'human', 0.0, 0.9);
      } else {
        // Respiração calma espaçada
        this.playSfx('/assets/audio/sfx/human/breath_calm.wav', 'human', 0.0, 0.45);
      }
    };

    // Respiração regular suave a cada 7 segundos, ou a cada 2.5s se tensa
    this.breathingInterval = setInterval(() => {
      playCycle();
    }, this.isTense ? 3000 : 7500);
  }

  setTensionLevel(isTense = false) {
    this.isTense = isTense;
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
      this.startBreathingLoop();
    }
    // Muda a trilha sonora de acordo com a tensão
    if (isTense) {
      this.playMusic('tension');
    } else if (this.currentMusicId === 'tension') {
      this.playMusic('exploration');
    }
  }

  // --- SONS DE PORTAS ---
  playDoor(action = 'open', pan = 0.0) {
    const doorMap = {
      handle: '/assets/audio/sfx/doors/door_handle.wav',
      open: '/assets/audio/sfx/doors/door_open_creak.wav',
      close: '/assets/audio/sfx/doors/door_close.wav',
      slam: '/assets/audio/sfx/doors/door_slam.wav'
    };
    if (doorMap[action]) {
      this.playSfx(doorMap[action], 'sfx', pan);
    }
  }

  // --- SONS DE INTERAÇÃO COM O MUNDO ---
  playInteraction(type = 'paper', pan = 0.0) {
    const interactMap = {
      paper: '/assets/audio/sfx/interaction/paper_turn.wav',
      keys: '/assets/audio/sfx/interaction/keys_jingle.wav',
      drawer: '/assets/audio/sfx/interaction/drawer_open.wav',
      lever: '/assets/audio/sfx/interaction/switch_lever.wav',
      spell: '/assets/audio/sfx/interaction/spell_cast.wav'
    };
    if (interactMap[type]) {
      this.playSfx(interactMap[type], 'sfx', pan);
    }
  }

  // --- SONS DE INTERFACE DE USUÁRIO (UI) ---
  playUi(soundName) {
    const uiMap = {
      click: '/assets/audio/ui/ui_click.wav',
      hover: '/assets/audio/ui/ui_hover.wav',
      open: '/assets/audio/ui/ui_modal_open.wav',
      close: '/assets/audio/ui/ui_modal_close.wav',
      notify: '/assets/audio/ui/ui_notification.wav',
      tick: '/assets/audio/ui/ui_tick.wav'
    };
    if (uiMap[soundName]) {
      this.playSfx(uiMap[soundName], 'sfx', 0.0, 0.7);
    }
  }

  // --- FALAS E DIÁLOGOS HUMANOS (VOICE MURMUR / SPEECH) ---
  speakText(text, characterId = 'elias') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    
    // Configurar tom realista de voz baseado na personalidade do personagem
    window.speechSynthesis.cancel(); // Interrompe fala anterior
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    const charTones = {
      elias: { pitch: 0.9, rate: 0.95 },      // Jovem, misterioso, sério
      morgana: { pitch: 0.85, rate: 0.9 },     // Solene, imponente, elegante
      octavian: { pitch: 0.8, rate: 0.85 },    // Sábio, maduro, pausado
      celeste: { pitch: 1.1, rate: 1.05 },     // Ágil, perspicaz, curiosa
      seraphine: { pitch: 1.15, rate: 0.85 },  // Eco distante, etérea
      vespera: { pitch: 0.95, rate: 0.88 }     // Sussurrada, enigmática
    };

    const cfg = charTones[characterId] || { pitch: 1.0, rate: 1.0 };
    utterance.pitch = cfg.pitch;
    utterance.rate = cfg.rate;
    utterance.volume = (this.volumes.master / 100) * (this.volumes.voices / 100);

    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioSystem = new AudioSystem();
