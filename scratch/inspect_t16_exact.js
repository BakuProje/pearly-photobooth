const sharp = require('sharp');
const path = require('path');

async function inspectT16() {
  const filepath = path.join('public/images/template', 'template 16.png');
  const img = sharp(filepath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  console.log(`T16 size: ${w}x${h}`);

  // In T16:
  // Strip 1: top right (around x: 740..1050, y: 230..620)
  // Strip 2: right mid-upper (around x: 730..1050, y: 570..990)
  // Strip 3: right mid-lower (around x: 710..1050, y: 940..1350)
  // Strip 4: right bottom (around x: 690..1030, y: 1290..1690)
  // Hero Atas: top left (around x: 70..780, y: 180..810)
  // Hero Bawah: bottom left (around x: 30..780, y: 720..1700)

  // Let's sample specific strips and find the exact frame boundaries (where black/border transitions to placeholder or vice versa)
  const regions = [
    { name: 'Hero Atas', x1: 50, x2: 800, y1: 150, y2: 850 },
    { name: 'Hero Bawah', x1: 20, x2: 800, y1: 700, y2: 1720 },
    { name: 'Strip 1', x1: 650, x2: 1060, y1: 200, y2: 650 },
    { name: 'Strip 2', x1: 650, x2: 1060, y1: 550, y2: 1000 },
    { name: 'Strip 3', x1: 650, x2: 1060, y1: 900, y2: 1350 },
    { name: 'Strip 4', x1: 600, x2: 1060, y1: 1250, y2: 1720 },
  ];

  for (const reg of regions) {
    let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
    let count = 0;
    for (let y = reg.y1; y < reg.y2; y++) {
      for (let x = reg.x1; x < reg.x2; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // detect canva placeholder (green hill / blue sky / cloud)
        const isSky = (b > 160 && b > r * 1.15 && r < 190 && g > 120 && g < 245);
        const isHill = (g > 110 && g > r * 1.1 && g > b * 1.15 && r < 190 && b < 140);
        const isCloud = (r > 230 && g > 235 && b > 240);
        if (isSky || isHill || isCloud) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          count++;
        }
      }
    }
    console.log(`\n${reg.name}:`);
    console.log(`  Pixels found: ${count}`);
    console.log(`  BBox Px: [x: ${minX}..${maxX} (w: ${maxX - minX + 1}), y: ${minY}..${maxY} (h: ${maxY - minY + 1})]`);
    console.log(`  Percent: x: ${((minX / w) * 100).toFixed(2)}%, y: ${((minY / h) * 100).toFixed(2)}%, w: ${(((maxX - minX + 1) / w) * 100).toFixed(2)}%, h: ${(((maxY - minY + 1) / h) * 100).toFixed(2)}%`);
    console.log(`  Center: cx: ${(((minX + maxX) / 2 / w) * 100).toFixed(2)}%, cy: ${(((minY + maxY) / 2 / h) * 100).toFixed(2)}%`);
  }
}

inspectT16();
