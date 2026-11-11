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
    this.doors = [];
    this.activeNearDoor = null;

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

    // 8. CRIAÇÃO DAS 3 PORTAS AMADEIRADAS GÓTICAS
    // Porta 1: Parede Direita (z = 8) -> Arquivo Secreto (Trancada)
    // Porta 2: Parede Esquerda (z = -4) -> Porão Antigo / Catacumbas (ABRE - Investigação)
    // Porta 3: Parede Direita (z = -16) -> Câmara de Observação Estelar (Trancada)
    this.createGothicDoors(woodDoorTex);

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

      // Arco gótico superior sobre a porta
      const archTopGeo = new THREE.CylinderGeometry(frameW / 2 - 0.09, frameW / 2 - 0.09, frameD, 12, 1, false, 0, Math.PI);
      const archTop = new THREE.Mesh(archTopGeo, frameMat);
      archTop.position.set(0, frameH - 0.1, 0);
      archTop.rotation.x = Math.PI / 2;
      doorGroup.add(archTop);

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

    // 2. Física de Pulo e Gravidade
    if (!this.player.isGrounded) {
      this.player.jumpVelocityY += this.player.gravity * delta;
      this.player.position.y += this.player.jumpVelocityY * delta;

      // Pouso no chão
      if (this.player.position.y <= 0) {
        this.player.position.y = 0;
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

      // Limites das paredes do corredor (Colisão com as paredes góticas)
      const minX = -3.1;
      const maxX = 3.1;
      const minZ = -33.5;
      const maxZ = 24.0;

      this.player.position.x = Math.max(minX, Math.min(maxX, this.player.position.x));
      this.player.position.z = Math.max(minZ, Math.min(maxZ, this.player.position.z));

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

