/**
 * NOCTÁRIA: A ACADEMIA DAS MIL PORTAS
 * Sistema de Ilustrações Narrativas Góticas em Alta Fidelidade
 * Cenários arquitetônicos, ilustrações de descobertas/pistas e artefatos.
 */

// Helper: encode SVG to Clean Data URL
function svgToDataUrl(svgString) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString.trim());
}

/* ==========================================================================
   1. CENÁRIOS PRINCIPAIS DE CADA CAPÍTULO / AMBIENTE (1920x1080)
   ========================================================================== */

// 1.1 PRÓLOGO: Fachada e Portões da Noite da Academia Gótica
export function getCourtyardArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="cy-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02040a"/>
        <stop offset="35%" stop-color="#070c1a"/>
        <stop offset="70%" stop-color="#0f1933"/>
        <stop offset="100%" stop-color="#142142"/>
      </linearGradient>
      <radialGradient id="cy-moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="25%" stop-color="#e8edff"/>
        <stop offset="50%" stop-color="#9bb7f7" stop-opacity="0.6"/>
        <stop offset="80%" stop-color="#6242a8" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="lantern-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffdd88" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#ff9933" stop-opacity="0.4"/>
        <stop offset="80%" stop-color="#a84370" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="mist-bottom" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#0b1124" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="#243b70" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <pattern id="cy-cobble" width="60" height="30" patternUnits="userSpaceOnUse">
        <path d="M 0 0 L 60 0 L 60 30 L 0 30 Z" fill="#080c18" stroke="#121a30" stroke-width="1.5"/>
        <path d="M 30 0 L 30 30" stroke="#121a30" stroke-width="1.5"/>
        <circle cx="15" cy="15" r="2" fill="#1b2542" opacity="0.4"/>
        <circle cx="45" cy="15" r="2" fill="#1b2542" opacity="0.4"/>
      </pattern>
      <filter id="night-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.8"/>
      </filter>
    </defs>

    <!-- Céu Noturno -->
    <rect width="1920" height="1080" fill="url(#cy-sky)"/>

    <!-- Lua Cheia e Halo Arcano -->
    <circle cx="1320" cy="200" r="190" fill="url(#cy-moon)"/>
    <circle cx="1320" cy="200" r="62" fill="#fcfdff" opacity="0.95"/>
    <!-- Nuvens Noturnas sobre a Lua -->
    <path d="M 1150 190 Q 1280 150 1420 210 Q 1500 230 1540 200 Q 1460 250 1340 240 Q 1220 250 1150 190 Z" fill="#080d1e" opacity="0.55"/>

    <!-- Montanhas e Floresta Negra ao Fundo -->
    <path d="M 0 680 L 120 540 L 280 620 L 440 500 L 680 640 L 900 520 L 1150 640 L 1420 480 L 1680 620 L 1920 510 L 1920 1080 L 0 1080 Z" fill="#050813" opacity="0.9"/>

    <!-- Fachada Gótica ao Longe: Torres e Agulhas de Pedra -->
    <!-- Agulha Esquerda -->
    <path d="M 180 720 L 260 160 L 340 720 Z" fill="#070c1d"/>
    <polygon points="260,130 255,160 265,160" fill="#a58ae8"/>
    <!-- Torre do Relógio Central -->
    <rect x="760" y="240" width="400" height="520" fill="#080e22" stroke="#162347" stroke-width="2"/>
    <polygon points="730,240 960,30 1190,240" fill="#060b1b" stroke="#1c2d59" stroke-width="3"/>
    <!-- Rosácea / Relógio da Torre -->
    <circle cx="960" cy="180" r="48" fill="#0d1838" stroke="#7650b8" stroke-width="4"/>
    <circle cx="960" cy="180" r="38" fill="none" stroke="#a58ae8" stroke-width="2" stroke-dasharray="6 4"/>
    <line x1="960" y1="180" x2="960" y2="152" stroke="#e8e8f2" stroke-width="3" stroke-linecap="round"/>
    <line x1="960" y1="180" x2="980" y2="175" stroke="#a58ae8" stroke-width="3" stroke-linecap="round"/>
    <!-- Vitrais Iluminados da Fachada -->
    <path d="M 830 380 L 830 310 Q 860 270 890 310 L 890 380 Z" fill="#3b2b68" stroke="#a58ae8" stroke-width="2"/>
    <path d="M 1030 380 L 1030 310 Q 1060 270 1090 310 L 1090 380 Z" fill="#243b70" stroke="#5376c8" stroke-width="2"/>
    <path d="M 930 460 L 930 360 Q 960 300 990 360 L 990 460 Z" fill="#432672" stroke="#a58ae8" stroke-width="3"/>

    <!-- Agulha Direita -->
    <path d="M 1580 720 L 1660 140 L 1740 720 Z" fill="#070c1d"/>
    <polygon points="1660,110 1655,140 1665,140" fill="#5376c8"/>

    <!-- Muralhas de Pedra Principais -->
    <rect x="0" y="600" width="1920" height="240" fill="#0a1024" stroke="#162347" stroke-width="4"/>
    <!-- Ameias do Topo da Muralha -->
    <g fill="#070c1a">
      <rect x="40" y="560" width="80" height="50"/>
      <rect x="180" y="560" width="80" height="50"/>
      <rect x="320" y="560" width="80" height="50"/>
      <rect x="460" y="560" width="80" height="50"/>
      <rect x="600" y="560" width="80" height="50"/>
      <rect x="1240" y="560" width="80" height="50"/>
      <rect x="1380" y="560" width="80" height="50"/>
      <rect x="1520" y="560" width="80" height="50"/>
      <rect x="1660" y="560" width="80" height="50"/>
      <rect x="1800" y="560" width="80" height="50"/>
    </g>

    <!-- Pilares e Arco de Entrada Monumental -->
    <rect x="580" y="420" width="120" height="660" fill="#0c142b" stroke="#243b70" stroke-width="4"/>
    <rect x="1220" y="420" width="120" height="660" fill="#0c142b" stroke="#243b70" stroke-width="4"/>
    <!-- Estátuas / Gárgulas nos Topos dos Pilares -->
    <path d="M 600 420 L 640 340 L 680 420 Z" fill="#162347"/>
    <path d="M 1240 420 L 1280 340 L 1320 420 Z" fill="#162347"/>
    <!-- Brasão de Noctária no Arco Superior -->
    <path d="M 700 520 Q 960 300 1220 520" fill="none" stroke="#243b70" stroke-width="26"/>
    <circle cx="960" cy="410" r="45" fill="#080c1d" stroke="#a58ae8" stroke-width="5"/>
    <polygon points="960,380 970,405 995,405 975,420 985,445 960,430 935,445 945,420 925,405 950,405" fill="#a58ae8"/>

    <!-- Portões de Ferro Forjado da Noite -->
    <g stroke="#1a274c" stroke-width="6" fill="none">
      <line x1="710" y1="520" x2="710" y2="1080"/>
      <line x1="760" y1="490" x2="760" y2="1080"/>
      <line x1="810" y1="465" x2="810" y2="1080"/>
      <line x1="860" y1="445" x2="860" y2="1080"/>
      <line x1="910" y1="435" x2="910" y2="1080"/>
      <line x1="960" y1="430" x2="960" y2="1080" stroke="#7650b8" stroke-width="8"/>
      <line x1="1010" y1="435" x2="1010" y2="1080"/>
      <line x1="1060" y1="445" x2="1060" y2="1080"/>
      <line x1="1110" y1="465" x2="1110" y2="1080"/>
      <line x1="1160" y1="490" x2="1160" y2="1080"/>
      <line x1="1210" y1="520" x2="1210" y2="1080"/>
      <!-- Travessas horizontais de ferro com espigões -->
      <line x1="700" y1="650" x2="1220" y2="650" stroke="#243b70" stroke-width="8"/>
      <line x1="700" y1="880" x2="1220" y2="880" stroke="#243b70" stroke-width="8"/>
    </g>

    <!-- Lanternas Góticas de Ferro dos Pilares (Luz Âmbar Acolhedora mas Sombria) -->
    <!-- Lanterna Esquerda -->
    <circle cx="640" cy="560" r="140" fill="url(#lantern-glow)"/>
    <rect x="625" y="530" width="30" height="50" fill="#ffdd88" stroke="#162347" stroke-width="4"/>
    <polygon points="615,530 640,490 665,530" fill="#0d142b"/>
    <!-- Lanterna Direita -->
    <circle cx="1280" cy="560" r="140" fill="url(#lantern-glow)"/>
    <rect x="1265" y="530" width="30" height="50" fill="#ffdd88" stroke="#162347" stroke-width="4"/>
    <polygon points="1255,530 1280,490 1305,530" fill="#0d142b"/>

    <!-- Chão de Paralelepípedos e Escadaria de Entrada -->
    <rect x="0" y="800" width="1920" height="280" fill="url(#cy-cobble)"/>
    <!-- Escadaria Central -->
    <polygon points="520,1080 620,860 1300,860 1400,1080" fill="#0c1326" stroke="#243b70" stroke-width="3"/>
    <line x1="560" y1="940" x2="1360" y2="940" stroke="#1c2d59" stroke-width="4"/>
    <line x1="600" y1="900" x2="1320" y2="900" stroke="#1c2d59" stroke-width="4"/>

    <!-- Névoa Espessa que Rasteja pelo Pátio -->
    <rect x="0" y="660" width="1920" height="420" fill="url(#mist-bottom)"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.2 FASE 1: O Salão das Cinzas (Interior Monumental com Arcos e Vitral Central)
export function getAshesHallArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="hall-deep" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#04060e"/>
        <stop offset="45%" stop-color="#0a1226"/>
        <stop offset="100%" stop-color="#060914"/>
      </linearGradient>
      <linearGradient id="stained-ray" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="#a58ae8" stop-opacity="0.5"/>
        <stop offset="35%" stop-color="#5376c8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="torch-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff9933" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="#7650b8" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <pattern id="hall-tiles" width="100" height="50" patternUnits="userSpaceOnUse">
        <polygon points="50,0 100,25 50,50 0,25" fill="#080e22" stroke="#141f3d" stroke-width="2"/>
        <polygon points="50,2 96,25 50,48 4,25" fill="#0c1530" opacity="0.6"/>
      </pattern>
    </defs>

    <rect width="1920" height="1080" fill="url(#hall-deep)"/>

    <!-- Teto Abobadado com Nervuras Cruzadas Góticas -->
    <path d="M 0 0 Q 960 280 1920 0 L 1920 160 Q 960 420 0 160 Z" fill="#080d1e" stroke="#162347" stroke-width="3"/>
    <path d="M 960 0 L 960 350 M 480 0 L 720 300 M 1440 0 L 1200 300" stroke="#1f2f59" stroke-width="8"/>

    <!-- Colunata de Pedra Imponente dos Lados -->
    <path d="M 160 1080 L 160 320 Q 240 180 480 160 Q 720 180 800 320 L 800 1080" fill="none" stroke="#141f3d" stroke-width="36"/>
    <path d="M 1120 1080 L 1120 320 Q 1200 180 1440 160 Q 1680 180 1760 320 L 1760 1080" fill="none" stroke="#141f3d" stroke-width="36"/>

    <!-- Parede dos Fundos com Galeria de Retratos e Murais -->
    <rect x="360" y="240" width="1200" height="520" fill="#070c1a" stroke="#19274c" stroke-width="3"/>

    <!-- Vitral Gótico Central com a Rosa Mística de Noctária -->
    <g transform="translate(840, 160)">
      <path d="M 0 340 L 0 140 Q 0 0 120 0 Q 240 0 240 140 L 240 340 Z" fill="#101a38" stroke="#5376c8" stroke-width="8"/>
      <!-- Círculo da Rosa no topo -->
      <circle cx="120" cy="110" r="85" fill="#241542" stroke="#a58ae8" stroke-width="6"/>
      <circle cx="120" cy="110" r="55" fill="#0e234a" stroke="#5376c8" stroke-width="4"/>
      <circle cx="120" cy="110" r="22" fill="#a58ae8"/>
      <!-- Raios de Vidro Colorido -->
      <line x1="120" y1="25" x2="120" y2="195" stroke="#a58ae8" stroke-width="3"/>
      <line x1="35" y1="110" x2="205" y2="110" stroke="#a58ae8" stroke-width="3"/>
      <line x1="60" y1="50" x2="180" y2="170" stroke="#5376c8" stroke-width="2"/>
      <line x1="180" y1="50" x2="60" y2="170" stroke="#5376c8" stroke-width="2"/>
      <!-- Feixe de Luz Mística Descendo pelo Salão -->
      <polygon points="120,80 -280,920 520,920" fill="url(#stained-ray)"/>
    </g>

    <!-- O Mural de Avisos dos Estudantes na Parede Esquerda -->
    <g transform="translate(300, 480)">
      <rect x="0" y="0" width="180" height="160" fill="#120e18" stroke="#5376c8" stroke-width="5"/>
      <rect x="15" y="15" width="60" height="50" fill="#f0ebd8" opacity="0.8"/>
      <rect x="90" y="20" width="70" height="40" fill="#f4ebd0" opacity="0.75"/>
      <!-- Cartaz de Mérito com o Nome Riscado -->
      <rect x="25" y="80" width="130" height="60" fill="#fffbe8" opacity="0.9"/>
      <line x1="35" y1="115" x2="145" y2="115" stroke="#2a1010" stroke-width="6"/>
      <text x="90" y="105" font-family="serif" font-size="10" fill="#243b70" font-weight="bold" text-anchor="middle">MÉRITO ACADÊMICO</text>
    </g>

    <!-- O Retrato Adulterado da Turma 42 na Parede Central-Esquerda -->
    <g transform="translate(540, 360)">
      <rect x="0" y="0" width="130" height="170" fill="#140f1a" stroke="#a58ae8" stroke-width="6"/>
      <!-- Fundo do quadro a óleo -->
      <rect x="12" y="12" width="106" height="146" fill="#1c2438"/>
      <!-- Silhuetas dos estudantes pintados -->
      <circle cx="45" cy="70" r="16" fill="#2b3b5c"/>
      <rect x="30" y="88" width="30" height="60" fill="#1e2a42"/>
      <!-- Rosto raspado com riscos de faca brancos/cinzentos -->
      <circle cx="85" cy="70" r="16" fill="#3a3845"/>
      <line x1="72" y1="58" x2="98" y2="82" stroke="#d5d5e5" stroke-width="4"/>
      <line x1="98" y1="58" x2="72" y2="82" stroke="#d5d5e5" stroke-width="4"/>
      <rect x="70" y="88" width="30" height="60" fill="#1e2a42"/>
      <text x="65" y="152" font-family="serif" font-size="9" fill="#a58ae8" text-anchor="middle">Turma 42 • S.A.</text>
    </g>

    <!-- O Púlpito de Carvalho Escuro com o Livro de Matrículas na Direita -->
    <g transform="translate(1380, 620)">
      <polygon points="40,60 220,60 260,260 0,260" fill="#17121c" stroke="#2b2038" stroke-width="4"/>
      <!-- Grande Livro de Capa de Couro Aberto -->
      <rect x="50" y="30" width="75" height="55" rx="3" fill="#2a1d2d" stroke="#c5a059" stroke-width="2"/>
      <rect x="128" y="30" width="75" height="55" rx="3" fill="#2a1d2d" stroke="#c5a059" stroke-width="2"/>
      <!-- Páginas Amareladas (com a folha 42 arrancada) -->
      <rect x="54" y="34" width="67" height="47" fill="#f5eedb"/>
      <rect x="132" y="34" width="67" height="47" fill="#f5eedb"/>
      <!-- Borda irregular da folha rasgada -->
      <path d="M 128 34 L 132 40 L 127 50 L 133 60 L 128 70 L 132 80" stroke="#7a2020" stroke-width="3" fill="none"/>
    </g>

    <!-- Tochas Góticas nas Paredes -->
    <circle cx="260" cy="460" r="110" fill="url(#torch-glow)"/>
    <rect x="255" y="440" width="10" height="60" fill="#2b1a10"/>
    <ellipse cx="260" cy="430" rx="14" ry="24" fill="#ffaa33"/>

    <circle cx="1660" cy="460" r="110" fill="url(#torch-glow)"/>
    <rect x="1655" y="440" width="10" height="60" fill="#2b1a10"/>
    <ellipse cx="1660" cy="430" rx="14" ry="24" fill="#ffaa33"/>

    <!-- Piso com Azulejos Geométricos Escuros -->
    <rect x="0" y="740" width="1920" height="340" fill="url(#hall-tiles)"/>
    <!-- Escadaria Nobre Central Descendo -->
    <polygon points="680,1080 800,740 1120,740 1240,1080" fill="#0d142b" stroke="#243b70" stroke-width="4"/>
    <line x1="720" y1="960" x2="1200" y2="960" stroke="#1f2f59" stroke-width="3"/>
    <line x1="760" y1="840" x2="1160" y2="840" stroke="#1f2f59" stroke-width="3"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.3 FASE 2: A Biblioteca Velada (Estantes Monumentais, Escadarias de Latão e Esfera Armilar)
export function getLibraryArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="lib-void" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02030a"/>
        <stop offset="50%" stop-color="#080e22"/>
        <stop offset="100%" stop-color="#040712"/>
      </linearGradient>
      <radialGradient id="armillary-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a58ae8" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#5376c8" stop-opacity="0.4"/>
        <stop offset="80%" stop-color="#141f3d" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="desk-lamp" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffd577" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="#ff9933" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#lib-void)"/>

    <!-- Teto Abobadado com Mapas Estelares Arcanos -->
    <path d="M 0 0 Q 960 220 1920 0 L 1920 80 Q 960 300 0 80 Z" fill="#070c1d" stroke="#162347" stroke-width="2"/>
    <circle cx="960" cy="120" r="4" fill="#fff"/>
    <circle cx="840" cy="140" r="3" fill="#a58ae8"/>
    <circle cx="1080" cy="140" r="3" fill="#5376c8"/>
    <circle cx="720" cy="110" r="2" fill="#fff"/>
    <circle cx="1200" cy="110" r="2" fill="#fff"/>

    <!-- Colossais Estantes de Livros Curvadas até o Teto (Lado Esquerdo) -->
    <polygon points="0,0 480,0 420,1080 0,1080" fill="#0a1024" stroke="#1b2a52" stroke-width="4"/>
    <!-- Prateleiras com livros encadernados -->
    <g fill="#161e38" stroke="#060914" stroke-width="2">
      <!-- Fileira 1 -->
      <line x1="0" y1="180" x2="465" y2="180" stroke="#2b1a12" stroke-width="14"/>
      <rect x="30" y="70" width="22" height="105" fill="#4a1525"/>
      <rect x="55" y="80" width="30" height="95" fill="#1c2d59"/>
      <rect x="90" y="65" width="25" height="110" fill="#2b3d32"/>
      <rect x="120" y="75" width="35" height="100" fill="#5c3826"/>
      <rect x="160" y="60" width="28" height="115" fill="#3a2352"/>
      <rect x="195" y="85" width="22" height="90" fill="#1c2d59"/>
      <rect x="225" y="70" width="34" height="105" fill="#4a1525"/>
      <rect x="265" y="75" width="26" height="100" fill="#5c3826"/>
      <!-- Fileira 2 -->
      <line x1="0" y1="360" x2="450" y2="360" stroke="#2b1a12" stroke-width="14"/>
      <rect x="40" y="240" width="35" height="115" fill="#3a2352"/>
      <rect x="80" y="250" width="24" height="105" fill="#1c2d59"/>
      <rect x="110" y="235" width="38" height="120" fill="#5c3826"/>
      <rect x="155" y="260" width="28" height="95" fill="#4a1525"/>
      <rect x="190" y="240" width="32" height="115" fill="#2b3d32"/>
      <!-- Fileira 3 -->
      <line x1="0" y1="540" x2="440" y2="540" stroke="#2b1a12" stroke-width="14"/>
      <rect x="30" y="420" width="30" height="115" fill="#1c2d59"/>
      <rect x="65" y="430" width="40" height="105" fill="#4a1525"/>
      <rect x="110" y="415" width="26" height="120" fill="#3a2352"/>
      <rect x="140" y="435" width="35" height="100" fill="#5c3826"/>
    </g>

    <!-- Colossais Estantes de Livros (Lado Direito) -->
    <polygon points="1440,0 1920,0 1920,1080 1500,1080" fill="#0a1024" stroke="#1b2a52" stroke-width="4"/>
    <g fill="#161e38" stroke="#060914" stroke-width="2">
      <line x1="1455" y1="180" x2="1920" y2="180" stroke="#2b1a12" stroke-width="14"/>
      <rect x="1520" y="70" width="32" height="105" fill="#1c2d59"/>
      <rect x="1560" y="60" width="28" height="115" fill="#3a2352"/>
      <rect x="1595" y="75" width="34" height="100" fill="#4a1525"/>
      <rect x="1635" y="65" width="30" height="110" fill="#5c3826"/>
      <line x1="1470" y1="360" x2="1920" y2="360" stroke="#2b1a12" stroke-width="14"/>
      <rect x="1530" y="240" width="36" height="115" fill="#4a1525"/>
      <rect x="1575" y="250" width="26" height="105" fill="#1c2d59"/>
      <rect x="1610" y="235" width="40" height="120" fill="#3a2352"/>
      <line x1="1485" y1="540" x2="1920" y2="540" stroke="#2b1a12" stroke-width="14"/>
    </g>

    <!-- Escada Alta de Latão Dourado Correndo pelas Estantes -->
    <line x1="320" y1="60" x2="260" y2="820" stroke="#c5a059" stroke-width="8"/>
    <line x1="365" y1="60" x2="305" y2="820" stroke="#c5a059" stroke-width="8"/>
    <!-- Degraus -->
    <line x1="315" y1="140" x2="360" y2="140" stroke="#c5a059" stroke-width="5"/>
    <line x1="305" y1="240" x2="350" y2="240" stroke="#c5a059" stroke-width="5"/>
    <line x1="295" y1="340" x2="340" y2="340" stroke="#c5a059" stroke-width="5"/>
    <line x1="285" y1="440" x2="330" y2="440" stroke="#c5a059" stroke-width="5"/>
    <line x1="275" y1="540" x2="320" y2="540" stroke="#c5a059" stroke-width="5"/>
    <line x1="265" y1="640" x2="310" y2="640" stroke="#c5a059" stroke-width="5"/>

    <!-- A Grande Esfera Armilar Arcana no Centro ao Fundo -->
    <g transform="translate(960, 440)">
      <circle cx="0" cy="0" r="260" fill="url(#armillary-glow)"/>
      <!-- Anéis de Bronze e Ouro Antigo Rotacionando -->
      <circle cx="0" cy="0" r="190" fill="none" stroke="#c5a059" stroke-width="6"/>
      <ellipse cx="0" cy="0" rx="190" ry="70" fill="none" stroke="#a58ae8" stroke-width="5"/>
      <ellipse cx="0" cy="0" rx="70" ry="190" fill="none" stroke="#5376c8" stroke-width="5"/>
      <ellipse cx="0" cy="0" rx="140" ry="140" fill="none" stroke="#c5a059" stroke-width="3" stroke-dasharray="8 6"/>
      <!-- Globo Celestial Central Roxo Resplandecente -->
      <circle cx="0" cy="0" r="42" fill="#7650b8" stroke="#ffffff" stroke-width="4"/>
      <circle cx="-10" cy="-10" r="12" fill="#fff" opacity="0.8"/>
    </g>

    <!-- Grande Mesa de Estudos e Decifração de Mogno Escuro -->
    <polygon points="560,780 1360,780 1480,1080 440,1080" fill="#16101c" stroke="#2d2238" stroke-width="5"/>

    <!-- O Tomo Proibido Aberto no Centro da Mesa -->
    <g transform="translate(960, 840)">
      <polygon points="-110,-40 110,-40 140,50 -140,50" fill="#2d1d36" stroke="#c5a059" stroke-width="4"/>
      <polygon points="-100,-35 0,-30 0,40 -125,45" fill="#f4ebd0"/>
      <polygon points="100,-35 0,-30 0,40 125,45" fill="#f4ebd0"/>
      <!-- Runas Escritas Brilhando em Púrpura -->
      <line x1="-80" y1="-15" x2="-20" y2="-15" stroke="#7650b8" stroke-width="3"/>
      <line x1="-80" y1="0" x2="-20" y2="0" stroke="#7650b8" stroke-width="3"/>
      <line x1="-80" y1="15" x2="-35" y2="15" stroke="#7650b8" stroke-width="3"/>
      <line x1="20" y1="-15" x2="80" y2="-15" stroke="#7650b8" stroke-width="3"/>
      <line x1="20" y1="0" x2="80" y2="0" stroke="#7650b8" stroke-width="3"/>
      <!-- Símbolo de REVELARE no Centro -->
      <circle cx="0" cy="5" r="16" fill="#a58ae8"/>
      <polygon points="0,-6 4,4 -4,4" fill="#fff"/>
    </g>

    <!-- Lâmpada de Banqueiro Antiga / Vela de Estudo (Esquerda da Mesa) -->
    <circle cx="680" cy="790" r="120" fill="url(#desk-lamp)"/>
    <ellipse cx="680" cy="850" rx="22" ry="8" fill="#c5a059"/>
    <rect x="677" y="800" width="6" height="50" fill="#c5a059"/>
    <ellipse cx="680" cy="795" rx="18" ry="10" fill="#2e7d32" stroke="#1b5e20" stroke-width="2"/>
    <circle cx="680" cy="800" r="6" fill="#fff"/>

    <!-- Pilhas de Manuscritos e Pergaminhos Espalhados -->
    <rect x="1180" y="820" width="90" height="15" fill="#e8dfc8" stroke="#333" stroke-width="1"/>
    <rect x="1190" y="808" width="85" height="14" fill="#e2d6b8" stroke="#333" stroke-width="1"/>
    <rect x="1175" y="796" width="95" height="14" fill="#edd0a4" stroke="#333" stroke-width="1"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.4 FASE 3: O Laboratório de Alquimia das Sombras (Grande Caldeirão Fumegante, Frascos e Alambiques)
export function getAlchemyLabArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="alc-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#04080e"/>
        <stop offset="50%" stop-color="#091824"/>
        <stop offset="100%" stop-color="#050e14"/>
      </linearGradient>
      <radialGradient id="cauldron-fire" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4ef0c4" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#3a86ff" stop-opacity="0.45"/>
        <stop offset="75%" stop-color="#7209b7" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="vial-emerald" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#69f0ae"/>
        <stop offset="100%" stop-color="#004d40"/>
      </radialGradient>
      <radialGradient id="vial-amethyst" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ea80fc"/>
        <stop offset="100%" stop-color="#4a148c"/>
      </radialGradient>
      <radialGradient id="vial-amber" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffd54f"/>
        <stop offset="100%" stop-color="#e65100"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#alc-dark)"/>

    <!-- Teto Abobadado de Pedra Rústica com Vigas de Carvalho e Ramos Secos -->
    <path d="M 0 0 Q 960 220 1920 0 L 1920 100 Q 960 280 0 100 Z" fill="#0d1822" stroke="#1d2e3d" stroke-width="3"/>
    <!-- Feixes de Ervas Suspensos do Teto -->
    <path d="M 420 80 L 410 180 M 420 80 L 425 190 M 420 80 L 435 175" stroke="#3b4d2b" stroke-width="4"/>
    <path d="M 1480 80 L 1470 170 M 1480 80 L 1490 185 M 1480 80 L 1495 165" stroke="#5c4033" stroke-width="4"/>

    <!-- Prateleiras de Alquimia Repletas de Frascos (Lado Esquerdo) -->
    <rect x="80" y="220" width="520" height="24" fill="#241a12" stroke="#3b2b1e" stroke-width="3"/>
    <rect x="80" y="440" width="520" height="24" fill="#241a12" stroke="#3b2b1e" stroke-width="3"/>
    <!-- Frascos na Prateleira Superior Esquerda -->
    <circle cx="160" cy="180" r="30" fill="url(#vial-emerald)"/>
    <rect x="153" y="130" width="14" height="25" fill="#f0ebd8" stroke="#444" stroke-width="2"/>
    <ellipse cx="260" cy="175" rx="22" ry="35" fill="url(#vial-amethyst)"/>
    <rect x="252" y="125" width="16" height="20" fill="#f0ebd8" stroke="#444" stroke-width="2"/>
    <circle cx="360" cy="180" r="28" fill="url(#vial-amber)"/>
    <rect x="353" y="135" width="14" height="20" fill="#f0ebd8" stroke="#444" stroke-width="2"/>
    <rect x="440" y="150" width="35" height="65" rx="6" fill="#3a86ff" opacity="0.85"/>

    <!-- Prateleiras de Alquimia (Lado Direito) com Alambiques de Vidro -->
    <rect x="1320" y="220" width="520" height="24" fill="#241a12" stroke="#3b2b1e" stroke-width="3"/>
    <rect x="1320" y="440" width="520" height="24" fill="#241a12" stroke="#3b2b1e" stroke-width="3"/>
    <circle cx="1440" cy="180" r="32" fill="url(#vial-amethyst)"/>
    <rect x="1540" y="145" width="40" height="70" rx="8" fill="#4ef0c4" opacity="0.85"/>
    <circle cx="1660" cy="180" r="28" fill="url(#vial-emerald)"/>
    <!-- Tubos de Destilação em Serpentina de Vidro -->
    <path d="M 1470 170 Q 1500 130 1530 170 T 1590 170" fill="none" stroke="#76e5fc" stroke-width="6" opacity="0.75"/>

    <!-- O Grande Caldeirão de Ferro Fundido no Centro -->
    <g transform="translate(960, 740)">
      <!-- Fogo Místico / Resplendor Esmeralda e Safira -->
      <circle cx="0" cy="40" r="320" fill="url(#cauldron-fire)"/>

      <!-- Pernas Tripé de Ferro -->
      <line x1="-180" y1="120" x2="-260" y2="300" stroke="#10141d" stroke-width="32" stroke-linecap="round"/>
      <line x1="180" y1="120" x2="260" y2="300" stroke="#10141d" stroke-width="32" stroke-linecap="round"/>
      <line x1="0" y1="140" x2="0" y2="310" stroke="#0b0e14" stroke-width="28" stroke-linecap="round"/>

      <!-- Corpo Bojudo do Caldeirão -->
      <ellipse cx="0" cy="110" rx="250" ry="170" fill="#141a24" stroke="#253142" stroke-width="10"/>

      <!-- Borda do Caldeirão e Superfície da Poção da Lembrança -->
      <ellipse cx="0" cy="0" rx="240" ry="60" fill="#0c161a" stroke="#4ef0c4" stroke-width="8"/>
      <ellipse cx="0" cy="0" rx="215" ry="48" fill="#144238" opacity="0.95"/>

      <!-- Bolhas Místicas Alquímicas Subindo -->
      <circle cx="-90" cy="-10" r="18" fill="#4ef0c4" opacity="0.8"/>
      <circle cx="60" cy="-5" r="14" fill="#76e5fc" opacity="0.8"/>
      <circle cx="-20" cy="10" r="22" fill="#a58ae8" opacity="0.75"/>
      <circle cx="120" cy="-15" r="12" fill="#4ef0c4" opacity="0.8"/>

      <!-- Volutas de Fumaça e Vapor Mágico Subindo aos Céus -->
      <path d="M -90 -40 Q -160 -180 -60 -280 T 20 -420" fill="none" stroke="#4ef0c4" stroke-width="16" opacity="0.4" stroke-linecap="round"/>
      <path d="M 60 -40 Q 140 -160 70 -290 T 110 -430" fill="none" stroke="#a58ae8" stroke-width="14" opacity="0.35" stroke-linecap="round"/>
    </g>

    <!-- Bancada de Pedra à Frente com Reagentes de Alquimia -->
    <polygon points="0,980 1920,980 1920,1080 0,1080" fill="#0d141c" stroke="#1f2c38" stroke-width="4"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.5 FASE 4: Os Dormitórios da Noite (Lareira de Pedra, Janela Ogival e Baú dos Crowe)
export function getDormitoryArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="dorm-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#050612"/>
        <stop offset="50%" stop-color="#0f152d"/>
        <stop offset="100%" stop-color="#090d1c"/>
      </linearGradient>
      <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff9933" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#e65100" stop-opacity="0.5"/>
        <stop offset="75%" stop-color="#7650b8" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="moon-window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c5d8ff" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0c142b" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#dorm-dark)"/>

    <!-- Janela Gótica Central Alta Dando para a Noite Chuvosa de Noctária -->
    <g transform="translate(800, 140)">
      <path d="M 0 540 L 0 220 Q 0 0 160 0 Q 320 0 320 220 L 320 540 Z" fill="#091024" stroke="#243b70" stroke-width="10"/>
      <polygon points="160,0 -80,780 400,780" fill="url(#moon-window)"/>
      <!-- Esquadrias de Ferro Góticas -->
      <line x1="160" y1="0" x2="160" y2="540" stroke="#162347" stroke-width="5"/>
      <line x1="0" y1="240" x2="320" y2="240" stroke="#162347" stroke-width="5"/>
      <line x1="0" y1="380" x2="320" y2="380" stroke="#162347" stroke-width="5"/>
      <!-- Lua ao Longe Vista pela Janela -->
      <circle cx="160" cy="140" r="45" fill="#f0f5ff" opacity="0.85"/>
    </g>

    <!-- Grande Lareira Medieval de Cantaria na Parede Esquerda -->
    <g transform="translate(180, 440)">
      <!-- Brilho Acolhedor do Fogo -->
      <circle cx="200" cy="300" r="320" fill="url(#fire-glow)"/>
      <!-- Moldura de Pedra Talhada -->
      <path d="M 0 580 L 0 140 Q 200 60 400 140 L 400 580 Z" fill="#151926" stroke="#2d354d" stroke-width="10"/>
      <!-- Boca da Lareira Escura -->
      <path d="M 60 580 L 60 260 Q 200 200 340 260 L 340 580 Z" fill="#080a10"/>
      <!-- Toras de Carvalho Queimando em Brasas -->
      <polygon points="120,540 280,540 240,480 160,480" fill="#2d1508"/>
      <polygon points="140,510 260,510 200,410" fill="#ff7722"/>
      <polygon points="165,490 235,490 200,430" fill="#ffdd55"/>
      <!-- O Tijolo Falso Onde Estava Oculta a Chave de Ferro dos Crowe -->
      <rect x="25" y="440" width="30" height="20" fill="#2b3345" stroke="#ffaa33" stroke-width="2"/>
    </g>

    <!-- Escrivaninha de Elias e o Baú Trancado dos Crowe (Direita) -->
    <g transform="translate(1320, 580)">
      <!-- Mesa de Carvalho Antigo com Papeis e Frascos -->
      <polygon points="0,120 440,120 480,360 -40,360" fill="#18111e" stroke="#2d2138" stroke-width="4"/>
      <!-- O Solene Baú de Ferro com Brasão do Corvo no Chão -->
      <g transform="translate(120, 260)">
        <rect x="0" y="0" width="220" height="150" rx="10" fill="#141724" stroke="#5376c8" stroke-width="6"/>
        <!-- Cinta Metálica com Rebites -->
        <line x1="45" y1="0" x2="45" y2="150" stroke="#243b70" stroke-width="10"/>
        <line x1="175" y1="0" x2="175" y2="150" stroke="#243b70" stroke-width="10"/>
        <!-- Placa Central com o Emblema do Corvo dos Crowe -->
        <circle cx="110" cy="75" r="30" fill="#090c17" stroke="#a58ae8" stroke-width="4"/>
        <!-- Silhueta do Corvo Alado -->
        <polygon points="110,60 120,75 110,90 100,75" fill="#a58ae8"/>
        <!-- Fechadura de Bronze da Primeira Chave Dimensional -->
        <circle cx="110" cy="115" r="7" fill="#c5a059"/>
        <polygon points="107,115 113,115 111,126 109,126" fill="#c5a059"/>
      </g>
    </g>

    <!-- Piso de Madeira Escura Envelhecida com Tapete Gótico -->
    <polygon points="0,840 1920,840 1920,1080 0,1080" fill="#0a0d18" stroke="#161c30" stroke-width="3"/>
    <!-- Tapete Bordado Violeta e Prata no Centro -->
    <polygon points="640,870 1280,870 1420,1060 500,1060" fill="#1e1330" stroke="#7650b8" stroke-width="4"/>
    <ellipse cx="960" cy="965" rx="240" ry="65" fill="none" stroke="#a58ae8" stroke-width="2" stroke-dasharray="8 6"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.6 FASE 5: A Ala Lacrada (Mansão Primitiva, Correntes Antigas, Retratos Históricos e Círculo Rúnico)
export function getSealedWingArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="seal-void" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#04020a"/>
        <stop offset="50%" stop-color="#120822"/>
        <stop offset="100%" stop-color="#06020c"/>
      </linearGradient>
      <radialGradient id="ward-trap" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff2a55" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="#7650b8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mirror-ghost" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e8e8f2" stop-opacity="0.7"/>
        <stop offset="50%" stop-color="#a58ae8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#seal-void)"/>

    <!-- Paredes em Ruínas e Alvenaria Desmoronada da Fundação Antiga -->
    <path d="M 0 1080 L 260 560 L 440 640 L 620 480 L 800 600 L 1120 600 L 1300 480 L 1480 640 L 1660 560 L 1920 1080 Z" fill="#0d071a" stroke="#24143d" stroke-width="8"/>

    <!-- Correntes de Ferro Monumentais Penduradas do Teto Lacrando a Passagem -->
    <g stroke="#3a3648" stroke-width="16" stroke-dasharray="18 12">
      <line x1="380" y1="0" x2="480" y2="580"/>
      <line x1="1540" y1="0" x2="1440" y2="580"/>
      <line x1="960" y1="0" x2="960" y2="480" stroke="#7650b8" stroke-width="12"/>
    </g>

    <!-- Galeria Cronológica de Retratos Proibidos na Parede dos Fundos -->
    <g transform="translate(560, 220)">
      <!-- Quadro 1: 1842 (Primeiro Arquivista Crowe) -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="200" height="270" rx="4" fill="#100b1a" stroke="#7650b8" stroke-width="8"/>
        <rect x="15" y="15" width="170" height="200" fill="#181226"/>
        <circle cx="100" cy="90" r="35" fill="#302048"/>
        <rect x="65" y="130" width="70" height="85" fill="#201532"/>
        <text x="100" y="245" font-family="serif" font-size="22" fill="#a58ae8" font-weight="bold" text-anchor="middle">1842 • Fundação</text>
      </g>
      <!-- Quadro 2: 1899 (O Grande Incêndio Rúnico) -->
      <g transform="translate(290, 0)">
        <rect x="0" y="0" width="200" height="270" rx="4" fill="#100b1a" stroke="#5376c8" stroke-width="8"/>
        <rect x="15" y="15" width="170" height="200" fill="#10182c"/>
        <polygon points="100,60 140,150 60,150" fill="#ff6633" opacity="0.8"/>
        <polygon points="100,75 130,150 70,150" fill="#ffdd44"/>
        <text x="100" y="245" font-family="serif" font-size="22" fill="#5376c8" font-weight="bold" text-anchor="middle">1899 • Incêndio</text>
      </g>
      <!-- Quadro 3: 1923 (O Conclave Secreto de Morgana Vale) -->
      <g transform="translate(580, 0)">
        <rect x="0" y="0" width="200" height="270" rx="4" fill="#100b1a" stroke="#e85d75" stroke-width="8"/>
        <rect x="15" y="15" width="170" height="200" fill="#240c14"/>
        <circle cx="100" cy="90" r="35" fill="#4d1624"/>
        <rect x="65" y="130" width="70" height="85" fill="#360e19"/>
        <text x="100" y="245" font-family="serif" font-size="22" fill="#e85d75" font-weight="bold" text-anchor="middle">1923 • Selamento</text>
      </g>
    </g>

    <!-- Espelho Espectral Trincado no Centro (Manifestação do Passado de Morgana) -->
    <g transform="translate(960, 480)">
      <circle cx="0" cy="0" r="90" fill="url(#mirror-ghost)"/>
      <ellipse cx="0" cy="0" rx="60" ry="85" fill="#0d071a" stroke="#a58ae8" stroke-width="4"/>
      <!-- Rachadura do Espelho -->
      <path d="M 0 -85 L 10 -20 L -15 30 L 5 85" stroke="#ffffff" stroke-width="3" fill="none"/>
    </g>

    <!-- Armadilha Rúnica Perigosa no Chão (Círculo de Espinhos Carmesim) -->
    <g transform="translate(960, 880)">
      <circle cx="0" cy="0" r="220" fill="url(#ward-trap)"/>
      <!-- Runas de Contenção -->
      <circle cx="0" cy="0" r="180" fill="none" stroke="#ff2a55" stroke-width="6"/>
      <polygon points="0,-160 138,80 -138,80" fill="none" stroke="#ff2a55" stroke-width="4"/>
      <polygon points="0,160 138,-80 -138,-80" fill="none" stroke="#ff2a55" stroke-width="4"/>
      <circle cx="0" cy="0" r="45" fill="#120517" stroke="#a58ae8" stroke-width="4"/>
      <text x="0" y="8" font-family="serif" font-size="24" fill="#ffffff" font-weight="bold" text-anchor="middle">✦</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.7 FASE 6: A Galeria das Mil Portas (Vazio Cósmico, Abismo Estelar e os 5 Portais Dimensionais)
export function getGalleryDoorsArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="void-cosmic" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#010105"/>
        <stop offset="50%" stop-color="#080724"/>
        <stop offset="100%" stop-color="#0b031c"/>
      </linearGradient>
      <radialGradient id="portal-stars-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e2c8ff" stop-opacity="0.95"/>
        <stop offset="35%" stop-color="#a58ae8" stop-opacity="0.7"/>
        <stop offset="70%" stop-color="#3a86ff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mirror-door-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#c0d2f5" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#void-cosmic)"/>

    <!-- Constelações e Galáxias Distantes no Vazio -->
    <g fill="#ffffff">
      <circle cx="200" cy="180" r="2"/>
      <circle cx="340" cy="120" r="3"/>
      <circle cx="560" cy="90" r="1.5"/>
      <circle cx="820" cy="70" r="2.5"/>
      <circle cx="1120" cy="80" r="3"/>
      <circle cx="1380" cy="140" r="2"/>
      <circle cx="1620" cy="110" r="2.5"/>
      <circle cx="1800" cy="200" r="1.5"/>
    </g>

    <!-- Passadiço de Pedra Flutuante Suspensa sobre o Abismo Estelar -->
    <polygon points="0,1080 540,780 1380,780 1920,1080" fill="#0d0e26" stroke="#243b70" stroke-width="5"/>
    <line x1="580" y1="840" x2="1340" y2="840" stroke="#7650b8" stroke-width="3" stroke-dasharray="16 12"/>

    <!-- OS 5 PORTAIS DIMENSIONAIS DA GALERIA -->

    <!-- Porta 1: A Porta dos Espelhos (Extrema Esquerda) -->
    <g transform="translate(140, 400)">
      <rect x="0" y="0" width="160" height="300" rx="8" fill="#0c1630" stroke="#5376c8" stroke-width="6"/>
      <ellipse cx="80" cy="150" rx="50" ry="100" fill="url(#mirror-door-glow)"/>
      <text x="80" y="335" font-family="serif" font-size="16" fill="#5376c8" font-weight="bold" text-anchor="middle">🪞 Espelhos</text>
    </g>

    <!-- Porta 2: A Porta do Pêndulo / Mecânica (Centro-Esquerda) -->
    <g transform="translate(460, 320)">
      <rect x="0" y="0" width="170" height="330" rx="8" fill="#1e150e" stroke="#c5a059" stroke-width="6"/>
      <circle cx="85" cy="165" r="55" fill="#2d1f14" stroke="#c5a059" stroke-width="4"/>
      <!-- Pêndulo Interior -->
      <line x1="85" y1="110" x2="85" y2="200" stroke="#c5a059" stroke-width="5"/>
      <circle cx="85" cy="205" r="15" fill="#ffd54f"/>
      <text x="85" y="365" font-family="serif" font-size="16" fill="#c5a059" font-weight="bold" text-anchor="middle">⏳ Pêndulo</text>
    </g>

    <!-- Porta 3: A PORTA DAS ESTRELAS (Centro — O Portal para o Entretempo) -->
    <g transform="translate(840, 200)">
      <!-- Halo Místico Estelar Majestoso -->
      <circle cx="120" cy="200" r="260" fill="url(#portal-stars-glow)"/>
      <!-- Moldura de Obsidiana com Treze Estrelas Côncavas -->
      <rect x="20" y="0" width="200" height="400" rx="14" fill="#140728" stroke="#a58ae8" stroke-width="10"/>
      <!-- A Constelação Sagrada de Noctária Dentro da Porta -->
      <g stroke="#ffffff" stroke-width="3" fill="#ffffff">
        <circle cx="120" cy="110" r="8"/>
        <circle cx="70" cy="170" r="6"/>
        <circle cx="170" cy="170" r="6"/>
        <circle cx="120" cy="230" r="7"/>
        <circle cx="85" cy="290" r="6"/>
        <circle cx="155" cy="290" r="6"/>
        <line x1="120" y1="110" x2="70" y2="170"/>
        <line x1="120" y1="110" x2="170" y2="170"/>
        <line x1="70" y1="170" x2="120" y2="230"/>
        <line x1="170" y1="170" x2="120" y2="230"/>
        <line x1="120" y1="230" x2="85" y2="290"/>
        <line x1="120" y1="230" x2="155" y2="290"/>
      </g>
      <!-- Fechadura Estelar Resplandecente para a Chave de Ébano -->
      <circle cx="120" cy="330" r="16" fill="#e8e8f2" stroke="#a58ae8" stroke-width="4"/>
      <text x="120" y="440" font-family="serif" font-size="20" fill="#a58ae8" font-weight="bold" text-anchor="middle">✦ Porta das Estrelas ✦</text>
    </g>

    <!-- Porta 4: A Porta das Cinzas (Centro-Direita) -->
    <g transform="translate(1280, 320)">
      <rect x="0" y="0" width="170" height="330" rx="8" fill="#16171d" stroke="#8c8d9e" stroke-width="6"/>
      <polygon points="85,110 140,220 30,220" fill="#242530" stroke="#8c8d9e" stroke-width="4"/>
      <text x="85" y="365" font-family="serif" font-size="16" fill="#8c8d9e" font-weight="bold" text-anchor="middle">🕯 Cinzas</text>
    </g>

    <!-- Porta 5: A Porta dos Espinhos (Extrema Direita) -->
    <g transform="translate(1620, 400)">
      <rect x="0" y="0" width="160" height="300" rx="8" fill="#1e0c12" stroke="#b7243c" stroke-width="6"/>
      <path d="M 30 70 Q 90 150 140 230 M 130 70 Q 70 150 20 230" stroke="#b7243c" stroke-width="8"/>
      <text x="80" y="335" font-family="serif" font-size="16" fill="#b7243c" font-weight="bold" text-anchor="middle">🥀 Espinhos</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.8 FASE 7: O Reino Onde o Tempo Parou (Dimensão do Entretempo, Relógios Estilhaçados e Gravidade Invertida)
export function getTimelessRealmArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="time-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#030812"/>
        <stop offset="50%" stop-color="#0a1a33"/>
        <stop offset="100%" stop-color="#040914"/>
      </linearGradient>
      <radialGradient id="shatter-time-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#76e5fc" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#5376c8" stop-opacity="0.45"/>
        <stop offset="80%" stop-color="#7650b8" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="echo-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4ef0c4" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="#141f3d" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#time-dark)"/>

    <!-- Fragmentos Arquitetônicos Flutuando em Gravidade Zero -->
    <polygon points="240,140 480,70 420,380 180,320" fill="#0b1b30" stroke="#76e5fc" stroke-width="4" opacity="0.75"/>
    <polygon points="1440,90 1720,190 1600,440 1360,300" fill="#0b1b30" stroke="#76e5fc" stroke-width="4" opacity="0.75"/>
    <polygon points="860,60 1060,40 1020,180 820,160" fill="#0b1b30" stroke="#5376c8" stroke-width="3" opacity="0.65"/>

    <!-- O Colossal Mostrador de Relógio Parado na 13ª Hora no Centro -->
    <g transform="translate(960, 480)">
      <circle cx="0" cy="0" r="320" fill="url(#shatter-time-glow)"/>
      <circle cx="0" cy="0" r="230" fill="#091326" stroke="#76e5fc" stroke-width="8"/>
      <circle cx="0" cy="0" r="190" fill="none" stroke="#a58ae8" stroke-width="4" stroke-dasharray="18 14"/>

      <!-- As Treze Marcas Horárias Numerais Arcanos -->
      <circle cx="0" cy="-190" r="12" fill="#fff"/>
      <circle cx="88" cy="-168" r="8" fill="#a58ae8"/>
      <circle cx="158" cy="-105" r="8" fill="#a58ae8"/>
      <circle cx="187" cy="-23" r="8" fill="#a58ae8"/>
      <circle cx="168" cy="88" r="8" fill="#a58ae8"/>
      <circle cx="105" cy="158" r="8" fill="#a58ae8"/>
      <circle cx="0" cy="190" r="10" fill="#4ef0c4"/>
      <circle cx="-105" cy="158" r="8" fill="#a58ae8"/>
      <circle cx="-168" cy="88" r="8" fill="#a58ae8"/>
      <circle cx="-187" cy="-23" r="8" fill="#a58ae8"/>
      <circle cx="-158" cy="-105" r="8" fill="#a58ae8"/>
      <circle cx="-88" cy="-168" r="8" fill="#a58ae8"/>

      <!-- Ponteiros Congelados e Quebrados Apontando para o Vazio -->
      <line x1="0" y1="0" x2="0" y2="-170" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="60" y2="-140" stroke="#76e5fc" stroke-width="8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="24" fill="#a58ae8" stroke="#fff" stroke-width="4"/>
    </g>

    <!-- As 3 Silhuetas Espectrais dos Ecos de Seraphine no Espaço -->
    <!-- Eco 1: Esquerda -->
    <g transform="translate(420, 680)">
      <circle cx="0" cy="0" r="120" fill="url(#echo-glow)"/>
      <ellipse cx="0" cy="20" rx="35" ry="110" fill="#4ef0c4" opacity="0.35"/>
      <circle cx="0" cy="-110" r="26" fill="#a58ae8" opacity="0.5"/>
      <text x="0" y="160" font-family="serif" font-size="16" fill="#4ef0c4" font-weight="bold" text-anchor="middle">Eco I: O Ritual</text>
    </g>

    <!-- Eco 2: Direita -->
    <g transform="translate(1500, 680)">
      <circle cx="0" cy="0" r="120" fill="url(#echo-glow)"/>
      <ellipse cx="0" cy="20" rx="35" ry="110" fill="#4ef0c4" opacity="0.35"/>
      <circle cx="0" cy="-110" r="26" fill="#a58ae8" opacity="0.5"/>
      <text x="0" y="160" font-family="serif" font-size="16" fill="#4ef0c4" font-weight="bold" text-anchor="middle">Eco II: Morgana</text>
    </g>

    <!-- Eco 3: Centro Superior -->
    <g transform="translate(960, 220)">
      <circle cx="0" cy="0" r="110" fill="url(#echo-glow)"/>
      <ellipse cx="0" cy="15" rx="30" ry="90" fill="#4ef0c4" opacity="0.4"/>
      <circle cx="0" cy="-90" r="22" fill="#fff" opacity="0.6"/>
      <text x="0" y="130" font-family="serif" font-size="16" fill="#4ef0c4" font-weight="bold" text-anchor="middle">Eco III: A Carta</text>
    </g>

    <!-- Plataforma Temporal Quebrada Onde Seraphine Está Presa -->
    <polygon points="560,920 1360,920 1480,1080 440,1080" fill="#0c1729" stroke="#76e5fc" stroke-width="4"/>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.9 FASE 8: O Ritual das Treze Badaladas (Câmara Subterrânea, Altar de Obsidiana e Pêndulos Cósmicos)
export function getCentralChamberArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="chamber-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#080212"/>
        <stop offset="50%" stop-color="#1f0733"/>
        <stop offset="100%" stop-color="#05010a"/>
      </linearGradient>
      <radialGradient id="altar-cosmic-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f72585" stop-opacity="0.95"/>
        <stop offset="35%" stop-color="#7209b7" stop-opacity="0.75"/>
        <stop offset="70%" stop-color="#4361ee" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="chime-socket-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4ef0c4"/>
        <stop offset="100%" stop-color="#7209b7"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="1080" fill="url(#chamber-dark)"/>

    <!-- Treze Pilares Monolíticos de Pedra Negra ao Fundo -->
    <g stroke="#350c59" stroke-width="12">
      <line x1="160" y1="0" x2="160" y2="1080"/>
      <line x1="380" y1="0" x2="380" y2="1080"/>
      <line x1="600" y1="0" x2="600" y2="1080"/>
      <line x1="1320" y1="0" x2="1320" y2="1080"/>
      <line x1="1540" y1="0" x2="1540" y2="1080"/>
      <line x1="1760" y1="0" x2="1760" y2="1080"/>
    </g>

    <!-- Fissura Dimensional Cósmica no Teto Subterrâneo -->
    <polygon points="960,0 840,160 990,260 940,380 960,340 1080,180" fill="#f72585" opacity="0.8"/>

    <!-- O Grande Círculo Altar das Treze Badaladas Cósmicas -->
    <g transform="translate(960, 680)">
      <!-- Halo Cósmico Pulsante -->
      <circle cx="0" cy="0" r="420" fill="url(#altar-cosmic-glow)"/>

      <!-- Anel de Pedra Rúnica com os 13 Encaixes de Chaves -->
      <circle cx="0" cy="0" r="340" fill="#140624" stroke="#f72585" stroke-width="10"/>
      <circle cx="0" cy="0" r="250" fill="none" stroke="#a58ae8" stroke-width="5" stroke-dasharray="20 14"/>

      <!-- Os 13 Soquetes Rúnicos Mágicos Equidistantes -->
      <circle cx="0" cy="-340" r="22" fill="url(#chime-socket-glow)" stroke="#ffffff" stroke-width="4"/>
      <circle cx="160" cy="-300" r="18" fill="#a58ae8"/>
      <circle cx="286" cy="-186" r="18" fill="#a58ae8"/>
      <circle cx="339" cy="-33" r="18" fill="#a58ae8"/>
      <circle cx="305" cy="153" r="18" fill="#a58ae8"/>
      <circle cx="190" cy="282" r="18" fill="#a58ae8"/>
      <circle cx="0" cy="340" r="22" fill="url(#chime-socket-glow)" stroke="#ffffff" stroke-width="4"/>
      <circle cx="-190" cy="282" r="18" fill="#a58ae8"/>
      <circle cx="-305" cy="153" r="18" fill="#a58ae8"/>
      <circle cx="-339" cy="-33" r="18" fill="#a58ae8"/>
      <circle cx="-286" cy="-186" r="18" fill="#a58ae8"/>
      <circle cx="-160" cy="-300" r="18" fill="#a58ae8"/>

      <!-- Obelisco de Obsidiana Central Onde Repousam as Chaves -->
      <polygon points="0,-180 90,60 -90,60" fill="#1a072d" stroke="#f72585" stroke-width="6"/>
      <circle cx="0" cy="-50" r="34" fill="#ffffff" stroke="#f72585" stroke-width="5"/>
      <polygon points="0,-70 12,-40 38,-40 18,-20 28,10 0,-10 -28,10 -18,-20 -38,-40 -12,-40" fill="#7209b7"/>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

// 1.10 EPÍLOGO: O Outro Lado (Aposentos do Protagonista com a Alvorada, Nova Carta e Chave de Prata)
export function getEpilogueRoomArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="dawn-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0b132b"/>
        <stop offset="45%" stop-color="#1c2541"/>
        <stop offset="85%" stop-color="#5bc0be"/>
        <stop offset="100%" stop-color="#e8d7f1"/>
      </linearGradient>
      <radialGradient id="candle-soft" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffdd88" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#ff9933" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="silver-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#b8c0d9"/>
        <stop offset="100%" stop-color="#727b99"/>
      </linearGradient>
    </defs>

    <rect width="1920" height="1080" fill="#080c1d"/>

    <!-- Janela Gótica Alta com a Primeira Luz da Alvorada Entrando -->
    <g transform="translate(800, 100)">
      <path d="M 0 540 L 0 200 Q 160 0 320 200 L 320 540 Z" fill="url(#dawn-sky)" stroke="#243b70" stroke-width="8"/>
      <!-- Estrela da Manhã Solitária -->
      <circle cx="160" cy="180" r="6" fill="#ffffff"/>
      <!-- Feixe Dourado e Azulado Invadindo o Quarto -->
      <polygon points="160,180 -180,880 500,880" fill="#5bc0be" opacity="0.15"/>
    </g>

    <!-- Escrivaninha de Mogno Nobre no Centro em Primeiro Plano -->
    <polygon points="480,720 1440,720 1560,1080 360,1080" fill="#181122" stroke="#332442" stroke-width="5"/>

    <!-- Candelabro com Vela de Cera Acesa na Esquerda -->
    <g transform="translate(680, 680)">
      <circle cx="0" cy="0" r="160" fill="url(#candle-soft)"/>
      <ellipse cx="0" cy="80" rx="30" ry="12" fill="#c5a059"/>
      <rect x="-6" y="20" width="12" height="65" fill="#f0ebd8"/>
      <!-- Chama da Vela -->
      <path d="M -8 18 Q 0 -25 0 -35 Q 0 -25 8 18 Z" fill="#ffdd66"/>
      <circle cx="0" cy="5" r="4" fill="#ffffff"/>
    </g>

    <!-- A Nova Carta sem Remetente Repousando no Centro da Mesa -->
    <g transform="translate(960, 840)">
      <!-- Envelope de Pergaminho Negro Luxuoso -->
      <rect x="-90" y="-55" width="180" height="110" rx="6" fill="#14111f" stroke="#7650b8" stroke-width="5"/>
      <!-- Aba do Envelope com Selo de Cera Violeta com Treze Estrelas -->
      <polygon points="-90,-55 90,-55 0,15" fill="#1e1830"/>
      <circle cx="0" cy="15" r="26" fill="#7650b8" stroke="#a58ae8" stroke-width="3"/>
      <!-- Emblema de Porta Estelar no Selo -->
      <polygon points="0,-3 9,15 -9,15" fill="#ffffff"/>

      <!-- A Chave Prateada Impossível Repousando Sobre o Envelope -->
      <g transform="translate(40, -10) rotate(-25)">
        <circle cx="0" cy="0" r="22" fill="none" stroke="url(#silver-sheen)" stroke-width="8"/>
        <line x1="22" y1="0" x2="110" y2="0" stroke="url(#silver-sheen)" stroke-width="10" stroke-linecap="round"/>
        <!-- Dentes em Geometria Fractal Arcanos -->
        <line x1="80" y1="0" x2="80" y2="18" stroke="url(#silver-sheen)" stroke-width="8"/>
        <line x1="100" y1="0" x2="100" y2="24" stroke="url(#silver-sheen)" stroke-width="8"/>
        <!-- Brilho Místico Prateado -->
        <circle cx="110" cy="0" r="12" fill="#ffffff" opacity="0.8"/>
      </g>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

/* ==========================================================================
   2. ILUSTRAÇÕES DE PISTAS, RELÍQUIAS E MOMENTOS DA NARRATIVA (INSPECT MODALS)
   ========================================================================== */

export const STORY_ILLUSTRATIONS = {
  // Prólogo: A Carta Caída na Escadaria
  prologue_letter: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#080c1d"/>
    <!-- Escada de Pedra Gótica -->
    <polygon points="0,450 180,260 800,260 800,450" fill="#12182b" stroke="#243b70" stroke-width="3"/>
    <!-- Envelope caído com névoa rastejante -->
    <g transform="translate(360, 240) rotate(-8)">
      <rect x="-140" y="-85" width="280" height="170" rx="6" fill="#1c162b" stroke="#7650b8" stroke-width="4"/>
      <polygon points="-140,-85 140,-85 0,20" fill="#292040"/>
      <!-- Selo de cera com treze estrelas -->
      <circle cx="0" cy="20" r="28" fill="#7650b8" stroke="#a58ae8" stroke-width="3"/>
      <polygon points="0,5 12,25 -12,25" fill="#fff"/>
      <text x="0" y="60" font-family="serif" font-size="14" fill="#a58ae8" text-anchor="middle">Noctária • 13 Badaladas</text>
    </g>
  </svg>`),

  // Prólogo: A Porta Fantasma que Desaparece
  phantom_door: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="phantom-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a58ae8" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="#5376c8" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#080c1d"/>
    <circle cx="400" cy="225" r="200" fill="url(#phantom-glow)"/>
    <!-- Moldura de Pedra Translúcida -->
    <rect x="290" y="80" width="220" height="340" rx="8" fill="#120c24" stroke="#a58ae8" stroke-width="8" opacity="0.85"/>
    <circle cx="400" cy="220" r="50" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>
    <!-- Efeito de dissolução em cinzas estelares -->
    <circle cx="480" cy="140" r="4" fill="#a58ae8"/>
    <circle cx="320" cy="180" r="5" fill="#fff"/>
    <circle cx="510" cy="260" r="3" fill="#a58ae8"/>
    <circle cx="340" cy="300" r="4" fill="#fff"/>
  </svg>`),

  // Fase 1: Mural de Avisos com Nome Apagado
  notice_board: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0d1021"/>
    <!-- Moldura de Madeira Escura do Mural -->
    <rect x="120" y="40" width="560" height="370" fill="#1b1426" stroke="#5376c8" stroke-width="6"/>
    <!-- Cartazes Fixados com Tachinhas -->
    <rect x="160" y="80" width="140" height="100" fill="#f5eedb"/>
    <rect x="330" y="70" width="160" height="120" fill="#ece4cc"/>
    <rect x="520" y="90" width="130" height="90" fill="#f5eedb"/>
    <!-- O Cartaz de Mérito Acadêmico com o Nome Seraphine Riscado -->
    <rect x="220" y="220" width="360" height="150" fill="#fffdf2" stroke="#243b70" stroke-width="3"/>
    <text x="400" y="260" font-family="serif" font-size="18" fill="#1a274c" font-weight="bold" text-anchor="middle">QUADRO DE HONRA • TURMA 42</text>
    <text x="400" y="300" font-family="serif" font-size="22" fill="#762020" font-weight="bold" text-anchor="middle">...phíne Ashf...d</text>
    <line x1="260" y1="295" x2="540" y2="295" stroke="#16121d" stroke-width="8"/>
    <text x="400" y="340" font-family="serif" font-size="13" fill="#666" text-anchor="middle">Registro sob censura da Diretoria</text>
  </svg>`),

  // Fase 1: Retrato Raspado com Lâmina
  erased_portrait: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0a0d1c"/>
    <!-- Moldura Barroca Dourada Antiga -->
    <rect x="260" y="30" width="280" height="390" rx="8" fill="#141724" stroke="#c5a059" stroke-width="10"/>
    <rect x="280" y="50" width="240" height="350" fill="#1b253d"/>
    <!-- Pintura da Estudante com Rosto Raspado a Faca -->
    <circle cx="400" cy="180" r="60" fill="#36394a"/>
    <!-- Riscos profundos de lâmina brancos e raspados -->
    <line x1="350" y1="130" x2="450" y2="230" stroke="#f0f0f5" stroke-width="8"/>
    <line x1="450" y1="130" x2="350" y2="230" stroke="#f0f0f5" stroke-width="8"/>
    <line x1="340" y1="180" x2="460" y2="180" stroke="#f0f0f5" stroke-width="6"/>
    <!-- Vestimenta Acadêmica Gótica -->
    <path d="M 330 380 L 370 240 L 430 240 L 470 380 Z" fill="#0f1629"/>
    <!-- Placa de Latão da Turma -->
    <rect x="330" y="370" width="140" height="24" fill="#c5a059"/>
    <text x="400" y="387" font-family="serif" font-size="13" fill="#080c1d" font-weight="bold" text-anchor="middle">S. A. • TURMA 42</text>
  </svg>`),

  // Fase 1: Livro de Matrículas com Folha 42 Arrancada
  altered_ledger: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#070a18"/>
    <!-- Grande Tomo de Matrículas Aberto -->
    <rect x="140" y="60" width="520" height="330" rx="6" fill="#1c121e" stroke="#c5a059" stroke-width="5"/>
    <rect x="160" y="80" width="240" height="290" fill="#f5eedb"/>
    <rect x="400" y="80" width="240" height="290" fill="#f5eedb"/>
    <!-- Folha 42 arrancada rente à costura -->
    <path d="M 400 80 L 415 120 L 402 160 L 416 220 L 401 290 L 414 370" stroke="#8a1c1c" stroke-width="6" fill="none"/>
    <!-- Bilhete dobrado escondido na fresta -->
    <rect x="420" y="180" width="190" height="90" fill="#ffffff" stroke="#7650b8" stroke-width="2"/>
    <text x="515" y="220" font-family="serif" font-size="14" fill="#161226" font-style="italic" text-anchor="middle">“Ela não atravessou</text>
    <text x="515" y="245" font-family="serif" font-size="14" fill="#161226" font-style="italic" text-anchor="middle">a porta sozinha.”</text>
  </svg>`),

  // Fase 2: Feitiço REVELARE Aprendido
  spell_revelare: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="rev-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#a58ae8" stop-opacity="0.8"/>
        <stop offset="70%" stop-color="#5376c8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#070918"/>
    <circle cx="400" cy="225" r="220" fill="url(#rev-glow)"/>
    <circle cx="400" cy="225" r="140" fill="none" stroke="#a58ae8" stroke-width="4" stroke-dasharray="14 10"/>
    <!-- A Runa de REVELARE: Olho Estelar da Clarividência -->
    <polygon points="400,110 430,200 520,225 430,250 400,340 370,250 280,225 370,200" fill="#a58ae8" stroke="#ffffff" stroke-width="3"/>
    <circle cx="400" cy="225" r="26" fill="#ffffff"/>
    <text x="400" y="390" font-family="serif" font-size="24" fill="#a58ae8" font-weight="bold" letter-spacing="4" text-anchor="middle">✦ REVELARE ✦</text>
  </svg>`),

  // Fase 3: A Poção da Lembrança e Visão de Seraphine
  memory_potion: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="potion-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4ef0c4" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="#3a86ff" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#060c14"/>
    <circle cx="400" cy="240" r="180" fill="url(#potion-core)"/>
    <!-- Frasco de Cristal Gótico Alquímico com Elixir Fumegante -->
    <g transform="translate(400, 240)">
      <circle cx="0" cy="40" r="90" fill="#144238" stroke="#4ef0c4" stroke-width="6"/>
      <rect x="-24" y="-70" width="48" height="60" fill="#1b2a38" stroke="#4ef0c4" stroke-width="4"/>
      <!-- Tampa de Prata Trabalhada -->
      <polygon points="-30,-70 30,-70 0,-100" fill="#c5a059"/>
      <!-- Líquido Luminescente com Lembranças Flutuantes -->
      <circle cx="-25" cy="40" r="12" fill="#ffffff" opacity="0.8"/>
      <circle cx="20" cy="55" r="8" fill="#76e5fc"/>
    </g>
    <text x="400" y="410" font-family="serif" font-size="20" fill="#4ef0c4" font-weight="bold" text-anchor="middle">Elixir da Memória • Destilado</text>
  </svg>`),

  // Fase 4: O Diário Secreto dos Crowe
  crowe_diary: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#090a18"/>
    <!-- Baú Aberto com Diário de Couro Escuro dos Crowe -->
    <rect x="220" y="60" width="360" height="300" rx="8" fill="#1c1424" stroke="#5376c8" stroke-width="6"/>
    <!-- Capa do Livro com Brasão do Corvo em Prata -->
    <rect x="250" y="90" width="300" height="240" rx="6" fill="#120e1a" stroke="#a58ae8" stroke-width="4"/>
    <circle cx="400" cy="180" r="45" fill="#1c162b" stroke="#a58ae8" stroke-width="3"/>
    <polygon points="400,150 415,180 400,210 385,180" fill="#a58ae8"/>
    <!-- A Primeira Chave Dimensional de Ferro dos Crowe -->
    <g transform="translate(400, 270)">
      <circle cx="-50" cy="0" r="18" fill="none" stroke="#c5a059" stroke-width="5"/>
      <line x1="-32" y1="0" x2="60" y2="0" stroke="#c5a059" stroke-width="7" stroke-linecap="round"/>
      <line x1="40" y1="0" x2="40" y2="14" stroke="#c5a059" stroke-width="6"/>
      <line x1="55" y1="0" x2="55" y2="18" stroke="#c5a059" stroke-width="6"/>
    </g>
    <text x="400" y="405" font-family="serif" font-size="18" fill="#a58ae8" font-weight="bold" text-anchor="middle">Primeira Chave Dimensional • Linhagem Crowe</text>
  </svg>`),

  // Fase 5: Gravação Mágica de Morgana Vale no Espelho
  morgana_mirror_spectral: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="spectral-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="35%" stop-color="#a58ae8" stop-opacity="0.8"/>
        <stop offset="70%" stop-color="#7650b8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#080312"/>
    <circle cx="400" cy="225" r="200" fill="url(#spectral-glow)"/>
    <!-- Silhueta Espectral da Diretora Morgana Entoando o Ritual de 1923 -->
    <ellipse cx="400" cy="200" rx="60" ry="120" fill="#1b0a2a" stroke="#a58ae8" stroke-width="4"/>
    <circle cx="400" cy="120" r="32" fill="#301548"/>
    <!-- Duas Chaves Cruzadas de Prata em suas Mãos -->
    <line x1="370" y1="210" x2="430" y2="250" stroke="#fff" stroke-width="5"/>
    <line x1="430" y1="210" x2="370" y2="250" stroke="#fff" stroke-width="5"/>
    <text x="400" y="390" font-family="serif" font-size="18" fill="#a58ae8" font-weight="bold" text-anchor="middle">✦ Gravação Arcana de 1923 Revelada ✦</text>
  </svg>`),

  // Fase 6: Pingente Estelar de Seraphine na Porta das Estrelas
  star_pendant: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="pendant-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#a58ae8" stop-opacity="0.8"/>
        <stop offset="80%" stop-color="#5376c8" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#04040d"/>
    <circle cx="400" cy="225" r="190" fill="url(#pendant-glow)"/>
    <!-- Corrente de Prata e Estrela das Mil Portas -->
    <path d="M 330 60 Q 400 160 400 180 Q 400 160 470 60" fill="none" stroke="#e8e8f2" stroke-width="5"/>
    <!-- A Estrela de Prata com Pedra de Safira Central -->
    <polygon points="400,150 415,200 465,215 415,230 400,280 385,230 335,215 385,200" fill="#e8e8f2" stroke="#a58ae8" stroke-width="4"/>
    <circle cx="400" cy="215" r="16" fill="#3a86ff" stroke="#ffffff" stroke-width="3"/>
    <text x="400" y="360" font-family="serif" font-size="20" fill="#a58ae8" font-weight="bold" text-anchor="middle">Pingente Pessoal de Seraphine Ashford</text>
  </svg>`),

  // Fase 7: O Eco Temporal e o Despertar de Seraphine
  timeless_echo: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="echo-res" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4ef0c4" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="#5376c8" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#040914"/>
    <circle cx="400" cy="225" r="210" fill="url(#echo-res)"/>
    <!-- Relógio Quebrado de Areia e Ecos -->
    <polygon points="360,110 440,110 400,200 440,290 360,290 400,200" fill="#0c1d33" stroke="#76e5fc" stroke-width="5"/>
    <circle cx="400" cy="200" r="12" fill="#fff"/>
    <text x="400" y="380" font-family="serif" font-size="20" fill="#4ef0c4" font-weight="bold" text-anchor="middle">✦ Eco Temporal Resgatado com MEMORIA ✦</text>
  </svg>`),

  // Fase 8: Os Três Finais de Noctária
  ending_choice: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="end-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f72585" stop-opacity="0.8"/>
        <stop offset="40%" stop-color="#7209b7" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="#06010d"/>
    <circle cx="400" cy="225" r="220" fill="url(#end-glow)"/>
    <!-- O Tríptico do Destino -->
    <circle cx="260" cy="220" r="70" fill="#0d142b" stroke="#5376c8" stroke-width="4"/>
    <text x="260" y="228" font-family="serif" font-size="34" fill="#5376c8" text-anchor="middle">🛡</text>
    <circle cx="400" cy="180" r="85" fill="#170929" stroke="#f72585" stroke-width="5"/>
    <text x="400" y="192" font-family="serif" font-size="44" fill="#f72585" text-anchor="middle">👑</text>
    <circle cx="540" cy="220" r="70" fill="#0d1f1e" stroke="#4ef0c4" stroke-width="4"/>
    <text x="540" y="228" font-family="serif" font-size="34" fill="#4ef0c4" text-anchor="middle">🌀</text>
    <text x="400" y="370" font-family="serif" font-size="22" fill="#fff" font-weight="bold" text-anchor="middle">O Destino Final das Mil Portas</text>
  </svg>`),

  // Epílogo: A Nova Carta e Chave do Além
  epilogue_letter: () => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#090d1c"/>
    <!-- Escrivaninha iluminada pela aurora -->
    <polygon points="100,450 700,450 750,220 50,220" fill="#1a1224" stroke="#332542" stroke-width="3"/>
    <!-- Envelope Negro com Selo Violeta e Chave Prateada Impossível -->
    <g transform="translate(400, 310)">
      <rect x="-140" y="-80" width="280" height="160" rx="6" fill="#120e1c" stroke="#7650b8" stroke-width="4"/>
      <circle cx="0" cy="0" r="28" fill="#7650b8" stroke="#a58ae8" stroke-width="3"/>
      <!-- Chave de Prata Cósmica Brilhando -->
      <circle cx="-60" cy="-20" r="18" fill="none" stroke="#ffffff" stroke-width="6"/>
      <line x1="-42" y1="-20" x2="60" y2="-20" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <line x1="30" y1="-20" x2="30" y2="-5" stroke="#ffffff" stroke-width="6"/>
      <line x1="50" y1="-20" x2="50" y2="-2" stroke="#ffffff" stroke-width="6"/>
    </g>
    <text x="400" y="160" font-family="serif" font-size="22" fill="#a58ae8" font-weight="bold" text-anchor="middle">“O limiar foi apenas o primeiro passo.”</text>
  </svg>`)
};

/* ==========================================================================
   3. BANCO GERAL DE CENAS E CAPÍTULOS
   ========================================================================== */

export const SCENE_BACKGROUNDS = {
  courtyard: getCourtyardArt,
  ashes_hall: getAshesHallArt,
  library: getLibraryArt,
  alchemy_lab: getAlchemyLabArt,
  dormitory: getDormitoryArt,
  sealed_wing: getSealedWingArt,
  gallery_doors: getGalleryDoorsArt,
  timeless_realm: getTimelessRealmArt,
  central_chamber: getCentralChamberArt,
  epilogue_room: getEpilogueRoomArt
};
