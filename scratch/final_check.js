const sharp = require('sharp');
const fs = require('fs');

async function renderTemplateExact(templateFile, slots, outFile) {
  const meta = await sharp(`images/template/${templateFile}`).metadata();
  const w = meta.width;
  const h = meta.height;

  let svgOverlays = '';
  const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#6366f1', '#14b8a6', '#d946ef', '#f97316', '#84cc16', '#a855f7', '#0ea5e9'];

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
      <text x="${cx}" y="${cy}" font-size="${Math.max(14, Math.round(Math.min(boxW, boxH)*0.22))}" font-family="Arial" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${i+1}</text>
    </g>`;
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgOverlays}</svg>`;
  const rendered = await sharp(`images/template/${templateFile}`)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  fs.writeFileSync(`scratch/${outFile}`, rendered);
  console.log(`Rendered scratch/${outFile} (${w}x${h})`);
}

const t17_slots = [
  { x: 22.5, y: 5.5, width: 22.0, height: 17.5, rotation: -3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
  { x: 13.5, y: 32.2, width: 26.0, height: 19.5, rotation: 0.0, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
  { x: 10.0, y: 64.8, width: 25.0, height: 19.0, rotation: 10.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
  { x: 58.0, y: 10.2, width: 30.5, height: 23.2, rotation: 8.3, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
  { x: 53.8, y: 38.6, width: 30.5, height: 23.2, rotation: 8.3, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
  { x: 49.6, y: 66.8, width: 30.5, height: 23.2, rotation: 8.3, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
];

const t16_slots = [
  { x: 15.0, y: 13.8, width: 49.0, height: 23.5, rotation: -2.8, borderRadius: 3, label: 'Hero Atas' },
  { x: 13.0, y: 38.8, width: 48.0, height: 43.5, rotation: -2.8, borderRadius: 3, label: 'Hero Bawah' },
  { x: 75.8, y: 16.0, width: 19.8, height: 14.4, rotation: -1.0, borderRadius: 2, label: 'Strip 1' },
  { x: 74.5, y: 33.8, width: 19.8, height: 14.6, rotation: -1.0, borderRadius: 2, label: 'Strip 2' },
  { x: 73.0, y: 51.5, width: 19.8, height: 14.4, rotation: -1.0, borderRadius: 2, label: 'Strip 3' },
  { x: 71.5, y: 69.0, width: 19.8, height: 14.4, rotation: -1.0, borderRadius: 2, label: 'Strip 4' },
];

const t25_slots = [
  { x: 57.5, y: 25.6, width: 9.0, height: 5.8, rotation: 8.0, borderRadius: 2, label: 'Gantungan #1' },
  { x: 68.3, y: 27.6, width: 9.0, height: 5.8, rotation: -6.0, borderRadius: 2, label: 'Gantungan #2' },
  { x: 78.0, y: 29.3, width: 9.0, height: 5.8, rotation: 0.0, borderRadius: 2, label: 'Gantungan #3' },
  { x: 88.0, y: 30.6, width: 9.0, height: 5.8, rotation: 5.0, borderRadius: 2, label: 'Gantungan #4' },
  { x: 10.6, y: 37.8, width: 13.0, height: 7.5, borderRadius: 3, label: 'Sticky Pink' },
  { x: 10.5, y: 45.8, width: 33.5, height: 17.5, borderRadius: 3, label: 'Buku Kiri' },
  { x: 58.2, y: 39.0, width: 27.0, height: 11.0, borderRadius: 3, label: 'Buku Kanan' },
  { x: 5.2, y: 65.0, width: 23.5, height: 14.8, rotation: -8.0, borderRadius: 3, label: 'Polaroid Kiri Bawah' },
  { x: 33.2, y: 64.5, width: 23.5, height: 14.8, rotation: 8.0, borderRadius: 3, label: 'Polaroid Tengah' },
  { x: 7.8, y: 86.8, width: 17.0, height: 7.8, borderRadius: 3, label: 'Kamera Digital' },
  { x: 38.0, y: 83.5, width: 27.5, height: 12.0, rotation: -3.0, borderRadius: 3, label: 'Polaroid Bawah' },
  { x: 74.0, y: 60.5, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #1' },
  { x: 71.8, y: 69.2, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #2' },
  { x: 69.5, y: 78.0, width: 18.5, height: 8.5, borderRadius: 2, label: 'Filmstrip #3' },
];

async function run() {
  await renderTemplateExact('template 17.png', t17_slots, 'v6_check_t17.png');
  await renderTemplateExact('template 16.png', t16_slots, 'v6_check_t16.png');
  await renderTemplateExact('template 25.png', t25_slots, 'v6_check_t25.png');
}
run();
