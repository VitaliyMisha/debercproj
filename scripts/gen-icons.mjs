import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

function makeSvg(size) {
  const r = Math.round(size * 0.15);
  const border = Math.max(2, Math.round(size * 0.025));
  const inset = Math.round(size * 0.03);
  const fontSize = Math.round(size * 0.62);
  const textY = Math.round(size * 0.755);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#78350F"/>
      <stop offset="45%"  stop-color="#FCD34D"/>
      <stop offset="55%"  stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
    <linearGradient id="letter" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>

  <!-- background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#0A1A0C"/>

  <!-- gold border -->
  <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}"
        rx="${r - inset}" fill="none"
        stroke="url(#gold)" stroke-width="${border}"/>

  <!-- letter Д -->
  <text x="${size / 2}" y="${textY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-weight="bold"
        font-size="${fontSize}"
        text-anchor="middle"
        fill="url(#letter)">Д</text>
</svg>`;
}

// Generate PWA icons
for (const size of sizes) {
  const svg = makeSvg(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const path = `public/icons/icon-${size}x${size}.png`;
  writeFileSync(path, png);
  console.log(`✓ ${path}`);
}

// Generate favicon 32×32
const faviconSvg = makeSvg(32);
const favicon = new Resvg(faviconSvg, { fitTo: { mode: 'width', value: 32 } });
writeFileSync('public/favicon-32x32.png', favicon.render().asPng());
console.log('✓ public/favicon-32x32.png');

// Save SVG favicon too (best quality for modern browsers)
writeFileSync('public/favicon.svg', makeSvg(512));
console.log('✓ public/favicon.svg');

console.log('\nDone!');
