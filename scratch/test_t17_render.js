const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testT17Render() {
  const filepath = path.join('public/images/template', 'template 17.png');
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's test calibrated slots for T17:
  // In T17:
  // Slot 1 (Top Left): cx: 34.5%, cy: 17.5%, w: 43.0%, h: 33.5%, rot: 4.0
  // Slot 2 (Top Right): cx: 73.5%, cy: 22.5%, w: 54.0%, h: 41.0%, rot: 8.5
  // Slot 3 (Mid Left): cx: 32.5%, cy: 45.0%, w: 45.0%, h: 37.0%, rot: 0.0
  // Slot 4 (Mid Right): cx: 69.5%, cy: 50.0%, w: 57.0%, h: 41.0%, rot: 8.4
  // Slot 5 (Bot Left): cx: 27.5%, cy: 75.0%, w: 53.0%, h: 41.5%, rot: -10.5
  // Slot 6 (Bot Right): cx: 63.5%, cy: 75.0%, w: 62.0%, h: 41.5%, rot: 8.4

  const slots = [
    { label: 'Polaroid 1 (Atas Kiri)', cx: 34.5, cy: 17.0, w: 43.0, h: 33.5, rot: 4.0 },
    { label: 'Polaroid 2 (Atas Kanan)', cx: 73.5, cy: 22.5, w: 54.5, h: 41.0, rot: 8.5 },
    { label: 'Polaroid 3 (Tengah Kiri)', cx: 32.5, cy: 45.0, w: 45.5, h: 37.0, rot: 0.0 },
    { label: 'Polaroid 4 (Tengah Kanan)', cx: 69.5, cy: 50.0, w: 57.5, h: 41.0, rot: 8.4 },
    { label: 'Polaroid 5 (Bawah Kiri)', cx: 27.5, cy: 75.0, w: 53.5, h: 41.5, rot: -10.5 },
    { label: 'Polaroid 6 (Bawah Kanan)', cx: 63.5, cy: 75.0, w: 62.5, h: 41.5, rot: 8.4 },
  ];

  const configSlots = slots.map(s => ({
    label: s.label,
    x: +(s.cx - s.w / 2).toFixed(1),
    y: +(s.cy - s.h / 2).toFixed(1),
    width: +s.w.toFixed(1),
    height: +s.h.toFixed(1),
    rotation: s.rot,
    borderRadius: 4
  }));

  console.log('T17 Proposed Config Slots:');
  console.log(JSON.stringify(configSlots, null, 2));

  let svgRects = '';
  configSlots.forEach(s => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    svgRects += `<g transform="rotate(${s.rotation} ${cx} ${cy})">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#ff4444" fill-opacity="0.85" stroke="#ffffff" stroke-width="3" />
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t17_out.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved test rendering to', outPath);

  // Check how many placeholder pixels remain outside the covered areas
  const { data, info } = await sharp(rendered).raw().toBuffer({ resolveWithObject: true });
  let leakedPlaceholder = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const isCovered = (r > 200 && g < 100);
      if (!isCovered) {
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        if (isSky || isHill) {
          leakedPlaceholder++;
        }
      }
    }
  }
  console.log(`Leaked placeholder pixels in T17: ${leakedPlaceholder} (0 is perfect)`);
}

testT17Render();
