const sharp = require('sharp');
const path = require('path');

async function renderTemplateWithPhoto(templateName, slots, outputName) {
  const templatePath = path.join('public/images/template', templateName);
  const meta = await sharp(templatePath).metadata();
  const W = meta.width;
  const H = meta.height;

  // Create SVG overlay with rectangles for each slot
  const svgElements = slots.map((s, idx) => {
    const sw = (s.width / 100) * W;
    const sh = (s.height / 100) * H;
    const sx = (s.x / 100) * W;
    const sy = (s.y / 100) * H;
    const rot = s.rotation || 0;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;

    // A colorful placeholder or semi-transparent photo simulation
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7D794'];
    const col = colors[idx % colors.length];

    return `
      <g transform="rotate(${rot}, ${cx}, ${cy})">
        <!-- Photo layer -->
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="${col}" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="2" />
        <text x="${cx}" y="${cy}" font-size="28" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">PHOTO #${idx+1}</text>
      </g>
    `;
  }).join('\n');

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements}
    </svg>
  `;

  // In photobooth DOM, the photo layer is rendered UNDER the frame overlay if transparent cutout, or OVER the frame if slot positioned.
  // When slot is placed OVER the template, let's see how it looks:
  const compositeBuffer = await sharp(templatePath)
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
    { x: 16.5, y: 30.7, width: 64.9, height: 34.9, rotation: -1.8, borderRadius: 3, label: 'Dark Newspaper Polaroid' }
  ], 'preview_t27.png');

  // Template 26
  await renderTemplateWithPhoto('template 26.png', [
    { x: 23.8, y: 26.1, width: 53.5, height: 38.3, rotation: -1.7, borderRadius: 3, label: 'Sunset Polaroid' }
  ], 'preview_t26.png');

  // Template 25
  await renderTemplateWithPhoto('template 25.png', [
    { x: 8.8, y: 19.5, width: 21.0, height: 18.5, rotation: -1.7, borderRadius: 2, label: 'Strip 1 (Atas)' },
    { x: 9.6, y: 40.2, width: 21.0, height: 18.5, rotation: -1.9, borderRadius: 2, label: 'Strip 2 (Tengah)' },
    { x: 10.4, y: 60.8, width: 21.0, height: 18.5, rotation: -1.7, borderRadius: 2, label: 'Strip 3 (Bawah)' },
    { x: 38.5, y: 27.8, width: 46.0, height: 34.8, rotation: 3.0, borderRadius: 2, label: 'Polaroid Kanan' },
  ], 'preview_t25.png');

  // Template 17
  await renderTemplateWithPhoto('template 17.png', [
    { x: 17.5, y: 2.8, width: 32.5, height: 24.8, rotation: 3.9, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 8.6, y: 29.0, width: 36.3, height: 28.8, rotation: -1.2, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 2.5, y: 61.5, width: 37.5, height: 26.2, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 51.5, y: 8.5, width: 42.0, height: 25.5, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 46.8, y: 36.8, width: 42.0, height: 25.5, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 40.8, y: 64.5, width: 42.0, height: 25.5, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ], 'preview_t17.png');

  // Template 16
  await renderTemplateWithPhoto('template 16.png', [
    { x: 18.5, y: 3.5, width: 74.0, height: 23.0, borderRadius: 4, label: 'Foto #1 (Atas)' },
    { x: 18.5, y: 29.5, width: 74.0, height: 23.0, borderRadius: 4, label: 'Foto #2 (Tengah)' },
    { x: 18.5, y: 55.5, width: 74.0, height: 23.0, borderRadius: 4, label: 'Foto #3 (Bawah)' },
  ], 'preview_t16.png');
}
run();
