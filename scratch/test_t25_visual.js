const sharp = require('sharp');
const fs = require('fs');

async function testT25VisualOverlay() {
  const filepath = 'images/template/template 25.png';
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's refine all 14 slots for Template 25:
  // 1. Gantungan #1: top-right hanging photo 1
  // 2. Gantungan #2: top-right hanging photo 2
  // 3. Gantungan #3: top-right hanging photo 3
  // 4. Gantungan #4: top-right hanging photo 4
  // 5. Sticky Pink: top-left pink card on notebook
  // 6. Buku Kiri: bottom-left notebook page photo
  // 7. Buku Kanan: right notebook page photo
  // 8. Polaroid Kiri Bawah: rotated -12.5°
  // 9. Polaroid Tengah: rotated 11.9°
  // 10. Kamera Digital: screen on silver camera
  // 11. Polaroid Bawah: rotated -3.0°
  // 12. Filmstrip #1: top film cell
  // 13. Filmstrip #2: mid film cell
  // 14. Filmstrip #3: bot film cell (y: 83.0%..97.0%)

  const slots = [
    { label: 'Gantungan #1', x: 49.5, y: 21.5, width: 17.0, height: 12.5, borderRadius: 3 },
    { label: 'Gantungan #2', x: 59.5, y: 23.5, width: 17.0, height: 12.5, borderRadius: 3 },
    { label: 'Gantungan #3', x: 69.5, y: 25.5, width: 17.0, height: 12.5, borderRadius: 3 },
    { label: 'Gantungan #4', x: 79.5, y: 26.5, width: 17.5, height: 12.5, borderRadius: 3 },
    { label: 'Sticky Pink', x: 4.8, y: 34.5, width: 23.5, height: 14.0, borderRadius: 4 },
    { label: 'Buku Kiri', x: 7.0, y: 46.0, width: 43.0, height: 22.0, borderRadius: 4 },
    { label: 'Buku Kanan', x: 52.0, y: 35.0, width: 40.0, height: 19.5, borderRadius: 4 },
    { label: 'Polaroid Kiri Bawah', x: -0.5, y: 62.0, width: 45.0, height: 28.0, rotation: -12.5, borderRadius: 4 },
    { label: 'Polaroid Tengah', x: 25.5, y: 59.0, width: 49.0, height: 28.5, rotation: 11.9, borderRadius: 4 },
    { label: 'Kamera Digital', x: 2.0, y: 84.0, width: 27.0, height: 15.0, borderRadius: 6 },
    { label: 'Polaroid Bawah', x: 34.8, y: 79.5, width: 40.0, height: 19.0, rotation: -3.0, borderRadius: 4 },
    { label: 'Filmstrip #1', x: 67.5, y: 56.0, width: 31.5, height: 14.5, borderRadius: 4 },
    { label: 'Filmstrip #2', x: 64.5, y: 69.5, width: 31.5, height: 14.5, borderRadius: 4 },
    { label: 'Filmstrip #3', x: 61.0, y: 83.0, width: 31.5, height: 14.5, borderRadius: 4 },
  ];

  let svgRects = '';
  slots.forEach((s, idx) => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const rotAttr = s.rotation ? `transform="rotate(${s.rotation} ${cx} ${cy})"` : '';
    svgRects += `<g ${rotAttr}>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#10b981" fill-opacity="0.8" stroke="#ffffff" stroke-width="3" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${idx+1}</text>
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t25_visual.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved visual test to', outPath);
}

testT25VisualOverlay();
