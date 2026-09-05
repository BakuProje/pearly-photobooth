const sharp = require('sharp');
const path = require('path');

async function renderTemplateWithPhoto(templateName, slots, outputName) {
  const templatePath = path.join('public/images/template', templateName);
  const meta = await sharp(templatePath).metadata();
  const W = meta.width;
  const H = meta.height;

  const svgElements = slots.map((s, idx) => {
    const sw = (s.width / 100) * W;
    const sh = (s.height / 100) * H;
    const sx = (s.x / 100) * W;
    const sy = (s.y / 100) * H;
    const rot = s.rotation || 0;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7D794'];
    const col = colors[idx % colors.length];

    return `
      <g transform="rotate(${rot}, ${cx}, ${cy})">
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="${col}" fill-opacity="0.88" stroke="#FFFFFF" stroke-width="2" />
        <text x="${cx}" y="${cy}" font-size="24" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">PHOTO #${idx+1}</text>
      </g>
    `;
  }).join('\n');

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements}
    </svg>
  `;

  await sharp(templatePath)
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 }
    ])
    .png()
    .toFile(path.join('scratch', outputName));

  console.log(`Rendered ${outputName}`);
}

async function run() {
  // Template 27
  await renderTemplateWithPhoto('template 27.png', [
    { x: 16.9, y: 30.9, width: 64.3, height: 34.6, rotation: -1.8, borderRadius: 3, label: 'Dark Newspaper Polaroid' }
  ], 'verify_t27_perfect.png');

  // Template 26
  await renderTemplateWithPhoto('template 26.png', [
    { x: 23.7, y: 27.5, width: 52.3, height: 37.2, rotation: -2.0, borderRadius: 3, label: 'Sunset Polaroid' }
  ], 'verify_t26_perfect.png');

  // Template 25
  await renderTemplateWithPhoto('template 25.png', [
    { x: 8.7, y: 20.0, width: 21.0, height: 18.8, rotation: -1.6, borderRadius: 2, label: 'Strip 1 (Atas)' },
    { x: 9.5, y: 40.6, width: 21.0, height: 18.8, rotation: -1.6, borderRadius: 2, label: 'Strip 2 (Tengah)' },
    { x: 10.4, y: 61.2, width: 21.0, height: 18.8, rotation: -1.6, borderRadius: 2, label: 'Strip 3 (Bawah)' },
    { x: 38.2, y: 28.8, width: 45.0, height: 34.5, rotation: 3.0, borderRadius: 2, label: 'Polaroid Kanan' },
  ], 'verify_t25_perfect.png');

  // Template 17
  await renderTemplateWithPhoto('template 17.png', [
    { x: 18.5, y: 3.5, width: 28.8, height: 18.8, rotation: 3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 9.5, y: 31.3, width: 32.5, height: 21.0, rotation: -1.2, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 4.8, y: 65.5, width: 31.5, height: 20.5, rotation: -11.3, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 57.0, y: 8.8, width: 33.6, height: 25.5, rotation: 8.3, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 50.8, y: 37.0, width: 33.6, height: 25.5, rotation: 8.3, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 44.5, y: 65.2, width: 33.6, height: 25.5, rotation: 8.3, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ], 'verify_t17_perfect.png');

  // Template 16
  await renderTemplateWithPhoto('template 16.png', [
    { x: 19.0, y: 2.5, width: 73.0, height: 24.2, borderRadius: 4, label: 'Foto #1 (Atas)' },
    { x: 19.0, y: 28.9, width: 73.0, height: 24.2, borderRadius: 4, label: 'Foto #2 (Tengah)' },
    { x: 19.0, y: 55.2, width: 73.0, height: 24.2, borderRadius: 4, label: 'Foto #3 (Bawah)' },
  ], 'verify_t16_perfect.png');
}
run();
