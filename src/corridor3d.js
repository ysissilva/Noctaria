import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
      speed: 4.8,
      runMultiplier: 1.8,
      isRunning: false,
      // Sistema de Pulo e Gravidade
      isGrounded: true,
      jumpVelocityY: 0,
      jumpStrength: 6.2,
      gravity: -18.0
    };

    // Controle de Câmera com Mouse (Terceira pessoa estilo RPG / TPS)
    this.cameraAngles = {
      yaw: Math.PI,           // Rotação horizontal ao redor do jogador
      pitch: 0.28,           // Rotação vertical (altura do olhar)
      distance: 4.8,          // Distância da câmera
      targetYaw: Math.PI,
      targetPitch: 0.28,
      sensitivity: 0.0024,
      isPointerLocked: false,
      isMouseDown: false
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

    this.isDisposed = false;
    this.animationId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Cena com névoa e atmosfera gótica
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050711);
    this.scene.fog = new THREE.FogExp2(0x080c1d, 0.035);

    // 2. Câmera terceira pessoa
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 23);

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
    // 1. Luz ambiente reforçada para perfeita visibilidade do cenário e dos livros
    const ambientLight = new THREE.AmbientLight(0x283858, 2.4);
    this.scene.add(ambientLight);

    // 2. Luz de névoa e luar etéreo azul-turquesa ao centro do teto/abóbada
    const moonLight = new THREE.DirectionalLight(0x5ca5f0, 2.2);
    moonLight.position.set(0, 16, 5);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    this.scene.add(moonLight);

    // 3. Focos de luz mística azulada no piso e ar (como o nevoeiro luminoso da imagem)
    const mistPoint1 = new THREE.PointLight(0x3aa7f5, 4.5, 22, 1.8);
    mistPoint1.position.set(0, 3.2, -6);
    this.scene.add(mistPoint1);

    const mistPoint2 = new THREE.PointLight(0x4dc5ff, 4.0, 18, 1.8);
    mistPoint2.position.set(0, 2.8, -20);
    this.scene.add(mistPoint2);

    // 4. Arandelas e candelabros com velas/chamas douradas quentes fixadas nas pilastras
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
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f1710, metalness: 0.85, roughness: 0.3 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffbb44 });

    sconcePositions.forEach((pos, idx) => {
      // Luz pontual dourada quente
      const light = new THREE.PointLight(0xffb544, 3.6, 9.5, 1.9);
      const posX = pos.side === 'left' ? pos.x + 0.35 : pos.x - 0.35;
      light.position.set(posX, 2.8, pos.z);
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

    // 5. Teto com Arcos Góticos Abobadados com Nervuras Cruzadas
    const ceilingGeo = new THREE.CylinderGeometry(corridorWidth / 2, corridorWidth / 2, corridorLength, 20, 1, false, Math.PI, Math.PI);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x181f30,
      side: THREE.BackSide,
      roughness: 0.85
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight - 0.8, -5);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Nervuras dos arcos transversais ao longo do teto gótico
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x101524, roughness: 0.7 });
    for (let z = 22; z >= -32; z -= 6) {
      const archRibGeo = new THREE.TorusGeometry(corridorWidth / 2 - 0.05, 0.14, 8, 24, Math.PI);
      const archRib = new THREE.Mesh(archRibGeo, ribMat);
      archRib.position.set(0, corridorHeight - 0.8, z);
      this.scene.add(archRib);
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

    // 7. Névoa mística azulada etérea no centro (efeito vaporoso idêntico à foto)
    const mistGeo = new THREE.CylinderGeometry(1.6, 2.2, 5.0, 16, 1, true);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x3da3f2,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const mistColumn = new THREE.Mesh(mistGeo, mistMat);
    mistColumn.position.set(0, 3.2, -14);
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

    if (this.activeNearDoor.isOpenable) {
      this.activeNearDoor.isOpen = !this.activeNearDoor.isOpen;
      // Girar porta abrindo para dentro
      this.activeNearDoor.targetAngle = this.activeNearDoor.isOpen ? Math.PI * 0.55 : 0;
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

        // Transformar o boneco manequim robótico em Elias Crowe (humano, roupa nobre gótica vitoriana)
        this.customizeEliasCrowe(this.model, gltf);

        this.scene.add(this.model);

        // Configurar AnimationMixer e clipes
        this.mixer = new THREE.AnimationMixer(this.model);
        gltf.animations.forEach((clip) => {
          // Ajustar marcha e corrida para postura masculina e firme
          const adjustedClip = this.adjustAnimationForMasculineWalk(clip);
          const action = this.mixer.clipAction(adjustedClip);
          this.actions[clip.name] = action;
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
        console.error('Erro ao carregar modelo 3D:', error);
        const loadIndicator = document.getElementById('corridor-3d-loading');
        if (loadIndicator) loadIndicator.textContent = 'Erro ao carregar modelo 3D.';
      }
    );
  }

  // Personaliza o corpo, veste sobrecasaca gótica bordada, preenche as juntas mecânicas e adiciona cabelos de Elias Crowe
  customizeEliasCrowe(model, gltf) {
    let surfaceMesh = null;
    let jointsMesh = null;
    let headBone = null;
    let spine2Bone = null;
    let neckBone = null;

    model.traverse((child) => {
      if (child.isBone) {
        if (child.name === 'mixamorig:Head') headBone = child;
        if (child.name === 'mixamorig:Spine2') spine2Bone = child;
        if (child.name === 'mixamorig:Neck') neckBone = child;
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name === 'Beta_Surface') surfaceMesh = child;
        if (child.name === 'Beta_Joints') jointsMesh = child;
      }
    });

    // Paleta de roupas nobres e tom de pele de Elias Crowe
    const colSkin = new THREE.Color(0xf2cfb2);       // Tom de pele humano claro e visível
    const colFaceShadow = new THREE.Color(0xd9b396); // Sombreamento facial
    const colEyes = new THREE.Color(0x111622);       // Olhar escuro e sobrancelhas marcadas
    const colLips = new THREE.Color(0xc98f82);       // Lábios naturais
    const colCoat = new THREE.Color(0x1c253d);       // Sobrecasaca azul-noite escura nobre
    const colVest = new THREE.Color(0x28334f);       // Colete gótico bordado
    const colSilver = new THREE.Color(0xdfe7f2);     // Bordados e ornamentos de prata
    const colPants = new THREE.Color(0x181a24);      // Calça escura de alfaiataria
    const colBoots = new THREE.Color(0x121013);      // Botas pretas de montaria
    const colGlove = new THREE.Color(0x242022);      // Luvas de couro
    const colShirt = new THREE.Color(0x3a3845);      // Lenço/jabot vitoriano no pescoço

    // 1. REVESTIR AS JUNTAS/DOBRADIÇAS PARA PARECEREM TECIDO E CORPO HUMANO (Em vez de ocultá-las, o que criava buracos no modelo)
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
      jointsMesh.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.1
      });
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

        // Cabeça e Face de Elias Crowe
        if (domJoint === 5 || (y > 1.48 && Math.abs(x) < 0.12 && z > -0.1)) {
          // Olhar penetrante / Sobrancelhas de Elias
          if (z > 0.095 && y >= 1.635 && y <= 1.685 && Math.abs(x) >= 0.018 && Math.abs(x) <= 0.058) {
            c = colEyes;
          }
          // Lábios naturais masculinos
          else if (z > 0.11 && y >= 1.585 && y <= 1.615 && Math.abs(x) <= 0.025) {
            c = colLips;
          }
          // Sombra da mandíbula / contorno facial
          else if (z > 0.05 && y >= 1.54 && y <= 1.62 && Math.abs(x) >= 0.055) {
            c = colFaceShadow;
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
      surfaceMesh.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.65,
        metalness: 0.15
      });
    }

    // 3. CABELO PRETO ONDULADO/REBELDE DE ELIAS CROWE
    // Como os ossos da armadura têm escala 0.01, anexamos os cabelos e ornamentos diretamente ao grupo do modelo
    // e atualizamos suas posições na renderização para seguir suavemente o personagem
    this.eliasAttachments = {
      hairGroup: null,
      coatGroup: null,
      headBone: headBone,
      spine2Bone: spine2Bone
    };

    const hairGroup = new THREE.Group();
    hairGroup.name = 'Elias_Hair';

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x07080c,
      roughness: 0.5,
      metalness: 0.2
    });

    // Volume do cabelo cobrindo a nuca e topo da cabeça
    const hairBaseGeo = new THREE.SphereGeometry(0.12, 16, 16);
    hairBaseGeo.scale(0.96, 1.12, 1.15);
    const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
    hairBase.position.set(0, 0.05, -0.015);
    hairGroup.add(hairBase);

    // Mechas frontais rebeldes onduladas na testa e laterais
    const bangsGeo = new THREE.ConeGeometry(0.028, 0.095, 6);
    bangsGeo.rotateX(-Math.PI / 3);

    const bangPositions = [
      { x: -0.045, y: 0.08, z: 0.08, rx: 0.4, ry: -0.3, rz: -0.35, s: 1.1 },
      { x: -0.015, y: 0.085, z: 0.088, rx: 0.5, ry: -0.1, rz: -0.1, s: 1.2 },
      { x: 0.02, y: 0.083, z: 0.086, rx: 0.48, ry: 0.2, rz: 0.15, s: 1.15 },
      { x: 0.05, y: 0.075, z: 0.075, rx: 0.35, ry: 0.4, rz: 0.45, s: 1.0 },
      { x: -0.082, y: 0.02, z: 0.04, rx: 0.2, ry: -0.5, rz: -0.25, s: 1.25 },
      { x: 0.082, y: 0.02, z: 0.04, rx: 0.2, ry: 0.5, rz: 0.25, s: 1.25 },
      { x: 0, y: -0.01, z: -0.085, rx: -0.4, ry: 0, rz: 0, s: 1.35 }
    ];

    bangPositions.forEach((bp) => {
      const bang = new THREE.Mesh(bangsGeo, hairMat);
      bang.position.set(bp.x, bp.y, bp.z);
      bang.rotation.set(bp.rx, bp.ry, bp.rz);
      bang.scale.set(bp.s, bp.s, bp.s);
      hairGroup.add(bang);
    });

    this.scene.add(hairGroup);
    this.eliasAttachments.hairGroup = hairGroup;

    // 4. COLARINHO ALTO VITORIANO E PINGENTE DA LUA CRESCENTE
    const coatGroup = new THREE.Group();
    coatGroup.name = 'Elias_CoatDetails';

    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x0f1424,
      roughness: 0.6,
      metalness: 0.2
    });
    const collarGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.11, 14, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, 0.03, -0.01);
    collarMesh.rotation.x = 0.1;
    coatGroup.add(collarMesh);

    // Pingente da Lua Crescente
    const chainMat = new THREE.MeshStandardMaterial({
      color: 0xddeeff,
      metalness: 0.9,
      roughness: 0.2
    });
    const crescentGeo = new THREE.TorusGeometry(0.018, 0.004, 8, 16, Math.PI * 1.3);
    const crescent = new THREE.Mesh(crescentGeo, chainMat);
    crescent.position.set(0, -0.04, 0.10);
    crescent.rotation.z = Math.PI * 0.35;
    coatGroup.add(crescent);

    this.scene.add(coatGroup);
    this.eliasAttachments.coatGroup = coatGroup;
  }

  // Modifica os canais das animações para retirar o balanço feminino de quadris e conferir um andar masculino firme
  adjustAnimationForMasculineWalk(clip) {
    if (clip.name !== 'walk' && clip.name !== 'run') return clip;

    const modifiedTracks = clip.tracks.map((track) => {
      // 1. Reduzir a oscilação lateral da bacia/quadril (hip sway feminino em mixamorig:Hips)
      if (track.name === 'mixamorig:Hips.rotation') {
        const values = track.values.slice();
        // values são quatérnios [x, y, z, w]
        for (let i = 0; i < values.length; i += 4) {
          // Reduz a rotação no eixo Z (inclinação lateral feminina da pelve) em 75%
          values[i + 2] *= 0.25;
          // Reduz o rebolado / torção no eixo Y em 65%
          values[i + 1] *= 0.35;

          // Renormalizar quatérnio
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

      // 2. Reduzir o deslocamento lateral brusco dos quadris no eixo X
      if (track.name === 'mixamorig:Hips.translation') {
        const values = track.values.slice();
        // values são [x, y, z]
        let avgX = 0;
        for (let i = 0; i < values.length; i += 3) {
          avgX += values[i];
        }
        avgX /= (values.length / 3);

        for (let i = 0; i < values.length; i += 3) {
          // Amortece o desvio lateral
          values[i] = avgX + (values[i] - avgX) * 0.3;
        }
        return new THREE.VectorKeyframeTrack(track.name, track.times, values);
      }

      // 3. Ajustar balanço dos braços e pernas para postura mais aberta e ereta
      if (track.name === 'mixamorig:LeftArm.rotation' || track.name === 'mixamorig:RightArm.rotation') {
        const values = track.values.slice();
        for (let i = 0; i < values.length; i += 4) {
          // Reduz movimento fletido para dentro, deixando postura mais firme
          values[i + 1] *= 0.7;
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

    // Zoom da câmera com a rodinha do mouse
    this.onWheel = (e) => {
      this.cameraAngles.distance += e.deltaY * 0.003;
      this.cameraAngles.distance = Math.max(2.5, Math.min(8.0, this.cameraAngles.distance));
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

    // 4. Entrada do controle Gamepad
    const gp = this.getGamepadInput();
    if (gp) {
      if (gp.x !== 0 || gp.y !== 0) {
        inputX = gp.x;
        inputZ = gp.y;
      }
      if (gp.run) isRunning = true;
    }

    const inputLength = Math.hypot(inputX, inputZ);
    const isMoving = inputLength > 0.08;

    if (isMoving) {
      // Normalizar input
      const normInputX = inputX / (inputLength > 1 ? inputLength : 1);
      const normInputZ = inputZ / (inputLength > 1 ? inputLength : 1);

      // Direção frontal e lateral em relação à orientação da câmera
      // (W vai em frente na direção que a câmera olha; S para trás; D para a direita; A para a esquerda)
      const forwardX = Math.sin(this.cameraAngles.yaw);
      const forwardZ = Math.cos(this.cameraAngles.yaw);
      const rightX = Math.cos(this.cameraAngles.yaw);
      const rightZ = -Math.sin(this.cameraAngles.yaw);

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

    // 5. Câmera Orbital em Terceira Pessoa controlada pelo Mouse ao redor de Elias Crowe
    const lookTargetY = this.player.position.y + 1.65;
    const dist = this.cameraAngles.distance;
    const yaw = this.cameraAngles.yaw;
    const pitch = this.cameraAngles.pitch;

    // Posição esférica da câmera
    const camOffsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const camOffsetY = Math.sin(pitch) * dist + 1.2;
    const camOffsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;

    const targetCamX = this.player.position.x - camOffsetX;
    const targetCamY = this.player.position.y + camOffsetY;
    const targetCamZ = this.player.position.z - camOffsetZ;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 12.0 * delta;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 12.0 * delta;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 12.0 * delta;

    this.camera.lookAt(
      this.player.position.x,
      lookTargetY,
      this.player.position.z
    );
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

    // Atualizar acessórios de Elias Crowe (cabelos rebeldes, colarinho e corrente) para acompanhar a cabeça e coluna
    if (this.eliasAttachments && this.model) {
      const { hairGroup, coatGroup, headBone, spine2Bone } = this.eliasAttachments;
      if (headBone && hairGroup) {
        headBone.getWorldPosition(hairGroup.position);
        headBone.getWorldQuaternion(hairGroup.quaternion);
      }
      if (spine2Bone && coatGroup) {
        spine2Bone.getWorldPosition(coatGroup.position);
        spine2Bone.getWorldQuaternion(coatGroup.quaternion);
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

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
      this.renderer.domElement.removeEventListener('wheel', this.onWheel);
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}

