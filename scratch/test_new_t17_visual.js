const sharp = require('sharp');
const fs = require('fs');

async function testT17Visual() {
  const filepath = 'images/template/template 17.png';
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's test the 6 slots for new Template 17:
  const slots = [
    { label: 'Polaroid 1 (Atas Kiri)', cx: 34.0, cy: 17.6, w: 33.0, h: 25.0, rot: 4.0 },
    { label: 'Polaroid 2 (Tengah Kiri)', cx: 27.5, cy: 46.3, w: 36.5, h: 28.5, rot: -1.1 },
    { label: 'Polaroid 3 (Bawah Kiri)', cx: 24.5, cy: 76.5, w: 36.5, h: 28.5, rot: -11.0 },
    { label: 'Strip 1 (Atas Kanan)', cx: 67.8, cy: 21.0, w: 34.5, h: 24.5, rot: 8.4 },
    { label: 'Strip 2 (Tengah Kanan)', cx: 64.2, cy: 49.0, w: 34.5, h: 24.5, rot: 8.4 },
    { label: 'Strip 3 (Bawah Kanan)', cx: 60.6, cy: 77.0, w: 34.5, h: 24.5, rot: 8.4 },
  ];

  const configSlots = slots.map(s => ({
    label: s.label,
    x: +(s.cx - s.w / 2).toFixed(1),
    y: +(s.cy - s.h / 2).toFixed(1),
    width: +s.w.toFixed(1),
    height: +s.h.toFixed(1),
    rotation: s.rot,
    borderRadius: 3
  }));

  console.log('T17 Proposed Config:');
  console.log(JSON.stringify(configSlots, null, 2));

  let svgRects = '';
  configSlots.forEach((s, idx) => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];
    svgRects += `<g transform="rotate(${s.rotation} ${cx} ${cy})">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${colors[idx]}" fill-opacity="0.85" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${idx+1}</text>
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_new_t17_visual.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved visual test to', outPath);
}

testT17Visual();
