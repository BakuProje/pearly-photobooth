const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function isCanvaSkyOrHill(r, g, b) {
  const isSky = (b > 165 && b > r * 1.15 && r < 195 && g > 130 && g < 245);
  const isHill = (g > 115 && g > r * 1.1 && g > b * 1.2 && r < 190 && b < 140);
  const isCloud = (r > 230 && g > 235 && b > 240);
  return isSky || isHill || isCloud;
}

async function analyzeNewT17() {
  const filepath = 'public/images/template/template 17.png';
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  console.log(`\n================== NEW TEMPLATE 17 (${w}x${h}) ==================`);
  // Looking at user's image 2:
  // Left column: 3 Polaroids (tilted)
  //   - Polaroid 1 (top left): around x: 200..650, y: 50..600
  //   - Polaroid 2 (mid left): around x: 100..600, y: 550..1150
  //   - Polaroid 3 (bot left): around x: 50..550, y: 1200..1850
  // Right column: 1 Vertical Strip with 3 cells
  //   - Strip Cell 1 (top right): around x: 600..1200, y: 100..750
  //   - Strip Cell 2 (mid right): around x: 550..1150, y: 650..1300
  //   - Strip Cell 3 (bot right): around x: 500..1100, y: 1200..1900

  const searchBoxes = [
    { name: 'Polaroid 1 (Kiri Atas)', x1: 200, x2: 650, y1: 50, y2: 600 },
    { name: 'Polaroid 2 (Kiri Tengah)', x1: 100, x2: 600, y1: 550, y2: 1150 },
    { name: 'Polaroid 3 (Kiri Bawah)', x1: 50, x2: 550, y1: 1200, y2: 1850 },
    { name: 'Strip 1 (Kanan Atas)', x1: 600, x2: 1200, y1: 100, y2: 750 },
    { name: 'Strip 2 (Kanan Tengah)', x1: 550, x2: 1150, y1: 650, y2: 1300 },
    { name: 'Strip 3 (Kanan Bawah)', x1: 500, x2: 1100, y1: 1200, y2: 1900 },
  ];

  const results = [];

  for (const sb of searchBoxes) {
    const pts = [];
    for (let y = sb.y1; y < sb.y2; y++) {
      for (let x = sb.x1; x < sb.x2; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (isCanvaSkyOrHill(r, g, b)) {
          pts.push(x, y);
        }
      }
    }

    const count = pts.length / 2;
    if (count < 100) {
      console.log(`[${sb.name}] NO PIXELS FOUND (count: ${count})`);
      continue;
    }

    let sumX = 0, sumY = 0;
    for (let i = 0; i < pts.length; i += 2) {
      sumX += pts[i];
      sumY += pts[i+1];
    }
    const cx = sumX / count;
    const cy = sumY / count;

    // Search best rotation angle
    let bestAngle = 0;
    let minArea = Infinity;
    let bestW = 0, bestH = 0;
    for (let a = -25; a <= 25; a += 0.05) {
      const rad = (a * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - cx;
        const dy = pts[i+1] - cy;
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

    const sx = +(((cx - bestW/2)/w)*100).toFixed(1);
    const sy = +(((cy - bestH/2)/h)*100).toFixed(1);
    const sw = +((bestW/w)*100).toFixed(1);
    const sh = +((bestH/h)*100).toFixed(1);
    const rot = +bestAngle.toFixed(1);

    console.log(`\n[${sb.name}] count: ${count}`);
    console.log(`  Centroid: (${cx.toFixed(1)}, ${cy.toFixed(1)}) -> cx%: ${((cx/w)*100).toFixed(2)}%, cy%: ${((cy/h)*100).toFixed(2)}%`);
    console.log(`  Inner size: ${bestW.toFixed(1)} x ${bestH.toFixed(1)} px -> w%: ${sw}%, h%: ${sh}%, rot: ${rot}°`);
    console.log(`  Slot config: { x: ${sx}, y: ${sy}, width: ${sw}, height: ${sh}, rotation: ${rot}, borderRadius: 3, label: '${sb.name}' }`);
    results.push({ label: sb.name, x: sx, y: sy, width: sw, height: sh, rotation: rot, borderRadius: 3 });
  }

  return results;
}

analyzeNewT17();
