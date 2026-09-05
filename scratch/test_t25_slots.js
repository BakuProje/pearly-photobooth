const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testT25AllSlots() {
  const filepath = path.join('images/template', 'template 25.png');
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  // Calibrated 14 slots for Template 25:
  // 1. Gantungan #1: cx: 58.0%, cy: 28.0%, w: 16.5%, h: 12.0%
  // 2. Gantungan #2: cx: 68.0%, cy: 30.0%, w: 16.5%, h: 12.0%
  // 3. Gantungan #3: cx: 78.0%, cy: 32.0%, w: 16.5%, h: 12.0%
  // 4. Gantungan #4: cx: 88.0%, cy: 33.0%, w: 17.0%, h: 12.0%
  // 5. Sticky Pink (top left notebook): cx: 16.5%, cy: 41.5%, w: 23.0%, h: 13.5%
  // 6. Buku Kiri (bottom left notebook): cx: 28.5%, cy: 57.0%, w: 42.0%, h: 21.0%
  // 7. Buku Kanan (right notebook): cx: 72.0%, cy: 45.0%, w: 39.0%, h: 18.5%
  // 8. Polaroid Kiri Bawah (tilted -12.5°): cx: 22.0%, cy: 76.0%, w: 43.5%, h: 27.0%, rot: -12.5
  // 9. Polaroid Tengah (tilted 11.9°): cx: 50.0%, cy: 73.5%, w: 47.5%, h: 27.5%, rot: 11.9
  // 10. Kamera Digital: cx: 15.5%, cy: 91.5%, w: 26.5%, h: 14.5%
  // 11. Polaroid Bawah (tilted -3.0°): cx: 55.0%, cy: 89.0%, w: 39.0%, h: 18.0%, rot: -3.0
  // 12. Filmstrip #1 (top): cx: 83.5%, cy: 63.5%, w: 30.0%, h: 14.0%
  // 13. Filmstrip #2 (mid): cx: 80.5%, cy: 77.0%, w: 30.0%, h: 14.0%
  // 14. Filmstrip #3 (bot): cx: 77.0%, cy: 90.5%, w: 30.0%, h: 14.0%

  const slots = [
    { label: 'Gantungan #1', cx: 58.0, cy: 28.0, w: 16.5, h: 12.0, rot: 0 },
    { label: 'Gantungan #2', cx: 68.0, cy: 30.0, w: 16.5, h: 12.0, rot: 0 },
    { label: 'Gantungan #3', cx: 78.0, cy: 32.0, w: 16.5, h: 12.0, rot: 0 },
    { label: 'Gantungan #4', cx: 88.0, cy: 33.0, w: 17.0, h: 12.0, rot: 0 },
    { label: 'Sticky Pink', cx: 16.5, cy: 41.5, w: 23.0, h: 13.5, rot: 0 },
    { label: 'Buku Kiri', cx: 28.5, cy: 57.0, w: 42.5, h: 21.5, rot: 0 },
    { label: 'Buku Kanan', cx: 72.0, cy: 45.0, w: 39.5, h: 19.0, rot: 0 },
    { label: 'Polaroid Kiri Bawah', cx: 22.0, cy: 76.0, w: 44.0, h: 27.5, rot: -12.5 },
    { label: 'Polaroid Tengah', cx: 50.0, cy: 73.5, w: 48.0, h: 28.0, rot: 11.9 },
    { label: 'Kamera Digital', cx: 15.5, cy: 91.5, w: 26.5, h: 14.5, rot: 0, borderRadius: 6 },
    { label: 'Polaroid Bawah', cx: 55.0, cy: 89.0, w: 39.5, h: 18.5, rot: -3.0 },
    { label: 'Filmstrip #1', cx: 83.5, cy: 63.5, w: 30.5, h: 14.0, rot: 0 },
    { label: 'Filmstrip #2', cx: 80.5, cy: 77.0, w: 30.5, h: 14.0, rot: 0 },
    { label: 'Filmstrip #3', cx: 77.0, cy: 90.5, w: 30.5, h: 14.0, rot: 0 },
  ];

  const configSlots = slots.map(s => ({
    label: s.label,
    x: +(s.cx - s.w / 2).toFixed(1),
    y: +(s.cy - s.h / 2).toFixed(1),
    width: +s.w.toFixed(1),
    height: +s.h.toFixed(1),
    rotation: s.rot || undefined,
    borderRadius: s.borderRadius || 4
  }));

  console.log('T25 Proposed Config Slots:');
  console.log(JSON.stringify(configSlots, null, 2));

  let svgRects = '';
  configSlots.forEach((s, idx) => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const rotAttr = s.rotation ? `transform="rotate(${s.rotation} ${cx} ${cy})"` : '';
    svgRects += `<g ${rotAttr}>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#ff4444" fill-opacity="0.85" stroke="#ffffff" stroke-width="3" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${idx+1}</text>
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t25_out.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved test rendering to', outPath);
}

testT25AllSlots();
