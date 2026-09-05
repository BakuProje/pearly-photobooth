const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// We can test composite drawing onto template 16 using sharp svg composite!
async function testT16Render() {
  const filepath = path.join('public/images/template', 'template 16.png');
  const meta = await sharp(filepath).metadata();
  const w = meta.width;
  const h = meta.height;

  // Let's test slots for T16:
  // Strip 1: cx: 79.5%, cy: 22.2%, w: 32%, h: 22.5%, rot: 2.8°
  // Strip 2: cx: 77.8%, cy: 40.5%, w: 32%, h: 22.5%, rot: 2.8°
  // Strip 3: cx: 76.2%, cy: 58.7%, w: 32%, h: 22.5%, rot: 2.8°
  // Strip 4: cx: 74.5%, cy: 77.0%, w: 32%, h: 22.5%, rot: 2.8°
  // Hero Atas: cx: 40.0%, cy: 26.5%, w: 68%, h: 35%, rot: 4.0°
  // Hero Bawah: cx: 38.5%, cy: 63.5%, w: 72%, h: 52%, rot: -3.0°

  const slots = [
    { name: 'Hero Atas', cx: 40.0, cy: 26.5, w: 68.0, h: 35.0, rot: 4.0 },
    { name: 'Hero Bawah', cx: 38.5, cy: 63.5, w: 72.0, h: 52.0, rot: -3.0 },
    { name: 'Strip 1', cx: 79.5, cy: 22.2, w: 32.0, h: 22.5, rot: 2.8 },
    { name: 'Strip 2', cx: 77.8, cy: 40.5, w: 32.0, h: 22.5, rot: 2.8 },
    { name: 'Strip 3', cx: 76.2, cy: 58.7, w: 32.0, h: 22.5, rot: 2.8 },
    { name: 'Strip 4', cx: 74.5, cy: 77.0, w: 32.0, h: 22.5, rot: 2.8 },
  ];

  // Convert cx,cy,w,h to x,y,width,height:
  const configSlots = slots.map(s => ({
    label: s.name,
    x: +(s.cx - s.w / 2).toFixed(1),
    y: +(s.cy - s.h / 2).toFixed(1),
    width: +s.w.toFixed(1),
    height: +s.h.toFixed(1),
    rotation: s.rot,
    borderRadius: 4
  }));

  console.log('T16 Config Slots:');
  console.log(JSON.stringify(configSlots, null, 2));

  // Let's create an SVG overlay that simulates drawing opaque photos in these slots
  let svgRects = '';
  configSlots.forEach(s => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    svgRects += `<g transform="rotate(${s.rotation} ${cx} ${cy})">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#ff4444" fill-opacity="0.85" stroke="#ffffff" stroke-width="3" />
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t16_out.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved test rendering to', outPath);

  // Check how many placeholder pixels remain visible outside the rendered boxes
  const { data, info } = await sharp(rendered).raw().toBuffer({ resolveWithObject: true });
  let leakedPlaceholder = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Check if red overlay didn't cover:
      // If red overlay covered, r > 200 and g < 100
      const isCovered = (r > 200 && g < 100);
      if (!isCovered) {
        // Is it a canva placeholder?
        // Note: exclude car at bottom (y > 1650 and x < 400)
        if (y < 1650 || x > 400) {
          const isSky = (b > 160 && b > r * 1.15 && r < 190 && g > 120 && g < 245);
          const isHill = (g > 110 && g > r * 1.1 && g > b * 1.15 && r < 190 && b < 140);
          if (isSky || isHill) {
            leakedPlaceholder++;
          }
        }
      }
    }
  }
  console.log(`Leaked placeholder pixels in T16: ${leakedPlaceholder}`);
}

testT16Render();
