const sharp = require('sharp');
const fs = require('fs');

async function createFoodPhoto(w, h, label, bgR, bgG, bgB) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(${bgR},${bgG},${bgB})" />
        <stop offset="100%" stop-color="rgb(${Math.max(0,bgR-50)},${Math.max(0,bgG-50)},${Math.max(0,bgB-50)})" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <!-- Meal tray simulation -->
    <rect x="${w*0.08}" y="${h*0.08}" width="${w*0.84}" height="${h*0.84}" rx="12" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/>
    <circle cx="${w*0.3}" cy="${h*0.35}" r="${Math.min(w,h)*0.16}" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
    <rect x="${w*0.55}" y="${h*0.2}" width="${w*0.3}" height="${h*0.3}" rx="8" fill="#eab308" />
    <rect x="${w*0.15}" y="${h*0.58}" width="${w*0.32}" height="${h*0.28}" rx="8" fill="#22c55e" />
    <rect x="${w*0.55}" y="${h*0.58}" width="${w*0.3}" height="${h*0.28}" rx="8" fill="#ef4444" />
    <text x="${w/2}" y="${h/2}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w,h)*0.14)}" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderRealTest(templatePath, slots, outName) {
  const meta = await sharp('public/images/template/' + templatePath).metadata();
  const { width, height } = meta;

  const bgImg = await sharp('public/images/template/' + templatePath).png().toBuffer();
  const composites = [];

  const colors = [
    [241, 245, 249], [254, 243, 199], [254, 226, 226], [219, 234, 254],
    [243, 232, 255], [220, 252, 231], [254, 249, 195], [255, 228, 230]
  ];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const boxX = (slot.x / 100) * width;
    const boxY = (slot.y / 100) * height;
    const boxW = (slot.width / 100) * width;
    const boxH = (slot.height / 100) * height;
    const rot = slot.rotation || 0;
    const rad = slot.borderRadius ? (slot.borderRadius / 1000) * width : 4;

    const [r, g, b] = colors[i % colors.length];
    const rawPhoto = await createFoodPhoto(800, 800, `Foto #${i+1}`, r, g, b);
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
  console.log(`Saved scratch/${outName}`);
}

async function main() {
  const t17_straight_slots = [
    { x: 14.5, y: 1.8, width: 36.0, height: 26.5, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 4.5, y: 27.5, width: 41.0, height: 27.5, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 1.5, y: 57.5, width: 44.0, height: 32.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 49.5, y: 5.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 44.5, y: 33.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 39.5, y: 61.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ];
  await renderRealTest('template 17.png', t17_straight_slots, 'real_straight_t17.png');

  const t16_straight_slots = [
    { x: 4.5, y: 7.5, width: 66.0, height: 30.5, borderRadius: 3, label: 'Hero Atas' },
    { x: 4.5, y: 37.5, width: 66.0, height: 49.0, borderRadius: 3, label: 'Hero Bawah' },
    { x: 67.5, y: 11.5, width: 31.0, height: 20.5, borderRadius: 2, label: 'Strip 1' },
    { x: 65.5, y: 29.5, width: 33.0, height: 18.5, borderRadius: 2, label: 'Strip 2' },
    { x: 63.5, y: 46.5, width: 33.0, height: 19.5, borderRadius: 2, label: 'Strip 3' },
    { x: 61.5, y: 64.5, width: 33.0, height: 19.5, borderRadius: 2, label: 'Strip 4' },
  ];
  await renderRealTest('template 16.png', t16_straight_slots, 'real_straight_t16.png');
}

main();
