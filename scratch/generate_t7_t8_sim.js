const sharp = require('sharp');

const t7_new = [
  { x: 2.70, y: 33.80, width: 94.45, height: 27.78, label: 'Hero Utama' },
  { x: 37.88, y: 65.03, width: 24.16, height: 11.81, label: 'Foto Tengah' },
  { x: 1.95, y: 78.64, width: 30.68, height: 18.81, label: 'Foto Bawah Kiri' },
];

const t8_new = [
  { x: 38.11, y: 33.62, width: 59.04, height: 29.71, label: 'Hero Kanan' },
  { x: 3.08, y: 68.53, width: 29.18, height: 18.56, label: 'Bawah Kiri' },
  { x: 67.89, y: 68.53, width: 29.26, height: 18.56, label: 'Bawah Kanan' },
];

async function generateSim(tmplFile, slots, outFile) {
  const tmplBuf = await sharp('public/images/template/' + tmplFile).toBuffer();
  const meta = await sharp(tmplBuf).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's create realistic photo placeholders (warm photo gradients or textures)
  const composites = [];
  
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const px = Math.round((s.x / 100) * w);
    const py = Math.round((s.y / 100) * h);
    const pw = Math.round((s.width / 100) * w);
    const ph = Math.round((s.height / 100) * h);

    const colors = [
      ['#ff7675', '#d63031'],
      ['#74b9ff', '#0984e3'],
      ['#55efc4', '#00b894']
    ];
    const [c1, c2] = colors[i % colors.length];

    const slotSvg = `
      <svg width="${pw}" height="${ph}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="100%" stop-color="${c2}" />
          </linearGradient>
        </defs>
        <rect width="${pw}" height="${ph}" fill="url(#grad${i})" />
        <circle cx="${pw/2}" cy="${ph/2 - 20}" r="35" fill="#fff" opacity="0.8"/>
        <text x="${pw/2}" y="${ph/2 + 35}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">${s.label}</text>
        <text x="${pw/2}" y="${ph/2 + 65}" font-family="Arial, sans-serif" font-size="16" fill="#fff" text-anchor="middle">Photo ${i+1}</text>
      </svg>
    `;
    
    // In our canvasRenderer, photos are drawn FIRST, then template is drawn ON TOP
    // Let's simulate: background canvas, photo drawn at (px, py, pw, ph), then template drawn on top!
    composites.push({
      input: Buffer.from(slotSvg),
      top: py,
      left: px
    });
  }

  // Create base canvas with background color
  const base = await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  }).png().toBuffer();

  // Draw photos on base
  const photosOnBase = await sharp(base).composite(composites).png().toBuffer();

  // Overlay template on top
  const finalImage = await sharp(photosOnBase)
    .composite([{ input: tmplBuf, top: 0, left: 0 }])
    .png()
    .toBuffer();

  await sharp(finalImage).toFile('scratch/' + outFile);
  console.log('Saved scratch/' + outFile);
}

async function run() {
  await generateSim('template 7.png', t7_new, 'final_t7_sim.png');
  await generateSim('template 8.png', t8_new, 'final_t8_sim.png');
}

run();
