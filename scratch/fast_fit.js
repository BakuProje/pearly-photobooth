const sharp = require('sharp');
const fs = require('fs');

async function analyzeTemplate(imgPath, regionSeeds) {
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  function isCanva(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const idx = (Math.round(y) * w + Math.round(x)) * ch;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    // Green
    if (g > 100 && g > r * 1.05 && g > b * 1.3 && r < 210 && b < 120) return true;
    if (g > 140 && r > 110 && r < 220 && b < 130) return true;
    // Blue
    if (b > 200 && g > 160 && r > 120 && b >= g && b > r) return true;
    // Cloud
    if (r > 240 && g > 240 && b > 240) return true;
    return false;
  }

  const results = [];
  for (const seed of regionSeeds) {
    // Search for a Canva pixel near seed.cx, seed.cy
    const startX = Math.round(seed.cx * w / 100);
    const startY = Math.round(seed.cy * h / 100);
    
    // Flood fill to find all pixels in this component
    const visited = new Uint8Array(w * h);
    const q = [startX, startY];
    visited[startY * w + startX] = 1;
    let sumX = 0, sumY = 0, count = 0;
    const pts = [];

    // If start pixel isn't Canva, spiral search nearby
    let found = isCanva(startX, startY);
    if (!found) {
      for (let r = 2; r < 50; r += 2) {
        for (let a = 0; a < 360; a += 30) {
          const nx = Math.round(startX + r * Math.cos(a * Math.PI / 180));
          const ny = Math.round(startY + r * Math.sin(a * Math.PI / 180));
          if (isCanva(nx, ny)) {
            q[0] = nx; q[1] = ny;
            visited[ny * w + nx] = 1;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      console.log(`Could not find Canva pixel for seed ${seed.label}`);
      continue;
    }

    let head = 0;
    while (head < q.length) {
      const cx = q[head++];
      const cy = q[head++];
      count++;
      sumX += cx; sumY += cy;
      if (head % 4 === 0) pts.push([cx, cy]);

      const neighbors = [
        [cx+3, cy], [cx-3, cy], [cx, cy+3], [cx, cy-3]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nidx = ny * w + nx;
          // Constrain search within region bounds if specified
          if (seed.minX && (nx < seed.minX * w / 100 || nx > seed.maxX * w / 100)) continue;
          if (seed.minY && (ny < seed.minY * h / 100 || ny > seed.maxY * h / 100)) continue;

          if (isCanva(nx, ny) && !visited[nidx]) {
            visited[nidx] = 1;
            q.push(nx, ny);
          }
        }
      }
    }

    const meanX = sumX / count;
    const meanY = sumY / count;

    // Moments for rotation
    let sxx = 0, syy = 0, sxy = 0;
    for (const [px, py] of pts) {
      sxx += (px - meanX) * (px - meanX);
      syy += (py - meanY) * (py - meanY);
      sxy += (px - meanX) * (py - meanY);
    }
    const angleRad = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    let angleDeg = (angleRad * 180 / Math.PI);
    while (angleDeg > 45) angleDeg -= 90;
    while (angleDeg < -45) angleDeg += 90;

    // Use seed's expected rotation if specified or refined angle
    const chosenRot = seed.expectedRot !== undefined ? seed.expectedRot : angleDeg;
    const chosenRad = chosenRot * Math.PI / 180;
    const cosA = Math.cos(chosenRad);
    const sinA = Math.sin(chosenRad);

    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const [px, py] of pts) {
      const u = (px - meanX) * cosA + (py - meanY) * sinA;
      const v = -(px - meanX) * sinA + (py - meanY) * cosA;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }

    const boxW = maxU - minU;
    const boxH = maxV - minV;
    const centerU = (minU + maxU) / 2;
    const centerV = (minV + maxV) / 2;

    const actualCX = meanX + centerU * cosA - centerV * sinA;
    const actualCY = meanY + centerU * sinA + centerV * cosA;

    const slotX = (actualCX - boxW / 2) / w * 100;
    const slotY = (actualCY - boxH / 2) / h * 100;
    const slotW = boxW / w * 100;
    const slotH = boxH / h * 100;

    results.push({
      label: seed.label,
      x: +slotX.toFixed(1),
      y: +slotY.toFixed(1),
      width: +slotW.toFixed(1),
      height: +slotH.toFixed(1),
      rotation: +chosenRot.toFixed(1),
      borderRadius: seed.borderRadius || 3,
    });
  }

  console.log(`\n=== Results for ${imgPath} ===`);
  console.log(JSON.stringify(results, null, 2));
  return results;
}

async function run() {
  // T17
  const t17_seeds = [
    { label: 'Polaroid 1 (Atas Kiri)', cx: 33, cy: 15, expectedRot: -3.8, minX: 15, maxX: 50, minY: 2, maxY: 28 },
    { label: 'Polaroid 2 (Tengah Kiri)', cx: 27, cy: 42, expectedRot: 0.0, minX: 10, maxX: 45, minY: 28, maxY: 56 },
    { label: 'Polaroid 3 (Bawah Kiri)', cx: 24, cy: 76, expectedRot: 9.0, minX: 5, maxX: 42, minY: 58, maxY: 90 },
    { label: 'Strip 1 (Atas Kanan)', cx: 69, cy: 21, expectedRot: -8.3, minX: 50, maxX: 88, minY: 5, maxY: 35 },
    { label: 'Strip 2 (Tengah Kanan)', cx: 64, cy: 49, expectedRot: -8.3, minX: 45, maxX: 83, minY: 34, maxY: 64 },
    { label: 'Strip 3 (Bawah Kanan)', cx: 59, cy: 77, expectedRot: -8.3, minX: 40, maxX: 78, minY: 63, maxY: 92 },
  ];
  const t17_res = await analyzeTemplate('public/images/template/template 17.png', t17_seeds);

  // T16
  const t16_seeds = [
    { label: 'Hero Atas', cx: 38, cy: 23, expectedRot: -2.8, minX: 15, maxX: 62, minY: 10, maxY: 38 },
    { label: 'Hero Bawah', cx: 37, cy: 58, expectedRot: -2.8, minX: 12, maxX: 62, minY: 36, maxY: 82 },
    { label: 'Strip 1', cx: 86, cy: 22, expectedRot: -1.0, minX: 72, maxX: 100, minY: 12, maxY: 32 },
    { label: 'Strip 2', cx: 85, cy: 39, expectedRot: -1.0, minX: 71, maxX: 99, minY: 30, maxY: 50 },
    { label: 'Strip 3', cx: 84, cy: 56, expectedRot: -1.0, minX: 70, maxX: 98, minY: 47, maxY: 67 },
    { label: 'Strip 4', cx: 83, cy: 74, expectedRot: -1.0, minX: 69, maxX: 97, minY: 64, maxY: 85 },
  ];
  const t16_res = await analyzeTemplate('public/images/template/template 16.png', t16_seeds);

  // T25
  const t25_seeds = [
    { label: 'Gantungan #1', cx: 64, cy: 28, expectedRot: 0, minX: 55, maxX: 72, minY: 22, maxY: 33 },
    { label: 'Gantungan #2', cx: 73, cy: 29, expectedRot: 0, minX: 67, maxX: 80, minY: 24, maxY: 35 },
    { label: 'Gantungan #3', cx: 83, cy: 31, expectedRot: 0, minX: 77, maxX: 90, minY: 26, maxY: 37 },
    { label: 'Gantungan #4', cx: 93, cy: 33, expectedRot: 0, minX: 87, maxX: 100, minY: 28, maxY: 39 },
    { label: 'Sticky Pink', cx: 15, cy: 40, expectedRot: 0, minX: 5, maxX: 26, minY: 33, maxY: 48 },
    { label: 'Buku Kiri', cx: 27, cy: 55, expectedRot: 0, minX: 8, maxX: 47, minY: 45, maxY: 66 },
    { label: 'Buku Kanan', cx: 73, cy: 44, expectedRot: 0, minX: 53, maxX: 93, minY: 34, maxY: 54 },
    { label: 'Polaroid Kiri Bawah', cx: 22, cy: 74, expectedRot: -10.0, minX: 0, maxX: 45, minY: 60, maxY: 88 },
    { label: 'Polaroid Tengah', cx: 48, cy: 72, expectedRot: 10.0, minX: 25, maxX: 72, minY: 58, maxY: 88 },
    { label: 'Kamera Digital', cx: 15, cy: 91, expectedRot: 0, minX: 2, maxX: 28, minY: 84, maxY: 98 },
    { label: 'Polaroid Bawah', cx: 54, cy: 89, expectedRot: -3.0, minX: 35, maxX: 74, minY: 79, maxY: 99 },
    { label: 'Filmstrip #1', cx: 83, cy: 62, expectedRot: 0, minX: 68, maxX: 98, minY: 55, maxY: 70 },
    { label: 'Filmstrip #2', cx: 80, cy: 76, expectedRot: 0, minX: 65, maxX: 95, minY: 69, maxY: 84 },
    { label: 'Filmstrip #3', cx: 77, cy: 90, expectedRot: 0, minX: 62, maxX: 92, minY: 83, maxY: 98 },
  ];
  const t25_res = await analyzeTemplate('public/images/template/template 25.png', t25_seeds);
}

run();
