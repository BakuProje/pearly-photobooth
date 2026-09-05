const sharp = require('sharp');
const path = require('path');

async function measureT17Fine() {
  const filepath = path.join('images/template', 'template 17.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  console.log(`T17 size: ${w}x${h}`);

  // 6 polaroid/card frames in T17
  // Region 1: Top-Left (x: 100..700, y: 50..800)
  // Region 2: Top-Right (x: 550..1300, y: 50..850)
  // Region 3: Mid-Left (x: 80..750, y: 500..1200)
  // Region 4: Mid-Right (x: 500..1300, y: 550..1300)
  // Region 5: Bottom-Left (x: 0..700, y: 1050..1800)
  // Region 6: Bottom-Right (x: 400..1300, y: 1050..1800)

  const regions = [
    { name: 'Card 1 (Atas Kiri)', x1: 150, x2: 700, y1: 50, y2: 750 },
    { name: 'Card 2 (Atas Kanan)', x1: 550, x2: 1250, y1: 50, y2: 850 },
    { name: 'Card 3 (Tengah Kiri)', x1: 80, x2: 700, y1: 500, y2: 1150 },
    { name: 'Card 4 (Tengah Kanan)', x1: 500, x2: 1250, y1: 550, y2: 1250 },
    { name: 'Card 5 (Bawah Kiri)', x1: 0, x2: 650, y1: 1050, y2: 1750 },
    { name: 'Card 6 (Bawah Kanan)', x1: 400, x2: 1250, y1: 1050, y2: 1750 },
  ];

  for (const reg of regions) {
    const pts = [];
    for (let y = reg.y1; y < reg.y2; y++) {
      for (let x = reg.x1; x < reg.x2; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        const isCloud = (r > 225 && g > 230 && b > 235);
        if (isSky || isHill || isCloud) {
          pts.push(x, y);
        }
      }
    }

    const count = pts.length / 2;
    if (count === 0) {
      console.log(`\n${reg.name}: NO PIXELS FOUND!`);
      continue;
    }
    let sumX = 0, sumY = 0;
    for (let i = 0; i < pts.length; i += 2) {
      sumX += pts[i];
      sumY += pts[i+1];
    }
    const cx = sumX / count;
    const cy = sumY / count;

    let bestAngle = 0;
    let minArea = Infinity;
    let bestW = 0, bestH = 0;
    for (let a = -25; a <= 25; a += 0.1) {
      const rad = (a * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - cx;
        const dy = pts[i + 1] - cy;
        const u = dx * cos + dy * sin;
        const v = -dx * sin + dy * cos;
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const area = (maxU - minU) * (maxV - minV);
      if (area < minArea) {
        minArea = area;
        bestAngle = a;
        bestW = maxU - minU;
        bestH = maxV - minV;
      }
    }

    const padW = bestW * 1.04;
    const padH = bestH * 1.04;
    console.log(`\n${reg.name}:`);
    console.log(`  Count: ${count} pts, Center: (${cx.toFixed(1)}, ${cy.toFixed(1)}) -> cx%: ${((cx/w)*100).toFixed(2)}%, cy%: ${((cy/h)*100).toFixed(2)}%`);
    console.log(`  Local size: ${bestW.toFixed(1)} x ${bestH.toFixed(1)} px -> w%: ${((bestW/w)*100).toFixed(2)}%, h%: ${((bestH/h)*100).toFixed(2)}%, angle: ${bestAngle.toFixed(2)}°`);
    const sx = +(((cx - padW / 2) / w) * 100).toFixed(1);
    const sy = +(((cy - padH / 2) / h) * 100).toFixed(1);
    const sw = +((padW / w) * 100).toFixed(1);
    const sh = +((padH / h) * 100).toFixed(1);
    console.log(`  Proposed slot: { x: ${sx}, y: ${sy}, width: ${sw}, height: ${sh}, rotation: ${+bestAngle.toFixed(1)}, borderRadius: 4, label: '${reg.name}' }`);
  }
}

measureT17Fine();
