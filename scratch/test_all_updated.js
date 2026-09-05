const sharp = require('sharp');
const fs = require('fs');

async function createSamplePhoto(w, h, label, r, g, b) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(${r},${g},${b})" />
        <stop offset="100%" stop-color="rgb(${Math.max(0,r-45)},${Math.max(0,g-45)},${Math.max(0,b-45)})" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <rect x="${w*0.06}" y="${h*0.06}" width="${w*0.88}" height="${h*0.88}" rx="12" fill="#ffffff" fill-opacity="0.9" />
    <circle cx="${w/2}" cy="${h*0.4}" r="${Math.min(w,h)*0.2}" fill="rgb(${r},${g},${b})" />
    <text x="${w/2}" y="${h*0.75}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w,h)*0.13)}" font-weight="bold" fill="#0f172a" text-anchor="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderAndTest(templateFile, slots, outName) {
  const templatePath = 'public/images/template/' + templateFile;
  const meta = await sharp(templatePath).metadata();
  const { width, height } = meta;

  const bgImg = await sharp(templatePath).png().toBuffer();
  const composites = [];

  const colors = [
    [239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94],
    [6, 182, 212], [59, 130, 246], [168, 85, 247], [236, 72, 153],
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
    const rawPhoto = await createSamplePhoto(800, 800, `#${i+1} ${slot.label || ''}`, r, g, b);
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
  console.log(`Saved scratch/${outName} (${width}x${height})`);

  // Count uncovered Canva placeholder pixels
  const { data: renData } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
  const { data: tmplData } = await sharp(templatePath).raw().toBuffer({ resolveWithObject: true });
  let uncovered = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const tr = tmplData[idx], tg = tmplData[idx+1], tb = tmplData[idx+2];
      const isGrass = (tg > 95 && tg > tr * 1.05 && tg > tb * 1.15 && tr < 210 && tb < 160);
      const isSky = (tb > 150 && tg > 120 && tr < 210 && tb > tr + 12);
      if (isGrass || isSky) {
        const rr = renData[idx], rg = renData[idx+1], rb = renData[idx+2];
        if (Math.abs(rr - tr) < 3 && Math.abs(rg - tg) < 3 && Math.abs(rb - tb) < 3) {
          // ignore top sky decorative art outside photo frames
          uncovered++;
        }
      }
    }
  }
  console.log(`  Uncovered Canva pixels in ${outName}: ${uncovered}`);
}

async function run() {
  // Template 16 (600 x 1800, single strip 3 poses)
  const t16_slots = [
    { x: 18.5, y: 2.2, width: 74.0, height: 25.0, borderRadius: 4, label: 'Foto #1 (Atas)' },
    { x: 18.5, y: 28.5, width: 74.0, height: 25.0, borderRadius: 4, label: 'Foto #2 (Tengah)' },
    { x: 18.5, y: 54.8, width: 74.0, height: 25.0, borderRadius: 4, label: 'Foto #3 (Bawah)' },
  ];
  await renderAndTest('template 16.png', t16_slots, 'test_new_t16.png');

  // Template 17 (1333 x 2000, 6 poses scrapbook)
  const t17_slots = [
    { x: 14.5, y: 1.5, width: 37.0, height: 25.0, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
    { x: 4.5, y: 29.0, width: 41.5, height: 26.5, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
    { x: 0.5, y: 59.5, width: 42.5, height: 30.5, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
    { x: 49.5, y: 7.2, width: 48.0, height: 29.8, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
    { x: 44.0, y: 35.5, width: 48.5, height: 29.5, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
    { x: 36.5, y: 63.5, width: 49.5, height: 29.5, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
  ];
  await renderAndTest('template 17.png', t17_slots, 'test_new_t17.png');

  // Template 25 (1080 x 1350, 4 poses: 3 on left strip, 1 big polaroid on right)
  const t25_slots = [
    { x: 5.0, y: 18.5, width: 27.5, height: 21.0, borderRadius: 3, label: 'Strip 1 (Atas)' },
    { x: 5.0, y: 39.5, width: 27.5, height: 21.0, borderRadius: 3, label: 'Strip 2 (Tengah)' },
    { x: 5.0, y: 60.5, width: 27.5, height: 21.5, borderRadius: 3, label: 'Strip 3 (Bawah)' },
    { x: 36.2, y: 23.5, width: 59.0, height: 57.0, borderRadius: 3, label: 'Polaroid Kanan' },
  ];
  await renderAndTest('template 25.png', t25_slots, 'test_new_t25.png');

  // Template 26 (1080 x 1920, 1 pose sunset polaroid)
  const t26_slots = [
    { x: 21.0, y: 26.0, width: 57.5, height: 47.8, rotation: 2.8, borderRadius: 4, label: 'Sunset Polaroid' },
  ];
  await renderAndTest('template 26.png', t26_slots, 'test_new_t26.png');

  // Template 27 (1080 x 1920, 1 pose dark newspaper polaroid)
  const t27_slots = [
    { x: 12.5, y: 27.5, width: 75.0, height: 48.0, rotation: -1.6, borderRadius: 4, label: 'Dark Newspaper Polaroid' },
  ];
  await renderAndTest('template 27.png', t27_slots, 'test_new_t27.png');
}

run();
