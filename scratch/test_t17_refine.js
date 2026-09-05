const sharp = require('sharp');
const path = require('path');

async function testT17() {
  const tPath = path.join('public/images/template', 'template 17.png');
  const meta = await sharp(tPath).metadata();
  const W = meta.width;
  const H = meta.height;

  const slots = [
    { x: 18.2, y: 3.0, width: 30.2, height: 20.0, rotation: 3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 9.0, y: 30.8, width: 33.6, height: 22.0, rotation: -1.2, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 4.2, y: 64.8, width: 32.6, height: 21.6, rotation: -11.3, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 55.4, y: 7.6, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 49.2, y: 35.8, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 42.9, y: 64.0, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ];

  const rects = slots.map((s, i) => {
    const sw = (s.width / 100) * W;
    const sh = (s.height / 100) * H;
    const sx = (s.x / 100) * W;
    const sy = (s.y / 100) * H;
    const rot = s.rotation || 0;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const colors = ['#E63946', '#457B9D', '#2A9D8F', '#E76F51', '#9B5DE5', '#F15BB5'];
    const col = colors[i % colors.length];

    return `
      <g transform="rotate(${rot}, ${cx}, ${cy})">
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="${col}" fill-opacity="0.9" />
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="${cx}" y="${cy}" font-size="22" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">PHOTO #${i+1}</text>
      </g>
    `;
  }).join('\n');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

  await sharp(tPath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(path.join('scratch', 'final_t17_refine.png'));

  console.log('Rendered final_t17_refine.png');
}
testT17();
