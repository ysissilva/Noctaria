/**
 * Procedural SVG Backgrounds for all 10 Chapters & Locations of Noctária
 * Designed with authentic gothic atmosphere, dramatic lighting, and architectural details.
 */

// 1. Prologue: Courtyard / Portões da Noite
export function generateCourtyardSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="cy-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%2304060f"/>
        <stop offset="60%" stop-color="%230c142b"/>
        <stop offset="100%" stop-color="%23172445"/>
      </linearGradient>
      <radialGradient id="cy-moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23ffffff"/>
        <stop offset="40%" stop-color="%23d6e0ff" stop-opacity="0.9"/>
        <stop offset="70%" stop-color="%237650b8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="%2304060f" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="mist" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="%2310172f" stop-opacity="0.9"/>
        <stop offset="70%" stop-color="%235376c8" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23cy-sky)"/>
    <!-- Distant Gothic Spires -->
    <path d="M 100 700 L 180 280 L 260 700 Z M 350 720 L 480 180 L 610 720 Z M 1300 720 L 1440 220 L 1580 720 Z M 1650 700 L 1750 320 L 1850 700 Z" fill="%23080c1d" opacity="0.8"/>
    <!-- Moon -->
    <circle cx="1150" cy="220" r="140" fill="url(%23cy-moon)"/>
    <!-- Academy Façade Wall -->
    <rect x="0" y="620" width="1920" height="460" fill="%23090e21"/>
    <!-- Grand Wrought Iron Gates -->
    <g stroke="%231a2649" stroke-width="6" fill="none">
      <path d="M 640 1080 L 640 450 Q 960 300 1280 450 L 1280 1080" stroke="%23243b70" stroke-width="14"/>
      <!-- Spikes and Filigree -->
      <path d="M 720 1080 L 720 480 M 800 1080 L 800 440 M 880 1080 L 880 420 M 960 1080 L 960 400 M 1040 1080 L 1040 420 M 1120 1080 L 1120 440 M 1200 1080 L 1200 480"/>
      <circle cx="960" cy="460" r="50" stroke="%23a58ae8" stroke-width="4"/>
    </g>
    <!-- Gargoyles / Statues on Pillars -->
    <rect x="580" y="440" width="80" height="640" fill="%230c142b" stroke="%23243b70" stroke-width="4"/>
    <rect x="1260" y="440" width="80" height="640" fill="%230c142b" stroke="%23243b70" stroke-width="4"/>
    <!-- Cobblestone Ground -->
    <rect x="0" y="860" width="1920" height="220" fill="%23070b18"/>
    <rect x="0" y="750" width="1920" height="330" fill="url(%23mist)"/>
  </svg>`;
}

// 2. Salão das Cinzas (Prologue & Phase 1)
export function generateAshesHallSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="hall-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23050814"/>
        <stop offset="40%" stop-color="%230c142b"/>
        <stop offset="100%" stop-color="%23080C1D"/>
      </linearGradient>
      <linearGradient id="moon-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="%235376c8" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="%237650b8" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="torch-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23ffaa44" stop-opacity="0.5"/>
        <stop offset="50%" stop-color="%237650b8" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="%23080c1d" stop-opacity="0"/>
      </radialGradient>
      <pattern id="stone-tiles" width="80" height="40" patternUnits="userSpaceOnUse">
        <path d="M 0 0 L 80 0 L 80 40 L 0 40 Z" fill="none" stroke="%23131c38" stroke-width="1"/>
        <path d="M 40 0 L 40 40" fill="none" stroke="%23131c38" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1920" height="1080" fill="url(%23hall-bg)"/>
    <rect x="0" y="700" width="1920" height="380" fill="%23090e24"/>
    <rect x="0" y="700" width="1920" height="380" fill="url(%23stone-tiles)" opacity="0.6"/>
    <!-- Gothic Arches -->
    <path d="M 120 1080 L 120 300 Q 120 120 480 80 Q 840 120 840 300 L 840 1080" fill="none" stroke="%23162247" stroke-width="32"/>
    <path d="M 1080 1080 L 1080 300 Q 1080 120 1440 80 Q 1800 120 1800 300 L 1800 1080" fill="none" stroke="%23162247" stroke-width="32"/>
    <!-- Central Staircase -->
    <path d="M 720 1080 L 800 660 L 1120 660 L 1200 1080 Z" fill="%2310172f" stroke="%23243b70" stroke-width="4"/>
    <line x1="750" y1="920" x2="1170" y2="920" stroke="%23243b70" stroke-width="3"/>
    <line x1="780" y1="760" x2="1140" y2="760" stroke="%23243b70" stroke-width="3"/>
    <!-- Stained Glass Window -->
    <g transform="translate(860, 200)">
      <path d="M 0 350 L 0 150 Q 0 0 100 0 Q 200 0 200 150 L 200 350 Z" fill="%230c1736" stroke="%235376c8" stroke-width="8"/>
      <circle cx="100" cy="120" r="70" fill="none" stroke="%23a58ae8" stroke-width="5" opacity="0.8"/>
      <polygon points="100,50 -300,880 500,880" fill="url(%23moon-light)"/>
    </g>
    <!-- Astronomical Clock -->
    <g transform="translate(360, 260)">
      <circle cx="120" cy="120" r="90" fill="%230f1730" stroke="%23b7b7c8" stroke-width="6"/>
      <line x1="120" y1="120" x2="155" y2="85" stroke="%23a58ae8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="120" cy="120" r="8" fill="%23a58ae8"/>
    </g>
    <!-- Portrait -->
    <g transform="translate(240, 500)">
      <rect x="0" y="0" width="100" height="140" fill="%23090c1a" stroke="%23b7b7c8" stroke-width="6"/>
      <circle cx="50" cy="50" r="22" fill="%230d1224"/>
    </g>
    <!-- Desk & Torches -->
    <g transform="translate(1420, 680)">
      <polygon points="0,90 280,90 240,160 -40,160" fill="%231b1424" stroke="%232b213a" stroke-width="3"/>
      <rect x="80" y="100" width="90" height="40" rx="3" fill="%235c3826" stroke="%23b7b7c8" stroke-width="2"/>
    </g>
  </svg>`;
}

// 3. Phase 2: A Biblioteca Velada
export function generateLibrarySvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="lib-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23030611"/>
        <stop offset="60%" stop-color="%230a1126"/>
        <stop offset="100%" stop-color="%23060a17"/>
      </linearGradient>
      <linearGradient id="tome-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23a58ae8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="%23243b70" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23lib-bg)"/>
    <!-- Colossal Curved Bookshelves spanning to ceiling -->
    <g stroke="%231a2649" stroke-width="4">
      <!-- Left side tiers -->
      <path d="M 0 0 L 450 0 L 400 1080 L 0 1080 Z" fill="%230d142b"/>
      <!-- Shelf horizontal lines and colorful books -->
      <line x1="0" y1="180" x2="440" y2="180" stroke="%232b1b12" stroke-width="12"/>
      <line x1="0" y1="360" x2="425" y2="360" stroke="%232b1b12" stroke-width="12"/>
      <line x1="0" y1="540" x2="415" y2="540" stroke="%232b1b12" stroke-width="12"/>
      <line x1="0" y1="720" x2="405" y2="720" stroke="%232b1b12" stroke-width="12"/>
      <!-- Right side tiers -->
      <path d="M 1470 0 L 1920 0 L 1920 1080 L 1520 1080 Z" fill="%230d142b"/>
      <line x1="1480" y1="180" x2="1920" y2="180" stroke="%232b1b12" stroke-width="12"/>
      <line x1="1495" y1="360" x2="1920" y2="360" stroke="%232b1b12" stroke-width="12"/>
      <line x1="1505" y1="540" x2="1920" y2="540" stroke="%232b1b12" stroke-width="12"/>
      <line x1="1515" y1="720" x2="1920" y2="720" stroke="%232b1b12" stroke-width="12"/>
    </g>
    <!-- Upper Gallery Balcony and Brass Ladder -->
    <line x1="300" y1="100" x2="250" y2="800" stroke="%23c5a059" stroke-width="6"/>
    <line x1="340" y1="100" x2="290" y2="800" stroke="%23c5a059" stroke-width="6"/>
    <!-- Grand Armillary Sphere in Center Background -->
    <g transform="translate(960, 420)">
      <circle cx="0" cy="0" r="180" fill="none" stroke="%23c5a059" stroke-width="5" opacity="0.7"/>
      <ellipse cx="0" cy="0" rx="180" ry="70" fill="none" stroke="%237650b8" stroke-width="4"/>
      <ellipse cx="0" cy="0" rx="70" ry="180" fill="none" stroke="%235376c8" stroke-width="4"/>
      <circle cx="0" cy="0" r="30" fill="%23a58ae8" opacity="0.8"/>
    </g>
    <!-- Study Table & Pedestal for the Forbidden Tome -->
    <polygon points="680,820 1240,820 1340,1080 580,1080" fill="%23171320" stroke="%232e243d" stroke-width="4"/>
    <rect x="900" y="740" width="120" height="70" rx="6" fill="%233a1e2f" stroke="%23a58ae8" stroke-width="4"/>
    <circle cx="960" cy="740" r="60" fill="url(%23tome-glow)"/>
  </svg>`;
}

// 4. Phase 3: Laboratório de Alquimia
export function generateAlchemyLabSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="alc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23060a12"/>
        <stop offset="50%" stop-color="%230c1a24"/>
        <stop offset="100%" stop-color="%23071017"/>
      </linearGradient>
      <radialGradient id="cauldron-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%234ef0c4" stop-opacity="0.7"/>
        <stop offset="40%" stop-color="%235376c8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="%23080c1d" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23alc-bg)"/>
    <!-- Stone vaulted ceiling with hanging herb bundles and dried roots -->
    <path d="M 0 0 Q 960 220 1920 0 L 1920 120 Q 960 300 0 120 Z" fill="%230d1722"/>
    <!-- Shelves of bubbling glass alembics & glowing vials -->
    <rect x="140" y="240" width="460" height="24" fill="%23281a14"/>
    <rect x="1320" y="240" width="460" height="24" fill="%23281a14"/>
    <!-- Glowing potions on left shelf -->
    <circle cx="200" cy="210" r="22" fill="%23a58ae8" opacity="0.85"/>
    <rect x="260" y="180" width="30" height="50" rx="8" fill="%234ef0c4" opacity="0.85"/>
    <circle cx="340" cy="205" r="26" fill="%235376c8" opacity="0.85"/>
    <rect x="420" y="175" width="34" height="56" rx="6" fill="%23e85d75" opacity="0.8"/>
    <!-- Giant Cast-Iron Cauldron in center -->
    <g transform="translate(960, 780)">
      <circle cx="0" cy="0" r="240" fill="url(%23cauldron-glow)"/>
      <!-- Tripod legs -->
      <line x1="-150" y1="100" x2="-220" y2="280" stroke="%231a1a24" stroke-width="24" stroke-linecap="round"/>
      <line x1="150" y1="100" x2="220" y2="280" stroke="%231a1a24" stroke-width="24" stroke-linecap="round"/>
      <line x1="0" y1="120" x2="0" y2="280" stroke="%23111119" stroke-width="22" stroke-linecap="round"/>
      <!-- Cauldron belly -->
      <ellipse cx="0" cy="80" rx="200" ry="140" fill="%23151822" stroke="%232a3245" stroke-width="8"/>
      <!-- Cauldron rim and bubbling mixture -->
      <ellipse cx="0" cy="0" rx="190" ry="50" fill="%230b2024" stroke="%234ef0c4" stroke-width="5"/>
      <ellipse cx="0" cy="0" rx="170" ry="40" fill="%23174d47" opacity="0.9"/>
      <!-- Steam vapors -->
      <path d="M -80 -40 Q -120 -180 -40 -260 T 0 -380" fill="none" stroke="%234ef0c4" stroke-width="12" opacity="0.35" stroke-linecap="round"/>
      <path d="M 60 -40 Q 120 -160 50 -260 T 90 -380" fill="none" stroke="%23a58ae8" stroke-width="10" opacity="0.35" stroke-linecap="round"/>
    </g>
  </svg>`;
}

// 5. Phase 4: Dormitório & Pátio Interno de Elias
export function generateDormitorySvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="dorm-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23060714"/>
        <stop offset="50%" stop-color="%230f1429"/>
        <stop offset="100%" stop-color="%230a0d1c"/>
      </linearGradient>
      <radialGradient id="fireplace" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23ff8c42" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="%23a83232" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="%23060714" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23dorm-bg)"/>
    <!-- Gothic arched window looking onto misty courtyard -->
    <g transform="translate(820, 200)">
      <path d="M 0 450 L 0 200 Q 0 0 140 0 Q 280 0 280 200 L 280 450 Z" fill="%23080e1f" stroke="%23243b70" stroke-width="8"/>
      <line x1="140" y1="0" x2="140" y2="450" stroke="%231a2649" stroke-width="4"/>
      <line x1="0" y1="200" x2="280" y2="200" stroke="%231a2649" stroke-width="4"/>
      <circle cx="140" cy="120" r="12" fill="%23a58ae8" opacity="0.6"/>
    </g>
    <!-- Stone Hearth / Fireplace on Left -->
    <g transform="translate(180, 520)">
      <circle cx="160" cy="220" r="260" fill="url(%23fireplace)"/>
      <path d="M 0 460 L 0 100 Q 160 40 320 100 L 320 460 Z" fill="%23151824" stroke="%232c3244" stroke-width="8"/>
      <path d="M 50 460 L 50 240 Q 160 180 270 240 L 270 460 Z" fill="%23080a10"/>
      <!-- Glowing Embers -->
      <polygon points="120,440 200,440 160,360" fill="%23ff7722"/>
    </g>
    <!-- Study Desk and Chest of the Crowe Family on Right -->
    <g transform="translate(1360, 640)">
      <rect x="0" y="80" width="380" height="20" fill="%23261614"/>
      <rect x="40" y="100" width="30" height="240" fill="%23180d0c"/>
      <rect x="310" y="100" width="30" height="240" fill="%23180d0c"/>
      <!-- The Ornate Crowe Locked Chest on floor -->
      <rect x="80" y="240" width="180" height="120" rx="8" fill="%231a1926" stroke="%235376c8" stroke-width="5"/>
      <circle cx="170" cy="300" r="14" fill="%23a58ae8"/>
    </g>
  </svg>`;
}

// 6. Phase 5: A Ala Lacrada
export function generateSealedWingSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="seal-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23080512"/>
        <stop offset="60%" stop-color="%23120c24"/>
        <stop offset="100%" stop-color="%2305030a"/>
      </linearGradient>
      <radialGradient id="rune-trap" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23ff2a55" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="%237650b8" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="%23080512" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23seal-bg)"/>
    <!-- Broken walls, collapsed masonry & ancient heavy chains -->
    <path d="M 0 1080 L 320 620 L 480 700 L 640 540 L 800 660 L 1120 660 L 1280 520 L 1440 680 L 1600 580 L 1920 1080 Z" fill="%230c081a" stroke="%23211538" stroke-width="6"/>
    <!-- Hanging Iron Chains sealing the corridor -->
    <line x1="380" y1="0" x2="480" y2="600" stroke="%233a3648" stroke-width="12" stroke-dasharray="14 10"/>
    <line x1="1540" y1="0" x2="1440" y2="600" stroke="%233a3648" stroke-width="12" stroke-dasharray="14 10"/>
    <line x1="960" y1="0" x2="960" y2="520" stroke="%235376c8" stroke-width="8" stroke-dasharray="16 8"/>
    <!-- Ancient Wall Portraits Gallery with missing names -->
    <g transform="translate(680, 240)">
      <rect x="0" y="0" width="140" height="200" fill="%23090614" stroke="%237650b8" stroke-width="6"/>
      <text x="70" y="110" font-family="serif" font-size="28" fill="%23a58ae8" text-anchor="middle">1842</text>
      <rect x="240" y="0" width="140" height="200" fill="%23090614" stroke="%235376c8" stroke-width="6"/>
      <text x="310" y="110" font-family="serif" font-size="28" fill="%235376c8" text-anchor="middle">1899</text>
      <rect x="480" y="0" width="140" height="200" fill="%23090614" stroke="%23e85d75" stroke-width="6"/>
      <text x="550" y="110" font-family="serif" font-size="28" fill="%23e85d75" text-anchor="middle">1923</text>
    </g>
    <!-- Floor Arcane Trap Glyphs (Dangerous Red/Violet Ward) -->
    <g transform="translate(960, 860)">
      <circle cx="0" cy="0" r="160" fill="url(%23rune-trap)"/>
      <polygon points="0,-140 120,70 -120,70" fill="none" stroke="%23ff2a55" stroke-width="4"/>
      <polygon points="0,140 120,-70 -120,-70" fill="none" stroke="%23ff2a55" stroke-width="4"/>
      <circle cx="0" cy="0" r="40" fill="none" stroke="%23a58ae8" stroke-width="4"/>
    </g>
  </svg>`;
}

// 7. Phase 6: A Galeria das Mil Portas
export function generateGalleryDoorsSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="gal-void" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23020208"/>
        <stop offset="50%" stop-color="%2307071f"/>
        <stop offset="100%" stop-color="%230b051a"/>
      </linearGradient>
      <radialGradient id="portal-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23a58ae8" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="%235376c8" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23gal-void)"/>
    <!-- Cosmic Void Floating Path -->
    <path d="M 0 1080 L 600 780 L 1320 780 L 1920 1080 Z" fill="%230d0e26" stroke="%23243b70" stroke-width="4"/>
    <!-- Five Monumental Dimensional Doors floating along arch -->
    <!-- Door 1: Mirror Door -->
    <g transform="translate(180, 420)">
      <rect x="0" y="0" width="140" height="260" rx="8" fill="%230f1d38" stroke="%235376c8" stroke-width="6"/>
      <ellipse cx="70" cy="130" rx="40" ry="80" fill="%23c0d2f5" opacity="0.4"/>
      <text x="70" y="295" font-family="serif" font-size="16" fill="%235376c8" text-anchor="middle">Porta dos Espelhos</text>
    </g>
    <!-- Door 2: Clockwork Door -->
    <g transform="translate(480, 340)">
      <rect x="0" y="0" width="150" height="280" rx="8" fill="%23241b12" stroke="%23c5a059" stroke-width="6"/>
      <circle cx="75" cy="140" r="45" fill="none" stroke="%23c5a059" stroke-width="4"/>
      <text x="75" y="315" font-family="serif" font-size="16" fill="%23c5a059" text-anchor="middle">Porta do Pêndulo</text>
    </g>
    <!-- Door 3: Mist Door -->
    <g transform="translate(860, 240)">
      <circle cx="100" cy="160" r="180" fill="url(%23portal-glow)"/>
      <rect x="20" y="0" width="160" height="320" rx="10" fill="%231a0e33" stroke="%23a58ae8" stroke-width="8"/>
      <!-- Star constellation of Noctária -->
      <circle cx="100" cy="110" r="8" fill="%23ffffff"/>
      <circle cx="70" cy="140" r="5" fill="%23ffffff"/>
      <circle cx="130" cy="140" r="5" fill="%23ffffff"/>
      <circle cx="100" cy="190" r="6" fill="%23ffffff"/>
      <line x1="100" y1="110" x2="70" y2="140" stroke="%23ffffff" stroke-width="2"/>
      <line x1="100" y1="110" x2="130" y2="140" stroke="%23ffffff" stroke-width="2"/>
      <line x1="70" y1="140" x2="100" y2="190" stroke="%23ffffff" stroke-width="2"/>
      <line x1="130" y1="140" x2="100" y2="190" stroke="%23ffffff" stroke-width="2"/>
      <text x="100" y="360" font-family="serif" font-size="18" fill="%23a58ae8" font-weight="bold" text-anchor="middle">Porta das Estrelas (Entretempo)</text>
    </g>
    <!-- Door 4: Ash Door -->
    <g transform="translate(1260, 340)">
      <rect x="0" y="0" width="150" height="280" rx="8" fill="%231e1e24" stroke="%239696a6" stroke-width="6"/>
      <polygon points="75,80 120,180 30,180" fill="none" stroke="%239696a6" stroke-width="4"/>
      <text x="75" y="315" font-family="serif" font-size="16" fill="%239696a6" text-anchor="middle">Porta das Cinzas</text>
    </g>
    <!-- Door 5: Iron Bramble Door -->
    <g transform="translate(1580, 420)">
      <rect x="0" y="0" width="140" height="260" rx="8" fill="%23180c10" stroke="%239e2a2b" stroke-width="6"/>
      <path d="M 20 60 Q 70 130 120 200 M 120 60 Q 70 130 20 200" stroke="%239e2a2b" stroke-width="6"/>
      <text x="70" y="295" font-family="serif" font-size="16" fill="%239e2a2b" text-anchor="middle">Porta dos Espinhos</text>
    </g>
  </svg>`;
}

// 8. Phase 7: O Reino Onde o Tempo Parou (Entretempo)
export function generateTimelessRealmSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="time-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23050c18"/>
        <stop offset="40%" stop-color="%230c1d33"/>
        <stop offset="100%" stop-color="%23040914"/>
      </linearGradient>
      <radialGradient id="chrono-shatter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%2376e5fc" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="%235376c8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="%23040914" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23time-bg)"/>
    <!-- Inverted / shattered architectural ruins suspended in frozen gravity -->
    <polygon points="300,120 540,60 480,360 220,300" fill="%230f233d" stroke="%2376e5fc" stroke-width="3" opacity="0.6"/>
    <polygon points="1400,80 1680,180 1560,420 1320,280" fill="%230f233d" stroke="%2376e5fc" stroke-width="3" opacity="0.6"/>
    <!-- Floating Shattered Clock Faces Frozen in Mid-Air -->
    <g transform="translate(960, 480)">
      <circle cx="0" cy="0" r="260" fill="url(%23chrono-shatter)"/>
      <circle cx="0" cy="0" r="200" fill="none" stroke="%2376e5fc" stroke-width="6" stroke-dasharray="24 16"/>
      <!-- Broken hands stopped exactly at the 13th hour -->
      <line x1="0" y1="0" x2="0" y2="-150" stroke="%23ffffff" stroke-width="8" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="60" y2="-130" stroke="%23a58ae8" stroke-width="6" stroke-linecap="round"/>
      <!-- Suspended glowing hourglass -->
      <polygon points="-40,-50 40,-50 0,0 -40,50 40,50 0,0" fill="%2376e5fc" opacity="0.5"/>
    </g>
    <!-- Spectral Echo Figures in shadows -->
    <g transform="translate(620, 680)">
      <ellipse cx="0" cy="0" rx="40" ry="120" fill="%235376c8" opacity="0.35"/>
      <circle cx="0" cy="-140" r="26" fill="%23a58ae8" opacity="0.4"/>
    </g>
    <g transform="translate(1300, 680)">
      <ellipse cx="0" cy="0" rx="40" ry="120" fill="%2376e5fc" opacity="0.35"/>
      <circle cx="0" cy="-140" r="26" fill="%23ffffff" opacity="0.4"/>
    </g>
  </svg>`;
}

// 9. Phase 8: O Ritual das Treze Badaladas (Câmara Central)
export function generateCentralChamberSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="chamber-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23080312"/>
        <stop offset="50%" stop-color="%231a062b"/>
        <stop offset="100%" stop-color="%2306010d"/>
      </linearGradient>
      <radialGradient id="ritual-altar" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23f72585" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="%237209b7" stop-opacity="0.6"/>
        <stop offset="80%" stop-color="%234361ee" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="%23080312" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23chamber-bg)"/>
    <!-- Colossal Underground Cavern with 13 Monolith Pillars -->
    <g stroke="%232e0847" stroke-width="8">
      <line x1="200" y1="0" x2="200" y2="1080"/>
      <line x1="450" y1="0" x2="450" y2="1080"/>
      <line x1="1470" y1="0" x2="1470" y2="1080"/>
      <line x1="1720" y1="0" x2="1720" y2="1080"/>
    </g>
    <!-- Massive Circular Ritual Floor Ring with 13 Chimes Glyphs -->
    <g transform="translate(960, 680)">
      <circle cx="0" cy="0" r="380" fill="url(%23ritual-altar)"/>
      <circle cx="0" cy="0" r="320" fill="none" stroke="%23f72585" stroke-width="8"/>
      <circle cx="0" cy="0" r="220" fill="none" stroke="%23a58ae8" stroke-width="4" stroke-dasharray="16 12"/>
      <!-- The 13 Key Sockets around the rim -->
      <!-- 13 equidistant runes -->
      <circle cx="0" cy="-320" r="16" fill="%23ffffff" stroke="%23f72585" stroke-width="4"/>
      <circle cx="150" cy="-282" r="14" fill="%23a58ae8"/>
      <circle cx="268" cy="-175" r="14" fill="%23a58ae8"/>
      <circle cx="318" cy="-31" r="14" fill="%23a58ae8"/>
      <circle cx="286" cy="144" r="14" fill="%23a58ae8"/>
      <circle cx="178" cy="265" r="14" fill="%23a58ae8"/>
      <circle cx="0" cy="320" r="16" fill="%234ef0c4"/>
      <circle cx="-178" cy="265" r="14" fill="%23a58ae8"/>
      <circle cx="-286" cy="144" r="14" fill="%23a58ae8"/>
      <circle cx="-318" cy="-31" r="14" fill="%23a58ae8"/>
      <circle cx="-268" cy="-175" r="14" fill="%23a58ae8"/>
      <circle cx="-150" cy="-282" r="14" fill="%23a58ae8"/>
      <!-- Central Altar Obelisk with Dimensional Rifts -->
      <polygon points="0,-160 80,40 -80,40" fill="%23170529" stroke="%23f72585" stroke-width="6"/>
      <circle cx="0" cy="-40" r="30" fill="%23ffffff"/>
    </g>
  </svg>`;
}

// 10. Epilogue: O Outro Lado (Quarto do Protagonista com a Nova Carta)
export function generateEpilogueRoomSvg() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="epi-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23060814"/>
        <stop offset="60%" stop-color="%23101833"/>
        <stop offset="100%" stop-color="%23090d1f"/>
      </linearGradient>
      <radialGradient id="candle" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%23ffdd88" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="%23ff9933" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="%23060814" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(%23epi-bg)"/>
    <!-- Gothic arched window with gentle blue morning dawn / storm breaking -->
    <g transform="translate(860, 160)">
      <path d="M 0 420 L 0 180 Q 0 0 100 0 Q 200 0 200 180 L 200 420 Z" fill="%2317254d" stroke="%235376c8" stroke-width="6"/>
      <!-- Distant morning star -->
      <circle cx="100" cy="100" r="6" fill="%23ffffff"/>
    </g>
    <!-- Student Study Desk in Center -->
    <polygon points="560,780 1360,780 1480,1080 440,1080" fill="%231b1426" stroke="%233a2a4f" stroke-width="4"/>
    <!-- Glowing Candleholder -->
    <g transform="translate(720, 720)">
      <circle cx="0" cy="0" r="160" fill="url(%23candle)"/>
      <path d="M -8 10 L 8 10 L 0 -15 Z" fill="%23ffeedd"/>
      <rect x="-4" y="10" width="8" height="40" fill="%23e8e8f2"/>
      <ellipse cx="0" cy="50" rx="20" ry="8" fill="%23c5a059"/>
    </g>
    <!-- The New Unopened Letter with Silver Key on Desk -->
    <g transform="translate(980, 840)">
      <rect x="-60" y="-40" width="120" height="80" rx="4" fill="%23f4f1ea" stroke="%237650b8" stroke-width="4"/>
      <!-- Violet wax seal with the star-door emblem -->
      <circle cx="0" cy="0" r="18" fill="%237650b8"/>
      <polygon points="0,-10 8,6 -8,6" fill="%23ffffff"/>
      <!-- The Impossible Silver Key resting on top -->
      <path d="M 40 -20 L 100 -20 M 80 -20 L 80 -5 M 95 -20 L 95 -8" stroke="%23d6e0ff" stroke-width="6" stroke-linecap="round"/>
      <circle cx="40" cy="-20" r="14" fill="none" stroke="%23d6e0ff" stroke-width="5"/>
    </g>
  </svg>`;
}

export const SCENE_BACKGROUNDS = {
  courtyard: generateCourtyardSvg,
  ashes_hall: generateAshesHallSvg,
  library: generateLibrarySvg,
  alchemy_lab: generateAlchemyLabSvg,
  dormitory: generateDormitorySvg,
  sealed_wing: generateSealedWingSvg,
  gallery_doors: generateGalleryDoorsSvg,
  timeless_realm: generateTimelessRealmSvg,
  central_chamber: generateCentralChamberSvg,
  epilogue_room: generateEpilogueRoomSvg
};
