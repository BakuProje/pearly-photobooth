const sharp = require('sharp');
const fs = require('fs');

async function processTemplate(filename, numSlots, slotRegions) {
  const { data, info } = await sharp('images/template/' + filename).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`\n========================================`);
  console.log(`ANALYZING ${filename} (${width}x${height})`);
  console.log(`========================================`);

  for (let i = 0; i < slotRegions.length; i++) {
    const reg = slotRegions[i];
    const minPxX = Math.floor((reg.searchX[0] / 100) * width);
    const maxPxX = Math.ceil((reg.searchX[1] / 100) * width);
    const minPxY = Math.floor((reg.searchY[0] / 100) * height);
    const maxPxY = Math.ceil((reg.searchY[1] / 100) * height);

    let points = [];
    for (let y = minPxY; y <= maxPxY; y++) {
      for (let x = minPxX; x <= maxPxX; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        
        // Match Canva placeholder colors (sky, grass, dark grass, cloud)
        const isSky = (b > 150 && g > 120 && r < 210 && b > r + 10);
        const isGrass = (g > 95 && g > r * 1.02 && g > b * 1.1 && r < 220 && b < 170);
        const isDarkGrass = (g > 70 && g < 150 && g > r + 8 && g > b + 15);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);

        if (isSky || isGrass || isDarkGrass || isCloud) {
          points.push({ x, y });
        }
      }
    }

    if (points.length === 0) {
      console.log(`Slot #${i+1} (${reg.name}): NO POINTS FOUND in search box`);
      continue;
    }

    // Compute center of mass
    let sumX = 0, sumY = 0;
    for (const p of points) { sumX += p.x; sumY += p.y; }
    const cx = sumX / points.length;
    const cy = sumY / points.length;

    // Test different rotation angles to find the tightest rotated bounding box
    let bestRot = 0;
    let bestArea = Infinity;
    let bestBounds = null;

    const angleStart = reg.expectedRot ? reg.expectedRot - 10 : -25;
    const angleEnd = reg.expectedRot ? reg.expectedRot + 10 : 25;

    for (let angleDeg = angleStart; angleDeg <= angleEnd; angleDeg += 0.2) {
      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);

      let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
      for (const p of points) {
        // rotate around center (cx, cy)
        const dx = p.x - cx;
        const dy = p.y - cy;
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        if (rx < rMinX) rMinX = rx;
        if (rx > rMaxX) rMaxX = rx;
        if (ry < rMinY) rMinY = ry;
        if (ry > rMaxY) rMaxY = ry;
      }

      const w = rMaxX - rMinX;
      const h = rMaxY - rMinY;
      const area = w * h;

      if (area < bestArea) {
        bestArea = area;
        bestRot = angleDeg;
        bestBounds = { rMinX, rMaxX, rMinY, rMaxY, w, h };
      }
    }

    // Convert back to template % coordinates
    // When rendered with CSS/Canvas rotate(rot deg):
    // The top-left corner before rotation is (cx + bestBounds.rMinX, cy + bestBounds.rMinY)
    // Box width is bestBounds.w, height is bestBounds.h
    // To ensure 100% full coverage of the placeholder with NO background leakage,
    // we expand width and height by ~2% (1% on each side)
    const padW = bestBounds.w * 0.025; // 2.5% padding to ensure clean overlap
    const padH = bestBounds.h * 0.025;
    const finalW = bestBounds.w + padW * 2;
    const finalH = bestBounds.h + padH * 2;
    const finalLeft = cx + bestBounds.rMinX - padW;
    const finalTop = cy + bestBounds.rMinY - padH;

    const leftPct = +((finalLeft / width) * 100).toFixed(1);
    const topPct = +((finalTop / height) * 100).toFixed(1);
    const widthPct = +((finalW / width) * 100).toFixed(1);
    const heightPct = +((finalH / height) * 100).toFixed(1);
    const rotRounded = +(bestRot).toFixed(1);

    console.log(`Slot #${i+1} (${reg.name}):`);
    console.log(`  Raw Placeholder: ${points.length} px, Center=(${((cx/width)*100).toFixed(1)}%, ${((cy/height)*100).toFixed(1)}%)`);
    console.log(`  Calculated Best Angle: ${rotRounded}°`);
    console.log(`  Exact Slot: { x: ${leftPct}, y: ${topPct}, width: ${widthPct}, height: ${heightPct}, rotation: ${rotRounded}, borderRadius: ${reg.borderRadius || 3}, label: '${reg.name}' },`);
  }
}

async function main() {
  // 1. Template 17 (1333 x 2000)
  const t17_regions = [
    { name: 'Polaroid 1 (Atas Kiri)', searchX: [15, 50], searchY: [2, 28], expectedRot: -3.8, borderRadius: 2 },
    { name: 'Polaroid 2 (Tengah Kiri)', searchX: [5, 45], searchY: [28, 55], expectedRot: 0.0, borderRadius: 2 },
    { name: 'Polaroid 3 (Bawah Kiri)', searchX: [2, 45], searchY: [58, 90], expectedRot: 10.5, borderRadius: 2 },
    { name: 'Strip 1 (Atas Kanan)', searchX: [50, 95], searchY: [6, 36], expectedRot: 8.3, borderRadius: 2 },
    { name: 'Strip 2 (Tengah Kanan)', searchX: [45, 90], searchY: [34, 64], expectedRot: 8.3, borderRadius: 2 },
    { name: 'Strip 3 (Bawah Kanan)', searchX: [40, 85], searchY: [62, 92], expectedRot: 8.3, borderRadius: 2 },
  ];
  await processTemplate('template 17.png', 6, t17_regions);

  // 2. Template 16 (1080 x 1920)
  const t16_regions = [
    { name: 'Hero Atas', searchX: [5, 70], searchY: [8, 38], expectedRot: -2.8, borderRadius: 3 },
    { name: 'Hero Bawah', searchX: [5, 70], searchY: [38, 86], expectedRot: -2.8, borderRadius: 3 },
    { name: 'Strip 1', searchX: [68, 98], searchY: [12, 32], expectedRot: -1.0, borderRadius: 2 },
    { name: 'Strip 2', searchX: [66, 98], searchY: [30, 48], expectedRot: -1.0, borderRadius: 2 },
    { name: 'Strip 3', searchX: [64, 96], searchY: [47, 66], expectedRot: -1.0, borderRadius: 2 },
    { name: 'Strip 4', searchX: [62, 94], searchY: [65, 84], expectedRot: -1.0, borderRadius: 2 },
  ];
  await processTemplate('template 16.png', 6, t16_regions);
}

main();
