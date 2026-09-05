const sharp = require('sharp');
const path = require('path');

async function testComposite(name, slots, outName) {
  const tPath = path.join('public/images/template', name);
  const meta = await sharp(tPath).metadata();
  const W = meta.width;
  const H = meta.height;

  // Render colorful rectangles with border
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
    .toFile(path.join('scratch', outName));

  console.log(`Generated ${outName}`);
}

async function run() {
  // Template 27
  await testComposite('template 27.png', [
    { x: 16.7, y: 30.7, width: 65.0, height: 35.0, rotation: -1.8, borderRadius: 3, label: 'Dark Newspaper Polaroid' }
  ], 'final_t27.png');

  // Template 26
  await testComposite('template 26.png', [
    { x: 23.3, y: 27.2, width: 53.2, height: 38.0, rotation: -1.9, borderRadius: 3, label: 'Sunset Polaroid' }
  ], 'final_t26.png');

  // Template 25
  await testComposite('template 25.png', [
    { x: 8.6, y: 19.8, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 1 (Atas)' },
    { x: 9.4, y: 40.4, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 2 (Tengah)' },
    { x: 10.3, y: 61.0, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 3 (Bawah)' },
    { x: 38.0, y: 28.5, width: 45.6, height: 35.0, rotation: 3.0, borderRadius: 2, label: 'Polaroid Kanan' },
  ], 'final_t25.png');

  // Template 17
  await testComposite('template 17.png', [
    { x: 18.5, y: 3.2, width: 29.5, height: 19.5, rotation: 3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 9.2, y: 31.0, width: 33.2, height: 21.6, rotation: -1.2, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 4.4, y: 65.0, width: 32.2, height: 21.2, rotation: -11.3, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 56.4, y: 8.2, width: 35.0, height: 26.5, rotation: 8.4, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 50.2, y: 36.4, width: 35.0, height: 26.5, rotation: 8.4, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 43.9, y: 64.6, width: 35.0, height: 26.5, rotation: 8.4, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ], 'final_t17.png');

  // Template 16
  await testComposite('template 16.png', [
    { x: 19.0, y: 2.5, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #1 (Atas)' },
    { x: 19.0, y: 28.9, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #2 (Tengah)' },
    { x: 19.0, y: 55.2, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #3 (Bawah)' },
  ], 'final_t16.png');
}
run();
