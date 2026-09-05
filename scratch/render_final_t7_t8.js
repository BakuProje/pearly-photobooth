const sharp = require('sharp');
const fs = require('fs');

async function renderPhoto(text, color, w, h) {
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" />
          <stop offset="100%" stop-color="#2d3436" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)" />
      <circle cx="${w/2}" cy="${h/2 - 25}" r="${Math.min(w,h)/4.5}" fill="#ffffff" opacity="0.85" />
      <text x="${w/2}" y="${h/2 + 35}" font-family="Arial, sans-serif" font-size="${Math.max(16, Math.round(w/15))}" font-weight="bold" fill="#ffffff" text-anchor="middle">${text}</text>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderFull(tmplFile, slots, outFile) {
  const tmplBuf = await sharp('public/images/template/' + tmplFile).toBuffer();
  const meta = await sharp(tmplBuf).metadata();
  const { width, height } = meta;

  const composites = [];
  const colors = ['#e17055', '#0984e3', '#00b894'];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const boxX = Math.round((s.x / 100) * width);
    const boxY = Math.round((s.y / 100) * height);
    const boxW = Math.round((s.width / 100) * width);
    const boxH = Math.round((s.height / 100) * height);

    const pBuf = await renderPhoto(`Foto ${i+1}: ${s.label}`, colors[i], boxW, boxH);
    composites.push({
      input: pBuf,
      top: boxY,
      left: boxX
    });
  }

  const finalImg = await sharp(tmplBuf).composite(composites).png().toBuffer();
  await sharp(finalImg).toFile('scratch/' + outFile);
  console.log('Saved scratch/' + outFile);
}

const t7_slots = [
  { x: 2.65, y: 33.75, width: 94.65, height: 27.9, label: 'Hero Utama' },
  { x: 37.8, y: 65.0, width: 24.3, height: 11.9, label: 'Foto Tengah' },
  { x: 1.9, y: 78.6, width: 30.95, height: 18.9, label: 'Foto Bawah Kiri' },
];

const t8_slots = [
  { x: 38.05, y: 33.55, width: 59.2, height: 29.85, label: 'Hero Kanan' },
  { x: 3.0, y: 68.45, width: 29.35, height: 18.7, label: 'Bawah Kiri' },
  { x: 67.8, y: 68.45, width: 29.4, height: 18.7, label: 'Bawah Kanan' },
];

async function run() {
  await renderFull('template 7.png', t7_slots, 'verified_t7_final.png');
  await renderFull('template 8.png', t8_slots, 'verified_t8_final.png');
}

run();
