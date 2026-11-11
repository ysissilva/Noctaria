import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * World3DManager - Gerenciador da experiência 3D da Missão 1 (Salão das Cinzas)
 * Inclui:
 * - Personagem Iniciado 3D com Skeletal Animation & Additive Blending (idle, walk, run, interact/agree, headShake)
 * - Controles por teclado (WASD, Setas) com giro suave e colisão com paredes/limites
 * - Câmera em 3ª pessoa suave que acompanha o personagem
 * - Cenário gótico tridimensional: arquitetura em pedra, vitrais violetas, colunas góticas, archotes vivos
 * - Entidades interativas no mundo 3D (Elias Crowe, Diretora Morgana, Mural, Retrato, Livro, Portal)
 * - Indicadores visuais de proximidade no chão e HUD 3D discreto
 */
export class World3DManager {
  constructor(game, containerEl) {
    this.game = game;
    this.container = containerEl;
    this.isActive = false;

    // Three.js core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Character state
    this.character = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.currentBaseAction = 'idle';

    // Movement & physics
    this.position = new THREE.Vector3(0, 0, 8);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.speed = 4.2;
    this.turnSpeed = 10.0;
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Camera follow
    this.cameraOffset = new THREE.Vector3(0, 3.8, 5.8);
    this.cameraLookOffset = new THREE.Vector3(0, 1.4, 0);

    // Interactive points in 3D world (Salão das Cinzas)
    this.interactives = [];
    this.nearbyInteractive = null;

    // Torch lights for gothic atmosphere
    this.torches = [];

    // Bound listeners
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onResize = this.onResize.bind(this);
    this._animate = this.animate.bind(this);
    this.animFrameId = null;
  }

  init() {
    this.isActive = true;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050711);
    this.scene.fog = new THREE.FogExp2(0x080c1d, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    this.camera.position.set(0, 5, 14);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Create Gothic Environment
    this.buildGothicCathedral();

    // 5. Setup Interactives
    this.setupInteractives();

    // 6. Load 3D Character with Skeletal Animation
    this.loadCharacter();

    // 7. Event listeners
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('resize', this._onResize);

    // 8. Start loop
    this.clock.start();
    this.animate();
  }

  buildGothicCathedral() {
    // Ambient light - deep moonlight blue
    const ambientLight = new THREE.AmbientLight(0x2a3258, 1.2);
    this.scene.add(ambientLight);

    // Directional light representing moon streaming through high rose window
    const moonLight = new THREE.DirectionalLight(0xa58ae8, 2.2);
    moonLight.position.set(-8, 16, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 40;
    moonLight.shadow.camera.left = -16;
    moonLight.shadow.camera.right = 16;
    moonLight.shadow.camera.top = 16;
    moonLight.shadow.camera.bottom = -16;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Floor - Polished dark gothic marble flagstones
    const floorGeo = new THREE.PlaneGeometry(28, 36, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c1024,
      roughness: 0.28,
      metalness: 0.35
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Cathedral Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x161a30,
      roughness: 0.85,
      metalness: 0.1
    });

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 1), wallMat);
    northWall.position.set(0, 7, -18);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    // South Wall (Entrance)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 1), wallMat);
    southWall.position.set(0, 7, 18);
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 36), wallMat);
    westWall.position.set(-14, 7, 0);
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 36), wallMat);
    eastWall.position.set(14, 7, 0);
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);

    // Gothic Columns along both sides
    const columnGeo = new THREE.CylinderGeometry(0.55, 0.65, 14, 12);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x1d223c,
      roughness: 0.7,
      metalness: 0.2
    });

    const colPositions = [
      [-8, -12], [-8, -6], [-8, 0], [-8, 6], [-8, 12],
      [8, -12], [8, -6], [8, 0], [8, 6], [8, 12]
    ];

    colPositions.forEach(([x, z], i) => {
      const col = new THREE.Mesh(columnGeo, columnMat);
      col.position.set(x, 7, z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);

      // Gothic Column Capital / Arch base
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.6), columnMat);
      cap.position.set(x, 13.5, z);
      this.scene.add(cap);

      // Torches on specific pillars
      if (i % 2 === 0) {
        this.createTorch(x + (x > 0 ? -0.7 : 0.7), 3.2, z);
      }
    });

    // Large Stained Glass Rose Window on North Wall
    const windowFrameGeo = new THREE.RingGeometry(2.5, 3.6, 24);
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x242038,
      roughness: 0.5,
      metalness: 0.6
    });
    const roseFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    roseFrame.position.set(0, 9, -17.4);
    this.scene.add(roseFrame);

    const glassGeo = new THREE.CircleGeometry(2.5, 24);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x9a6aff,
      transparent: true,
      opacity: 0.78
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 9, -17.38);
    this.scene.add(glass);

    // Stained glass glow light
    const windowLight = new THREE.PointLight(0xa58ae8, 3.5, 18, 1.5);
    windowLight.position.set(0, 8.5, -15);
    this.scene.add(windowLight);

    // Cathedral Vaulted Arches
    for (let z = -12; z <= 12; z += 6) {
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-8, 13.5, z),
        new THREE.Vector3(0, 16.5, z),
        new THREE.Vector3(8, 13.5, z)
      ]);
      const archGeo = new THREE.TubeGeometry(archCurve, 20, 0.28, 8, false);
      const archMesh = new THREE.Mesh(archGeo, columnMat);
      this.scene.add(archMesh);
    }
  }

  createTorch(x, y, z) {
    // Torch bracket
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x33281e, roughness: 0.9, metalness: 0.8 });
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 8), bracketMat);
    bracket.position.set(x, y, z);
    bracket.rotation.z = x > 0 ? 0.35 : -0.35;
    this.scene.add(bracket);

    // Violet Flame Light
    const torchLight = new THREE.PointLight(0xa58ae8, 1.8, 7.5, 2);
    torchLight.position.set(x, y + 0.45, z);
    torchLight.castShadow = false;
    this.scene.add(torchLight);

    // Glowing flame sphere
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xc8a2ff });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), flameMat);
    flame.position.set(x, y + 0.45, z);
    this.scene.add(flame);

    this.torches.push({ light: torchLight, baseIntensity: 1.8 });
  }

  setupInteractives() {
    // 1. Elias Crowe (near pillar left)
    this.createNpcEntity('elias', 'Elias Crowe', -4.5, 0, 4.0, 0x4ef0c4, () => {
      this.game.startDialogue('elias_phase1', 'start');
    });

    // 2. Diretora Morgana Vale (near high altar north)
    this.createNpcEntity('morgana', 'Diretora Morgana Vale', 0, 0, -11.0, 0xf72585, () => {
      this.game.startDialogue('morgana_phase1', 'start');
    });

    // 3. Mural de Avisos Estudantis (West Wall)
    this.createObjectEntity('noticeBoard', 'Mural de Avisos Estudantis', -13.0, 2.2, -2.0, 0xa58ae8, () => {
      this.triggerInteractionAnimation();
      this.game.examineNoticeBoard();
    });

    // 4. Retrato Adulterado (West Wall near entrance)
    this.createObjectEntity('erasedPortrait', 'Retrato Adulterado (S.A.)', -13.0, 2.4, 7.0, 0x5376c8, () => {
      this.triggerInteractionAnimation();
      this.game.examineErasedPortrait();
    });

    // 5. Livro de Matrículas Oficial (East Desk)
    this.createObjectEntity('alteredLedger', 'Livro de Matrículas Oficial', 12.0, 1.2, 5.0, 0xdfb045, () => {
      this.triggerInteractionAnimation();
      this.game.examineAlteredLedger();
    });

    // 6. Portal para a Biblioteca Velada (East Wall Door)
    this.createDoorEntity('libraryDoor', 'Entrada da Biblioteca Velada', 13.0, 0, -6.0, () => {
      if (this.game.flags.phase1Completed) {
        this.game.changeChapter('phase_2');
      } else {
        this.game.showNotification('🔒 A porta para a Biblioteca Velada requer descobrir a aluna apagada com Elias!', 'info');
      }
    });
  }

  createNpcEntity(id, name, x, y, z, colorHex, onInteract) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Gothic Cloaked Character Figure
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x101426,
      roughness: 0.6,
      metalness: 0.3
    });

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.58, 1.75, 12), robeMat);
    body.position.y = 0.88;
    body.castShadow = true;
    group.add(body);

    // Head / Hood
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0a0d1a, roughness: 0.8 });
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), hoodMat);
    hood.position.y = 1.82;
    hood.castShadow = true;
    group.add(hood);

    // Arcane aura ring on floor
    const auraMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const aura = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 24), auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.03;
    group.add(aura);

    // Floating rune beacon above head
    const beaconMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), beaconMat);
    beacon.position.y = 2.45;
    group.add(beacon);

    this.scene.add(group);

    this.interactives.push({
      id,
      name,
      position: new THREE.Vector3(x, y, z),
      radius: 2.8,
      beacon,
      onInteract
    });
  }

  createObjectEntity(id, name, x, y, z, colorHex, onInteract) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Pedestal or Frame
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x221815, roughness: 0.8, metalness: 0.2 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 2.8), woodMat);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Parchment / Canvas
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xdbc498, roughness: 0.9 });
    const canvasMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.6, 2.4), canvasMat);
    group.add(canvasMesh);

    // Floating interaction indicator
    const beaconMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const beacon = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), beaconMat);
    beacon.position.set(x > 0 ? -0.8 : 0.8, 0, 0);
    group.add(beacon);

    this.scene.add(group);

    this.interactives.push({
      id,
      name,
      position: new THREE.Vector3(x, y, z),
      radius: 3.2,
      beacon,
      onInteract
    });
  }

  createDoorEntity(id, name, x, y, z, onInteract) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Grand Gothic Arch Doorway
    const archMat = new THREE.MeshStandardMaterial({ color: 0x14182e, roughness: 0.7, metalness: 0.4 });
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.0, 3.6), archMat);
    doorMesh.position.y = 3.0;
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    group.add(doorMesh);

    // Luminous runes along door
    const runesMat = new THREE.MeshBasicMaterial({ color: 0x4ef0c4, wireframe: true });
    const runesMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 5.2, 3.0), runesMat);
    runesMesh.position.y = 3.0;
    group.add(runesMesh);

    this.scene.add(group);

    this.interactives.push({
      id,
      name,
      position: new THREE.Vector3(x, y, z),
      radius: 3.5,
      beacon: runesMesh,
      onInteract
    });
  }

  loadCharacter() {
    const loader = new GLTFLoader();
    const modelUrl = '/assets/models/Xbot.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        this.character = gltf.scene;
        this.character.scale.set(1.15, 1.15, 1.15);
        this.character.position.copy(this.position);

        // Customize materials for Gothic Adept aesthetic (dark obsidian cloak & violet highlights)
        this.character.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.color = new THREE.Color(0x1a1e38);
              child.material.roughness = 0.4;
              child.material.metalness = 0.5;
            }
          }
        });

        this.scene.add(this.character);

        // Setup Skeletal Animation Mixer & Animation Blending
        this.mixer = new THREE.AnimationMixer(this.character);
        const animations = gltf.animations;

        animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          this.actions[clip.name] = action;

          if (clip.name === 'idle') {
            action.play();
            this.activeAction = action;
          } else if (clip.name === 'walk' || clip.name === 'run') {
            action.play();
            action.weight = 0;
          }
        });

        // Additive secondary clips (e.g. nodding 'agree' when interacting)
        if (this.actions['agree']) {
          this.actions['agree'].setLoop(THREE.LoopOnce);
          this.actions['agree'].clampWhenFinished = true;
        }

        console.log('3D Gothic Character loaded successfully with Skeletal Animation.');
      },
      undefined,
      (err) => {
        console.error('Error loading 3D character model:', err);
      }
    );
  }

  onKeyDown(e) {
    if (this.game.activeModal || this.game.activeDialogue) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'KeyE':
      case 'Space':
      case 'Enter':
        this.triggerInteraction();
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  }

  triggerInteraction() {
    if (this.nearbyInteractive && typeof this.nearbyInteractive.onInteract === 'function') {
      this.triggerInteractionAnimation();
      this.nearbyInteractive.onInteract();
    }
  }

  triggerInteractionAnimation() {
    if (this.actions['agree']) {
      this.actions['agree'].reset();
      this.actions['agree'].fadeIn(0.2);
      this.actions['agree'].play();
    }
  }

  updateMovement(delta) {
    // If dialogue or modal is open, force stop character movement
    if (this.game.activeModal || this.game.activeDialogue) {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
    }

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      // Calculate movement angle
      const angle = Math.atan2(moveX, moveZ);
      this.targetRotationY = angle;

      // Smooth rotation towards walking direction
      let diff = this.targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, this.turnSpeed * delta);

      // Move forward in current facing direction
      const step = this.speed * delta;
      const nextX = this.position.x + Math.sin(angle) * step;
      const nextZ = this.position.z + Math.cos(angle) * step;

      // Cathedral boundaries collision
      const minX = -12.5;
      const maxX = 12.5;
      const minZ = -16.5;
      const maxZ = 16.5;

      if (nextX >= minX && nextX <= maxX) {
        this.position.x = nextX;
      }
      if (nextZ >= minZ && nextZ <= maxZ) {
        this.position.z = nextZ;
      }

      // Smoothly blend animations to 'walk'
      this.fadeToAction('walk', 0.25);
    } else {
      // Blend back to 'idle'
      this.fadeToAction('idle', 0.35);
    }

    if (this.character) {
      this.character.position.copy(this.position);
      this.character.rotation.y = this.rotationY;
    }
  }

  fadeToAction(name, duration) {
    if (this.currentBaseAction === name) return;

    const prevAction = this.actions[this.currentBaseAction];
    const newAction = this.actions[name];

    if (prevAction && newAction) {
      this.currentBaseAction = name;
      newAction.reset();
      newAction.weight = 1.0;
      newAction.play();
      prevAction.crossFadeTo(newAction, duration, true);
    }
  }

  updateCamera() {
    if (!this.camera) return;

    // Camera smoothly follows behind player
    const desiredPos = this.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(desiredPos, 0.08);

    const lookTarget = this.position.clone().add(this.cameraLookOffset);
    this.camera.lookAt(lookTarget);
  }

  checkProximity() {
    let closest = null;
    let closestDist = Infinity;

    this.interactives.forEach((item) => {
      const dist = this.position.distanceTo(item.position);
      if (dist < item.radius && dist < closestDist) {
        closest = item;
        closestDist = dist;
      }

      // Rotate floating beacon
      if (item.beacon) {
        item.beacon.rotation.y += 0.025;
        item.beacon.rotation.x += 0.012;
      }
    });

    this.nearbyInteractive = closest;
    this.updateProximityPrompt(closest);
  }

  updateProximityPrompt(interactive) {
    let promptEl = document.getElementById('world3d-prompt');
    if (!promptEl) {
      promptEl = document.createElement('div');
      promptEl.id = 'world3d-prompt';
      promptEl.className = 'world3d-interaction-prompt';
      this.container.appendChild(promptEl);
    }

    if (interactive && !this.game.activeModal && !this.game.activeDialogue) {
      promptEl.innerHTML = `
        <div class="prompt-key">E</div>
        <div class="prompt-text">
          <span class="prompt-action">Interagir</span>
          <span class="prompt-target">${interactive.name}</span>
        </div>
      `;
      promptEl.style.display = 'flex';
      promptEl.classList.add('visible');
    } else {
      promptEl.style.display = 'none';
      promptEl.classList.remove('visible');
    }
  }

  animate() {
    if (!this.isActive) return;

    this.animFrameId = requestAnimationFrame(this._animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update animations mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Update movement and camera
    this.updateMovement(delta);
    this.updateCamera();

    // Check interaction proximity
    this.checkProximity();

    // Subtle torch light flickering
    const time = this.clock.getElapsedTime();
    this.torches.forEach((torch, i) => {
      torch.light.intensity = torch.baseIntensity + Math.sin(time * 8 + i * 2) * 0.25;
    });

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    this.isActive = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('resize', this._onResize);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

