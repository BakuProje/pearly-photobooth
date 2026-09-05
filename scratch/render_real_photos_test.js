const sharp = require('sharp');
const fs = require('fs');

async function createSamplePhoto(w, h, color1, color2, label) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <rect x="${w*0.06}" y="${h*0.06}" width="${w*0.42}" height="${h*0.42}" rx="10" fill="#ffffff" fill-opacity="0.95"/>
    <circle cx="${w*0.27}" cy="${h*0.27}" r="${Math.min(w,h)*0.14}" fill="#f59e0b" />
    <rect x="${w*0.52}" y="${h*0.06}" width="${w*0.42}" height="${h*0.42}" rx="10" fill="#ffffff" fill-opacity="0.95"/>
    <rect x="${w*0.06}" y="${h*0.52}" width="${w*0.42}" height="${h*0.42}" rx="10" fill="#ffffff" fill-opacity="0.95"/>
    <rect x="${w*0.52}" y="${h*0.52}" width="${w*0.42}" height="${h*0.42}" rx="10" fill="#ffffff" fill-opacity="0.95"/>
    <text x="${w/2}" y="${h/2}" font-family="Arial" font-size="${Math.round(Math.min(w,h)*0.14)}" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderTemplateWithPhotos(templateFile, slots, outFile) {
  const meta = await sharp(`images/template/${templateFile}`).metadata();
  const width = meta.width;
  const height = meta.height;

  const composites = [];
  const photoColors = [
    ['#e2e8f0', '#94a3b8'],
    ['#fed7aa', '#f97316'],
    ['#fef08a', '#eab308'],
    ['#bbf7d0', '#22c55e'],
    ['#bae6fd', '#0284c7'],
    ['#ddd6fe', '#8b5cf6'],
    ['#fbcfe8', '#ec4899'],
    ['#fecdd3', '#f43f5e'],
    ['#c7d2fe', '#6366f1'],
    ['#99f6e4', '#14b8a6'],
    ['#fed7aa', '#ea580c'],
    ['#e9d5ff', '#a855f7'],
    ['#fef9c3', '#ca8a04'],
    ['#ccfbf1', '#0d9488'],
  ];

  for (let sIdx = 0; sIdx < slots.length; sIdx++) {
    const slot = slots[sIdx];
    const boxX = (slot.x / 100) * width;
    const boxY = (slot.y / 100) * height;
    const boxW = (slot.width / 100) * width;
    const boxH = (slot.height / 100) * height;
    const rot = slot.rotation || 0;
    const rad = slot.borderRadius ? (slot.borderRadius / 1000) * width : 2;

    const [c1, c2] = photoColors[sIdx % photoColors.length];
    const rawPhoto = await createSamplePhoto(600, 600, c1, c2, `Foto #${sIdx + 1}`);

    const croppedPhoto = await sharp(rawPhoto)
      .resize(Math.round(boxW), Math.round(boxH), { fit: 'cover' })
      .png()
      .toBuffer();

    const photoB64 = croppedPhoto.toString('base64');
    const cx = boxW / 2;
    const cy = boxH / 2;

    const rotTransform = rot ? `transform="rotate(${rot} ${boxX + cx} ${boxY + cy})"` : '';
    const slotSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="clip${sIdx}">
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rad}" />
        </clipPath>
      </defs>
      <g ${rotTransform} clip-path="url(#clip${sIdx})">
        <image xlink:href="data:image/png;base64,${photoB64}" x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" preserveAspectRatio="xMidYMid slice" />
      </g>
    </svg>`;
    composites.push({ input: Buffer.from(slotSvg), top: 0, left: 0 });
  }

  const rendered = await sharp(`images/template/${templateFile}`)
    .composite(composites)
    .png()
    .toBuffer();

  fs.writeFileSync(`scratch/${outFile}`, rendered);
  console.log(`Rendered scratch/${outFile} (${width}x${height})`);
}

// Perfect fill candidate slots
const t17_slots = [
  { x: 19.5, y: 3.2, width: 29.5, height: 23.5, rotation: -3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
  { x: 12.0, y: 30.5, width: 28.5, height: 23.0, rotation: 0.0, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
  { x: 8.0, y: 63.0, width: 28.5, height: 23.0, rotation: 10.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
  { x: 55.5, y: 8.5, width: 35.5, height: 27.5, rotation: 8.3, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
  { x: 51.5, y: 36.8, width: 35.5, height: 27.5, rotation: 8.3, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
  { x: 47.5, y: 65.0, width: 35.5, height: 27.5, rotation: 8.3, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
];

const t16_slots = [
  { x: 12.0, y: 12.2, width: 55.0, height: 27.2, rotation: 2.8, borderRadius: 3, label: 'Hero Atas' },
  { x: 10.5, y: 37.0, width: 53.5, height: 48.5, rotation: 2.8, borderRadius: 3, label: 'Hero Bawah' },
  { x: 74.2, y: 14.8, width: 23.0, height: 17.5, rotation: -1.0, borderRadius: 2, label: 'Strip 1' },
  { x: 72.8, y: 32.5, width: 23.0, height: 17.5, rotation: -1.0, borderRadius: 2, label: 'Strip 2' },
  { x: 71.4, y: 50.2, width: 23.0, height: 17.5, rotation: -1.0, borderRadius: 2, label: 'Strip 3' },
  { x: 69.8, y: 67.8, width: 23.0, height: 17.5, rotation: -1.0, borderRadius: 2, label: 'Strip 4' },
];

const t25_slots = [
  { x: 56.5, y: 24.5, width: 11.0, height: 8.5, rotation: 8.0, borderRadius: 2, label: 'Gantungan #1' },
  { x: 67.2, y: 26.5, width: 11.0, height: 8.5, rotation: -6.0, borderRadius: 2, label: 'Gantungan #2' },
  { x: 77.0, y: 28.0, width: 11.0, height: 8.5, rotation: 0.0, borderRadius: 2, label: 'Gantungan #3' },
  { x: 87.0, y: 29.2, width: 11.0, height: 8.5, rotation: 5.0, borderRadius: 2, label: 'Gantungan #4' },
  { x: 9.8, y: 37.0, width: 14.5, height: 8.5, borderRadius: 3, label: 'Sticky Pink' },
  { x: 9.2, y: 44.5, width: 35.5, height: 20.0, borderRadius: 3, label: 'Buku Kiri' },
  { x: 57.0, y: 38.0, width: 29.5, height: 12.8, borderRadius: 3, label: 'Buku Kanan' },
  { x: 1.5, y: 62.5, width: 30.0, height: 20.5, rotation: -12.5, borderRadius: 3, label: 'Polaroid Kiri Bawah' },
  { x: 30.0, y: 62.0, width: 30.0, height: 20.5, rotation: 12.0, borderRadius: 3, label: 'Polaroid Tengah' },
  { x: 7.0, y: 86.2, width: 18.5, height: 8.8, borderRadius: 3, label: 'Kamera Digital' },
  { x: 36.5, y: 82.5, width: 30.5, height: 14.5, rotation: -3.0, borderRadius: 3, label: 'Polaroid Bawah' },
  { x: 73.0, y: 59.5, width: 20.5, height: 10.5, borderRadius: 2, label: 'Filmstrip #1' },
  { x: 70.8, y: 68.2, width: 20.5, height: 10.5, borderRadius: 2, label: 'Filmstrip #2' },
  { x: 68.5, y: 77.0, width: 20.5, height: 10.5, borderRadius: 2, label: 'Filmstrip #3' },
];

async function run() {
  await renderTemplateWithPhotos('template 17.png', t17_slots, 'perfect_t17.png');
  await renderTemplateWithPhotos('template 16.png', t16_slots, 'perfect_t16.png');
  await renderTemplateWithPhotos('template 25.png', t25_slots, 'perfect_t25.png');
}
run();
