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
    this.musicEnabled = true;
    this.youtubeVideoId = 'SQM38DJdaeU';
    this.ytPlayer = null;
    this.ytReady = false;
    this.ytPendingPlay = false;
    this._ytApiLoading = false;
    
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
      this.currentMusicAudio.volume = (this.volumes.master / 100) * (this.volumes.music / 100) * (this.isMuted || !this.musicEnabled ? 0 : 1);
    }
    if (this.currentAmbienceAudio) {
      this.currentAmbienceAudio.volume = (this.volumes.master / 100) * (this.volumes.ambience / 100) * (this.isMuted ? 0 : 0.45);
    }
    this.updateYouTubeVolume();
  }

  // --- CONTROLE DO PLAYER YOUTUBE PARA MÚSICA DE FUNDO ---
  initYouTubePlayer() {
    if (typeof document === 'undefined' || this.ytPlayer || this._ytApiLoading) return;
    this._ytApiLoading = true;

    let container = document.getElementById('noctaria-yt-music-player');
    if (!container) {
      container = document.createElement('div');
      container.id = 'noctaria-yt-music-player';
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0.001;pointer-events:none;';
      document.body.appendChild(container);
    }

    const createPlayer = () => {
      if (this.ytPlayer || !window.YT || !window.YT.Player) return;
      this.ytPlayer = new window.YT.Player('noctaria-yt-music-player', {
        height: '1',
        width: '1',
        videoId: this.youtubeVideoId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: this.youtubeVideoId,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            this.updateYouTubeVolume();
            if (this.ytPendingPlay && this.musicEnabled && !this.isMuted) {
              try {
                this.ytPlayer.playVideo();
              } catch (e) {}
            }
          },
          onStateChange: (event) => {
            // Garantir loop contínuo se terminar
            if (window.YT && event.data === window.YT.PlayerState.ENDED && this.musicEnabled && !this.isMuted) {
              try {
                this.ytPlayer.seekTo(0);
                this.ytPlayer.playVideo();
              } catch (e) {}
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      createPlayer();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  updateYouTubeVolume() {
    if (!this.ytPlayer || !this.ytReady) return;
    try {
      if (this.isMuted || !this.musicEnabled) {
        this.ytPlayer.mute();
        this.ytPlayer.pauseVideo();
      } else {
        this.ytPlayer.unMute();
        const vol = Math.round((this.volumes.master / 100) * (this.volumes.music / 100) * 100);
        this.ytPlayer.setVolume(Math.max(0, Math.min(100, vol)));
      }
    } catch (e) {}
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    this.savePreferences();
    if (!this.musicEnabled) {
      this.ytPendingPlay = false;
      this.stopMusic(0.4);
      this.updateYouTubeVolume();
    } else {
      this.playMusic(this.currentMusicId || 'exploration');
    }
  }

  unlockOnGesture() {
    this.resumeContext();
    if (this.musicEnabled && !this.isMuted) {
      if (this.ytPlayer && this.ytReady) {
        try {
          const state = this.ytPlayer.getPlayerState?.();
          if (state !== 1) {
            this.updateYouTubeVolume();
            this.ytPlayer.playVideo();
          }
        } catch (e) {}
      } else if (this.ytPendingPlay) {
        this.initYouTubePlayer();
      }
    }
    if (this.currentAmbienceAudio && this.currentAmbienceAudio.paused) {
      this.currentAmbienceAudio.play().catch(() => {});
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
        if (typeof parsed.musicEnabled === 'boolean') {
          this.musicEnabled = parsed.musicEnabled;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de áudio:', e);
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('noctaria_audio_settings', JSON.stringify({
        volumes: this.volumes,
        isMuted: this.isMuted,
        musicEnabled: this.musicEnabled
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

  // --- REPRODUÇÃO DE TRILHA SONORA (YOUTUBE + FALLBACK) ---
  playMusic(musicId, fadeDuration = 1.5) {
    this.currentMusicId = musicId || 'exploration';
    if (!this.musicEnabled || this.isMuted) {
      this.ytPendingPlay = false;
      this.updateYouTubeVolume();
      return;
    }

    this.ytPendingPlay = true;
    this.initYouTubePlayer();
    if (this.ytPlayer && this.ytReady) {
      try {
        this.updateYouTubeVolume();
        this.ytPlayer.playVideo();
      } catch (e) {}
    }
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
    audio.volume = (this.volumes.master / 100) * (this.volumes.ambience / 100) * (this.isMuted ? 0 : 0.25);
    audio.play().catch(() => {});
    this.currentAmbienceAudio = audio;
    this.currentAmbienceId = ambienceId;
  }

  stopAmbience() {
    if (this.currentAmbienceAudio) {
      this.currentAmbienceAudio.pause();
      this.currentAmbienceAudio.currentTime = 0;
      this.currentAmbienceAudio = null;
      this.currentAmbienceId = null;
    }
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

  // --- RESPIRAÇÃO DINÂMICA (desativada para evitar som ecoando em segundo plano) ---
  startBreathingLoop() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
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

  // --- SONS DE PORTAS E PORTÃO ---
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

  playGate(pan = 0.0) {
    this.playSfx('/assets/audio/sfx/interaction/keys_jingle.wav', 'sfx', pan, 0.9);
    setTimeout(() => {
      this.playSfx('/assets/audio/sfx/doors/door_open_creak.wav', 'sfx', pan, 0.95);
    }, 180);
  }

  // --- SONS DE INTERAÇÃO COM O MUNDO ---
  playInteraction(type = 'paper', pan = 0.0) {
    const interactMap = {
      paper: '/assets/audio/sfx/interaction/paper_turn.wav',
      keys: '/assets/audio/sfx/interaction/keys_jingle.wav',
      drawer: '/assets/audio/sfx/interaction/drawer_open.wav',
      lever: '/assets/audio/sfx/interaction/switch_lever.wav',
      spell: '/assets/audio/sfx/interaction/spell_cast.wav',
      painting: '/assets/audio/sfx/ambience/old_wood_creaks.wav'
    };
    if (interactMap[type]) {
      this.playSfx(interactMap[type], 'sfx', pan, type === 'painting' ? 0.65 : 1.0);
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

    // --- SELEÇÃO DE VOZES HUMANAS E PERSONALIZADAS POR PERSONAGEM ---
  getVoicesPool() {
    if (!('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return [];
    
    // Preferência absoluta por vozes com suporte natural a pt-BR
    const ptVoices = voices.filter(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith('pt-br') ||
      v.lang.toLowerCase().replace('_', '-').startsWith('pt')
    );
    return ptVoices.length > 0 ? ptVoices : voices;
  }

  getVoiceForCharacter(characterId) {
    const pool = this.getVoicesPool();
    if (pool.length === 0) return null;

    // Perfis de busca priorizando vozes neurais / naturais do Edge / Chrome / Windows
    // Ex: Microsoft Francisca Online (Natural), Maria, Daniel, Antonio, etc.
    const searchKeys = {
      elias: ['daniel', 'felipe', 'ricardo', 'antonio', 'male', 'homem'],
      octavian: ['antonio', 'antônio', 'ricardo', 'david', 'male', 'homem'],
      morgana: ['francisca', 'helena', 'thalita', 'luciana', 'maria', 'female', 'mulher'],
      celeste: ['vitória', 'vitoria', 'leticia', 'letícia', 'camila', 'female', 'mulher'],
      seraphine: ['maria', 'francisca', 'helena', 'zira', 'female', 'mulher'],
      vespera: ['luciana', 'camila', 'maria', 'female', 'mulher']
    };

    const keys = searchKeys[characterId] || [];
    // Prioriza vozes que contenham 'natural' ou 'online' (as mais humanas)
    for (const key of keys) {
      const matchNatural = pool.find(v => {
        const n = v.name.toLowerCase();
        return n.includes(key) && (n.includes('natural') || n.includes('neural') || n.includes('online'));
      });
      if (matchNatural) return matchNatural;
    }

    for (const key of keys) {
      const match = pool.find(v => v.name.toLowerCase().includes(key));
      if (match) return match;
    }

    return pool[0] || null;
  }

  // --- FALAS E DIÁLOGOS HUMANOS (NATURAIS E SINCRONIZADOS) ---
  speakText(text, characterId = 'elias', onWordBoundary = null, onEnd = null) {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Interrompe fala anterior
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    // Configurações personalizadas por personagem: tom (pitch) e ritmo humano e calmo (rate)
    const charProfiles = {
      elias: { pitch: 0.96, rate: 0.98 },       // Jovem, sério, cadência natural e humana
      octavian: { pitch: 0.82, rate: 0.94 },    // Sábio, voz mais grave e profunda
      morgana: { pitch: 1.08, rate: 0.96 },     // Solene, autoritária, calma
      celeste: { pitch: 1.18, rate: 1.02 },     // Jovem alquimista, levemente mais dinâmica e curiosa
      seraphine: { pitch: 1.22, rate: 0.92 },   // Mística, tom suave e etéreo
      vespera: { pitch: 1.04, rate: 0.95 }      // Enigmática, sussurrada e ponderada
    };

    const profile = charProfiles[characterId] || { pitch: 1.0, rate: 1.0 };
    const voice = this.getVoiceForCharacter(characterId);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.volume = (this.volumes.master / 100) * (this.volumes.voices / 100);

    if (onWordBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          onWordBoundary(e.charIndex);
        }
      };
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioSystem = new AudioSystem();
