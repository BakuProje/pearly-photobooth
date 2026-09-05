const sharp = require('sharp');
const fs = require('fs');

async function inspectT25() {
  const { data, info } = await sharp('public/images/template/template 25.png').raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log('=== Inspecting Template 25 Left Strip ===');

  // Let's scan x in [5% .. 35%] and check Y profile of placeholder pixels
  const minX = Math.floor(width * 0.05);
  const maxX = Math.floor(width * 0.35);

  const rowPlaceholderCount = new Int32Array(height);
  for (let y = 0; y < height; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isSky = (b > 150 && g > 120 && r < 210 && b > r + 12);
      const isGrass = (g > 95 && g > r * 1.05 && g > b * 1.15 && r < 210 && b < 160);
      const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
      if (isSky || isGrass || isCloud) {
        rowPlaceholderCount[y]++;
      }
    }
  }

  // Find blocks of placeholder rows
  let inBlock = false, startY = 0;
  const blocks = [];
  for (let y = 0; y < height; y++) {
    if (rowPlaceholderCount[y] > (maxX - minX) * 0.3) {
      if (!inBlock) { inBlock = true; startY = y; }
    } else {
      if (inBlock) {
        inBlock = false;
        blocks.push({ startY, endY: y, h: y - startY });
      }
    }
  }
  if (inBlock) blocks.push({ startY, endY: height - 1, h: height - 1 - startY });

  console.log(`Found ${blocks.length} photo blocks in left strip:`);
  blocks.forEach((b, i) => {
    console.log(`  Block #${i+1}: Y = ${((b.startY/height)*100).toFixed(2)}% to ${((b.endY/height)*100).toFixed(2)}% (height = ${((b.h/height)*100).toFixed(2)}%)`);
  });
}

async function inspectT17Precise() {
  const { data, info } = await sharp('public/images/template/template 17.png').raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log('\n=== Inspecting Template 17 Frames Precisely ===');

  // Let's inspect the 3 polaroids on the left and the 3 frames in the strip on the right
  // We want to find the exact inner photo cutout:
  // For each of the 6 photo areas, let's find the exact 4 corners of the photo window!
  const regions = [
    { name: 'Polaroid 1 (Atas Kiri)', xRange: [0.15, 0.50], yRange: [0.03, 0.26] },
    { name: 'Polaroid 2 (Tengah Kiri)', xRange: [0.06, 0.45], yRange: [0.30, 0.54] },
    { name: 'Polaroid 3 (Bawah Kiri)', xRange: [0.02, 0.42], yRange: [0.60, 0.88] },
    { name: 'Strip 1 (Atas Kanan)', xRange: [0.50, 0.95], yRange: [0.08, 0.35] },
    { name: 'Strip 2 (Tengah Kanan)', xRange: [0.44, 0.90], yRange: [0.36, 0.63] },
    { name: 'Strip 3 (Bawah Kanan)', xRange: [0.38, 0.85], yRange: [0.64, 0.91] },
  ];

  for (const reg of regions) {
    const rxMin = Math.floor(reg.xRange[0] * width);
    const rxMax = Math.floor(reg.xRange[1] * width);
    const ryMin = Math.floor(reg.yRange[0] * height);
    const ryMax = Math.floor(reg.yRange[1] * height);

    let pts = [];
    for (let y = ryMin; y <= ryMax; y++) {
      for (let x = rxMin; x <= rxMax; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 150 && g > 120 && r < 210 && b > r + 12);
        const isGrass = (g > 95 && g > r * 1.05 && g > b * 1.15 && r < 210 && b < 160);
        const isDarkGrass = (g > 70 && g < 150 && g > r + 10 && g > b + 20);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
        if (isSky || isGrass || isDarkGrass || isCloud) {
          pts.push({ x, y });
        }
      }
    }

    if (pts.length === 0) continue;

    let sumX = 0, sumY = 0;
    for (const p of pts) { sumX += p.x; sumY += p.y; }
    const cx = sumX / pts.length;
    const cy = sumY / pts.length;

    // Test rotation angles between -15 and 15 in steps of 0.1 deg
    let bestRot = 0, minArea = Infinity, bestBox = null;
    for (let deg = -15; deg <= 15; deg += 0.1) {
      const rad = (-deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
      for (let k = 0; k < pts.length; k += 4) {
        const p = pts[k];
        const dx = p.x - cx;
        const dy = p.y - cy;
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        if (rx < minRx) minRx = rx;
        if (rx > maxRx) maxRx = rx;
        if (ry < minRy) minRy = ry;
        if (ry > maxRy) maxRy = ry;
      }
      const area = (maxRx - minRx) * (maxRy - minRy);
      if (area < minArea) {
        minArea = area;
        bestRot = deg;
        bestBox = { minRx, maxRx, minRy, maxRy, w: maxRx - minRx, h: maxRy - minRy };
      }
    }

    // Expand box slightly (1.5%) so that there is zero edge leakage
    const padW = bestBox.w * 0.02;
    const padH = bestBox.h * 0.02;
    const finalW = bestBox.w + padW * 2;
    const finalH = bestBox.h + padH * 2;
    // When centered at cx, cy and rotated by bestRot, top-left is cx - finalW/2, cy - finalH/2
    const finalX = cx - finalW / 2;
    const finalY = cy - finalH / 2;

    console.log(`${reg.name}:`);
    console.log(`  center: (${((cx/width)*100).toFixed(2)}%, ${((cy/height)*100).toFixed(2)}%)`);
    console.log(`  angle: ${bestRot.toFixed(1)}°`);
    console.log(`  bounds: x: ${((finalX/width)*100).toFixed(2)}%, y: ${((finalY/height)*100).toFixed(2)}%, w: ${((finalW/width)*100).toFixed(2)}%, h: ${((finalH/height)*100).toFixed(2)}%`);
  }
}

async function run() {
  await inspectT25();
  await inspectT17Precise();
}
run();
