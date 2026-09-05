const sharp = require('sharp');
const fs = require('fs');

async function testT17FineTuned() {
  const filepath = 'images/template/template 17.png';
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  const slots = [
    { label: 'Polaroid 1 (Atas Kiri)', cx: 33.5, cy: 16.5, w: 25.5, h: 20.0, rot: -3.8 },
    { label: 'Polaroid 2 (Tengah Kiri)', cx: 26.5, cy: 42.5, w: 28.5, h: 22.0, rot: 0.0 },
    { label: 'Polaroid 3 (Bawah Kiri)', cx: 22.5, cy: 75.0, w: 28.5, h: 22.5, rot: 10.5 },
    { label: 'Strip 1 (Atas Kanan)', cx: 66.5, cy: 21.0, w: 30.5, h: 23.5, rot: 8.3 },
    { label: 'Strip 2 (Tengah Kanan)', cx: 62.5, cy: 49.5, w: 30.5, h: 23.5, rot: 8.3 },
    { label: 'Strip 3 (Bawah Kanan)', cx: 58.5, cy: 78.0, w: 30.5, h: 23.5, rot: 8.3 },
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
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="${colors[idx]}" fill-opacity="0.88" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${idx+1}</text>
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t17_finetuned.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved finetuned test to', outPath);
}

testT17FineTuned();
