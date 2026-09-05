const sharp = require('sharp');
const path = require('path');

const t7_slots = [
  { x: 2.85, y: 33.87, width: 94.22, height: 27.71, label: 'Hero Utama' },
  { x: 38.33, y: 65.08, width: 23.33, height: 11.56, label: 'Foto Tengah' },
  { x: 2.10, y: 78.69, width: 30.53, height: 18.71, label: 'Foto Bawah Kiri' },
];

const t8_slots = [
  { x: 38.33, y: 33.67, width: 58.74, height: 29.66, label: 'Hero Kanan' },
  { x: 3.23, y: 68.63, width: 29.03, height: 18.36, label: 'Bawah Kiri' },
  { x: 68.04, y: 68.63, width: 29.03, height: 18.36, label: 'Bawah Kanan' },
];

async function renderTest(tmplName, slots, outName) {
  const bg = await sharp('public/images/template/' + tmplName).toBuffer();
  const meta = await sharp(bg).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's create an SVG overlay with photo boxes
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
  
  const colors = ['#e74c3c', '#3498db', '#2ecc71'];
  
  slots.forEach((s, idx) => {
    const px = Math.round((s.x / 100) * w);
    const py = Math.round((s.y / 100) * h);
    const pw = Math.round((s.width / 100) * w);
    const ph = Math.round((s.height / 100) * h);
    
    svg += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${colors[idx % colors.length]}" opacity="0.85" stroke="#000" stroke-width="2"/>`;
    svg += `<text x="${px + pw/2}" y="${py + ph/2}" font-family="Arial" font-size="24" fill="#fff" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${s.label}</text>`;
  });
  svg += `</svg>`;

  const result = await sharp(bg)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  await sharp(result).toFile('scratch/' + outName);
  console.log('Saved scratch/' + outName);
}

async function run() {
  await renderTest('template 7.png', t7_slots, 'test_t7_result.png');
  await renderTest('template 8.png', t8_slots, 'test_t8_result.png');
}

run();
