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
  const meta = await sharp('images/template/' + templatePath).metadata();
  const { width, height } = meta;

  const bgImg = await sharp('images/template/' + templatePath).png().toBuffer();
  const composites = [];

  const colors = [
    [239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94],
    [6, 182, 212], [59, 130, 246], [168, 85, 247], [236, 72, 153],
    [244, 63, 94], [20, 184, 166], [99, 102, 241], [139, 92, 246],
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

  // Check uncovered placeholder pixels
  const { data: renData } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
  const { data: tmplData } = await sharp('images/template/' + templatePath).raw().toBuffer({ resolveWithObject: true });
  let uncovered = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const tr = tmplData[idx], tg = tmplData[idx+1], tb = tmplData[idx+2];
      const isGrass = (tg > 105 && tg > tr * 1.05 && tg > tb * 1.15 && tr < 210 && tb < 160);
      const isSky = (tb > 160 && tg > 130 && tr < 200 && tb > tr + 15);
      if (isGrass || isSky) {
        const rr = renData[idx], rg = renData[idx+1], rb = renData[idx+2];
        if (Math.abs(rr - tr) < 3 && Math.abs(rg - tg) < 3 && Math.abs(rb - tb) < 3) {
          uncovered++;
        }
      }
    }
  }
  console.log(`Rendered ${outName} -> Uncovered Canva pixels: ${uncovered}`);
}

async function run() {
  const t17_straight_slots = [
    { x: 14.5, y: 1.8, width: 36.0, height: 26.5, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 4.5, y: 27.5, width: 41.0, height: 27.5, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 1.5, y: 57.5, width: 44.0, height: 32.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 49.5, y: 5.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 44.5, y: 33.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 39.5, y: 61.5, width: 45.5, height: 30.5, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ];
  await renderTemplateExact('template 17.png', t17_straight_slots, 'test_straight_t17.png');

  const t16_straight_slots = [
    { x: 4.5, y: 7.5, width: 66.0, height: 30.5, borderRadius: 3, label: 'Hero Atas' },
    { x: 4.5, y: 37.5, width: 66.0, height: 49.0, borderRadius: 3, label: 'Hero Bawah' },
    { x: 67.5, y: 11.5, width: 31.0, height: 20.5, borderRadius: 2, label: 'Strip 1' },
    { x: 65.5, y: 29.5, width: 33.0, height: 18.5, borderRadius: 2, label: 'Strip 2' },
    { x: 63.5, y: 46.5, width: 33.0, height: 19.5, borderRadius: 2, label: 'Strip 3' },
    { x: 61.5, y: 64.5, width: 33.0, height: 19.5, borderRadius: 2, label: 'Strip 4' },
  ];
  await renderTemplateExact('template 16.png', t16_straight_slots, 'test_straight_t16.png');
}

run();
