const sharp = require('sharp');
const fs = require('fs');

const t7_slots = [
  { x: 2.70, y: 33.80, width: 94.45, height: 27.78, label: 'Hero Utama' },
  { x: 37.88, y: 65.03, width: 24.16, height: 11.81, label: 'Foto Tengah' },
  { x: 1.95, y: 78.64, width: 30.68, height: 18.81, label: 'Foto Bawah Kiri' },
];

const t8_slots = [
  { x: 38.11, y: 33.62, width: 59.04, height: 29.71, label: 'Hero Kanan' },
  { x: 3.08, y: 68.53, width: 29.18, height: 18.56, label: 'Bawah Kiri' },
  { x: 67.89, y: 68.53, width: 29.26, height: 18.56, label: 'Bawah Kanan' },
];

// Let's create dummy real photos (using sharp with gradient/solid with text)
async function makePhoto(w, h, text, color) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${color}"/>
    <circle cx="${w/2}" cy="${h/2 - 20}" r="${Math.min(w,h)/4}" fill="#ffffff" opacity="0.9"/>
    <text x="${w/2}" y="${h/2 + 30}" font-family="sans-serif" font-size="${Math.min(w,h)/10}" font-weight="bold" fill="#333" text-anchor="middle">${text}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function simulateCanvasRenderer(tmplFile, slots, outFile) {
  const tmplBuf = await sharp('public/images/template/' + tmplFile).toBuffer();
  const meta = await sharp(tmplBuf).metadata();
  const width = meta.width;
  const height = meta.height;

  const composites = [];
  const colors = ['#f39c12', '#3498db', '#9b59b6'];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const boxX = Math.round((s.x / 100) * width);
    const boxY = Math.round((s.y / 100) * height);
    const boxW = Math.round((s.width / 100) * width);
    const boxH = Math.round((s.height / 100) * height);

    // Create photo
    const photoBuf = await makePhoto(boxW, boxH, s.label, colors[i]);
    composites.push({
      input: photoBuf,
      top: boxY,
      left: boxX
    });
  }

  // Draw template as background, then draw photos over slots
  const final = await sharp(tmplBuf).composite(composites).png().toBuffer();
  await sharp(final).toFile('scratch/' + outFile);
  console.log('Saved scratch/' + outFile);
}

async function run() {
  await simulateCanvasRenderer('template 7.png', t7_slots, 'canvas_sim_t7.png');
  await simulateCanvasRenderer('template 8.png', t8_slots, 'canvas_sim_t8.png');
}

run();
