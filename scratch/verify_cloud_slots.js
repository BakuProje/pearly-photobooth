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
    <rect x="${w*0.06}" y="${h*0.06}" width="${w*0.88}" height="${h*0.88}" rx="14" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/>
    <circle cx="${w*0.28}" cy="${h*0.35}" r="${Math.min(w,h)*0.16}" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
    <rect x="${w*0.52}" y="${h*0.18}" width="${w*0.36}" height="${h*0.34}" rx="10" fill="#eab308" />
    <rect x="${w*0.14}" y="${h*0.56}" width="${w*0.34}" height="${h*0.32}" rx="10" fill="#22c55e" />
    <rect x="${w*0.52}" y="${h*0.56}" width="${w*0.36}" height="${h*0.32}" rx="10" fill="#ef4444" />
    <rect x="${w*0.25}" y="${h*0.42}" width="${w*0.5}" height="${h*0.16}" rx="6" fill="#0f172a" fill-opacity="0.85"/>
    <text x="${w/2}" y="${h*0.51}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w,h)*0.09)}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderTemplateExact(templatePath, slots, outName) {
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
  const t25_slots = [
    { x: 5.7, y: 19.3, width: 26.5, height: 20.5, borderRadius: 2, label: 'Strip 1 (Atas)' },
    { x: 6.4, y: 40.3, width: 26.8, height: 20.4, borderRadius: 2, label: 'Strip 2 (Tengah)' },
    { x: 6.4, y: 61.3, width: 28.2, height: 20.5, borderRadius: 2, label: 'Strip 3 (Bawah)' },
    { x: 34.1, y: 25.5, width: 56.3, height: 50.0, rotation: 0.6, borderRadius: 2, label: 'Polaroid Kanan' },
  ];
  await renderTemplateExact('template 25.png', t25_slots, 'verify_cloud_t25.png');

  const t26_slots = [
    { x: 19.1, y: 25.5, width: 60.7, height: 50.7, rotation: 1.3, borderRadius: 3, label: 'Sunset Polaroid' },
  ];
  await renderTemplateExact('template 26.png', t26_slots, 'verify_cloud_t26.png');

  const t27_slots = [
    { x: 12.1, y: 27.0, width: 77.5, height: 50.0, borderRadius: 3, label: 'Dark Newspaper Polaroid' },
  ];
  await renderTemplateExact('template 27.png', t27_slots, 'verify_cloud_t27.png');

  const t17_slots = [
    { x: 14.5, y: 0.5, width: 38.9, height: 25.5, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 3.9, y: 28.4, width: 42.9, height: 27.5, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: -0.5, y: 58.3, width: 44.9, height: 32.6, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 48.6, y: 6.7, width: 49.0, height: 31.6, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 42.8, y: 34.7, width: 51.1, height: 31.6, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 33.6, y: 62.3, width: 54.2, height: 31.6, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ];
  await renderTemplateExact('template 17.png', t17_slots, 'verify_cloud_t17.png');
}

main();
