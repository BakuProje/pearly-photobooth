const sharp = require('sharp');
const fs = require('fs');

async function renderOverlay(templateFile, slots, outFile) {
  const meta = await sharp(`public/images/template/${templateFile}`).metadata();
  const w = meta.width;
  const h = meta.height;

  let svgOverlays = '';
  const colors = ['#e11d48', '#9333ea', '#0284c7', '#d97706', '#db2777', '#2563eb', '#059669', '#4f46e5', '#0d9488', '#c026d3', '#ea580c', '#65a30d', '#7c3aed', '#0891b2'];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const boxX = (s.x / 100) * w;
    const boxY = (s.y / 100) * h;
    const boxW = (s.width / 100) * w;
    const boxH = (s.height / 100) * h;
    const rot = s.rotation || 0;
    const rad = s.borderRadius || 3;
    const cx = boxX + boxW / 2;
    const cy = boxY + boxH / 2;
    const rotAttr = rot ? `transform="rotate(${rot} ${cx} ${cy})"` : '';
    const col = colors[i % colors.length];

    svgOverlays += `<g ${rotAttr}>
      <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rad}" fill="${col}" fill-opacity="0.85" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="${Math.max(14, Math.round(Math.min(boxW, boxH)*0.24))}" font-family="Arial" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${i+1}</text>
    </g>`;
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgOverlays}</svg>`;
  const rendered = await sharp(`public/images/template/${templateFile}`)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  fs.writeFileSync(`scratch/${outFile}`, rendered);
  console.log(`Rendered scratch/${outFile} (${w}x${h})`);
}

const t17_slots = [
  { x: 21.0, y: 4.8, width: 23.5, height: 21.0, rotation: -4.0, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
  { x: 13.5, y: 31.8, width: 27.5, height: 21.5, rotation: 0.0, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
  { x: 9.0, y: 63.8, width: 27.5, height: 21.5, rotation: 9.0, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
  { x: 54.0, y: 9.5, width: 28.0, height: 23.0, rotation: 8.3, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
  { x: 50.0, y: 37.5, width: 28.0, height: 23.0, rotation: 8.3, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
  { x: 46.0, y: 65.5, width: 28.0, height: 23.0, rotation: 8.3, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
];

const t16_slots = [
  { x: 14.5, y: 13.2, width: 52.0, height: 24.5, rotation: 2.2, borderRadius: 3, label: 'Hero Atas' },
  { x: 11.5, y: 38.0, width: 51.0, height: 45.0, rotation: 2.2, borderRadius: 3, label: 'Hero Bawah' },
  { x: 75.8, y: 16.0, width: 20.0, height: 14.5, rotation: -1.0, borderRadius: 2, label: 'Strip 1' },
  { x: 74.5, y: 33.8, width: 20.0, height: 14.8, rotation: -1.0, borderRadius: 2, label: 'Strip 2' },
  { x: 73.0, y: 51.5, width: 20.0, height: 14.5, rotation: -1.0, borderRadius: 2, label: 'Strip 3' },
  { x: 71.5, y: 69.0, width: 20.0, height: 14.5, rotation: -1.0, borderRadius: 2, label: 'Strip 4' },
];

const t25_slots = [
  { x: 57.5, y: 25.6, width: 9.0, height: 5.8, rotation: 8.0, borderRadius: 2, label: 'Gantungan #1' },
  { x: 68.3, y: 27.6, width: 9.0, height: 5.8, rotation: -6.0, borderRadius: 2, label: 'Gantungan #2' },
  { x: 78.0, y: 29.3, width: 9.0, height: 5.8, rotation: 0.0, borderRadius: 2, label: 'Gantungan #3' },
  { x: 88.0, y: 30.6, width: 9.0, height: 5.8, rotation: 5.0, borderRadius: 2, label: 'Gantungan #4' },
  { x: 10.6, y: 37.8, width: 13.0, height: 7.5, borderRadius: 3, label: 'Sticky Pink' },
  { x: 10.5, y: 45.8, width: 33.5, height: 17.5, borderRadius: 3, label: 'Buku Kiri' },
  { x: 58.2, y: 39.0, width: 27.0, height: 11.0, borderRadius: 3, label: 'Buku Kanan' },
  { x: 4.7, y: 64.7, width: 24.5, height: 15.5, rotation: -8.0, borderRadius: 3, label: 'Polaroid Kiri Bawah' },
  { x: 32.7, y: 64.2, width: 24.5, height: 15.5, rotation: 8.0, borderRadius: 3, label: 'Polaroid Tengah' },
  { x: 7.8, y: 86.8, width: 17.0, height: 7.8, borderRadius: 3, label: 'Kamera Digital' },
  { x: 38.0, y: 83.5, width: 27.5, height: 12.0, rotation: -3.0, borderRadius: 3, label: 'Polaroid Bawah' },
  { x: 74.0, y: 60.5, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #1' },
  { x: 71.8, y: 69.2, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #2' },
  { x: 69.5, y: 78.0, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #3' },
];

async function run() {
  await renderOverlay('template 17.png', t17_slots, 'check_t17_v5.png');
  await renderOverlay('template 16.png', t16_slots, 'check_t16_v5.png');
  await renderOverlay('template 25.png', t25_slots, 'check_t25_v5.png');
}
run();
