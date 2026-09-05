const sharp = require('sharp');

async function inspectAllSlots(templatePath, regions) {
  const { data, info } = await sharp('images/template/' + templatePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n========================================`);
  console.log(`ANALYZING ${templatePath} (${width}x${height})`);
  console.log(`========================================`);

  for (const reg of regions) {
    const minPxX = Math.floor((reg.searchX[0] / 100) * width);
    const maxPxX = Math.ceil((reg.searchX[1] / 100) * width);
    const minPxY = Math.floor((reg.searchY[0] / 100) * height);
    const maxPxY = Math.ceil((reg.searchY[1] / 100) * height);

    let points = [];
    for (let y = minPxY; y <= maxPxY; y++) {
      for (let x = minPxX; x <= maxPxX; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 150 && g > 120 && r < 210 && b > r + 10);
        const isGrass = (g > 95 && g > r * 1.02 && g > b * 1.1 && r < 220 && b < 170);
        const isDarkGrass = (g > 70 && g < 150 && g > r + 8 && g > b + 15);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
        if (isSky || isGrass || isDarkGrass || isCloud) {
          points.push({ x, y });
        }
      }
    }

    if (points.length === 0) continue;

    // Find extreme points
    let topPoint = points[0], botPoint = points[points.length - 1];
    let leftPoint = points[0], rightPoint = points[0];
    let minX = width, maxX = 0, minY = height, maxY = 0;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.x < leftPoint.x) leftPoint = p;
      if (p.x > rightPoint.x) rightPoint = p;
    }

    // Measure rotation from top edge and left edge
    // Find top-left, top-right, bottom-left, bottom-right corners
    // Point closest to (minX, minY) is TL, (maxX, minY) is TR, (minX, maxY) is BL, (maxX, maxY) is BR
    let tl = points[0], tr = points[0], bl = points[0], br = points[0];
    let minD_TL = Infinity, minD_TR = Infinity, minD_BL = Infinity, minD_BR = Infinity;

    for (const p of points) {
      const dTL = Math.hypot(p.x - minX, p.y - minY);
      const dTR = Math.hypot(p.x - maxX, p.y - minY);
      const dBL = Math.hypot(p.x - minX, p.y - maxY);
      const dBR = Math.hypot(p.x - maxX, p.y - maxY);
      if (dTL < minD_TL) { minD_TL = dTL; tl = p; }
      if (dTR < minD_TR) { minD_TR = dTR; tr = p; }
      if (dBL < minD_BL) { minD_BL = dBL; bl = p; }
      if (dBR < minD_BR) { minD_BR = dBR; br = p; }
    }

    // Top edge angle
    const topAngle = Math.atan2(tr.y - tl.y, tr.x - tl.x) * (180 / Math.PI);
    // Left edge angle
    const leftAngle = (Math.atan2(bl.y - tl.y, bl.x - tl.x) * (180 / Math.PI)) - 90;
    const avgAngle = (topAngle + leftAngle) / 2;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const boxW = maxX - minX;
    const boxH = maxY - minY;

    console.log(`--- ${reg.name} ---`);
    console.log(`  TL: (${((tl.x/width)*100).toFixed(2)}%, ${((tl.y/height)*100).toFixed(2)}%)`);
    console.log(`  TR: (${((tr.x/width)*100).toFixed(2)}%, ${((tr.y/height)*100).toFixed(2)}%)`);
    console.log(`  BL: (${((bl.x/width)*100).toFixed(2)}%, ${((bl.y/height)*100).toFixed(2)}%)`);
    console.log(`  BR: (${((br.x/width)*100).toFixed(2)}%, ${((br.y/height)*100).toFixed(2)}%)`);
    console.log(`  Angle: topEdge=${topAngle.toFixed(2)}°, leftEdge=${leftAngle.toFixed(2)}°, avg=${avgAngle.toFixed(2)}°`);
    console.log(`  BoundingBox: x=${((minX/width)*100).toFixed(2)}%, y=${((minY/height)*100).toFixed(2)}%, w=${((boxW/width)*100).toFixed(2)}%, h=${((boxH/height)*100).toFixed(2)}%`);
  }
}

async function main() {
  const t17_regions = [
    { name: 'Polaroid 1 (Atas Kiri)', searchX: [15, 50], searchY: [2, 28] },
    { name: 'Polaroid 2 (Tengah Kiri)', searchX: [5, 45], searchY: [28, 55] },
    { name: 'Polaroid 3 (Bawah Kiri)', searchX: [2, 45], searchY: [58, 90] },
    { name: 'Strip 1 (Atas Kanan)', searchX: [50, 95], searchY: [6, 36] },
    { name: 'Strip 2 (Tengah Kanan)', searchX: [45, 90], searchY: [34, 64] },
    { name: 'Strip 3 (Bawah Kanan)', searchX: [40, 85], searchY: [62, 92] },
  ];
  await inspectAllSlots('template 17.png', t17_regions);

  const t16_regions = [
    { name: 'Hero Atas', searchX: [5, 70], searchY: [8, 38] },
    { name: 'Hero Bawah', searchX: [5, 70], searchY: [38, 86] },
    { name: 'Strip 1', searchX: [68, 98], searchY: [12, 32] },
    { name: 'Strip 2', searchX: [66, 98], searchY: [30, 48] },
    { name: 'Strip 3', searchX: [64, 96], searchY: [47, 66] },
    { name: 'Strip 4', searchX: [62, 94], searchY: [65, 84] },
  ];
  await inspectAllSlots('template 16.png', t16_regions);
}

main();
