import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { audioSystem } from './audioSystem.js';

/**
 * Corridor3DScene
 * Gerencia a renderização 3D do personagem explorando o corredor gótico de Noctária.
 * Suporta movimentação WASD, Gamepad, rotação suave, câmera em terceira pessoa
 * e animações combinadas (Idle, Walk, Run).
 */
export class Corridor3DScene {
  constructor(container, options = {}) {
    this.container = container;
    this.onExit = options.onExit || null;
    this.onInteract = options.onInteract || null;
    this.onDoorInteract = options.onDoorInteract || null;
    this.onToggleMenu = options.onToggleMenu || null;
    this.onOpenSettings = options.onOpenSettings || null;
    this.onInspectLedger = options.onInspectLedger || null;
    this.onTalkMorgana = options.onTalkMorgana || null;
    this.onTalkElias = options.onTalkElias || null;
    this.onInspectNoticeBoard = options.onInspectNoticeBoard || null;
    this.onInspectPortrait = options.onInspectPortrait || null;
    this.onInspectStairPainting = options.onInspectStairPainting || null;
    this.onEnterLibrary = options.onEnterLibrary || null;

    this.doors = [];
    this.activeNearDoor = null;
    this.interactivePoints = [];
    this.activeInteractivePoint = null;
    this.animatedProps = [];
    this.isBasementDoorOpen = false;
    this.hudUpdatedToPhase1 = false;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Modelo e animações
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentActionName = 'idle';

    // Estado do jogador no corredor
    this.player = {
      position: new THREE.Vector3(0, 0, 18),
      velocity: new THREE.Vector3(),
      rotationY: Math.PI, // Olhando para o fundo do corredor
      speed: 6.8, // Velocidade aumentada ao andar (antes 4.8)
      runMultiplier: 1.75, // Corrida ágil e fluida
      isRunning: false,
      // Sistema de Pulo e Gravidade
      isGrounded: true,
      jumpVelocityY: 0,
      jumpStrength: 6.8,
      gravity: -18.0,
      // Animação de estender o braço para abrir portas
      doorReachTimer: 0,
      isReachingDoor: false
    };

    // Referências aos ossos do braço para animação cinemática/procedural
    this.bones = {
      head: null,
      neck: null,
      spine2: null,
      rightArm: null,
      rightForeArm: null,
      rightHand: null
    };

    // Controle de Câmera com Mouse (Terceira pessoa e Primeira pessoa)
    this.cameraAngles = {
      yaw: Math.PI,           // Rotação horizontal ao redor do jogador
      pitch: 0.15,           // Rotação vertical (altura do olhar)
      distance: 3.6,          // Distância inicial da câmera
      targetYaw: Math.PI,
      targetPitch: 0.15,
      targetDistance: 3.6,
      sensitivity: 0.0024,
      isPointerLocked: false,
      isMouseDown: false,
      isFirstPerson: false    // Modo primeira pessoa
    };

    // Controles de teclado
    this.keys = {
      w: false,
      s: false,
      a: false,
      d: false,
      shift: false,
      space: false,
      arrowup: false,
      arrowdown: false,
      arrowleft: false,
      arrowright: false
    };

    // Entrada de joystick virtual para modo mobile horizontal
    this.touchJoystick = {
      x: 0,
      y: 0,
      run: false
    };
    this.cameraTouchId = null;
    this.lastTouchX = 0;
    this.lastTouchY = 0;

    this.isDisposed = false;
    this.animationId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Cena com iluminação e atmosfera gótica clara
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1424);
    this.scene.fog = new THREE.FogExp2(0x131a30, 0.012);

    // 2. Câmera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 120);
    this.camera.position.set(0, 2.5, 22);

    // 3. Renderer WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 4. Iluminação do Castelo (Tochas violetas/douradas, luar nas janelas altas)
    this.setupLighting();

    // 5. Construir o Corredor Gótico em 3D
    this.buildGothicCorridor();

    // 6. Carregar Modelo 3D Xbot com animações
    this.loadCharacterModel();

    // 7. Eventos de controles (Teclado e Redimensionamento)
    this.setupEventListeners();

    // 8. Loop de animação
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupLighting() {
    // 1. Luz ambiente reforçada para perfeita visibilidade do corredor, portas e estantes
    const ambientLight = new THREE.AmbientLight(0x4a6596, 4.2);
    this.scene.add(ambientLight);

    // 2. Luz de névoa e luar etéreo azul-turquesa ao centro do teto/abóbada
    const moonLight = new THREE.DirectionalLight(0x8ec5ff, 3.8);
    moonLight.position.set(0, 18, 5);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    this.scene.add(moonLight);

    // Luz de preenchimento direcionada para o fundo do corredor
    const forwardFill = new THREE.DirectionalLight(0xddeeff, 2.0);
    forwardFill.position.set(0, 6, 25);
    forwardFill.target.position.set(0, 2, -35);
    this.scene.add(forwardFill);
    this.scene.add(forwardFill.target);

    // 3. Focos de luz mística azulada e turquesa ao longo do corredor
    const mistPoint1 = new THREE.PointLight(0x5cb8ff, 6.0, 28, 1.4);
    mistPoint1.position.set(0, 4.2, 10);
    this.scene.add(mistPoint1);

    const mistPoint2 = new THREE.PointLight(0x5cb8ff, 6.0, 28, 1.4);
    mistPoint2.position.set(0, 4.2, -6);
    this.scene.add(mistPoint2);

    const mistPoint3 = new THREE.PointLight(0x6ed4ff, 5.5, 26, 1.4);
    mistPoint3.position.set(0, 4.2, -22);
    this.scene.add(mistPoint3);

    // 4. Arandelas e candelabros com tochas quentes douradas fixadas nas pilastras
    const sconcePositions = [
      { x: -3.85, z: 18, side: 'left' },  { x: 3.85, z: 18, side: 'right' },
      { x: -3.85, z: 6, side: 'left' },   { x: 3.85, z: 6, side: 'right' },
      { x: -3.85, z: -6, side: 'left' },  { x: 3.85, z: -6, side: 'right' },
      { x: -3.85, z: -18, side: 'left' }, { x: 3.85, z: -18, side: 'right' },
      { x: -3.85, z: -28, side: 'left' }, { x: 3.85, z: -28, side: 'right' }
    ];

    this.torches = [];
    const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x2d2420, metalness: 0.85, roughness: 0.3 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd266 });

    sconcePositions.forEach((pos, idx) => {
      // Luz pontual dourada quente ampliada e mais brilhante
      const light = new THREE.PointLight(0xffbe4e, 5.5, 14, 1.5);
      const posX = pos.side === 'left' ? pos.x + 0.35 : pos.x - 0.35;
      light.position.set(posX, 2.9, pos.z);
      this.scene.add(light);

      // Suporte de ferro forjado trabalhado
      const bracket = new THREE.Group();
      const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.rotation.z = pos.side === 'left' ? -Math.PI / 4 : Math.PI / 4;
      bracket.add(arm);

      // Vela
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.set(pos.side === 'left' ? 0.15 : -0.15, 0.2, 0);
      bracket.add(candle);

      // Chama dourada
      const flameGeo = new THREE.SphereGeometry(0.065, 8, 8);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos.side === 'left' ? 0.15 : -0.15, 0.38, 0);
      bracket.add(flame);

      bracket.position.set(pos.x, 2.5, pos.z);
      this.scene.add(bracket);

      this.torches.push({ light, flame, baseIntensity: 3.6, offset: Math.random() * Math.PI * 2 });
    });
  }

  // Gera textura procedural de estantes de biblioteca gótica repletas de tomos antigos
  createBookshelfTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fundo mogno envelhecido escuro
    ctx.fillStyle = '#181210';
    ctx.fillRect(0, 0, 1024, 1024);

    const shelfCount = 10;
    const shelfHeight = 1024 / shelfCount;
    const bookColors = [
      '#4a1515', '#6b2020', '#1c2d4a', '#143826', '#3b281c',
      '#5e4425', '#241a38', '#422416', '#703816', '#2b303c'
    ];

    for (let s = 0; s < shelfCount; s++) {
      const y = s * shelfHeight;

      // Viga de madeira da prateleira
      ctx.fillStyle = '#2c1e14';
      ctx.fillRect(0, y + shelfHeight - 14, 1024, 14);
      ctx.fillStyle = '#4a3424';
      ctx.fillRect(0, y + shelfHeight - 14, 1024, 3);

      // Livros enfileirados
      let x = 6;
      while (x < 1018) {
        const bookW = 12 + Math.random() * 22;
        const bookH = shelfHeight - 18 - Math.random() * 12;
        const color = bookColors[Math.floor(Math.random() * bookColors.length)];

        ctx.fillStyle = color;
        ctx.fillRect(x, y + shelfHeight - 14 - bookH, bookW, bookH);

        // Detalhe de lombada dourada
        if (Math.random() > 0.4) {
          ctx.fillStyle = '#c5a059';
          ctx.fillRect(x + 2, y + shelfHeight - 14 - bookH + 6, bookW - 4, 3);
          ctx.fillRect(x + 2, y + shelfHeight - 14 - 12, bookW - 4, 2);
        }

        x += bookW + 2;
      }
    }

    // Moldura entalhada em torno da estante
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#382518';
    ctx.strokeRect(5, 5, 1014, 1014);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Textura realista de veludo damasco escuro para as cortinas
  createVelvetCurtainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fundo em veludo carmesim profundo / vinho quase negro
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#100308');
    grad.addColorStop(0.25, '#280814');
    grad.addColorStop(0.5, '#3d0a1b');
    grad.addColorStop(0.75, '#220610');
    grad.addColorStop(1, '#100308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    // Ondulações verticais de tecido pesado drapeado
    for (let x = 0; x < 512; x += 32) {
      const foldGrad = ctx.createLinearGradient(x, 0, x + 32, 0);
      foldGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      foldGrad.addColorStop(0.5, 'rgba(160, 40, 75, 0.28)');
      foldGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(x, 0, 32, 1024);
    }

    // Padrão de damasco gótico sutil bordado no tecido
    ctx.strokeStyle = 'rgba(212, 168, 77, 0.14)';
    ctx.lineWidth = 1.5;
    for (let y = 30; y < 1024; y += 90) {
      for (let x = 32; x < 512; x += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x, y - 18);
        ctx.lineTo(x + 12, y);
        ctx.lineTo(x, y + 18);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Ruído e microtextura de fibras de veludo
    for (let i = 0; i < 28000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 1024;
      const alpha = Math.random() * 0.08;
      ctx.fillStyle = `rgba(255, 230, 200, ${alpha})`;
      ctx.fillRect(rx, ry, 1, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }

  // Gera textura procedural de blocos de cantaria cinza para as paredes da escadaria
  createStoneBlocksTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fundo cinza escuro de argamassa e pedra
    ctx.fillStyle = '#222731';
    ctx.fillRect(0, 0, 1024, 1024);

    const rows = 16;
    const rowH = 1024 / rows;
    const stoneColors = [
      '#48505e', '#535c6e', '#5d677a', '#3f4653', '#4d5666',
      '#596374', '#383e4a', '#545e70', '#495261', '#636e82'
    ];

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 5;
      const blockW = 1024 / cols;
      const offsetX = (r % 2 === 0) ? 0 : blockW / 2;

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * blockW + offsetX;
        const color = stoneColors[Math.floor(Math.random() * stoneColors.length)];

        // Bloco de cantaria principal
        ctx.fillStyle = color;
        ctx.fillRect(x + 4, y + 4, blockW - 8, rowH - 8);

        // Textura granular mineral de pedra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        for (let i = 0; i < 28; i++) {
          const rx = x + 5 + Math.random() * (blockW - 14);
          const ry = y + 5 + Math.random() * (rowH - 14);
          const rw = 2 + Math.random() * 8;
          const rh = 1 + Math.random() * 4;
          ctx.fillRect(rx, ry, rw, rh);
        }

        // Realce de luz nas bordas superiores e esquerdas do bloco chanfrado
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + rowH - 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.lineTo(x + blockW - 4, y + 4);
        ctx.stroke();

        // Sombra de chanfro nas bordas inferiores e direitas
        ctx.strokeStyle = 'rgba(10, 14, 20, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + blockW - 4, y + 4);
        ctx.lineTo(x + blockW - 4, y + rowH - 4);
        ctx.lineTo(x + 4, y + rowH - 4);
        ctx.stroke();

        // Linha profunda da junta de argamassa
        ctx.strokeStyle = '#151922';
        ctx.lineWidth = 3.5;
        ctx.strokeRect(x + 2, y + 2, blockW - 4, rowH - 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  // Gera pintura a óleo clássica decorativa para o quadro da escada
  createDecorativePaintingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // Céu noturno em gradiente profundo: do anil místico ao crepúsculo violeta
    const grad = ctx.createLinearGradient(0, 0, 0, 768);
    grad.addColorStop(0, '#0a0d1e');
    grad.addColorStop(0.35, '#141a33');
    grad.addColorStop(0.7, '#241a38');
    grad.addColorStop(1, '#0f0a17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 768);

    // Lua cheia envolta em bruma luminosa prateada
    ctx.shadowColor = '#8bc4ff';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#e8f3ff';
    ctx.beginPath();
    ctx.arc(380, 130, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Constelações e estrelas arcanas
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 420;
      const sr = 0.6 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Silhuetas imponentes das torres góticas de Noctária sob o luar
    ctx.fillStyle = '#080a14';

    // Agulha principal da catedral
    ctx.beginPath();
    ctx.moveTo(256, 110);
    ctx.lineTo(294, 330);
    ctx.lineTo(294, 768);
    ctx.lineTo(218, 768);
    ctx.lineTo(218, 330);
    ctx.closePath();
    ctx.fill();

    // Torres laterais e pináculos
    const towers = [
      { x: 75, w: 78, topY: 250 },
      { x: 160, w: 65, topY: 310 },
      { x: 325, w: 72, topY: 280 },
      { x: 410, w: 82, topY: 230 }
    ];
    towers.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(t.x + t.w / 2, t.topY);
      ctx.lineTo(t.x + t.w, t.topY + 95);
      ctx.lineTo(t.x + t.w, 768);
      ctx.lineTo(t.x, 768);
      ctx.lineTo(t.x, t.topY + 95);
      ctx.closePath();
      ctx.fill();
    });

    // Vitrais ogivais iluminados em âmbar e dourado nas torres
    ctx.fillStyle = '#ffbe4e';
    ctx.shadowColor = '#ffa020';
    ctx.shadowBlur = 14;
    const windows = [
      { x: 244, y: 380, w: 24, h: 56 },
      { x: 244, y: 470, w: 24, h: 56 },
      { x: 104, y: 420, w: 20, h: 42 },
      { x: 350, y: 430, w: 20, h: 42 }
    ];
    windows.forEach(w => {
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y, w.w / 2, Math.PI, 0);
      ctx.lineTo(w.x + w.w, w.y + w.h);
      ctx.lineTo(w.x, w.y + w.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Vinheta e craquelê de verniz envelhecido
    const vig = ctx.createRadialGradient(256, 384, 160, 256, 384, 430);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(12,7,16,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 512, 768);

    // Inscrição solene em ouro dos Fundadores
    ctx.fillStyle = '#d4af37';
    ctx.font = 'italic 16px serif';
    ctx.fillText('Noctária — Crônicas Lunares (1842)', 24, 742);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Gera textura procedural de pedras de cantaria do piso com rachaduras e reflexos
  createFlagstoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c2233';
    ctx.fillRect(0, 0, 1024, 1024);

    // Lajes de pedra
    const cols = 8;
    const rows = 16;
    const tileW = 1024 / cols;
    const tileH = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2 === 0) ? 0 : tileW / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * tileW + offsetX;
        const y = r * tileH;
        const shade = Math.floor(24 + Math.random() * 20);
        ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 18})`;
        ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

        // Rachaduras e ruído mineral
        ctx.strokeStyle = '#101524';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);

        if (Math.random() > 0.6) {
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 10);
          ctx.lineTo(x + tileW - 20, y + tileH - 15);
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  // Gera textura procedural de madeira nobre envelhecida para as portas
  createWoodDoorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fundo madeira de carvalho/mogno escuro
    ctx.fillStyle = '#3a2216';
    ctx.fillRect(0, 0, 512, 1024);

    // Fibras da madeira
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#2e1910' : '#4a2c1d';
      const x = Math.random() * 512;
      const w = 1 + Math.random() * 4;
      ctx.fillRect(x, 0, w, 1024);
    }

    // Painéis entalhados da porta gótica (3 painéis verticais clássicos)
    const panels = [
      { y: 60, h: 260 },
      { y: 350, h: 320 },
      { y: 700, h: 260 }
    ];

    panels.forEach(p => {
      // Borda rebaixada
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#1d1109';
      ctx.strokeRect(40, p.y, 432, p.h);

      // Friso interno com acabamento claro
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#5a3824';
      ctx.strokeRect(52, p.y + 10, 408, p.h - 20);

      // Almofada central
      ctx.fillStyle = '#321d12';
      ctx.fillRect(60, p.y + 18, 392, p.h - 36);
    });

    // Rebites de ferro gótico nas molduras
    ctx.fillStyle = '#111012';
    for (let y = 40; y < 1000; y += 75) {
      ctx.beginPath();
      ctx.arc(25, y, 6, 0, Math.PI * 2);
      ctx.arc(487, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildGothicCorridor() {
    const corridorWidth = 8.4;
    const corridorLength = 65;
    const corridorHeight = 7.5;

    // 1. Texturas procedurais ricas inspiradas na imagem
    const bookshelfTex = this.createBookshelfTexture();
    const floorTex = this.createFlagstoneTexture();
    const woodDoorTex = this.createWoodDoorTexture();

    // 2. Piso de pedras de cantaria (com reflexos azuis do nevoeiro e luar)
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength, 32, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.25
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 3. Poças e reflexos luminosos no piso de pedra (como no centro da imagem)
    const puddleGeo = new THREE.PlaneGeometry(3.6, 22);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x1f3b58,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.5
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, 0.012, -7);
    this.scene.add(puddle);

    // 4. Paredes de Estantes de Livros Imponentes (ambos os lados repletos de tomos ancestrais)
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const bookshelfMat = new THREE.MeshStandardMaterial({
      map: bookshelfTex,
      roughness: 0.75,
      metalness: 0.1
    });

    // Parede Esquerda de Livros
    const leftWall = new THREE.Mesh(wallGeo, bookshelfMat);
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -5);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Parede Direita de Livros
    const rightWall = new THREE.Mesh(wallGeo, bookshelfMat);
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, -5);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // 5. Teto Plano Alto com Vigas Góticas Decorativas (sem cilindro obstrutivo)
    const ceilingGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2638,
      roughness: 0.8
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight, -5);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Vigas arquitetônicas elegantes no topo das paredes (mantendo a visão 100% desobstruída)
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x121828, roughness: 0.7 });
    const beamGeo = new THREE.BoxGeometry(corridorWidth, 0.2, 0.35);
    for (let z = 22; z >= -32; z -= 6) {
      const beam = new THREE.Mesh(beamGeo, ribMat);
      beam.position.set(0, corridorHeight - 0.1, z);
      this.scene.add(beam);
    }

    // 6. Pilastras Góticas de Pedra Entalhada e Pedestais
    const pillarGeo = new THREE.BoxGeometry(0.85, corridorHeight, 0.85);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1d243a, roughness: 0.65 });
    for (let z = 22; z >= -32; z -= 6) {
      const pLeft = new THREE.Mesh(pillarGeo, pillarMat);
      pLeft.position.set(-corridorWidth / 2 + 0.42, corridorHeight / 2, z);
      pLeft.castShadow = true;
      pLeft.receiveShadow = true;
      this.scene.add(pLeft);

      const pRight = new THREE.Mesh(pillarGeo, pillarMat);
      pRight.position.set(corridorWidth / 2 - 0.42, corridorHeight / 2, z);
      pRight.castShadow = true;
      pRight.receiveShadow = true;
      this.scene.add(pRight);
    }

    // 7. Névoa mística azulada etérea suave no chão do corredor
    const mistGeo = new THREE.CylinderGeometry(2.0, 3.2, 1.2, 16, 1, true);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x5cb8ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const mistColumn = new THREE.Mesh(mistGeo, mistMat);
    mistColumn.position.set(0, 0.6, -14);
    this.scene.add(mistColumn);

    // 7b. ESTANTES GRANDES DE MADEIRA COM LIVROS REAIS E LUSTRES CANDELABROS
    this.buildCorridorGrandBookshelves();

    // 8. CRIAÇÃO DAS 3 PORTAS AMADEIRADAS GÓTICAS
    this.createGothicDoors(woodDoorTex);

    // 8b. CONSTRUÇÃO DA ESCADARIA E DA SALA DA DIRETORIA NO PORÃO (FASE 1)
    this.buildBasementStairs(floorTex);
    this.buildBasementRoom(bookshelfTex, floorTex, woodDoorTex);

    // 9. Portal Monumental ao fundo (Fim do corredor)
    const portalFrameGeo = new THREE.BoxGeometry(4.0, 5.4, 0.5);
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x0c1222, roughness: 0.4, metalness: 0.6 });
    const portal = new THREE.Mesh(portalFrameGeo, portalMat);
    portal.position.set(0, 2.7, -35);
    this.scene.add(portal);

    const portalGateGeo = new THREE.PlaneGeometry(2.6, 4.6);
    const portalGateMat = new THREE.MeshBasicMaterial({
      color: 0x4aa5e8,
      transparent: true,
      opacity: 0.85
    });
    const portalGate = new THREE.Mesh(portalGateGeo, portalGateMat);
    portalGate.position.set(0, 2.5, -34.7);
    this.scene.add(portalGate);

    // 10. Paredes de encerramento no início e fim
    const endWallMat = new THREE.MeshStandardMaterial({ color: 0x131a2c, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(corridorWidth, corridorHeight), endWallMat);
    backWall.position.set(0, corridorHeight / 2, 26);
    backWall.rotation.y = Math.PI;
    this.scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(corridorWidth, corridorHeight), endWallMat);
    frontWall.position.set(0, corridorHeight / 2, -35.2);
    this.scene.add(frontWall);
  }

  // Constrói as 3 portas de madeira maciça esculpida com maçanetas de latão, molduras e arcos
  createGothicDoors(woodTexture) {
    this.doors = [];

    const doorConfig = [
      {
        id: 'door_archives',
        name: 'Porta dos Arquivos Esquecidos',
        side: 'right',
        x: 4.05,
        z: 8,
        rotY: -Math.PI / 2,
        isBasement: false,
        isOpenable: false,
        inspectText: 'A fechadura de ferro pesado está enferrujada e firmemente trancada por dentro.'
      },
      {
        id: 'door_basement',
        name: 'Porta do Porão Antigo',
        side: 'left',
        x: -4.05,
        z: -4,
        rotY: Math.PI / 2,
        isBasement: true,
        isOpenable: true,
        inspectText: 'O trinco de latão range... A porta cede e revela a escadaria úmida do Porão!'
      },
      {
        id: 'door_astronomy',
        name: 'Porta da Torre Astral',
        side: 'right',
        x: 4.05,
        z: -16,
        rotY: -Math.PI / 2,
        isBasement: false,
        isOpenable: false,
        inspectText: 'Um selo mágico com a insígnia da lua brilha em roxo. Trancada por encantamento.'
      }
    ];

    const doorMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.15
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x241810,
      roughness: 0.7,
      metalness: 0.2
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.35,
      metalness: 0.9
    });

    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xc49b38,
      roughness: 0.3,
      metalness: 0.8
    });

    doorConfig.forEach(cfg => {
      const doorGroup = new THREE.Group();
      doorGroup.position.set(cfg.x, 0, cfg.z);
      doorGroup.rotation.y = cfg.rotY;

      // Moldura de madeira maciça da porta
      const frameW = 2.0;
      const frameH = 3.6;
      const frameD = 0.22;

      // Batentes laterais e superior
      const sidePostGeo = new THREE.BoxGeometry(0.18, frameH, frameD);
      const postL = new THREE.Mesh(sidePostGeo, frameMat);
      postL.position.set(-frameW / 2 + 0.09, frameH / 2, 0);
      doorGroup.add(postL);

      const postR = new THREE.Mesh(sidePostGeo, frameMat);
      postR.position.set(frameW / 2 - 0.09, frameH / 2, 0);
      doorGroup.add(postR);

      const lintelGeo = new THREE.BoxGeometry(frameW, 0.25, frameD);
      const lintel = new THREE.Mesh(lintelGeo, frameMat);
      lintel.position.set(0, frameH - 0.1, 0);
      doorGroup.add(lintel);

      // Arco gótico e verga superior decorativa bem encaixada sobre a porta
      const overdoorH = 0.65;
      const overdoorGeo = new THREE.BoxGeometry(frameW + 0.12, overdoorH, frameD + 0.08);
      const overdoor = new THREE.Mesh(overdoorGeo, frameMat);
      overdoor.position.set(0, frameH + overdoorH / 2 - 0.1, 0);
      doorGroup.add(overdoor);

      // Cornija em relevo
      const corniceGeo = new THREE.BoxGeometry(frameW + 0.22, 0.12, frameD + 0.14);
      const cornice = new THREE.Mesh(corniceGeo, frameMat);
      cornice.position.set(0, frameH + overdoorH - 0.04, 0);
      doorGroup.add(cornice);

      // Ornamento de brasão central em latão sobre a porta
      const crestGeo = new THREE.CylinderGeometry(0.18, 0.18, frameD + 0.12, 6);
      const crest = new THREE.Mesh(crestGeo, handleMat);
      crest.rotation.x = Math.PI / 2;
      crest.position.set(0, frameH + overdoorH / 2 - 0.1, 0.02);
      doorGroup.add(crest);

      // Folha da porta de madeira (pivô na lateral para animação de abertura)
      const leafGroup = new THREE.Group();
      leafGroup.position.set(-frameW / 2 + 0.18, 0, 0);

      const leafW = frameW - 0.36;
      const leafH = frameH - 0.3;
      const leafD = 0.10;
      const leafGeo = new THREE.BoxGeometry(leafW, leafH, leafD);
      const leafMesh = new THREE.Mesh(leafGeo, doorMat);
      leafMesh.position.set(leafW / 2, leafH / 2, 0);
      leafMesh.castShadow = true;
      leafGroup.add(leafMesh);

      // Dobradiças de ferro decoradas
      const hingeGeo = new THREE.BoxGeometry(0.35, 0.06, 0.12);
      [-0.8, 0, 0.8].forEach(hy => {
        const hinge = new THREE.Mesh(hingeGeo, ironMat);
        hinge.position.set(0.12, leafH / 2 + hy, 0);
        leafGroup.add(hinge);
      });

      // Maçaneta e fechadura dourada de latão
      const handlePlateGeo = new THREE.BoxGeometry(0.08, 0.28, 0.13);
      const plate = new THREE.Mesh(handlePlateGeo, handleMat);
      plate.position.set(leafW - 0.16, 1.45, 0);
      leafGroup.add(plate);

      const handleKnobGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 16);
      const knob = new THREE.Mesh(handleKnobGeo, handleMat);
      knob.position.set(leafW - 0.16, 1.40, 0.08);
      leafGroup.add(knob);

      doorGroup.add(leafGroup);
      this.scene.add(doorGroup);

      // Placa informativa de identificação ou luz sobre a porta
      if (cfg.isBasement) {
        // Lanterna âmbar sobre o porão
        const lamp = new THREE.PointLight(0xffaa33, 2.0, 5);
        lamp.position.set(cfg.side === 'left' ? cfg.x + 0.5 : cfg.x - 0.5, 3.8, cfg.z);
        this.scene.add(lamp);
      }

      this.doors.push({
        ...cfg,
        doorGroup,
        leafGroup,
        isOpen: false,
        openAngle: 0,
        targetAngle: 0
      });
    });
  }

  // Interação do jogador com a porta mais próxima
  interactWithCurrentDoor() {
    if (!this.activeNearDoor) return;

    // Disparar animação realista de mover o braço em direção à maçaneta
    this.player.isReachingDoor = true;
    this.player.doorReachTimer = 1.0; // Duração de 1 segundo

    if (this.activeNearDoor.isOpenable) {
      this.activeNearDoor.isOpen = !this.activeNearDoor.isOpen;
      // Girar porta abrindo para dentro (90 graus em arco suave)
      this.activeNearDoor.targetAngle = this.activeNearDoor.isOpen ? Math.PI * 0.55 : 0;
      // Reproduzir som sonoro realista de porta abrindo ou fechando
      if (this.activeNearDoor.isOpen) {
        audioSystem.playDoor('open');
      } else {
        audioSystem.playDoor('close');
      }
    } else {
      // Porta trancada / inspecionada: som de maçaneta tentando abrir
      audioSystem.playDoor('handle');
    }

    if (this.onDoorInteract) {
      this.onDoorInteract(this.activeNearDoor);
    }
  }

  // Constrói estantes imponentes de madeira nobre de carvalho/mogno com centenas de livros 3D reais
  buildCorridorGrandBookshelves() {
    const shelfGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x22120a,
      roughness: 0.6,
      metalness: 0.12
    });
    const shelfTrimMat = new THREE.MeshStandardMaterial({
      color: 0x3d2214,
      roughness: 0.5,
      metalness: 0.18
    });
    const goldLeafMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    // Paleta de couros nobres para encadernações
    const bookColors = [
      0x581313, 0x3d0f12, 0x162238, 0x113122, 0x3d2414,
      0x54351a, 0x27173d, 0x3d1b10, 0x15161b, 0x732914
    ];
    const bookMats = bookColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.68 }));

    // Cria uma seção de estante de madeira maciça de 5.2m de largura com prateleiras e livros 3D
    const createBookcase = (x, z, rotationY, width = 5.2, height = 6.2) => {
      const bc = new THREE.Group();
      bc.position.set(x, 0, z);
      bc.rotation.y = rotationY;

      const depth = 0.52;
      const shelfTiers = 5;
      const tierHeight = (height - 0.7) / shelfTiers;

      // 1. Plinto / Base de madeira maciça
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, depth), woodMat);
      plinth.position.set(0, 0.175, 0);
      bc.add(plinth);

      // 2. Cornija entalhada no topo
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.32, depth + 0.1), shelfTrimMat);
      cornice.position.set(0, height - 0.16, 0);
      bc.add(cornice);

      // 3. Montantes laterais verticais e divisória central
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, depth), woodMat);
      sideL.position.set(-width / 2 + 0.06, height / 2, 0);
      bc.add(sideL);

      const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, depth), woodMat);
      sideR.position.set(width / 2 - 0.06, height / 2, 0);
      bc.add(sideR);

      const centerDiv = new THREE.Mesh(new THREE.BoxGeometry(0.1, height - 0.65, depth - 0.05), woodMat);
      centerDiv.position.set(0, (height - 0.65) / 2 + 0.35, 0);
      bc.add(centerDiv);

      // 4. Prateleiras horizontais e fileiras de livros 3D reais
      for (let s = 0; s < shelfTiers; s++) {
        const shelfY = 0.35 + s * tierHeight;
        const plank = new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.06, depth - 0.04), woodMat);
        plank.position.set(0, shelfY, 0);
        bc.add(plank);

        // Preencher baía esquerda e baía direita com livros 3D
        [-1, 1].forEach(bay => {
          const bayW = (width - 0.36) / 2;
          const bayCenter = bay * (bayW / 2 + 0.05);
          let currentX = bayCenter - bayW / 2 + 0.04;
          const endX = bayCenter + bayW / 2 - 0.04;

          while (currentX < endX) {
            const bWidth = 0.055 + Math.random() * 0.085;
            const bHeight = 0.35 + Math.random() * (tierHeight - 0.44);
            const bDepth = depth * 0.58 + Math.random() * (depth * 0.32);
            const mat = bookMats[Math.floor(Math.random() * bookMats.length)];

            const bookGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
            const bookMesh = new THREE.Mesh(bookGeo, mat);

            // Leve inclinação ocasional em livros no final da fileira
            const tilt = (Math.random() > 0.8) ? (Math.random() - 0.5) * 0.2 : 0;
            bookMesh.rotation.z = tilt;
            bookMesh.position.set(currentX + bWidth / 2, shelfY + 0.03 + bHeight / 2, 0);
            bc.add(bookMesh);

            // Lombada dourada e detalhes clássicos
            if (Math.random() > 0.45) {
              const ribGeo = new THREE.BoxGeometry(bWidth * 0.85, 0.02, 0.02);
              const rib = new THREE.Mesh(ribGeo, goldLeafMat);
              rib.position.set(currentX + bWidth / 2, shelfY + 0.03 + bHeight * 0.72, bDepth / 2 + 0.005);
              bc.add(rib);
            }

            currentX += bWidth + 0.015;
          }
        });
      }

      shelfGroup.add(bc);
    };

    // Estantes ao longo da parede direita (x = 3.84, viradas para -X)
    const rightSections = [20, 14, 8, 2, -7, -13, -19, -25];
    rightSections.forEach(z => {
      createBookcase(3.84, z, -Math.PI / 2, 5.2, 6.2);
    });

    // Estantes ao longo da parede esquerda (x = -3.84, viradas para +X, respeitando o vão da escada entre -2.9 e -5.1)
    const leftSections = [20, 14, 8, 2, -8, -14, -20, -25];
    leftSections.forEach(z => {
      createBookcase(-3.84, z, Math.PI / 2, 5.2, 6.2);
    });

    // Iluminação do corredor enriquecida: 4 Grandes Lustres Candelabros no centro do teto
    const chPositions = [18, 5, -8, -22];
    chPositions.forEach((cz, i) => {
      const chandelier = new THREE.Group();
      chandelier.position.set(0, 5.8, cz);

      // Aro de ferro forjado
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.05, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x181a20, metalness: 0.8, roughness: 0.35 })
      );
      ring.rotation.x = Math.PI / 2;
      chandelier.add(ring);

      // Corrente até o teto
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.7, 4),
        new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.9 })
      );
      chain.position.set(0, 0.85, 0);
      chandelier.add(chain);

      // Velas com chamas ao redor do aro
      for (let v = 0; v < 6; v++) {
        const ang = (v / 6) * Math.PI * 2;
        const vx = Math.cos(ang) * 1.3;
        const vz = Math.sin(ang) * 1.3;

        const candle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8),
          new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 })
        );
        candle.position.set(vx, 0.13, vz);
        chandelier.add(candle);

        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffd266 })
        );
        flame.position.set(vx, 0.3, vz);
        chandelier.add(flame);
      }

      // Luz quente radiante
      const chLight = new THREE.PointLight(0xffbe4e, 5.2, 16, 1.4);
      chLight.position.set(0, 0.2, 0);
      chandelier.add(chLight);
      this.scene.add(chandelier);

      if (this.torches) {
        this.torches.push({ light: chLight, flame: null, baseIntensity: 5.2, offset: i * 0.8 });
      }
    });

    this.scene.add(shelfGroup);
  }

  // Gera textura procedural de madeira nobre de mogno escuro para a mesa executiva da Diretoria
  createDeskWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#221109';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#1a0d06' : '#2d170c';
      const x = Math.random() * 512;
      const w = 1 + Math.random() * 5;
      ctx.fillRect(x, 0, w, 512);
    }

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#c49b38';
    ctx.strokeRect(10, 10, 492, 492);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4e3019';
    ctx.strokeRect(18, 18, 476, 476);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Gera textura procedural do Mural de Avisos Estudantis com editais antigos e bilhetes de Seraphine
  createNoticeBoardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1428';
    ctx.fillRect(0, 0, 1024, 512);

    for (let s = 0; s < 2000; s++) {
      const shade = Math.floor(20 + Math.random() * 15);
      ctx.fillStyle = `rgba(${shade + 10},${shade},${shade + 20},0.4)`;
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, 3, 3);
    }

    const notices = [
      { x: 40, y: 50, w: 220, h: 360, rot: -0.04, title: 'EDITAL DA ACADEMIA', text: 'Regras de conduta nos salões ancestrais.' },
      { x: 300, y: 70, w: 250, h: 330, rot: 0.02, title: 'TURMA 42 - MATRÍCULAS', text: 'Lista oficial de formandos de Noctária.' },
      { x: 590, y: 40, w: 200, h: 250, rot: 0.05, title: 'AVISO: ALUNA AUSENTE', text: 'Investigação suspensa por decreto.' },
      { x: 820, y: 80, w: 160, h: 300, rot: -0.03, title: 'SUSSURROS', text: 'Seraphine Ashford existiu.' },
      { x: 620, y: 310, w: 180, h: 140, rot: -0.06, title: 'DECRETO MORGANA', text: 'Acesso restrito ao arquivo.' }
    ];

    notices.forEach(n => {
      ctx.save();
      ctx.translate(n.x + n.w / 2, n.y + n.h / 2);
      ctx.rotate(n.rot);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-n.w / 2 + 6, -n.h / 2 + 6, n.w, n.h);
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(-n.w / 2, -n.h / 2, n.w, n.h);
      ctx.strokeStyle = '#b89f78';
      ctx.lineWidth = 2;
      ctx.strokeRect(-n.w / 2, -n.h / 2, n.w, n.h);
      ctx.fillStyle = '#8b1e3f';
      ctx.beginPath();
      ctx.arc(0, -n.h / 2 + 15, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c221a';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(n.title, -n.w / 2 + 16, -n.h / 2 + 42);
      ctx.fillStyle = '#5c483a';
      ctx.font = '10px Lora, serif';
      for (let l = 0; l < 8; l++) {
        const lineY = -n.h / 2 + 70 + l * 20;
        if (lineY < n.h / 2 - 20) {
          ctx.fillRect(-n.w / 2 + 16, lineY, n.w - 32, 2);
        }
      }
      ctx.restore();
    });

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Gera textura procedural do Retrato Adulterado da Turma 42
  createErasedPortraitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 768);
    grad.addColorStop(0, '#1c1828');
    grad.addColorStop(0.5, '#282038');
    grad.addColorStop(1, '#0e0b16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 768);

    ctx.lineWidth = 18;
    ctx.strokeStyle = '#c49b38';
    ctx.strokeRect(9, 9, 494, 750);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5a4214';
    ctx.strokeRect(24, 24, 464, 720);

    const students = [
      { x: 130, y: 380, r: 42, color: '#161d2d' },
      { x: 380, y: 390, r: 40, color: '#1c1b26' },
      { x: 256, y: 340, r: 48, color: '#251a36' },
      { x: 80, y: 430, r: 38, color: '#121620' },
      { x: 430, y: 440, r: 38, color: '#14141d' }
    ];

    students.forEach(st => {
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x - 70, st.y + 260);
      ctx.lineTo(st.x + 70, st.y + 260);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e8c9ad';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rosto central raspado violentamente
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 340, 56, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#08080c';
    ctx.fillRect(190, 270, 130, 140);
    ctx.strokeStyle = '#32283a';
    ctx.lineWidth = 3;
    for (let s = 0; s < 40; s++) {
      ctx.beginPath();
      const sx = 200 + Math.random() * 110;
      const sy = 280 + Math.random() * 120;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#c49b38';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TURMA 42 • SALÃO DAS CINZAS', 256, 710);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Constrói a imponente escadaria com paredes cinzas de blocos de pedra e quadro decorativo
  buildBasementStairs(floorTex) {
    const stairMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.2
    });

    const stoneBlocksTex = this.createStoneBlocksTexture();
    const stoneWallMat = new THREE.MeshStandardMaterial({
      map: stoneBlocksTex,
      roughness: 0.82,
      metalness: 0.12
    });

    const stoneBalustradeMat = new THREE.MeshStandardMaterial({
      color: 0x1d243a,
      roughness: 0.7,
      metalness: 0.2
    });

    const railMat = new THREE.MeshStandardMaterial({
      color: 0xc49b38,
      roughness: 0.35,
      metalness: 0.85
    });

    const stairLenX = 6.45; // de x = -4.05 até -10.5
    const stairMidX = -7.275;
    const stairHeightY = 7.4; // de y = -3.8 até 3.6
    const stairMidY = -0.1;

    // 1. PAREDES LATERAIS COMPLETAS DA ESCADA (CINZAS COM APARÊNCIA DE BLOCOS)
    const wallNGeo = new THREE.BoxGeometry(stairLenX, stairHeightY, 0.35);
    const wallN = new THREE.Mesh(wallNGeo, stoneWallMat);
    wallN.position.set(stairMidX, stairMidY, -2.85);
    wallN.receiveShadow = true;
    wallN.castShadow = true;
    this.scene.add(wallN);

    const wallSGeo = new THREE.BoxGeometry(stairLenX, stairHeightY, 0.35);
    const wallS = new THREE.Mesh(wallSGeo, stoneWallMat);
    wallS.position.set(stairMidX, stairMidY, -5.15);
    wallS.receiveShadow = true;
    wallS.castShadow = true;
    this.scene.add(wallS);

    // 2. TETO DE PEDRA DA ESCADARIA
    const stairCeilGeo = new THREE.BoxGeometry(stairLenX, 0.35, 2.3);
    const stairCeil = new THREE.Mesh(stairCeilGeo, stoneWallMat);
    stairCeil.position.set(stairMidX, 3.6, -4.0);
    this.scene.add(stairCeil);

    // 3. PAREDES DE FUNDAÇÃO DO CORREDOR ACIMA
    const foundNGeo = new THREE.BoxGeometry(0.4, 3.8, 8.85);
    const foundN = new THREE.Mesh(foundNGeo, stoneWallMat);
    foundN.position.set(-4.1, -1.9, 1.575);
    foundN.receiveShadow = true;
    this.scene.add(foundN);

    const foundSGeo = new THREE.BoxGeometry(0.4, 3.8, 8.85);
    const foundS = new THREE.Mesh(foundSGeo, stoneWallMat);
    foundS.position.set(-4.1, -1.9, -9.575);
    foundS.receiveShadow = true;
    this.scene.add(foundS);

    // 4. PAREDES EXTERNAS SÓLIDAS ATRÁS DO CORREDOR SUPERIOR
    const corrWallBackN = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, 30.4), stoneWallMat);
    corrWallBackN.position.set(-4.25, 3.75, 12.3);
    this.scene.add(corrWallBackN);

    const corrWallBackS = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, 32.4), stoneWallMat);
    corrWallBackS.position.set(-4.25, 3.75, -21.3);
    this.scene.add(corrWallBackS);

    // 5. PAREDES LESTE SÓLIDAS DA SALA DO PORÃO
    const eastStoneN = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.4, 8.9), stoneWallMat);
    eastStoneN.position.set(-10.5, -0.1, 1.55);
    this.scene.add(eastStoneN);

    const eastStoneS = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.4, 8.9), stoneWallMat);
    eastStoneS.position.set(-10.5, -0.1, -9.55);
    this.scene.add(eastStoneS);

    const eastArchTop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 2.3), stoneWallMat);
    eastArchTop.position.set(-10.5, 1.8, -4.0);
    this.scene.add(eastArchTop);

    // 6. 14 DEGRAUS SÓLIDOS DE PEDRA
    for (let i = 0; i < 14; i++) {
      const t = (i + 0.5) / 14;
      const sx = THREE.MathUtils.lerp(-4.05, -10.5, t);
      const sy = THREE.MathUtils.lerp(0.0, -3.8, t) - 0.14;
      const stepGeo = new THREE.BoxGeometry(0.52, 0.30, 2.3);
      const stepMesh = new THREE.Mesh(stepGeo, stairMat);
      stepMesh.position.set(sx, sy, -4.0);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      this.scene.add(stepMesh);
    }

    // Balaustradas e corrimãos ornamentados
    const stairLen = Math.hypot(10.5 - 4.05, 3.8);
    const stairAngle = Math.atan2(3.8, 10.5 - 4.05);

    const balGeo = new THREE.BoxGeometry(stairLen, 0.55, 0.12);
    const balN = new THREE.Mesh(balGeo, stoneBalustradeMat);
    balN.position.set(-7.275, -1.9 + 0.45, -2.75);
    balN.rotation.z = stairAngle;
    this.scene.add(balN);

    const balS = new THREE.Mesh(balGeo, stoneBalustradeMat);
    balS.position.set(-7.275, -1.9 + 0.45, -5.25);
    balS.rotation.z = stairAngle;
    this.scene.add(balS);

    const railGeo = new THREE.BoxGeometry(stairLen, 0.08, 0.12);
    const railN = new THREE.Mesh(railGeo, railMat);
    railN.position.set(-7.275, -1.9 + 0.78, -2.75);
    railN.rotation.z = stairAngle;
    this.scene.add(railN);

    const railS = new THREE.Mesh(railGeo, railMat);
    railS.position.set(-7.275, -1.9 + 0.78, -5.25);
    railS.rotation.z = stairAngle;
    this.scene.add(railS);

    const postGeo = new THREE.BoxGeometry(0.35, 1.35, 0.35);
    [-4.05, -10.5].forEach(px => {
      const py = px === -4.05 ? 0.65 : -3.8 + 0.65;
      [-2.85, -5.15].forEach(pz => {
        const post = new THREE.Mesh(postGeo, stoneBalustradeMat);
        post.position.set(px, py, pz);
        this.scene.add(post);
      });
    });

    // Tochas arandelas iluminando os degraus
    this.createStairSconce(-6.8, -0.6, -2.68, 'north');
    this.createStairSconce(-8.8, -1.8, -5.32, 'south');

    // QUADRO DECORATIVO NA PAREDE DA ESCADARIA
    const paintingGroup = new THREE.Group();
    paintingGroup.position.set(-7.3, -0.65, -2.66);

    const frameGeo = new THREE.BoxGeometry(1.4, 1.9, 0.08);
    const goldFrameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });
    const frameMesh = new THREE.Mesh(frameGeo, goldFrameMat);
    paintingGroup.add(frameMesh);

    const innerTrimGeo = new THREE.BoxGeometry(1.24, 1.74, 0.09);
    const innerTrimMat = new THREE.MeshStandardMaterial({ color: 0x181008, roughness: 0.7 });
    const innerTrim = new THREE.Mesh(innerTrimGeo, innerTrimMat);
    paintingGroup.add(innerTrim);

    const paintingTex = this.createDecorativePaintingTexture();
    const canvasGeo = new THREE.PlaneGeometry(1.16, 1.66);
    const canvasMat = new THREE.MeshStandardMaterial({
      map: paintingTex,
      roughness: 0.65,
      metalness: 0.1
    });
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.position.set(0, 0, 0.05);
    paintingGroup.add(canvasMesh);

    const lampArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8),
      goldFrameMat
    );
    lampArm.rotation.x = Math.PI / 3;
    lampArm.position.set(0, 1.05, 0.12);
    paintingGroup.add(lampArm);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
      goldFrameMat
    );
    lampShade.rotation.z = Math.PI / 2;
    lampShade.position.set(0, 1.15, 0.22);
    paintingGroup.add(lampShade);

    const galleryLight = new THREE.PointLight(0xffbe4e, 3.2, 5.0, 1.2);
    galleryLight.position.set(0, 1.1, 0.28);
    paintingGroup.add(galleryLight);

    this.scene.add(paintingGroup);

    this.interactivePoints.push({
      id: 'stair_painting',
      name: 'Pintura das Torres Noturnas',
      x: -7.3,
      y: -0.65,
      z: -3.4,
      radius: 2.8,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para admirar a <strong>Pintura das Torres Noturnas</strong> ✦',
      onInteract: () => {
        if (this.onInspectStairPainting) this.onInspectStairPainting();
      }
    });
  }

  createStairSconce(x, y, z, side) {
    const light = new THREE.PointLight(0xffbe4e, 4.5, 10, 1.4);
    light.position.set(x, y + 0.3, z);
    this.scene.add(light);

    const bracket = new THREE.Group();
    const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x2d2420, metalness: 0.85, roughness: 0.3 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd266 });

    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.rotation.z = side === 'north' ? -Math.PI / 4 : Math.PI / 4;
    bracket.add(arm);

    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.set(0, 0.2, 0);
    bracket.add(candle);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), flameMat);
    flame.position.set(0, 0.38, 0);
    bracket.add(flame);

    bracket.position.set(x, y, z);
    this.scene.add(bracket);

    if (this.torches) {
      this.torches.push({ light, flame, baseIntensity: 4.5, offset: Math.random() * Math.PI * 2 });
    }
  }

  // Constrói a Sala da Diretoria no Porão com cortinas escuras na parede, cadeiras para frente e Diretora Morgana visível
  buildBasementRoom(bookshelfTex, floorTex, woodDoorTex) {
    const roomWidth = 17.5;   // x de -10.5 até -28.0
    const roomLength = 20.0;  // z de -14.0 até +6.0
    const roomHeight = 7.4;   // y de -3.8 até 3.6
    const floorY = -3.8;
    const ceilingY = 3.6;

    const deskWoodTex = this.createDeskWoodTexture();

    // 1. Piso de pedra de cantaria
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.25
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-19.25, floorY, -4.0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Tapete nobre aveludado sob a mesa da diretoria
    const rugGeo = new THREE.PlaneGeometry(6.8, 8.5);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x381022,
      roughness: 0.85,
      metalness: 0.05
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-18.5, floorY + 0.012, -4.0);
    rug.receiveShadow = true;
    this.scene.add(rug);

    const borderMat = new THREE.MeshStandardMaterial({ color: 0xc49b38, roughness: 0.4, metalness: 0.8 });
    const rugBorder = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.015, 8.6), borderMat);
    rugBorder.position.set(-18.5, floorY + 0.008, -4.0);
    this.scene.add(rugBorder);

    // 2. Teto com vigas góticas
    const ceilGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x141a28, roughness: 0.85 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(-19.25, ceilingY, -4.0);
    this.scene.add(ceil);

    const beamGeo = new THREE.BoxGeometry(0.3, 0.35, roomLength);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7 });
    for (let bx = -12.5; bx >= -26.5; bx -= 3.5) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(bx, ceilingY - 0.17, -4.0);
      this.scene.add(beam);
    }

    // 3. Lustre gótico de ferro forjado sobre a mesa com 8 velas quentes
    const chGroup = new THREE.Group();
    chGroup.position.set(-18.5, 1.9, -4.0);
    const chRingGeo = new THREE.TorusGeometry(1.6, 0.06, 8, 24);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.85, roughness: 0.4 });
    const chRing = new THREE.Mesh(chRingGeo, ironMat);
    chRing.rotation.x = Math.PI / 2;
    chGroup.add(chRing);

    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.7, 4);
    const chain = new THREE.Mesh(chainGeo, ironMat);
    chain.position.set(0, 0.85, 0);
    chGroup.add(chain);

    const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 });
    const flameGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd266 });

    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const cx = Math.cos(angle) * 1.6;
      const cz = Math.sin(angle) * 1.6;
      const candleMesh = new THREE.Mesh(candleGeo, candleMat);
      candleMesh.position.set(cx, 0.15, cz);
      chGroup.add(candleMesh);
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      flameMesh.position.set(cx, 0.35, cz);
      chGroup.add(flameMesh);
    }
    const chLight = new THREE.PointLight(0xffbe4e, 5.0, 18, 1.3);
    chLight.position.set(0, 0.4, 0);
    chGroup.add(chLight);
    this.scene.add(chGroup);
    if (this.torches) {
      this.torches.push({ light: chLight, flame: null, baseIntensity: 5.0, offset: 0.5 });
    }

    // 4. Paredes de Estantes de Livros
    const wallMat = new THREE.MeshStandardMaterial({ map: bookshelfTex, roughness: 0.75, metalness: 0.1 });

    // Parede Norte (z = 6.0)
    const wallN = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    wallN.position.set(-19.25, floorY + roomHeight / 2, 6.0);
    wallN.rotation.y = Math.PI;
    this.scene.add(wallN);

    // Parede Sul (z = -14.0)
    const wallS = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    wallS.position.set(-19.25, floorY + roomHeight / 2, -14.0);
    this.scene.add(wallS);

    // Parede Oeste (x = -28.0)
    const wallW = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    wallW.position.set(-28.0, floorY + roomHeight / 2, -4.0);
    wallW.rotation.y = Math.PI / 2;
    this.scene.add(wallW);

    // 4b. DECORAÇÃO DA PAREDE LESTE QUE ESTAVA EM PRETO: CORTINAS ESCURAS EM TODA A PAREDE
    const stoneBlocksTex = this.createStoneBlocksTexture();
    const eastWallMat = new THREE.MeshStandardMaterial({
      map: stoneBlocksTex,
      roughness: 0.8,
      metalness: 0.1
    });

    const eastLenN = 8.9;
    const wallEN = new THREE.Mesh(new THREE.PlaneGeometry(eastLenN, roomHeight), eastWallMat);
    wallEN.position.set(-10.55, floorY + roomHeight / 2, 6.0 - eastLenN / 2);
    wallEN.rotation.y = -Math.PI / 2;
    this.scene.add(wallEN);

    const eastLenS = 8.9;
    const wallES = new THREE.Mesh(new THREE.PlaneGeometry(eastLenS, roomHeight), eastWallMat);
    wallES.position.set(-10.55, floorY + roomHeight / 2, -5.1 - eastLenS / 2);
    wallES.rotation.y = -Math.PI / 2;
    this.scene.add(wallES);

    const archTopWall = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.6), eastWallMat);
    archTopWall.position.set(-10.55, ceilingY - 1.8, -4.0);
    archTopWall.rotation.y = -Math.PI / 2;
    this.scene.add(archTopWall);

    // GRANDES CORTINAS ESCURAS REALISTAS EM TODA A EXTENSÃO DA PAREDE LESTE
    const velvetTex = this.createVelvetCurtainTexture();
    const curtainGroup = new THREE.Group();
    const darkCurtainMat = new THREE.MeshStandardMaterial({
      map: velvetTex,
      roughness: 0.85,
      metalness: 0.12,
      side: THREE.DoubleSide
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22
    });

    // Varão de cortina em latão dourado correndo pelo topo de toda a parede leste
    const rodGeo = new THREE.CylinderGeometry(0.045, 0.045, 20.0, 12);
    const rod = new THREE.Mesh(rodGeo, goldTrimMat);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(-10.70, ceilingY - 0.28, -4.0);
    curtainGroup.add(rod);

    // Argolas de sustentação ao longo do varão
    for (let rz = -13.6; rz <= 5.6; rz += 0.45) {
      if (rz > -5.0 && rz < -3.0) continue; // vão de passagem da escada
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 16), goldTrimMat);
      ring.position.set(-10.70, ceilingY - 0.28, rz);
      ring.rotation.y = Math.PI / 2;
      curtainGroup.add(ring);
    }

    // Ponteiras ornamentadas em pinha
    [5.9, -13.9].forEach(pz => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), goldTrimMat);
      finial.position.set(-10.70, ceilingY - 0.28, pz);
      curtainGroup.add(finial);
    });

    // Função para criar cortinas onduladas realistas com malha contínua drapeada
    const createRealisticCurtainSection = (startZ, endZ) => {
      const span = Math.abs(endZ - startZ);
      const drapeHeight = roomHeight - 0.4;
      const midZ = (startZ + endZ) / 2;
      const segmentsZ = Math.max(16, Math.floor(span * 8));

      // Malha plana subdividida que deformamos senoidalmente para criar ondas naturais de tecido
      const drapeGeo = new THREE.PlaneGeometry(span, drapeHeight, segmentsZ, 8);
      const pos = drapeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + span / 2) / span;
        const v = (pos.getY(i) + drapeHeight / 2) / drapeHeight;
        // Ondas primárias largas e secundárias finas de franzimento
        const wave = Math.sin(u * span * 6.0) * 0.12 + Math.cos(u * span * 12.0) * 0.04;
        // Perto do chão o tecido alarga ligeiramente
        const bottomSpread = (1.0 - v) * 0.03;
        pos.setZ(i, wave * (0.8 + 0.2 * v) + bottomSpread);
      }
      drapeGeo.computeVertexNormals();

      const drapeMesh = new THREE.Mesh(drapeGeo, darkCurtainMat);
      drapeMesh.position.set(-10.72, floorY + drapeHeight / 2, midZ);
      drapeMesh.rotation.y = -Math.PI / 2;
      curtainGroup.add(drapeMesh);

      // Sanefa drapeada superior (valance) recortada em festão
      const valanceGeo = new THREE.PlaneGeometry(span, 0.65, segmentsZ, 2);
      const vpos = valanceGeo.attributes.position;
      for (let i = 0; i < vpos.count; i++) {
        const u = (vpos.getX(i) + span / 2) / span;
        vpos.setZ(i, Math.sin(u * span * 7.0) * 0.08);
      }
      valanceGeo.computeVertexNormals();
      const valance = new THREE.Mesh(valanceGeo, darkCurtainMat);
      valance.position.set(-10.78, ceilingY - 0.58, midZ);
      valance.rotation.y = -Math.PI / 2;
      curtainGroup.add(valance);

      // Franja dourada no babado superior
      const fringeGeo = new THREE.BoxGeometry(0.04, 0.06, span);
      const fringe = new THREE.Mesh(fringeGeo, goldTrimMat);
      fringe.position.set(-10.80, ceilingY - 0.88, midZ);
      curtainGroup.add(fringe);
    };

    createRealisticCurtainSection(5.8, -2.85);
    createRealisticCurtainSection(-5.15, -13.8);

    // Abraçadeiras douradas com cordões e borlas prendendo as cortinas e emoldurando o vão da porta
    [-2.8, -5.2].forEach(tz => {
      const tieGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 16);
      const tie = new THREE.Mesh(tieGeo, goldTrimMat);
      tie.position.set(-10.76, floorY + 2.5, tz);
      tie.rotation.y = Math.PI / 2;
      curtainGroup.add(tie);

      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 8), goldTrimMat);
      tassel.position.set(-10.78, floorY + 2.2, tz);
      curtainGroup.add(tassel);
    });

    [1.5, -9.5].forEach(cz => {
      const sLight = new THREE.PointLight(0xffbe4e, 3.2, 8, 1.4);
      sLight.position.set(-10.95, floorY + 3.4, cz);
      curtainGroup.add(sLight);
      if (this.torches) {
        this.torches.push({ light: sLight, flame: null, baseIntensity: 3.2, offset: Math.random() * Math.PI });
      }
    });

    this.scene.add(curtainGroup);

    // Pilastras góticas com arandelas ao redor da sala
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1d243a, roughness: 0.65 });
    const bPillarGeo = new THREE.BoxGeometry(0.85, roomHeight, 0.85);
    const roomPillars = [
      { x: -14.5, z: 5.6 }, { x: -22.5, z: 5.6 },
      { x: -14.5, z: -13.6 }, { x: -22.5, z: -13.6 }
    ];
    roomPillars.forEach(p => {
      const pm = new THREE.Mesh(bPillarGeo, pillarMat);
      pm.position.set(p.x, floorY + roomHeight / 2, p.z);
      this.scene.add(pm);

      const pLight = new THREE.PointLight(0xffbe4e, 3.8, 12, 1.4);
      pLight.position.set(p.x, floorY + 3.2, p.z > 0 ? p.z - 0.5 : p.z + 0.5);
      this.scene.add(pLight);
      if (this.torches) {
        this.torches.push({ light: pLight, flame: null, baseIntensity: 3.8, offset: Math.random() * Math.PI });
      }
    });

    // 5. MESA DE ESCRITÓRIO DA DIRETORIA
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-18.5, floorY, -4.0);

    const deskTopGeo = new THREE.BoxGeometry(1.9, 0.14, 3.8);
    const deskMat = new THREE.MeshStandardMaterial({
      map: deskWoodTex,
      roughness: 0.35,
      metalness: 0.15
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(0, 1.15, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    const blotterGeo = new THREE.PlaneGeometry(1.2, 2.4);
    const blotterMat = new THREE.MeshStandardMaterial({ color: 0x121724, roughness: 0.6 });
    const blotter = new THREE.Mesh(blotterGeo, blotterMat);
    blotter.rotation.x = -Math.PI / 2;
    blotter.position.set(0, 1.23, 0);
    deskGroup.add(blotter);

    const pedGeo = new THREE.BoxGeometry(1.65, 1.08, 0.95);
    const pedL = new THREE.Mesh(pedGeo, deskMat);
    pedL.position.set(0, 0.54, -1.25);
    pedL.castShadow = true;
    deskGroup.add(pedL);

    const pedR = new THREE.Mesh(pedGeo, deskMat);
    pedR.position.set(0, 0.54, 1.25);
    pedR.castShadow = true;
    deskGroup.add(pedR);

    const handleGeo = new THREE.TorusGeometry(0.045, 0.012, 6, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    [-1.25, 1.25].forEach(pz => {
      [0.35, 0.65, 0.95].forEach(py => {
        const h = new THREE.Mesh(handleGeo, handleMat);
        h.position.set(0.83, py, pz);
        deskGroup.add(h);
      });
    });

    const modGeo = new THREE.BoxGeometry(0.1, 0.75, 1.55);
    const mod = new THREE.Mesh(modGeo, deskMat);
    mod.position.set(-0.72, 0.65, 0);
    deskGroup.add(mod);

    const candelabroGroup = new THREE.Group();
    candelabroGroup.position.set(-0.3, 1.23, 1.2);
    const candelabroBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), handleMat);
    candelabroGroup.add(candelabroBase);
    [-0.15, 0, 0.15].forEach(cz => {
      const c = new THREE.Mesh(candleGeo, candleMat);
      c.position.set(0, 0.35, cz);
      candelabroGroup.add(c);
      const f = new THREE.Mesh(flameGeo, flameMat);
      f.position.set(0, 0.52, cz);
      candelabroGroup.add(f);
    });
    deskGroup.add(candelabroGroup);

    this.scene.add(deskGroup);

    // 6. POLTRONA DA DIRETORA (Atrás da mesa)
    const dirChair = new THREE.Group();
    dirChair.position.set(-20.6, floorY, -4.0);

    const velvetCrimsonMat = new THREE.MeshStandardMaterial({ color: 0x3d0f1b, roughness: 0.85 });
    const cSeatGeo = new THREE.BoxGeometry(0.85, 0.16, 0.85);
    const cSeat = new THREE.Mesh(cSeatGeo, velvetCrimsonMat);
    cSeat.position.set(0, 0.58, 0);
    dirChair.add(cSeat);

    const cBackGeo = new THREE.BoxGeometry(0.12, 1.65, 0.82);
    const cBack = new THREE.Mesh(cBackGeo, velvetCrimsonMat);
    cBack.position.set(-0.38, 1.45, 0);
    dirChair.add(cBack);

    const cLegGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 6);
    [-0.35, 0.35].forEach(lx => {
      [-0.35, 0.35].forEach(lz => {
        const leg = new THREE.Mesh(cLegGeo, deskMat);
        leg.position.set(lx, 0.25, lz);
        dirChair.add(leg);
      });
    });
    this.scene.add(dirChair);

    // 7. CADEIRAS À FRENTE DA MESA (VIRADAS PARA FRENTE EM DIREÇÃO À MESA -X)
    [-4.9, -3.1].forEach((cz, idx) => {
      const vChair = new THREE.Group();
      vChair.position.set(-16.65, floorY, cz);
      // Viradas de frente para a mesa (-X)
      vChair.rotation.y = idx === 0 ? 0.06 : -0.06;

      const chairWoodMat = deskMat;
      const velvetPurpleMat = new THREE.MeshStandardMaterial({
        color: 0x2e1848,
        roughness: 0.75,
        metalness: 0.08
      });
      const goldStudMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.25
      });

      // Assento acolchoado
      const vSeat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.68), velvetPurpleMat);
      vSeat.position.set(0, 0.54, 0);
      vSeat.castShadow = true;
      vChair.add(vSeat);

      // Moldura e encosto estofado alto posicionado na parte de trás (+X), voltado para a frente (-X)
      const vBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.64), velvetPurpleMat);
      vBack.position.set(0.3, 1.05, 0);
      vBack.castShadow = true;
      vChair.add(vBack);

      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.68), chairWoodMat);
      crest.position.set(0.3, 1.56, 0);
      vChair.add(crest);

      [-0.34, 0.34].forEach(az => {
        const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.07), chairWoodMat);
        armRest.position.set(0.06, 0.88, az);
        vChair.add(armRest);

        const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6), chairWoodMat);
        armPost.position.set(-0.16, 0.71, az);
        vChair.add(armPost);
      });

      [-0.28, 0.28].forEach(lx => {
        [-0.28, 0.28].forEach(lz => {
          const leg = new THREE.Mesh(cLegGeo, chairWoodMat);
          leg.position.set(lx, 0.25, lz);
          leg.castShadow = true;
          vChair.add(leg);

          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 6), goldStudMat);
          foot.position.set(lx, 0.03, lz);
          vChair.add(foot);
        });
      });

      this.scene.add(vChair);
    });

    // 8. O LIVRO DE MATRÍCULAS OFICIAL COM ANIMAÇÃO DE ABERTURA E FOLHEAR PÁGINAS
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-18.0, floorY + 1.23, -4.0);

    const bookCoverGeo = new THREE.BoxGeometry(0.56, 0.04, 0.76);
    const bookCoverMat = new THREE.MeshStandardMaterial({ color: 0x13161c, roughness: 0.5, metalness: 0.2 });
    const bookCoverBase = new THREE.Mesh(bookCoverGeo, bookCoverMat);
    bookCoverBase.position.set(0, 0.02, 0);
    bookCoverBase.castShadow = true;
    bookGroup.add(bookCoverBase);

    const pagesGeo = new THREE.BoxGeometry(0.53, 0.08, 0.73);
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xdfd3b2, roughness: 0.85 });
    const pagesMesh = new THREE.Mesh(pagesGeo, pagesMat);
    pagesMesh.position.set(0, 0.07, 0);
    bookGroup.add(pagesMesh);

    // Cantoneiras douradas
    const goldCornerMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
    [-0.25, 0.25].forEach(cx => {
      [-0.35, 0.35].forEach(cz => {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), goldCornerMat);
        corner.position.set(cx, 0.07, cz);
        bookGroup.add(corner);
      });
    });

    // Capa superior móvel / dobradiça na lombada
    const topCoverPivot = new THREE.Group();
    topCoverPivot.position.set(-0.27, 0.11, 0);
    const topCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.035, 0.75),
      bookCoverMat
    );
    topCover.position.set(0.27, 0, 0);
    topCoverPivot.add(topCover);
    bookGroup.add(topCoverPivot);

    // Páginas com animação de leque / folhear
    const flipPages = [];
    for (let p = 0; p < 4; p++) {
      const pGroup = new THREE.Group();
      pGroup.position.set(-0.25, 0.11, 0);
      const pageMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xf5eedb, side: THREE.DoubleSide })
      );
      pageMesh.rotation.x = Math.PI / 2;
      pageMesh.position.set(0.24, 0, 0);
      pGroup.add(pageMesh);
      bookGroup.add(pGroup);
      flipPages.push(pGroup);
    }

    // Página rasgada de Seraphine saltando para fora
    const tornPage = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xf5eedb, side: THREE.DoubleSide })
    );
    tornPage.position.set(0.28, 0.12, -0.15);
    tornPage.rotation.x = -Math.PI / 2;
    tornPage.rotation.z = 0.25;
    bookGroup.add(tornPage);

    // Runa mágica dourada flutuando sobre o livro
    const runeGeo = new THREE.OctahedronGeometry(0.14, 0);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xffd580,
      emissive: 0xffaa33,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.9
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(0, 0.38, 0);
    bookGroup.add(rune);

    const bookLight = new THREE.PointLight(0xffd580, 2.4, 4.0);
    bookLight.position.set(0, 0.42, 0);
    bookGroup.add(bookLight);

    const auraRingGeo = new THREE.TorusGeometry(0.48, 0.015, 8, 32);
    const auraRingMat = new THREE.MeshBasicMaterial({ color: 0xffd580, transparent: true, opacity: 0.75 });
    const auraRing = new THREE.Mesh(auraRingGeo, auraRingMat);
    auraRing.rotation.x = Math.PI / 2;
    auraRing.position.set(0, 0.18, 0);
    bookGroup.add(auraRing);

    this.scene.add(bookGroup);

    this.animatedProps.push({
      type: 'ledger',
      group: bookGroup,
      topCoverPivot,
      flipPages,
      rune,
      auraRing,
      bookLight,
      isOpen: false,
      openProgress: 0,
      baseY: floorY + 1.23
    });

    this.interactivePoints.push({
      id: 'ledger',
      name: 'Livro de Matrículas Oficial',
      x: -18.0,
      y: floorY + 1.23,
      z: -4.0,
      radius: 2.8,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para abrir o <strong>Livro de Matrículas Oficial</strong> ✦',
      onInteract: () => {
        this.openLedger3DAnimation();
        if (this.onInspectLedger) this.onInspectLedger();
      }
    });

    // 9. DIRETORA MORGANA VALE (FIGURA ELEGANTE, SEM GOLA ALTA BLOQUEANDO E SEM FORMAS NO PESCOÇO)
    const morganaGroup = new THREE.Group();
    morganaGroup.position.set(-19.4, floorY, -2.15);
    morganaGroup.rotation.y = Math.PI * 0.65; // Virada para frente em direção à escrivaninha

    const gownGeo = new THREE.ConeGeometry(0.52, 1.48, 16);
    const morganaGownMat = new THREE.MeshStandardMaterial({
      color: 0x180b24,
      roughness: 0.68,
      metalness: 0.2
    });
    const gown = new THREE.Mesh(gownGeo, morganaGownMat);
    gown.position.set(0, 0.74, 0);
    gown.castShadow = true;
    morganaGroup.add(gown);

    // Torso elegante ajustado (vestido vitoriano sem cones altos que subam ao pescoço)
    const bodiceGeo = new THREE.CylinderGeometry(0.20, 0.26, 0.52, 14);
    const bodiceMat = new THREE.MeshStandardMaterial({
      color: 0x27103a,
      roughness: 0.55,
      metalness: 0.25
    });
    const bodice = new THREE.Mesh(bodiceGeo, bodiceMat);
    bodice.position.set(0, 1.35, 0);
    bodice.castShadow = true;
    morganaGroup.add(bodice);

    // Ombros e braços em repouso elegante
    [-0.20, 0.20].forEach(ax => {
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.44, 8), bodiceMat);
      upperArm.position.set(ax, 1.30, 0.05);
      upperArm.rotation.x = Math.PI / 8;
      upperArm.rotation.z = ax > 0 ? -0.15 : 0.15;
      morganaGroup.add(upperArm);
    });

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6dbcb, roughness: 0.42 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.6 });

    const handsMesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    handsMesh.position.set(0, 1.10, 0.20);
    morganaGroup.add(handsMesh);

    // Pescoço limpo, delicado e totalmente desobstruído (SEM gola alta ou cones ao redor)
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 10), skinMat);
    neckMesh.position.set(0, 1.68, 0.01);
    morganaGroup.add(neckMesh);

    // Gargantilha fina dourada rente à base do pescoço
    const choker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    choker.position.set(0, 1.62, 0.01);
    morganaGroup.add(choker);

    // Cabeça e rosto da Diretora Morgana
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 16), skinMat);
    head.position.set(0, 1.83, 0.02);
    morganaGroup.add(head);

    // Olhos arcanos violeta expressivos
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9b5de5 });
    [-0.046, 0.046].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
      eye.position.set(ex, 1.845, 0.152);
      morganaGroup.add(eye);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.008, 0.012), hairMat);
      brow.position.set(ex, 1.88, 0.153);
      brow.rotation.z = ex > 0 ? -0.15 : 0.15;
      morganaGroup.add(brow);
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), skinMat);
    nose.position.set(0, 1.82, 0.165);
    nose.rotation.x = Math.PI / 2;
    morganaGroup.add(nose);

    const lipsMat = new THREE.MeshStandardMaterial({ color: 0x7c142b, roughness: 0.4 });
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.014, 0.015), lipsMat);
    lips.position.set(0, 1.785, 0.158);
    morganaGroup.add(lips);

    // Cabelo preto aristocrático com coque estilizado
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 14), hairMat);
    hair.position.set(0, 1.87, -0.03);
    morganaGroup.add(hair);

    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), hairMat);
    bun.position.set(0, 1.98, -0.11);
    morganaGroup.add(bun);

    const silverEarMat = new THREE.MeshStandardMaterial({ color: 0xd0d5e2, metalness: 0.9, roughness: 0.2 });
    [-0.145, 0.145].forEach(ex => {
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), silverEarMat);
      earring.position.set(ex, 1.79, 0.02);
      morganaGroup.add(earring);
    });

    // Amuleto da Diretora no peito
    const amulet = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.014, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    amulet.position.set(0, 1.44, 0.21);
    morganaGroup.add(amulet);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.03, 0),
      new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5a189a, emissiveIntensity: 1.2, roughness: 0.1 })
    );
    gem.position.set(0, 1.44, 0.22);
    morganaGroup.add(gem);

    // Iluminação dedicada da face
    const faceLight = new THREE.PointLight(0xf8e8dc, 1.8, 3.5);
    faceLight.position.set(0, 1.85, 0.55);
    morganaGroup.add(faceLight);

    const mAura = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.02, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.75 })
    );

    const morganaLight = new THREE.PointLight(0xa58ae8, 2.2, 5.0);
    morganaLight.position.set(0, 1.5, 0);
    morganaGroup.add(morganaLight);

    this.scene.add(morganaGroup);

    this.animatedProps.push({
      type: 'morgana',
      group: morganaGroup,
      aura: mAura,
      baseY: floorY
    });

    this.interactivePoints.push({
      id: 'morgana',
      name: 'Diretora Morgana Vale',
      x: -19.4,
      y: floorY,
      z: -2.15,
      radius: 3.0,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para falar com a <strong>Diretora Morgana Vale</strong> ✦',
      onInteract: () => {
        if (this.onTalkMorgana) this.onTalkMorgana();
      }
    });

    // 10. MURAL DE AVISOS ESTUDANTIS NA PAREDE NORTE
    const noticeGroup = new THREE.Group();
    noticeGroup.position.set(-18.0, floorY + 2.6, 5.85);

    const boardGeo = new THREE.BoxGeometry(3.2, 1.8, 0.08);
    const boardTex = this.createNoticeBoardTexture();
    const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.8 });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    noticeGroup.add(boardMesh);

    const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x22150d, roughness: 0.7 });
    const topF = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.12), boardFrameMat);
    topF.position.set(0, 0.94, 0.02);
    noticeGroup.add(topF);
    const botF = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.12), boardFrameMat);
    botF.position.set(0, -0.94, 0.02);
    noticeGroup.add(botF);

    const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: 0xa58ae8 }));
    badge.position.set(0, 1.15, 0.08);
    noticeGroup.add(badge);

    const badgeLight = new THREE.PointLight(0xa58ae8, 1.8, 5.0);
    badgeLight.position.set(0, 0, 0.4);
    noticeGroup.add(badgeLight);

    this.scene.add(noticeGroup);

    this.interactivePoints.push({
      id: 'notice_board',
      name: 'Mural de Avisos Estudantis',
      x: -18.0,
      y: floorY + 2.6,
      z: 5.5,
      radius: 3.0,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para examinar o <strong>Mural de Avisos Estudantis</strong> ✦',
      onInteract: () => {
        if (this.onInspectNoticeBoard) this.onInspectNoticeBoard();
      }
    });

    // 11. RETRATO ADULTERADO DA TURMA 42 NA PAREDE SUL
    const portraitGroup = new THREE.Group();
    portraitGroup.position.set(-18.0, floorY + 2.6, -13.85);

    const pCanvasGeo = new THREE.BoxGeometry(2.4, 2.8, 0.08);
    const pTex = this.createErasedPortraitTexture();
    const pCanvasMat = new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.7 });
    const pMesh = new THREE.Mesh(pCanvasGeo, pCanvasMat);
    portraitGroup.add(pMesh);

    const gFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const pTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.14), gFrameMat);
    pTop.position.set(0, 1.45, 0.04);
    portraitGroup.add(pTop);
    const pBot = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.14), gFrameMat);
    pBot.position.set(0, -1.45, 0.04);
    portraitGroup.add(pBot);

    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.9, 0.14), gFrameMat);
    pL.position.set(-1.25, 0, 0.04);
    portraitGroup.add(pL);
    const pR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.9, 0.14), gFrameMat);
    pR.position.set(1.25, 0, 0.04);
    portraitGroup.add(pR);

    const pLight = new THREE.PointLight(0x7650b8, 1.8, 5.0);
    pLight.position.set(0, 0, 0.5);
    portraitGroup.add(pLight);

    this.scene.add(portraitGroup);

    this.interactivePoints.push({
      id: 'erased_portrait',
      name: 'Retrato Adulterado (Turma 42)',
      x: -18.0,
      y: floorY + 2.6,
      z: -13.5,
      radius: 3.0,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para examinar o <strong>Retrato Adulterado (Turma 42)</strong> ✦',
      onInteract: () => {
        if (this.onInspectPortrait) this.onInspectPortrait();
      }
    });

    // 12. PASSAGEM PARA A BIBLIOTECA VELADA NA PAREDE OESTE
    const libDoorGroup = new THREE.Group();
    libDoorGroup.position.set(-27.85, floorY, -4.0);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.7, metalness: 0.2 });
    const libDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 2.6), frameMat);
    libDoorFrame.position.set(0, 2.1, 0);
    libDoorGroup.add(libDoorFrame);

    const libDoorMat = new THREE.MeshStandardMaterial({ map: woodDoorTex, roughness: 0.55, metalness: 0.15 });
    const libDoorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 2.2), libDoorMat);
    libDoorLeaf.position.set(0.1, 1.9, 0);
    libDoorGroup.add(libDoorLeaf);

    const libRune = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0x4ef0c4, side: THREE.DoubleSide })
    );
    libRune.position.set(0.18, 2.0, 0);
    libRune.rotation.y = Math.PI / 2;
    libDoorGroup.add(libRune);

    const libLight = new THREE.PointLight(0x4ef0c4, 2.2, 5.0);
    libLight.position.set(0.4, 2.0, 0);
    libDoorGroup.add(libLight);

    this.scene.add(libDoorGroup);

    this.interactivePoints.push({
      id: 'library_passage',
      name: 'Passagem para a Biblioteca Velada',
      x: -27.0,
      y: floorY,
      z: -4.0,
      radius: 3.0,
      prompt: '✦ Pressione <kbd class="corridor-key">E</kbd> para avançar para a <strong>Biblioteca Velada (Fase 2)</strong> ✦',
      onInteract: () => {
        if (this.onEnterLibrary) this.onEnterLibrary();
      }
    });
  }

  // Executa animação 3D de abertura suave do livro de matrículas na mesa
  openLedger3DAnimation() {
    const prop = this.animatedProps.find(p => p.type === 'ledger');
    if (prop) {
      prop.isOpen = true;
    }
  }

  openBasementDoor() {
    this.isBasementDoorOpen = true;
    const basementDoor = this.doors.find(d => d.id === 'door_basement');
    if (basementDoor) {
      basementDoor.isOpen = true;
      basementDoor.targetAngle = Math.PI * 0.55;
    }
  }

  enterBasementRoom(forceTeleport = false) {
    this.openBasementDoor();

    if (forceTeleport) {
      this.player.position.set(-6.0, -1.15, -4.0);
      this.player.rotationY = -Math.PI / 2;
      this.cameraAngles.yaw = -Math.PI / 2;
      this.cameraAngles.targetYaw = -Math.PI / 2;
      this.cameraAngles.pitch = 0.12;
      this.cameraAngles.targetPitch = 0.12;
      this.cameraAngles.distance = 3.6;
    }

    const hudTitle = document.querySelector('.corridor-hud-title');
    const hudDesc = document.querySelector('.corridor-hud-desc');
    if (hudTitle) hudTitle.textContent = 'Salão das Cinzas • Sala da Diretoria (Fase 1)';
    if (hudDesc) hudDesc.textContent = 'Investigue o Porão: aproxime-se da mesa para abrir o Livro de Matrículas [E], fale com a Diretora Morgana Vale [E] e examine o mural e o retrato.';
  }

  interactWithNearbyObject() {
    this.checkInteractionsProximity();
    if (this.activeInteractivePoint) {
      if (this.activeInteractivePoint.onInteract) {
        this.activeInteractivePoint.onInteract();
      }
      return;
    }
    if (this.activeNearDoor) {
      this.interactWithCurrentDoor();
      return;
    }
  }

  checkInteractionsProximity() {
    let promptEl = document.getElementById('corridor-door-prompt');
    const diag = document.getElementById('dialogue-overlay');
    const modal = document.querySelector('.modal-backdrop');
    if (diag || modal) {
      if (promptEl) promptEl.classList.remove('visible');
      return;
    }

    let nearestPoint = null;
    let minDist = Infinity;

    if (this.interactivePoints) {
      this.interactivePoints.forEach(pt => {
        const dist = Math.hypot(this.player.position.x - pt.x, this.player.position.z - pt.z);
        if (dist < pt.radius && dist < minDist) {
          minDist = dist;
          nearestPoint = pt;
        }
      });
    }

    if (nearestPoint) {
      this.activeInteractivePoint = nearestPoint;
      if (promptEl) {
        promptEl.innerHTML = nearestPoint.prompt;
        promptEl.classList.add('visible');
      }
      return;
    }

    this.activeInteractivePoint = null;
    this.checkDoorsProximity();
  }


  // Checa proximidade com as 3 portas e exibe aviso de interação
  checkDoorsProximity() {
    let closestDoor = null;
    let minDist = 2.4;

    this.doors.forEach(door => {
      const dist = Math.hypot(this.player.position.x - door.x, this.player.position.z - door.z);
      if (dist < minDist) {
        minDist = dist;
        closestDoor = door;
      }
    });

    this.activeNearDoor = closestDoor;

    let doorPrompt = document.getElementById('corridor-door-prompt');
    if (!doorPrompt) {
      doorPrompt = document.createElement('div');
      doorPrompt.id = 'corridor-door-prompt';
      doorPrompt.className = 'corridor-door-notification';
      const screen = document.getElementById('corridor-3d-screen');
      if (screen) screen.appendChild(doorPrompt);
    }

    if (closestDoor) {
      if (closestDoor.isOpenable) {
        doorPrompt.innerHTML = `✦ Pressione <kbd class="corridor-key">E</kbd> para abrir o <strong>${closestDoor.name}</strong> ✦`;
      } else {
        doorPrompt.innerHTML = `🔒 Pressione <kbd class="corridor-key">E</kbd> para inspecionar o <strong>${closestDoor.name}</strong>`;
      }
      doorPrompt.classList.add('visible');
    } else if (doorPrompt) {
      doorPrompt.classList.remove('visible');
    }

    // Suavizar animação de rotação da folha da porta
    this.doors.forEach(door => {
      if (door.leafGroup) {
        door.openAngle += (door.targetAngle - door.openAngle) * 0.12;
        door.leafGroup.rotation.y = door.openAngle;
      }
    });
  }

  // Carrega o modelo Xbot oficial do exemplo Three.js (webgl_animation_skinning_additive_blending)
  loadCharacterModel() {
    const loader = new GLTFLoader();
    const modelUrl = '/assets/models/Xbot.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        if (this.isDisposed) return;

        this.model = gltf.scene;
        this.model.scale.set(1.4, 1.4, 1.4);
        this.model.position.copy(this.player.position);
        this.model.rotation.y = this.player.rotationY;

        // Transformar o boneco Xbot em Elias Crowe (humano, roupa nobre gótica vitoriana e mapeamento dos ossos do braço)
        this.customizeEliasCrowe(this.model, gltf);

        this.scene.add(this.model);

        // Configurar AnimationMixer e clipes
        this.mixer = new THREE.AnimationMixer(this.model);
        gltf.animations.forEach((clip) => {
          // Ajustar marcha e corrida para postura masculina e firme
          const adjustedClip = this.adjustAnimationForMasculineWalk(clip);
          const action = this.mixer.clipAction(adjustedClip);
          this.actions[clip.name] = action;
          this.actions[clip.name.toLowerCase()] = action;
        });

        // Iniciar com animação Idle ativa
        if (this.actions['idle']) {
          this.actions['idle'].play();
        } else if (gltf.animations.length > 0) {
          const first = this.actions[gltf.animations[0].name];
          if (first) first.play();
        }

        const loadIndicator = document.getElementById('corridor-3d-loading');
        if (loadIndicator) loadIndicator.style.display = 'none';
      },
      (xhr) => {
        // Progresso
      },
      (error) => {
        console.error('Erro ao carregar modelo 3D Xbot:', error);
        const loadIndicator = document.getElementById('corridor-3d-loading');
        if (loadIndicator) loadIndicator.textContent = 'Erro ao carregar modelo 3D.';
      }
    );
  }

  // Personaliza o corpo, veste sobrecasaca gótica bordada, preenche as juntas mecânicas e adiciona cabelos de Elias Crowe
  customizeEliasCrowe(model, gltf) {
    let surfaceMesh = null;
    let jointsMesh = null;

    model.traverse((child) => {
      if (child.isBone) {
        if (child.name === 'mixamorig:Head') this.bones.head = child;
        if (child.name === 'mixamorig:Spine2') this.bones.spine2 = child;
        if (child.name === 'mixamorig:Neck') this.bones.neck = child;
        if (child.name === 'mixamorig:RightArm') this.bones.rightArm = child;
        if (child.name === 'mixamorig:RightForeArm') this.bones.rightForeArm = child;
        if (child.name === 'mixamorig:RightHand') this.bones.rightHand = child;
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name === 'Beta_Surface') surfaceMesh = child;
        if (child.name === 'Beta_Joints') jointsMesh = child;
      }
    });

    const headBone = this.bones.head;
    const spine2Bone = this.bones.spine2;
    const neckBone = this.bones.neck;

    // Paleta de roupas nobres e tom de pele de Elias Crowe
    const colSkin = new THREE.Color(0xf5d3b3);       // Tom de pele humano claro e natural
    const colNeck = new THREE.Color(0xe0bfa2);       // Sombra de pescoço
    const colFaceShadow = new THREE.Color(0xd2aa89); // Contorno do maxilar
    const colEyes = new THREE.Color(0x0a0c12);       // Olhos escuros profundos e sobrancelhas
    const colLips = new THREE.Color(0xbf7b70);       // Lábios naturais masculinos
    const colCoat = new THREE.Color(0x131828);       // Sobrecasaca preta/azul meia-noite
    const colVest = new THREE.Color(0x1b2438);       // Colete gótico
    const colSilver = new THREE.Color(0xccd5e8);     // Bordados de prata
    const colPants = new THREE.Color(0x11131a);      // Calça escura
    const colBoots = new THREE.Color(0x0c0b0e);      // Botas pretas
    const colGlove = new THREE.Color(0x1a1618);      // Luvas de couro
    const colShirt = new THREE.Color(0x282634);      // Lenço/jabot vitoriano

    // 1. REVESTIR AS JUNTAS/DOBRADIÇAS PARA PARECEREM TECIDO E CORPO HUMANO
    if (jointsMesh && jointsMesh.geometry) {
      jointsMesh.visible = true;
      const jGeo = jointsMesh.geometry;
      const jPos = jGeo.attributes.position;
      const jJoint = jGeo.attributes.skinIndex || jGeo.attributes.joints;
      const jWeight = jGeo.attributes.skinWeight || jGeo.attributes.weights;
      const jCount = jPos.count;
      const jColors = new Float32Array(jCount * 3);

      for (let i = 0; i < jCount; i++) {
        let maxW = 0, domJ = -1;
        if (jWeight && jJoint) {
          for (let k = 0; k < 4; k++) {
            const w = jWeight.getComponent ? jWeight.getComponent(i, k) : 0;
            const j = jJoint.getComponent ? jJoint.getComponent(i, k) : 0;
            if (w > maxW) {
              maxW = w;
              domJ = j;
            }
          }
        }
        const y = jPos.getY(i);
        let c = colCoat;

        // Pescoço da junta: Pele humana de Elias Crowe
        if (domJ === 4 || y > 1.46) {
          c = colSkin;
        }
        // Dedos/juntas das mãos: Luvas de couro
        else if (domJ === 12 || domJ === 36 || (domJ >= 13 && domJ <= 32) || (domJ >= 37 && domJ <= 56)) {
          c = colGlove;
        }
        // Pés/tornozelos: Botas pretas
        else if (domJ === 59 || domJ === 64 || y < 0.38) {
          c = colBoots;
        }
        // Pernas/joelhos: Calça escura de alfaiataria
        else if ((domJ === 58 || domJ === 63 || domJ === 57 || domJ === 62) && y < 0.88) {
          c = colPants;
        }
        // Cintura/coluna: Tecido da sobrecasaca/colete
        else {
          c = colVest;
        }

        jColors[i * 3] = c.r;
        jColors[i * 3 + 1] = c.g;
        jColors[i * 3 + 2] = c.b;
      }

      jGeo.setAttribute('color', new THREE.BufferAttribute(jColors, 3));
      // Reutiliza e atualiza o material existente para manter o skinning do SkinnedMesh
      if (jointsMesh.material) {
        jointsMesh.material.vertexColors = true;
        jointsMesh.material.needsUpdate = true;
      }
    }

    // 2. VESTIMENTA E ANATOMIA HUMANA NA SUPERFÍCIE (Beta_Surface)
    if (surfaceMesh && surfaceMesh.geometry) {
      const geo = surfaceMesh.geometry;
      const posAttr = geo.attributes.position;
      const jointAttr = geo.attributes.skinIndex || geo.attributes.joints;
      const weightAttr = geo.attributes.skinWeight || geo.attributes.weights;
      const count = posAttr.count;
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        let x = posAttr.getX(i);
        let y = posAttr.getY(i);
        let z = posAttr.getZ(i);

        let maxW = 0, domJoint = -1;
        if (weightAttr && jointAttr) {
          for (let k = 0; k < 4; k++) {
            const w = weightAttr.getComponent ? weightAttr.getComponent(i, k) : 0;
            const j = jointAttr.getComponent ? jointAttr.getComponent(i, k) : 0;
            if (w > maxW) {
              maxW = w;
              domJoint = j;
            }
          }
        }

        // --- Atribuição de cores das roupas de Elias Crowe ---
        let c = colCoat;

        // Cabeça e Face de Elias Crowe (joint 5)
        if (domJoint === 5 || y >= 1.52) {
          // Rosto frontal (z > 0.05)
          if (z > 0.05) {
            // Olhos marcantes e sobrancelhas
            if (y >= 1.635 && y <= 1.685 && Math.abs(x) >= 0.015 && Math.abs(x) <= 0.065) {
              c = colEyes;
            }
            // Lábios naturais
            else if (y >= 1.555 && y <= 1.585 && Math.abs(x) <= 0.028) {
              c = colLips;
            }
            // Sombra da linha da mandíbula
            else if (y <= 1.56 && Math.abs(x) >= 0.04) {
              c = colFaceShadow;
            }
            // Pele do rosto
            else {
              c = colSkin;
            }
          }
          // Lateral e parte de trás da cabeça (cabelo ou pele de base)
          else if (z < 0.0) {
            c = new THREE.Color(0x0a0c10); // Cabelo preto de base
          } else {
            c = colSkin;
          }
        }
        // Mãos: Luvas elegantes de couro
        else if (
          domJoint === 12 || domJoint === 36 ||
          (domJoint >= 13 && domJoint <= 32) ||
          (domJoint >= 37 && domJoint <= 56)
        ) {
          c = colGlove;
        }
        // Pés: Botas pretas de montaria
        else if (domJoint === 59 || domJoint === 64 || y < 0.38) {
          c = colBoots;
        }
        // Pernas: Calça escura de alfaiataria
        else if ((domJoint === 58 || domJoint === 63 || domJoint === 57 || domJoint === 62) && y < 0.88) {
          c = colPants;
        }
        // Tronco: Sobrecasaca nobre com colete e bordados prateados
        else {
          // Centro do peito: Camisa / Jabot / Colete interno
          if (Math.abs(x) < 0.075 && z > 0.02 && y > 1.05 && y < 1.45) {
            if (y > 1.36) {
              c = colShirt;
            } else if (Math.abs(x) < 0.015) {
              c = colSilver;
            } else {
              c = colVest;
            }
          }
          // Bordados prateados nas lapelas (como na arte oficial)
          else if (Math.abs(x) >= 0.065 && Math.abs(x) <= 0.095 && z > 0.025 && y > 1.12 && y < 1.42) {
            c = colSilver;
          } else {
            c = colCoat;
          }
        }

        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      // Reutiliza e atualiza o material existente para manter o skinning funcionando
      if (surfaceMesh.material) {
        surfaceMesh.material.vertexColors = true;
        surfaceMesh.material.needsUpdate = true;
      }
    }

    // 3. CABELO PRETO ONDULADO/REBELDE DE ELIAS CROWE, GOLA ALTA E ORNAMENTOS
    if (headBone) {
      const hairGroup = new THREE.Group();
      hairGroup.name = 'Elias_Hair';

      const hairMat = new THREE.MeshStandardMaterial({
        color: 0x08090e,
        roughness: 0.6,
        metalness: 0.15
      });

      // Volume do topo da cabeça e nuca (em coordenadas locais do Head bone)
      const hairBaseGeo = new THREE.SphereGeometry(12.5, 16, 16);
      hairBaseGeo.scale(0.95, 1.15, 1.25);
      const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
      hairBase.position.set(0, 5.0, -1.8);
      hairGroup.add(hairBase);

      // Mechas e franja ondulada de Elias Crowe caindo pela testa e laterais
      const bangsGeo = new THREE.ConeGeometry(2.6, 9.8, 6);
      bangsGeo.rotateX(-Math.PI / 3);

      const bangPositions = [
        { x: -4.5, y: 7.5, z: 7.8, rx: 0.4, ry: -0.3, rz: -0.35, s: 1.1 },
        { x: -1.5, y: 8.2, z: 8.8, rx: 0.5, ry: -0.1, rz: -0.1, s: 1.2 },
        { x: 2.0, y: 8.0, z: 8.5, rx: 0.48, ry: 0.2, rz: 0.15, s: 1.15 },
        { x: 5.0, y: 7.2, z: 7.5, rx: 0.35, ry: 0.4, rz: 0.45, s: 1.0 },
        { x: -8.0, y: 2.0, z: 4.0, rx: 0.2, ry: -0.5, rz: -0.25, s: 1.25 },
        { x: 8.0, y: 2.0, z: 4.0, rx: 0.2, ry: 0.5, rz: 0.25, s: 1.25 },
        { x: -7.5, y: -4.0, z: 1.5, rx: 0.1, ry: -0.4, rz: -0.1, s: 1.3 },
        { x: 7.5, y: -4.0, z: 1.5, rx: 0.1, ry: 0.4, rz: 0.1, s: 1.3 },
        { x: 0, y: -1.0, z: -8.5, rx: -0.4, ry: 0, rz: 0, s: 1.35 }
      ];

      bangPositions.forEach((bp) => {
        const bang = new THREE.Mesh(bangsGeo, hairMat);
        bang.position.set(bp.x, bp.y, bp.z);
        bang.rotation.set(bp.rx, bp.ry, bp.rz);
        bang.scale.set(bp.s, bp.s, bp.s);
        hairGroup.add(bang);
      });

      headBone.add(hairGroup);
    }

    // 4. COLARINHO ALTO VITORIANO E PINGENTE DA LUA CRESCENTE (anexado ao Spine2 ou Neck)
    const torsoBone = spine2Bone || neckBone;
    if (torsoBone) {
      const coatGroup = new THREE.Group();
      coatGroup.name = 'Elias_CoatDetails';

      const collarMat = new THREE.MeshStandardMaterial({
        color: 0x0e1322,
        roughness: 0.6,
        metalness: 0.2
      });
      const collarGeo = new THREE.CylinderGeometry(11.5, 13.5, 12, 14, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(0, 10.0, 0.5);
      collarMesh.rotation.x = 0.15;
      coatGroup.add(collarMesh);

      // Pingente da Lua Crescente com corrente de prata
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0xebf2ff,
        metalness: 0.9,
        roughness: 0.2
      });
      const crescentGeo = new THREE.TorusGeometry(2.0, 0.45, 8, 16, Math.PI * 1.3);
      const crescent = new THREE.Mesh(crescentGeo, chainMat);
      crescent.position.set(0, 4.0, 9.5);
      crescent.rotation.z = Math.PI * 0.35;
      coatGroup.add(crescent);

      torsoBone.add(coatGroup);
    }
  }

  // Modifica os canais das animações para retirar a pose e balanço feminino (inclusive no idle) e conferir postura masculina firme
  adjustAnimationForMasculineWalk(clip) {
    const modifiedTracks = clip.tracks.map((track) => {
      // 1. Corrigir rotação dos quadris (Hips) em idle, walk e run
      if (track.name === 'mixamorig:Hips.rotation') {
        const values = track.values.slice();
        for (let i = 0; i < values.length; i += 4) {
          // Zera ou reduz drasticamente a inclinação lateral e torção feminina da cintura
          values[i + 2] *= 0.15;
          values[i + 1] *= 0.25;

          const len = Math.hypot(values[i], values[i + 1], values[i + 2], values[i + 3]);
          if (len > 0.0001) {
            values[i] /= len;
            values[i + 1] /= len;
            values[i + 2] /= len;
            values[i + 3] /= len;
          }
        }
        return new THREE.QuaternionKeyframeTrack(track.name, track.times, values);
      }

      // 2. Corrigir translação lateral dos quadris
      if (track.name === 'mixamorig:Hips.translation') {
        const values = track.values.slice();
        let avgX = 0;
        for (let i = 0; i < values.length; i += 3) {
          avgX += values[i];
        }
        avgX /= (values.length / 3);

        for (let i = 0; i < values.length; i += 3) {
          values[i] = avgX + (values[i] - avgX) * 0.2;
        }
        return new THREE.VectorKeyframeTrack(track.name, track.times, values);
      }

      // 3. Afastar e alinhar braços para postura mais imponente
      if (track.name === 'mixamorig:LeftArm.rotation' || track.name === 'mixamorig:RightArm.rotation') {
        const values = track.values.slice();
        for (let i = 0; i < values.length; i += 4) {
          values[i + 1] *= 0.6;
          const len = Math.hypot(values[i], values[i + 1], values[i + 2], values[i + 3]);
          if (len > 0.0001) {
            values[i] /= len;
            values[i + 1] /= len;
            values[i + 2] /= len;
            values[i + 3] /= len;
          }
        }
        return new THREE.QuaternionKeyframeTrack(track.name, track.times, values);
      }

      return track;
    });

    return new THREE.AnimationClip(clip.name, clip.duration, modifiedTracks);
  }

  setupEventListeners() {
    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (this.keys[key] !== undefined) {
        this.keys[key] = true;
      }
      if (e.key === 'Shift') {
        this.keys.shift = true;
      }
      if (key === 'e') {
        this.interactWithCurrentDoor();
      }
      if (key === 'v') {
        // Alternar entre Primeira e Terceira pessoa
        this.togglePerspective();
      }
      if (key === 'f') {
        // Abrir ou fechar o menu rapido do corredor com a tecla F
        if (this.onToggleMenu) {
          this.onToggleMenu();
        }
      }
      if (key === 'c' || key === 'g') {
        // Abrir ou fechar as Configuracoes diretamente pelo teclado (Tecla C ou G)
        if (this.onOpenSettings) {
          this.onOpenSettings();
        }
      }
      if (e.code === 'Space' || e.key === ' ') {
        this.keys.space = true;
        // Pulo do personagem
        this.triggerJump();
        e.preventDefault();
      }
    };

    this.onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (this.keys[key] !== undefined) {
        this.keys[key] = false;
      }
      if (e.key === 'Shift') {
        this.keys.shift = false;
      }
      if (e.code === 'Space' || e.key === ' ') {
        this.keys.space = false;
        e.preventDefault();
      }
    };

    // Controle da Câmera com Mouse (arrastar ou Pointer Lock)
    this.onMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) {
        this.cameraAngles.isMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Ao clicar no canvas, solicitar PointerLock para experiência suave estilo RPG
        if (this.renderer && this.renderer.domElement && document.pointerLockElement !== this.renderer.domElement) {
          this.renderer.domElement.requestPointerLock?.();
        }
      }
    };

    this.onMouseUp = (e) => {
      this.cameraAngles.isMouseDown = false;
    };

    this.onMouseMove = (e) => {
      let movementX = 0;
      let movementY = 0;

      if (document.pointerLockElement === this.renderer?.domElement) {
        movementX = e.movementX || 0;
        movementY = e.movementY || 0;
      } else if (this.cameraAngles.isMouseDown) {
        movementX = e.clientX - (this.lastMouseX || e.clientX);
        movementY = e.clientY - (this.lastMouseY || e.clientY);
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }

      if (movementX !== 0 || movementY !== 0) {
        const sens = this.cameraAngles.sensitivity;
        this.cameraAngles.targetYaw -= movementX * sens;
        this.cameraAngles.targetPitch += movementY * sens;

        // Limites de inclinação vertical (pitch) para não virar a câmera de cabeça para baixo
        const minPitch = -0.15; // Olhar um pouco de baixo para cima
        const maxPitch = 0.85;  // Olhar de cima para baixo
        this.cameraAngles.targetPitch = Math.max(minPitch, Math.min(maxPitch, this.cameraAngles.targetPitch));
      }
    };

    // Zoom da câmera com a rodinha do mouse (scroll para frente aproxima até primeira pessoa!)
    this.onWheel = (e) => {
      this.cameraAngles.targetDistance += e.deltaY * 0.0035;
      // Distância vai de 0.0 (Primeira Pessoa) até 7.5 (Visão ampla distante)
      this.cameraAngles.targetDistance = Math.max(0.0, Math.min(7.5, this.cameraAngles.targetDistance));

      // Se a distância for menor que 0.45, entra automaticamente em Primeira Pessoa
      this.cameraAngles.isFirstPerson = this.cameraAngles.targetDistance < 0.45;
      e.preventDefault();
    };

    this.onResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });

    // Suporte a toque (Touch) no canvas para girar a câmera em dispositivos móveis
    this.onTouchStart = (e) => {
      if (this.cameraTouchId !== null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.cameraTouchId = t.identifier;
        this.lastTouchX = t.clientX;
        this.lastTouchY = t.clientY;
        break;
      }
    };

    this.onTouchMove = (e) => {
      if (this.cameraTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.cameraTouchId) {
          const dx = t.clientX - this.lastTouchX;
          const dy = t.clientY - this.lastTouchY;
          this.lastTouchX = t.clientX;
          this.lastTouchY = t.clientY;

          const sens = this.cameraAngles.sensitivity * 1.6;
          this.cameraAngles.targetYaw -= dx * sens;
          this.cameraAngles.targetPitch += dy * sens;

          const minPitch = -0.15;
          const maxPitch = 0.85;
          this.cameraAngles.targetPitch = Math.max(minPitch, Math.min(maxPitch, this.cameraAngles.targetPitch));
          break;
        }
      }
    };

    this.onTouchEnd = (e) => {
      if (this.cameraTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
          break;
        }
      }
    };

    canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  }

  // Alterna manualmente o modo de perspectiva com a tecla V
  togglePerspective() {
    this.cameraAngles.isFirstPerson = !this.cameraAngles.isFirstPerson;
    if (this.cameraAngles.isFirstPerson) {
      this.cameraAngles.targetDistance = 0.0;
    } else {
      this.cameraAngles.targetDistance = 3.6;
    }
  }

  // Executa o pulo com impulso vertical e som/física
  triggerJump() {
    if (this.player.isGrounded) {
      this.player.isGrounded = false;
      this.player.jumpVelocityY = this.player.jumpStrength;
    }
  }

  // Alterna suavemente entre Idle, Walk e Run com crossfade
  fadeToAction(name, duration = 0.25) {
    if (this.currentActionName === name) return;

    const previousAction = this.actions[this.currentActionName];
    const activeAction = this.actions[name];

    if (activeAction) {
      activeAction.reset();
      activeAction.setEffectiveTimeScale(1);
      activeAction.setEffectiveWeight(1);
      activeAction.play();

      if (previousAction) {
        previousAction.crossFadeTo(activeAction, duration, true);
      }
      this.currentActionName = name;
    }
  }

  // Lê entrada do Gamepad (controle de videogame como Xbox / PlayStation)
  getGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        const deadzone = 0.18;
        let x = gp.axes[0] || 0;
        let y = gp.axes[1] || 0;

        if (Math.abs(x) < deadzone) x = 0;
        if (Math.abs(y) < deadzone) y = 0;

        // Botão de corrida (ex: A, R1, RT)
        const runBtn = gp.buttons[0]?.pressed || gp.buttons[5]?.pressed || gp.buttons[7]?.pressed;

        return { x, y, run: !!runBtn };
      }
    }
    return null;
  }

  updatePlayer(delta) {
    if (!this.model) return;

    // 1. Suavizar rotação e inclinação da câmera guiada pelo Mouse
    const camLerp = Math.min(1, 14 * delta);
    this.cameraAngles.yaw += (this.cameraAngles.targetYaw - this.cameraAngles.yaw) * camLerp;
    this.cameraAngles.pitch += (this.cameraAngles.targetPitch - this.cameraAngles.pitch) * camLerp;

    // 2. Altura do chão adaptada para escadaria e porão
    let targetFloorY = 0;
    const px = this.player.position.x;
    if (px <= -10.5) {
      targetFloorY = -3.8;
    } else if (px < -3.8) {
      const t = (px - (-3.8)) / (-6.7);
      targetFloorY = THREE.MathUtils.lerp(0, -3.8, Math.max(0, Math.min(1, t)));
    } else {
      targetFloorY = 0;
    }

    if (this.player.isGrounded) {
      this.player.position.y += (targetFloorY - this.player.position.y) * Math.min(1, 24 * delta);
    } else {
      this.player.jumpVelocityY += this.player.gravity * delta;
      this.player.position.y += this.player.jumpVelocityY * delta;
      if (this.player.position.y <= targetFloorY) {
        this.player.position.y = targetFloorY;
        this.player.jumpVelocityY = 0;
        this.player.isGrounded = true;
      }
    }

    let inputX = 0;
    let inputZ = 0;

    // 3. Teclas WASD e Setas
    if (this.keys.w || this.keys.arrowup) inputZ -= 1;
    if (this.keys.s || this.keys.arrowdown) inputZ += 1;
    if (this.keys.a || this.keys.arrowleft) inputX -= 1;
    if (this.keys.d || this.keys.arrowright) inputX += 1;

    let isRunning = this.keys.shift;

    // 4. Entrada do controle Gamepad ou Joystick Virtual Mobile
    const gp = this.getGamepadInput();
    if (gp) {
      if (gp.x !== 0 || gp.y !== 0) {
        inputX = gp.x;
        inputZ = gp.y;
      }
      if (gp.run) isRunning = true;
    }

    if (this.touchJoystick && (this.touchJoystick.x !== 0 || this.touchJoystick.y !== 0)) {
      inputX = this.touchJoystick.x;
      inputZ = this.touchJoystick.y;
      if (this.touchJoystick.run) isRunning = true;
    }

    const inputLength = Math.hypot(inputX, inputZ);
    const isMoving = inputLength > 0.08;

    if (isMoving) {
      // Normalizar input
      const normInputX = inputX / (inputLength > 1 ? inputLength : 1);
      const normInputZ = inputZ / (inputLength > 1 ? inputLength : 1);

      // Direção frontal e lateral em relação à orientação da câmera (PRESERVAR CONTROLES)
      // (W vai em frente na direção que a câmera olha; S para trás; D para a direita; A para a esquerda)
      const forwardX = Math.sin(this.cameraAngles.yaw);
      const forwardZ = Math.cos(this.cameraAngles.yaw);
      const rightX = -Math.cos(this.cameraAngles.yaw);
      const rightZ = Math.sin(this.cameraAngles.yaw);

      // normInputZ: -1 para W (frente), +1 para S (trás)
      // normInputX: +1 para D (direita), -1 para A (esquerda)
      const moveX = -normInputZ * forwardX + normInputX * rightX;
      const moveZ = -normInputZ * forwardZ + normInputX * rightZ;

      // Velocidade atual
      const currentSpeed = this.player.speed * (isRunning ? this.player.runMultiplier : 1.0);

      this.player.position.x += moveX * currentSpeed * delta;
      this.player.position.z += moveZ * currentSpeed * delta;

      // Limites e colisão adaptados para o Corredor e para a Sala do Porão (Fase 1)
      const curX = this.player.position.x;
      const curZ = this.player.position.z;

      if (curX >= -3.8) {
        // No corredor principal
        const isDoorOpen = this.isBasementDoorOpen || this.doors.some(d => d.id === 'door_basement' && d.isOpen);
        const minX = (isDoorOpen && curZ >= -5.2 && curZ <= -2.8) ? -11.0 : -3.1;
        const maxX = 3.1;
        const minZ = -33.5;
        const maxZ = 24.0;
        this.player.position.x = Math.max(minX, Math.min(maxX, this.player.position.x));
        this.player.position.z = Math.max(minZ, Math.min(maxZ, this.player.position.z));
      } else if (curX > -10.5) {
        // Descendo ou subindo a escadaria de pedra
        this.player.position.z = Math.max(-4.95, Math.min(-3.05, this.player.position.z));
        this.player.position.x = Math.max(-27.0, Math.min(3.1, this.player.position.x));
      } else {
        // Dentro da Sala da Diretoria no Porão
        const isVao = (curZ >= -5.2 && curZ <= -2.8);
        const maxX = isVao ? -3.8 : -10.8;
        this.player.position.x = Math.max(-27.2, Math.min(maxX, this.player.position.x));
        this.player.position.z = Math.max(-13.2, Math.min(5.2, this.player.position.z));

        // Colisão com a grande mesa da diretoria (-18.5, -4.0)
        if (this.player.position.x > -19.9 && this.player.position.x < -17.1 &&
            this.player.position.z > -6.0 && this.player.position.z < -2.0) {
          const dLeft = Math.abs(this.player.position.x - (-17.1));
          const dRight = Math.abs(this.player.position.x - (-19.9));
          const dTop = Math.abs(this.player.position.z - (-2.0));
          const dBottom = Math.abs(this.player.position.z - (-6.0));
          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) this.player.position.x = -17.0;
          else if (minD === dRight) this.player.position.x = -20.0;
          else if (minD === dTop) this.player.position.z = -1.9;
          else this.player.position.z = -6.1;
        }
      }

      // Rotação suave do personagem para encarar o sentido de movimento
      const targetAngle = Math.atan2(moveX, moveZ);
      let angleDiff = targetAngle - this.player.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.player.rotationY += angleDiff * Math.min(1, 14 * delta);

      // Transição de animação
      if (this.player.isGrounded) {
        if (isRunning && this.actions['run']) {
          this.fadeToAction('run', 0.2);
        } else if (this.actions['walk']) {
          this.fadeToAction('walk', 0.2);
        }
      }

      // Atualizar proximidade com as 3 portas amadeiradas
      this.checkDoorsProximity();

      // Notificar portal ao fundo do corredor alcançado
      if (this.player.position.z <= -32.5) {
        const prompt = document.getElementById('corridor-interact-prompt');
        if (prompt) prompt.classList.add('visible');
      } else {
        const prompt = document.getElementById('corridor-interact-prompt');
        if (prompt) prompt.classList.remove('visible');
      }
    } else {
      // Parado: Retorna para Idle
      if (this.player.isGrounded && this.actions['idle']) {
        this.fadeToAction('idle', 0.25);
      }
      const prompt = document.getElementById('corridor-interact-prompt');
      if (prompt && this.player.position.z > -32.5) {
        prompt.classList.remove('visible');
      }
    }

    // Atualizar posição do modelo 3D
    this.model.position.copy(this.player.position);
    this.model.rotation.y = this.player.rotationY;

    // Suavizar distância da câmera (para zoom suave)
    this.cameraAngles.distance += (this.cameraAngles.targetDistance - this.cameraAngles.distance) * 10.0 * delta;

    // Ocultar modelo do personagem no modo de primeira pessoa para não obstruir a visão
    const isFirstPerson = this.cameraAngles.isFirstPerson || this.cameraAngles.distance < 0.35;
    this.model.visible = !isFirstPerson;

    // 5. Câmera: Primeira Pessoa vs Terceira Pessoa Orbital
    if (isFirstPerson) {
      // Olhos do personagem: altura 1.62m
      const eyeHeight = 1.62;
      this.camera.position.set(
        this.player.position.x,
        this.player.position.y + eyeHeight,
        this.player.position.z
      );

      // Direção do olhar baseada no yaw e pitch do mouse (alinhada com o sentido frontal forwardX/forwardZ)
      const yaw = this.cameraAngles.yaw;
      const pitch = this.cameraAngles.pitch;
      const lookDist = 10.0;
      const lookAtTarget = new THREE.Vector3(
        this.camera.position.x + Math.sin(yaw) * Math.cos(pitch) * lookDist,
        this.camera.position.y - Math.sin(pitch) * lookDist,
        this.camera.position.z + Math.cos(yaw) * Math.cos(pitch) * lookDist
      );

      this.camera.lookAt(lookAtTarget);

      // No modo primeira pessoa, o personagem vira junto com o mouse ao se mover
      if (isMoving) {
        this.player.rotationY = this.cameraAngles.yaw;
      }
    } else {
      // Terceira Pessoa Orbital fluida ao redor de Elias Crowe
      const lookTargetY = this.player.position.y + 1.55;
      const dist = Math.max(this.cameraAngles.distance, 0.4);
      const yaw = this.cameraAngles.yaw;
      const pitch = this.cameraAngles.pitch;

      // Posição esférica da câmera
      const camOffsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
      const camOffsetY = Math.sin(pitch) * dist + 0.85;
      const camOffsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;

      const targetCamX = this.player.position.x - camOffsetX;
      const targetCamY = this.player.position.y + camOffsetY;
      const targetCamZ = this.player.position.z - camOffsetZ;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 14.0 * delta;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 14.0 * delta;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 14.0 * delta;

      this.camera.lookAt(
        this.player.position.x,
        lookTargetY,
        this.player.position.z
      );
    }
  }

  animate() {
    if (this.isDisposed) return;

    this.animationId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Efeito pulsante das chamas das tochas
    if (this.torches) {
      const time = this.clock.getElapsedTime();
      this.torches.forEach((t) => {
        const flicker = Math.sin(time * 8 + t.offset) * 0.45 + Math.cos(time * 14 + t.offset) * 0.2;
        t.light.intensity = t.baseIntensity + flicker;
      });
    }

    // Atualizar animação esquelética
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Atualizar locomoção do jogador e física
    this.updatePlayer(delta);

    // Animação cinemática/procedural do braço para abrir a porta ao interagir
    if (this.player.isReachingDoor && this.bones.rightArm) {
      this.player.doorReachTimer -= delta * 2.2;
      const progress = Math.max(0, this.player.doorReachTimer);
      // Arco suave de levantar o braço, alcançar a maçaneta e recolher
      const reachFactor = Math.sin((1.0 - progress) * Math.PI);

      if (this.bones.rightArm) {
        // Eleva o braço para frente em direção à maçaneta
        this.bones.rightArm.rotation.x += reachFactor * 1.35;
        this.bones.rightArm.rotation.z -= reachFactor * 0.45;
      }
      if (this.bones.rightForeArm) {
        // Flexiona o antebraço naturalmente
        this.bones.rightForeArm.rotation.x += reachFactor * 0.65;
      }
      if (this.bones.rightHand) {
        // Gira o punho para girar o trinco
        this.bones.rightHand.rotation.y += reachFactor * 0.55;
      }

      if (this.player.doorReachTimer <= 0) {
        this.player.isReachingDoor = false;
      }
    }

    // Renderizar cena
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
      this.renderer.domElement.removeEventListener('wheel', this.onWheel);
      this.renderer.domElement.removeEventListener('touchstart', this.onTouchStart);
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}

