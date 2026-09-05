const sharp = require('sharp');
const fs = require('fs');

async function measureT17CloudWindows() {
  const filepath = 'public/images/template/template 17.png';
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log('=== TEMPLATE 17 (1333 x 2000) ===');

  const regions = [
    { name: 'Polaroid 1 (Atas Kiri)', xRange: [14, 45], yRange: [3, 23] },
    { name: 'Polaroid 2 (Tengah Kiri)', xRange: [6, 40], yRange: [29, 50] },
    { name: 'Polaroid 3 (Bawah Kiri)', xRange: [2, 38], yRange: [60, 85] },
    { name: 'Strip 1 (Atas Kanan)', xRange: [50, 90], yRange: [8, 32] },
    { name: 'Strip 2 (Tengah Kanan)', xRange: [45, 85], yRange: [36, 60] },
    { name: 'Strip 3 (Bawah Kanan)', xRange: [40, 80], yRange: [64, 88] },
  ];

  for (let sIdx = 0; sIdx < regions.length; sIdx++) {
    const reg = regions[sIdx];
    const minPxX = Math.floor((reg.xRange[0] / 100) * width);
    const maxPxX = Math.ceil((reg.xRange[1] / 100) * width);
    const minPxY = Math.floor((reg.yRange[0] / 100) * height);
    const maxPxY = Math.ceil((reg.yRange[1] / 100) * height);

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

    if (pts.length === 0) continue;

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

    let bestRot = 0, minArea = Infinity, bestBox = null;
    for (let deg = -15; deg <= 15; deg += 0.1) {
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
        bestBox = { w: maxRx - minRx, h: maxRy - minRy };
      }
    }

    const finalW = bestBox.w;
    const finalH = bestBox.h;
    const finalX = cx - finalW / 2;
    const finalY = cy - finalH / 2;

    const slotDef = {
      x: +((finalX / width) * 100).toFixed(1),
      y: +((finalY / height) * 100).toFixed(1),
      width: +((finalW / width) * 100).toFixed(1),
      height: +((finalH / height) * 100).toFixed(1),
      rotation: Math.abs(bestRot) < 0.3 ? 0 : +bestRot.toFixed(1),
      borderRadius: 2,
      label: reg.name
    };

    console.log(`Slot #${sIdx+1} (${reg.name}):`, JSON.stringify(slotDef));
  }
}

measureT17CloudWindows();
