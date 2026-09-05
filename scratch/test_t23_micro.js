const sharp = require('sharp');
const path = require('path');

async function testT23MicroRefine() {
  const tPath = path.join('public/images/template', 'template 23.png');
  const meta = await sharp(tPath).metadata();
  const W = meta.width;
  const H = meta.height;

  const slots = [
    { x: -1.9, y: 23.6, width: 33.0, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#1 Film Atas Kiri' },
    { x: 30.9, y: 20.1, width: 34.6, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#2 Film Atas Tengah' },
    { x: 65.3, y: 16.5, width: 36.6, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#3 Film Atas Kanan' },
    { x: -1.9, y: 57.9, width: 33.8, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#4 Film Bawah Kiri' },
    { x: 31.8, y: 54.2, width: 37.6, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#5 Film Bawah Tengah' },
    { x: 69.2, y: 50.6, width: 32.8, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#6 Film Bawah Kanan' },
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
    .toFile(path.join('scratch', 'perfect_t23_micro.png'));

  console.log('Rendered perfect_t23_micro.png');
}
testT23MicroRefine();
