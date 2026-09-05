const sharp = require('sharp');
const fs = require('fs');

async function measureExactCloudBox(templateFile, searchRegions) {
  const filepath = 'public/images/template/' + templateFile;
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n======================================================`);
  console.log(`MEASURING: ${templateFile} (${width}x${height})`);
  console.log(`======================================================`);

  const results = [];

  for (let sIdx = 0; sIdx < searchRegions.length; sIdx++) {
    const reg = searchRegions[sIdx];
    const minPxX = Math.floor((reg.searchX[0] / 100) * width);
    const maxPxX = Math.ceil((reg.searchX[1] / 100) * width);
    const minPxY = Math.floor((reg.searchY[0] / 100) * height);
    const maxPxY = Math.ceil((reg.searchY[1] / 100) * height);

    let pts = [];
    for (let y = minPxY; y <= maxPxY; y++) {
      for (let x = minPxX; x <= maxPxX; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        
        const isSky = (b > 165 && g > 130 && r < 210 && b > r + 10);
        const isGrass = (g > 105 && g > r * 1.05 && g > b * 1.15 && r < 215 && b < 165);
        const isDarkGrass = (g > 75 && g < 155 && g > r * 1.02 && g > b * 1.1);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);

        if (isSky || isGrass || isDarkGrass || isCloud) {
          pts.push({ x, y });
        }
      }
    }

    if (pts.length === 0) {
      console.log(`Region #${sIdx+1} (${reg.name}): NO POINTS FOUND!`);
      continue;
    }

    let minX = width, maxX = 0, minY = height, maxY = 0;
    let sumX = 0, sumY = 0;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x; sumY += p.y;
    }
    const cx = sumX / pts.length;
    const cy = sumY / pts.length;

    // Search for best rotation angle
    let bestRot = 0, minArea = Infinity, bestBox = null;
    const angleRange = reg.expectedRot !== undefined ? [reg.expectedRot - 8, reg.expectedRot + 8] : [-15, 15];

    for (let deg = angleRange[0]; deg <= angleRange[1]; deg += 0.1) {
      const rad = (-deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
      for (let k = 0; k < pts.length; k += 4) {
        const p = pts[k];
        const rx = (p.x - cx) * cos - (p.y - cy) * sin;
        const ry = (p.x - cx) * sin + (p.y - cy) * cos;
        if (rx < minRx) minRx = rx;
        if (rx > maxRx) maxRx = rx;
        if (ry < minRy) minRy = ry;
        if (ry > maxRy) maxRy = ry;
      }
      const a = (maxRx - minRx) * (maxRy - minRy);
      if (a < minArea) {
        minArea = a;
        bestRot = deg;
        bestBox = { w: maxRx - minRx, h: maxRy - minRy, minRx, minRy };
      }
    }

    // Add minimal 1% padding so photo cleanly covers the entire cloud window without leaking background
    const padW = bestBox.w * 0.01;
    const padH = bestBox.h * 0.01;
    const finalW = bestBox.w + padW * 2;
    const finalH = bestBox.h + padH * 2;

    // The top-left corner before rotation is (cx - finalW/2, cy - finalH/2)
    const finalX = cx - finalW / 2;
    const finalY = cy - finalH / 2;

    const xPct = +((finalX / width) * 100).toFixed(1);
    const yPct = +((finalY / height) * 100).toFixed(1);
    const wPct = +((finalW / width) * 100).toFixed(1);
    const hPct = +((finalH / height) * 100).toFixed(1);
    const rotRounded = Math.abs(bestRot) < 0.5 ? 0 : +bestRot.toFixed(1);

    const slotDef = {
      x: xPct,
      y: yPct,
      width: wPct,
      height: hPct,
      ...(rotRounded ? { rotation: rotRounded } : {}),
      borderRadius: reg.borderRadius || 3,
      label: reg.name
    };

    results.push(slotDef);
    console.log(`Slot #${sIdx+1} (${reg.name}):`);
    console.log(`  Raw points: ${pts.length}, Center=(${((cx/width)*100).toFixed(1)}%, ${((cy/height)*100).toFixed(1)}%), rot=${bestRot.toFixed(2)}°`);
    console.log(`  Slot Object:`, JSON.stringify(slotDef));
  }

  return results;
}

async function main() {
  // 1. Template 25 (1080 x 1350)
  // Left strip: 3 small square windows with clouds
  // Right polaroid: 1 cloud window inside the polaroid (above the bottom signature "Snapbooth")
  const t25_regions = [
    { name: 'Strip 1 (Atas)', searchX: [6, 34], searchY: [19, 39], expectedRot: 0, borderRadius: 2 },
    { name: 'Strip 2 (Tengah)', searchX: [6, 34], searchY: [40, 60], expectedRot: 0, borderRadius: 2 },
    { name: 'Strip 3 (Bawah)', searchX: [6, 34], searchY: [61, 81], expectedRot: 0, borderRadius: 2 },
    { name: 'Polaroid Kanan', searchX: [36, 92], searchY: [25, 75], expectedRot: 0, borderRadius: 2 },
  ];
  await measureExactCloudBox('template 25.png', t25_regions);

  // 2. Template 26 (1080 x 1920)
  // 1 polaroid in center: cloud window inside polaroid frame
  const t26_regions = [
    { name: 'Sunset Polaroid', searchX: [20, 80], searchY: [25, 75], expectedRot: 0, borderRadius: 3 },
  ];
  await measureExactCloudBox('template 26.png', t26_regions);

  // 3. Template 27 (1080 x 1920)
  // 1 polaroid in center: cloud window inside polaroid frame
  const t27_regions = [
    { name: 'Dark Newspaper Polaroid', searchX: [12, 88], searchY: [26, 75], expectedRot: 0, borderRadius: 3 },
  ];
  await measureExactCloudBox('template 27.png', t27_regions);

  // 4. Template 17 (1333 x 2000)
  // 6 cloud windows: 3 polaroids on left + 3 strip frames on right
  const t17_regions = [
    { name: 'Polaroid 1 (Atas Kiri)', searchX: [14, 52], searchY: [1, 26], expectedRot: 0, borderRadius: 2 },
    { name: 'Polaroid 2 (Tengah Kiri)', searchX: [4, 46], searchY: [28, 55], expectedRot: 0, borderRadius: 2 },
    { name: 'Polaroid 3 (Bawah Kiri)', searchX: [0, 44], searchY: [58, 90], expectedRot: 0, borderRadius: 2 },
    { name: 'Strip 1 (Atas Kanan)', searchX: [48, 96], searchY: [6, 37], expectedRot: 0, borderRadius: 2 },
    { name: 'Strip 2 (Tengah Kanan)', searchX: [42, 92], searchY: [34, 65], expectedRot: 0, borderRadius: 2 },
    { name: 'Strip 3 (Bawah Kanan)', searchX: [35, 88], searchY: [62, 93], expectedRot: 0, borderRadius: 2 },
  ];
  await measureExactCloudBox('template 17.png', t17_regions);
}

main();
