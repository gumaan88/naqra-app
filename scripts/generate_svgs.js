import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/assets/images/words');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Map of word keys to child-friendly SVG illustrations
const svgMap = {
  dad: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8F5E9"/>
    <circle cx="50" cy="40" r="22" fill="#FFCC80"/>
    <path d="M30 35 Q50 20 70 35 Q50 30 30 35" fill="#5D4037"/>
    <circle cx="43" cy="38" r="3" fill="#3E2723"/>
    <circle cx="57" cy="38" r="3" fill="#3E2723"/>
    <path d="M43 48 Q50 54 57 48" stroke="#3E2723" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M22 92 C22 65 78 65 78 92 Z" fill="#2E7D32"/>
    <rect x="46" y="65" width="8" height="15" fill="#FFB74D" rx="2"/>
  </svg>`,

  mom: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FCE4EC"/>
    <circle cx="50" cy="42" r="22" fill="#FFE0B2"/>
    <path d="M26 40 C24 15 76 15 74 40 C76 60 72 70 68 72 C60 52 40 52 32 72 C28 70 24 60 26 40 Z" fill="#4E342E"/>
    <circle cx="43" cy="40" r="3" fill="#3E2723"/>
    <circle cx="57" cy="40" r="3" fill="#3E2723"/>
    <path d="M44 50 Q50 56 56 50" stroke="#E91E63" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M24 92 C24 68 76 68 76 92 Z" fill="#EC407A"/>
  </svg>`,

  brother: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E3F2FD"/>
    <circle cx="50" cy="42" r="20" fill="#FFE0B2"/>
    <path d="M32 36 Q50 18 68 36 Q50 28 32 36" fill="#6D4C41"/>
    <circle cx="44" cy="40" r="2.5" fill="#3E2723"/>
    <circle cx="56" cy="40" r="2.5" fill="#3E2723"/>
    <path d="M44 50 Q50 55 56 50" stroke="#3E2723" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M26 92 C26 70 74 70 74 92 Z" fill="#1E88E5"/>
  </svg>`,

  door: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#EFEBE9"/>
    <rect x="25" y="15" width="50" height="75" rx="5" fill="#8D6E63" stroke="#4E342E" stroke-width="3"/>
    <rect x="32" y="22" width="16" height="28" rx="2" fill="#A1887F"/>
    <rect x="52" y="22" width="16" height="28" rx="2" fill="#A1887F"/>
    <rect x="32" y="55" width="16" height="28" rx="2" fill="#A1887F"/>
    <rect x="52" y="55" width="16" height="28" rx="2" fill="#A1887F"/>
    <circle cx="34" cy="54" r="4" fill="#FFD54F" stroke="#FFA000" stroke-width="1.5"/>
  </svg>`,

  bear: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF3E0"/>
    <circle cx="28" cy="28" r="12" fill="#8D6E63"/>
    <circle cx="28" cy="28" r="6" fill="#D7CCC8"/>
    <circle cx="72" cy="28" r="12" fill="#8D6E63"/>
    <circle cx="72" cy="28" r="6" fill="#D7CCC8"/>
    <circle cx="50" cy="52" r="30" fill="#A1887F"/>
    <ellipse cx="50" cy="62" rx="16" ry="12" fill="#D7CCC8"/>
    <circle cx="40" cy="46" r="3.5" fill="#3E2723"/>
    <circle cx="60" cy="46" r="3.5" fill="#3E2723"/>
    <ellipse cx="50" cy="58" rx="6" ry="4" fill="#3E2723"/>
    <path d="M46 64 Q50 68 54 64" stroke="#3E2723" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,

  mouth: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF0F5"/>
    <path d="M15 50 C25 25 75 25 85 50 C75 80 25 80 15 50 Z" fill="#E91E63"/>
    <path d="M22 50 C32 34 68 34 78 50 C68 68 32 68 22 50 Z" fill="#880E4F"/>
    <rect x="34" y="44" width="32" height="7" rx="3" fill="#FFFFFF"/>
    <path d="M40 54 Q50 62 60 54" fill="#FF4081"/>
  </svg>`,

  hand: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF8E1"/>
    <path d="M30 85 L30 55 C30 50 38 50 38 55 L38 35 C38 30 46 30 46 35 L46 25 C46 20 54 20 54 25 L54 38 C54 33 62 33 62 38 L62 55 C62 50 70 50 70 58 L70 70 C70 85 45 92 30 85 Z" fill="#FFCC80" stroke="#FFA726" stroke-width="3" stroke-linejoin="round"/>
  </svg>`,

  lion: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFFDE7"/>
    <circle cx="50" cy="50" r="36" fill="#F57C00"/>
    <circle cx="50" cy="50" r="26" fill="#FFD54F"/>
    <circle cx="34" cy="24" r="8" fill="#F57C00"/>
    <circle cx="66" cy="24" r="8" fill="#F57C00"/>
    <circle cx="42" cy="46" r="3.5" fill="#3E2723"/>
    <circle cx="58" cy="46" r="3.5" fill="#3E2723"/>
    <polygon points="50,52 44,58 56,58" fill="#D84315"/>
    <path d="M44 63 Q50 67 56 63" stroke="#3E2723" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,

  cat: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#F3E5F5"/>
    <polygon points="26,18 42,40 20,44" fill="#FF9800"/>
    <polygon points="74,18 58,40 80,44" fill="#FF9800"/>
    <circle cx="50" cy="54" r="30" fill="#FFA726"/>
    <circle cx="38" cy="48" r="4.5" fill="#2E7D32"/>
    <circle cx="62" cy="48" r="4.5" fill="#2E7D32"/>
    <polygon points="50,56 46,60 54,60" fill="#E91E63"/>
    <path d="M45 64 Q50 68 55 64" stroke="#3E2723" stroke-width="2" fill="none"/>
    <line x1="24" y1="56" x2="38" y2="58" stroke="#3E2723" stroke-width="1.5"/>
    <line x1="22" y1="62" x2="38" y2="61" stroke="#3E2723" stroke-width="1.5"/>
    <line x1="76" y1="56" x2="62" y2="58" stroke="#3E2723" stroke-width="1.5"/>
    <line x1="78" y1="62" x2="62" y2="61" stroke="#3E2723" stroke-width="1.5"/>
  </svg>`,

  duck: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E0F7FA"/>
    <circle cx="42" cy="36" r="18" fill="#FFEB3B"/>
    <ellipse cx="55" cy="62" rx="26" ry="18" fill="#FFEB3B"/>
    <circle cx="36" cy="32" r="3" fill="#3E2723"/>
    <ellipse cx="20" cy="38" rx="10" ry="5" fill="#FF9800"/>
    <path d="M48 64 Q60 55 68 64" fill="#FDD835"/>
  </svg>`,

  pen: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8EAF6"/>
    <g transform="rotate(45 50 50)">
      <polygon points="50,15 42,30 58,30" fill="#424242"/>
      <polygon points="50,15 48,22 52,22" fill="#FFD54F"/>
      <rect x="42" y="30" width="16" height="50" rx="2" fill="#2196F3"/>
      <rect x="42" y="70" width="16" height="12" fill="#1565C0"/>
    </g>
  </svg>`,

  flag: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#ECEFF1"/>
    <rect x="25" y="15" width="6" height="72" rx="3" fill="#78909C"/>
    <path d="M31 20 Q50 15 65 24 Q80 33 75 48 Q60 38 45 46 Q31 52 31 52 Z" fill="#E53935"/>
  </svg>`,

  sun: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFFDE7"/>
    <g stroke="#FFA000" stroke-width="4" stroke-linecap="round">
      <line x1="50" y1="12" x2="50" y2="22"/>
      <line x1="50" y1="78" x2="50" y2="88"/>
      <line x1="12" y1="50" x2="22" y2="50"/>
      <line x1="78" y1="50" x2="88" y2="50"/>
      <line x1="23" y1="23" x2="30" y2="30"/>
      <line x1="70" y1="70" x2="77" y2="77"/>
      <line x1="23" y1="77" x2="30" y2="70"/>
      <line x1="70" y1="30" x2="77" y2="23"/>
    </g>
    <circle cx="50" cy="50" r="22" fill="#FFD54F" stroke="#FFB300" stroke-width="3"/>
  </svg>`,

  moon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A237E"/>
    <path d="M60 20 C40 20 25 35 25 55 C25 75 40 90 60 90 C45 80 42 50 60 20 Z" fill="#FFF59D"/>
    <circle cx="75" cy="30" r="2.5" fill="#FFFFFF"/>
    <circle cx="80" cy="65" r="3" fill="#FFFFFF"/>
    <circle cx="68" cy="78" r="2" fill="#FFFFFF"/>
  </svg>`,

  star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#EDE7F6"/>
    <polygon points="50,15 61,38 86,40 67,57 73,82 50,68 27,82 33,57 14,40 39,38" fill="#FFCA28" stroke="#FFA000" stroke-width="3" stroke-linejoin="round"/>
  </svg>`,

  eye: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8F5E9"/>
    <path d="M15 50 Q50 18 85 50 Q50 82 15 50 Z" fill="#FFFFFF" stroke="#37474F" stroke-width="3.5"/>
    <circle cx="50" cy="50" r="16" fill="#5C6BC0"/>
    <circle cx="50" cy="50" r="9" fill="#212121"/>
    <circle cx="46" cy="46" r="3.5" fill="#FFFFFF"/>
  </svg>`,

  dates: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#EFEBE9"/>
    <ellipse cx="38" cy="45" rx="14" ry="24" transform="rotate(-20 38 45)" fill="#5D4037"/>
    <ellipse cx="62" cy="52" rx="14" ry="24" transform="rotate(25 62 52)" fill="#4E342E"/>
    <ellipse cx="48" cy="65" rx="13" ry="20" fill="#3E2723"/>
  </svg>`,

  bread: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF8E1"/>
    <path d="M20 55 C20 35 30 25 50 25 C70 25 80 35 80 55 C80 75 70 80 50 80 C30 80 20 75 20 55 Z" fill="#FFA726" stroke="#E65100" stroke-width="3"/>
    <ellipse cx="35" cy="45" rx="3" ry="8" transform="rotate(-30 35 45)" fill="#FFE082"/>
    <ellipse cx="50" cy="42" rx="3" ry="8" fill="#FFE082"/>
    <ellipse cx="65" cy="45" rx="3" ry="8" transform="rotate(30 65 45)" fill="#FFE082"/>
  </svg>`,

  ant: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FAFAFA"/>
    <circle cx="28" cy="50" r="10" fill="#212121"/>
    <circle cx="48" cy="50" r="8" fill="#37474F"/>
    <ellipse cx="72" cy="50" rx="14" ry="10" fill="#212121"/>
    <path d="M22 44 Q14 36 12 40" stroke="#212121" stroke-width="2" fill="none"/>
    <path d="M24 42 Q18 32 22 28" stroke="#212121" stroke-width="2" fill="none"/>
    <g stroke="#212121" stroke-width="2.5">
      <line x1="44" y1="52" x2="38" y2="70"/>
      <line x1="50" y1="52" x2="52" y2="72"/>
      <line x1="54" y1="52" x2="64" y2="70"/>
    </g>
  </svg>`,

  rose: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FCE4EC"/>
    <path d="M50 50 Q50 75 48 90" stroke="#388E3C" stroke-width="4" fill="none"/>
    <ellipse cx="38" cy="70" rx="10" ry="5" transform="rotate(-30 38 70)" fill="#4CAF50"/>
    <circle cx="50" cy="40" r="22" fill="#E91E63"/>
    <path d="M40 32 C45 25 55 25 60 32 C65 40 58 48 50 48 C42 48 35 40 40 32 Z" fill="#C2185B"/>
  </svg>`,

  book: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8EAF6"/>
    <path d="M15 75 C30 68 45 70 50 78 C55 70 70 68 85 75 L85 28 C70 20 55 22 50 30 C45 22 30 20 15 28 Z" fill="#FFFFFF" stroke="#3F51B5" stroke-width="3"/>
    <path d="M15 75 C30 68 45 70 50 78 L50 30 C45 22 30 20 15 28 Z" fill="#E8EAF6"/>
    <line x1="50" y1="30" x2="50" y2="78" stroke="#303F9F" stroke-width="3"/>
  </svg>`,

  apple: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFEBEE"/>
    <path d="M50 25 Q54 12 60 12" stroke="#5D4037" stroke-width="3" fill="none"/>
    <ellipse cx="62" cy="18" rx="7" ry="4" transform="rotate(-20 62 18)" fill="#4CAF50"/>
    <path d="M35 30 C20 30 18 55 25 72 C32 88 45 88 50 82 C55 88 68 88 75 72 C82 55 80 30 65 30 C55 30 52 38 50 38 C48 38 45 30 35 30 Z" fill="#E53935"/>
  </svg>`,

  milk: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E1F5FE"/>
    <polygon points="35,18 65,18 70,30 30,30" fill="#0288D1"/>
    <rect x="30" y="30" width="40" height="55" rx="4" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
    <rect x="30" y="45" width="40" height="20" fill="#03A9F4"/>
    <circle cx="50" cy="55" r="6" fill="#FFFFFF"/>
  </svg>`,

  rabbit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#F3E5F5"/>
    <ellipse cx="38" cy="22" rx="6" ry="18" transform="rotate(-15 38 22)" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
    <ellipse cx="38" cy="22" rx="3" ry="12" transform="rotate(-15 38 22)" fill="#FF80AB"/>
    <ellipse cx="62" cy="22" rx="6" ry="18" transform="rotate(15 62 22)" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
    <ellipse cx="62" cy="22" rx="3" ry="12" transform="rotate(15 62 22)" fill="#FF80AB"/>
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
    <circle cx="42" cy="50" r="3.5" fill="#3E2723"/>
    <circle cx="58" cy="50" r="3.5" fill="#3E2723"/>
    <polygon points="50,56 46,60 54,60" fill="#FF4081"/>
    <path d="M46 64 Q50 68 54 64" stroke="#3E2723" stroke-width="1.5" fill="none"/>
  </svg>`,

  sky: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#81D4FA"/>
    <circle cx="28" cy="30" r="14" fill="#FFEE58"/>
    <path d="M40 65 C35 65 30 60 32 54 C33 46 42 45 46 48 C50 40 64 40 68 47 C75 46 80 52 78 58 C82 63 78 68 74 68 Z" fill="#FFFFFF"/>
  </svg>`,

  tree: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8F5E9"/>
    <rect x="44" y="55" width="12" height="35" rx="3" fill="#6D4C41"/>
    <circle cx="50" cy="40" r="26" fill="#43A047"/>
    <circle cx="36" cy="44" r="18" fill="#388E3C"/>
    <circle cx="64" cy="44" r="18" fill="#4CAF50"/>
  </svg>`,

  clock: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF3E0"/>
    <circle cx="50" cy="50" r="36" fill="#FFFFFF" stroke="#FB8C00" stroke-width="4"/>
    <circle cx="50" cy="50" r="4" fill="#37474F"/>
    <line x1="50" y1="50" x2="50" y2="28" stroke="#37474F" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="68" y2="50" stroke="#E53935" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  bird: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E0F2F1"/>
    <ellipse cx="48" cy="55" rx="24" ry="18" fill="#26A69A"/>
    <circle cx="65" cy="40" r="14" fill="#00897B"/>
    <polygon points="76,40 90,44 76,48" fill="#FFA000"/>
    <circle cx="68" cy="38" r="2.5" fill="#FFFFFF"/>
    <circle cx="69" cy="38" r="1.5" fill="#212121"/>
    <path d="M35 52 Q20 50 15 42 Q30 45 42 55" fill="#004D40"/>
  </svg>`,

  car: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#ECEFF1"/>
    <path d="M15 62 L25 45 Q35 35 50 35 L68 35 Q78 35 85 48 L90 62 Z" fill="#E53935"/>
    <rect x="12" y="60" width="78" height="15" rx="4" fill="#C62828"/>
    <polygon points="30,46 46,46 46,38 36,38" fill="#B3E5FC"/>
    <polygon points="52,46 72,46 68,38 52,38" fill="#B3E5FC"/>
    <circle cx="30" cy="75" r="9" fill="#212121"/>
    <circle cx="30" cy="75" r="4" fill="#B0BEC5"/>
    <circle cx="70" cy="75" r="9" fill="#212121"/>
    <circle cx="70" cy="75" r="4" fill="#B0BEC5"/>
  </svg>`,

  plane: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E1F5FE"/>
    <ellipse cx="50" cy="50" rx="38" ry="10" fill="#FFFFFF" stroke="#0288D1" stroke-width="2"/>
    <polygon points="45,45 35,15 50,15 60,45" fill="#0288D1"/>
    <polygon points="45,55 35,85 50,85 60,55" fill="#0288D1"/>
    <polygon points="15,48 10,32 20,32 26,48" fill="#0288D1"/>
    <circle cx="76" cy="50" r="3" fill="#B3E5FC"/>
  </svg>`,

  garden: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8F5E9"/>
    <path d="M0 70 Q50 60 100 70 L100 100 L0 100 Z" fill="#4CAF50"/>
    <circle cx="30" cy="58" r="8" fill="#E91E63"/>
    <circle cx="50" cy="52" r="10" fill="#FF9800"/>
    <circle cx="70" cy="58" r="8" fill="#9C27B0"/>
  </svg>`,

  school: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF8E1"/>
    <polygon points="50,15 15,38 85,38" fill="#D32F2F"/>
    <rect x="20" y="38" width="60" height="48" fill="#FFE082" stroke="#FFA000" stroke-width="2"/>
    <rect x="42" y="60" width="16" height="26" fill="#5D4037"/>
    <rect x="26" y="46" width="12" height="12" fill="#B3E5FC" stroke="#0288D1" stroke-width="1.5"/>
    <rect x="62" y="46" width="12" height="12" fill="#B3E5FC" stroke="#0288D1" stroke-width="1.5"/>
  </svg>`,

  ship: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E0F7FA"/>
    <polygon points="15,62 85,62 75,82 25,82" fill="#5D4037"/>
    <rect x="35" y="38" width="30" height="24" fill="#FFFFFF" stroke="#BDBDBD" stroke-width="1.5"/>
    <rect x="45" y="24" width="10" height="14" fill="#D32F2F"/>
    <path d="M0 80 Q25 74 50 80 Q75 86 100 80 L100 100 L0 100 Z" fill="#0288D1"/>
  </svg>`,

  butterfly: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FCE4EC"/>
    <ellipse cx="32" cy="40" rx="18" ry="14" fill="#AB47BC"/>
    <ellipse cx="68" cy="40" rx="18" ry="14" fill="#AB47BC"/>
    <ellipse cx="36" cy="62" rx="14" ry="10" fill="#E91E63"/>
    <ellipse cx="64" cy="62" rx="14" ry="10" fill="#E91E63"/>
    <ellipse cx="50" cy="50" rx="4" ry="24" fill="#212121"/>
    <circle cx="50" cy="30" r="5" fill="#212121"/>
    <path d="M48 26 Q40 16 38 18" stroke="#212121" stroke-width="2" fill="none"/>
    <path d="M52 26 Q60 16 62 18" stroke="#212121" stroke-width="2" fill="none"/>
  </svg>`,

  orange: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFF3E0"/>
    <circle cx="50" cy="55" r="30" fill="#FF9800" stroke="#F57C00" stroke-width="2"/>
    <ellipse cx="50" cy="25" rx="8" ry="4" fill="#4CAF50"/>
    <line x1="50" y1="25" x2="50" y2="28" stroke="#5D4037" stroke-width="2"/>
  </svg>`,

  bicycle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#EDE7F6"/>
    <circle cx="28" cy="65" r="16" fill="none" stroke="#37474F" stroke-width="4"/>
    <circle cx="72" cy="65" r="16" fill="none" stroke="#37474F" stroke-width="4"/>
    <polyline points="28,65 48,65 60,45 72,65" fill="none" stroke="#00BCD4" stroke-width="4" stroke-linecap="round"/>
    <polyline points="48,65 40,42 46,42" fill="none" stroke="#00BCD4" stroke-width="4" stroke-linecap="round"/>
    <line x1="60" y1="45" x2="56" y2="35" stroke="#37474F" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="35" x2="62" y2="35" stroke="#E91E63" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  giraffe: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFFDE7"/>
    <rect x="52" y="25" width="10" height="45" rx="3" fill="#FFC107"/>
    <circle cx="60" cy="22" r="10" fill="#FFC107"/>
    <circle cx="58" cy="20" r="2" fill="#3E2723"/>
    <ellipse cx="44" cy="68" rx="20" ry="12" fill="#FFC107"/>
    <rect x="30" y="76" width="5" height="18" fill="#FFA000"/>
    <rect x="50" y="76" width="5" height="18" fill="#FFA000"/>
    <circle cx="56" cy="38" r="3" fill="#E65100"/>
    <circle cx="58" cy="50" r="3" fill="#E65100"/>
  </svg>`,

  peacock: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E0F2F1"/>
    <circle cx="50" cy="45" r="35" fill="#00897B"/>
    <circle cx="30" cy="35" r="5" fill="#FFD54F"/>
    <circle cx="50" cy="22" r="5" fill="#FFD54F"/>
    <circle cx="70" cy="35" r="5" fill="#FFD54F"/>
    <ellipse cx="50" cy="62" rx="10" ry="18" fill="#0D47A1"/>
    <circle cx="50" cy="48" r="7" fill="#0D47A1"/>
    <polygon points="50,48 48,53 52,53" fill="#FFB300"/>
  </svg>`,

  computer: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#ECEFF1"/>
    <rect x="20" y="20" width="60" height="42" rx="4" fill="#37474F"/>
    <rect x="24" y="24" width="52" height="34" rx="2" fill="#00BCD4"/>
    <rect x="46" y="62" width="8" height="14" fill="#78909C"/>
    <rect x="32" y="76" width="36" height="5" rx="2" fill="#546E7A"/>
  </svg>`,

  turtle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8F5E9"/>
    <circle cx="74" cy="55" r="9" fill="#81C784"/>
    <circle cx="76" cy="53" r="1.5" fill="#1B5E20"/>
    <ellipse cx="48" cy="55" rx="24" ry="18" fill="#2E7D32"/>
    <ellipse cx="48" cy="55" rx="18" ry="12" fill="#388E3C"/>
    <circle cx="30" cy="68" r="6" fill="#81C784"/>
    <circle cx="60" cy="68" r="6" fill="#81C784"/>
  </svg>`,
};

for (const [key, svg] of Object.entries(svgMap)) {
  fs.writeFileSync(path.join(outDir, `${key}.svg`), svg.trim());
}

console.log(`Generated ${Object.keys(svgMap).length} word illustration SVGs in ${outDir}`);
