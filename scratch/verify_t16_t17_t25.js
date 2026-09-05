const sharp = require('sharp');
const fs = require('fs');

async function createSamplePhoto(w, h, label, r, g, b) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(${r},${g},${b})" />
        <stop offset="100%" stop-color="rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)*0.35}" fill="rgba(255,255,255,0.85)" />
    <text x="${w/2}" y="${h/2}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w,h)*0.16)}" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderTemplateExact(templatePath, slots, outName) {
  const meta = await sharp('public/images/template/' + templatePath).metadata();
  const { width, height } = meta;

  const bgImg = await sharp('public/images/template/' + templatePath).png().toBuffer();
  const composites = [];

  const colors = [
    [239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94],
    [6, 182, 212], [59, 130, 246], [168, 85, 247], [236, 72, 153],
    [244, 63, 94], [20, 184, 166], [99, 102, 241], [139, 92, 246],
    [245, 158, 11], [16, 185, 129]
  ];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const boxX = (slot.x / 100) * width;
    const boxY = (slot.y / 100) * height;
    const boxW = (slot.width / 100) * width;
    const boxH = (slot.height / 100) * height;
    const rot = slot.rotation || 0;
    const rad = slot.borderRadius ? (slot.borderRadius / 1000) * width : 2;

    const [r, g, b] = colors[i % colors.length];
    const rawPhoto = await createSamplePhoto(600, 600, '#' + (i+1), r, g, b);
    const cropped = await sharp(rawPhoto).resize(Math.round(boxW), Math.round(boxH), { fit: 'cover' }).png().toBuffer();
    const b64 = cropped.toString('base64');
    const cx = boxW / 2;
    const cy = boxH / 2;

    const rotTransform = rot ? `transform="rotate(${rot} ${boxX + cx} ${boxY + cy})"` : '';
    const slotSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="c${i}">
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rad}" />
        </clipPath>
      </defs>
      <g ${rotTransform} clip-path="url(#c${i})">
        <image xlink:href="data:image/png;base64,${b64}" x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" preserveAspectRatio="xMidYMid slice" />
      </g>
    </svg>`;
    composites.push({ input: Buffer.from(slotSvg), top: 0, left: 0 });
  }

  const result = await sharp(bgImg).composite(composites).png().toBuffer();
  fs.writeFileSync('scratch/' + outName, result);
  console.log('Saved scratch/' + outName);
}

const t17_slots = [
  { x: 20.5, y: 4.5, width: 27.0, height: 21.0, rotation: -3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
  { x: 10.5, y: 30.0, width: 31.0, height: 24.0, rotation: 0.0, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
  { x: 6.8, y: 62.0, width: 31.0, height: 24.0, rotation: 10.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
  { x: 55.8, y: 9.2, width: 34.8, height: 26.2, rotation: 8.3, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
  { x: 51.8, y: 37.4, width: 34.8, height: 26.2, rotation: 8.3, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
  { x: 47.8, y: 65.6, width: 34.8, height: 26.2, rotation: 8.3, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
];

const t16_slots = [
  { x: 10.5, y: 12.0, width: 55.0, height: 27.0, rotation: -2.8, borderRadius: 3, label: 'Hero Atas' },
  { x: 10.5, y: 40.0, width: 54.0, height: 43.0, rotation: -2.8, borderRadius: 3, label: 'Hero Bawah' },
  { x: 74.2, y: 15.0, width: 22.5, height: 16.5, rotation: -1.0, borderRadius: 2, label: 'Strip 1' },
  { x: 72.8, y: 32.8, width: 22.5, height: 16.5, rotation: -1.0, borderRadius: 2, label: 'Strip 2' },
  { x: 71.4, y: 50.5, width: 22.5, height: 16.5, rotation: -1.0, borderRadius: 2, label: 'Strip 3' },
  { x: 69.8, y: 68.2, width: 22.5, height: 16.5, rotation: -1.0, borderRadius: 2, label: 'Strip 4' },
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

async function main() {
  await renderTemplateExact('template 17.png', t17_slots, 'verify_t17.png');
  await renderTemplateExact('template 16.png', t16_slots, 'verify_t16.png');
  await renderTemplateExact('template 25.png', t25_slots, 'verify_t25.png');
}
main();
