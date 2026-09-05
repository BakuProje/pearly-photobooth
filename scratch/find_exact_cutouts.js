const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function isCanvaPlaceholder(r, g, b) {
  const isSky = (b > 165 && b > r * 1.15 && r < 195 && g > 130 && g < 245);
  const isHill = (g > 115 && g > r * 1.1 && g > b * 1.2 && r < 190 && b < 140);
  const isCloud = (r > 220 && g > 230 && b > 235);
  return isSky || isHill || isCloud;
}

// Function to find the exact oriented bounding box of a placeholder area
async function getOrientedBox(imgData, w, h, xmin, xmax, ymin, ymax, minAngle = -20, maxAngle = 20) {
  const pts = [];
  for (let y = ymin; y < ymax; y++) {
    for (let x = xmin; x < xmax; x++) {
      const idx = (y * w + x) * 4; // assuming 4 or 3 channels
      const r = imgData[idx], g = imgData[idx+1], b = imgData[idx+2];
      if (isCanvaPlaceholder(r, g, b)) {
        pts.push(x, y);
      }
    }
  }

  const count = pts.length / 2;
  if (count < 50) return null;

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

  for (let a = minAngle; a <= maxAngle; a += 0.05) {
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

  return {
    count,
    cx, cy,
    cxPercent: +((cx / w) * 100).toFixed(2),
    cyPercent: +((cy / h) * 100).toFixed(2),
    wPx: bestW,
    hPx: bestH,
    wPercent: +((bestW / w) * 100).toFixed(1),
    hPercent: +((bestH / h) * 100).toFixed(1),
    rotation: +bestAngle.toFixed(1),
    // Slot config with exact inner fit (+1px margin just enough to touch border without spilling outside)
    slot: {
      x: +(((cx - (bestW + 2) / 2) / w) * 100).toFixed(1),
      y: +(((cy - (bestH + 2) / 2) / h) * 100).toFixed(1),
      width: +(((bestW + 2) / w) * 100).toFixed(1),
      height: +(((bestH + 2) / h) * 100).toFixed(1),
      rotation: +bestAngle.toFixed(1),
    }
  };
}

async function analyzeAllExact() {
  // 1. TEMPLATE 17 (NEW DESIGN: 3 polaroids on left + 1 3-cell strip on right)
  const t17 = await sharp('public/images/template/template 17.png').raw().toBuffer({ resolveWithObject: true });
  console.log('\n================== EXACT NEW TEMPLATE 17 ==================');
  const t17Regions = [
    { label: 'Polaroid 1 (Kiri Atas)', x1: 200, x2: 650, y1: 50, y2: 550, minA: -10, maxA: 10 },
    { label: 'Polaroid 2 (Kiri Tengah)', x1: 150, x2: 600, y1: 580, y2: 1100, minA: -10, maxA: 10 },
    { label: 'Polaroid 3 (Kiri Bawah)', x1: 80, x2: 550, y1: 1200, y2: 1800, minA: -15, maxA: 15 },
    { label: 'Strip 1 (Kanan Atas)', x1: 600, x2: 1200, y1: 100, y2: 750, minA: 5, maxA: 12 },
    { label: 'Strip 2 (Kanan Tengah)', x1: 550, x2: 1150, y1: 650, y2: 1300, minA: 5, maxA: 12 },
    { label: 'Strip 3 (Kanan Bawah)', x1: 500, x2: 1100, y1: 1200, y2: 1900, minA: 5, maxA: 12 },
  ];
  const t17Slots = [];
  for (const r of t17Regions) {
    const box = await getOrientedBox(t17.data, t17.info.width, t17.info.height, r.x1, r.x2, r.y1, r.y2, r.minA, r.maxA);
    if (box) {
      console.log(`[${r.label}] inner: ${box.wPx.toFixed(1)}x${box.hPx.toFixed(1)} px, angle: ${box.rotation}°, center: (${box.cxPercent}%, ${box.cyPercent}%)`);
      console.log(`  slot: { x: ${box.slot.x}, y: ${box.slot.y}, width: ${box.slot.width}, height: ${box.slot.height}, rotation: ${box.slot.rotation}, borderRadius: 3, label: '${r.label}' }`);
      t17Slots.push({ ...box.slot, borderRadius: 3, label: r.label });
    }
  }

  // 2. TEMPLATE 16 (6 SLOTS: Hero Atas, Hero Bawah, Strip 1, 2, 3, 4 - INNER FIT INSIDE BLACK BORDER)
  const t16 = await sharp('public/images/template/template 16.png').raw().toBuffer({ resolveWithObject: true });
  console.log('\n================== EXACT TEMPLATE 16 (INNER FIT) ==================');
  const t16Regions = [
    { label: 'Hero Atas', x1: 100, x2: 750, y1: 200, y2: 750, minA: 2, maxA: 6 },
    { label: 'Hero Bawah', x1: 50, x2: 700, y1: 750, y2: 1600, minA: -5, maxA: 0 },
    { label: 'Strip 1', x1: 640, x2: 1040, y1: 240, y2: 600, minA: 1, maxA: 5 },
    { label: 'Strip 2', x1: 630, x2: 1030, y1: 580, y2: 950, minA: 1, maxA: 5 },
    { label: 'Strip 3', x1: 620, x2: 1020, y1: 940, y2: 1300, minA: 1, maxA: 5 },
    { label: 'Strip 4', x1: 600, x2: 1000, y1: 1280, y2: 1650, minA: 1, maxA: 5 },
  ];
  const t16Slots = [];
  for (const r of t16Regions) {
    const box = await getOrientedBox(t16.data, t16.info.width, t16.info.height, r.x1, r.x2, r.y1, r.y2, r.minA, r.maxA);
    if (box) {
      console.log(`[${r.label}] inner: ${box.wPx.toFixed(1)}x${box.hPx.toFixed(1)} px, angle: ${box.rotation}°, center: (${box.cxPercent}%, ${box.cyPercent}%)`);
      console.log(`  slot: { x: ${box.slot.x}, y: ${box.slot.y}, width: ${box.slot.width}, height: ${box.slot.height}, rotation: ${box.slot.rotation}, borderRadius: 3, label: '${r.label}' }`);
      t16Slots.push({ ...box.slot, borderRadius: 3, label: r.label });
    }
  }

  // 3. TEMPLATE 25 (14 SLOTS - INNER FIT INSIDE ALL NOTEBOOK / POLAROID / FILM CUTOUTS)
  const t25 = await sharp('public/images/template/template 25.png').raw().toBuffer({ resolveWithObject: true });
  console.log('\n================== EXACT TEMPLATE 25 (INNER FIT) ==================');
  const t25Regions = [
    { label: 'Gantungan #1', x1: 530, x2: 700, y1: 410, y2: 640, minA: -5, maxA: 5 },
    { label: 'Gantungan #2', x1: 640, x2: 800, y1: 440, y2: 670, minA: -5, maxA: 5 },
    { label: 'Gantungan #3', x1: 740, x2: 900, y1: 480, y2: 700, minA: -5, maxA: 5 },
    { label: 'Gantungan #4', x1: 850, x2: 1020, y1: 500, y2: 730, minA: -5, maxA: 5 },
    { label: 'Sticky Pink', x1: 60, x2: 300, y1: 660, y2: 920, minA: -5, maxA: 5 },
    { label: 'Buku Kiri', x1: 80, x2: 520, y1: 900, y2: 1300, minA: -5, maxA: 5 },
    { label: 'Buku Kanan', x1: 560, x2: 990, y1: 680, y2: 1050, minA: -5, maxA: 5 },
    { label: 'Polaroid Kiri Bawah', x1: 10, x2: 450, y1: 1200, y2: 1700, minA: -16, maxA: -8 },
    { label: 'Polaroid Tengah', x1: 280, x2: 770, y1: 1150, y2: 1680, minA: 8, maxA: 16 },
    { label: 'Kamera Digital', x1: 30, x2: 300, y1: 1620, y2: 1900, minA: -5, maxA: 5 },
    { label: 'Polaroid Bawah', x1: 380, x2: 790, y1: 1530, y2: 1890, minA: -6, maxA: 0 },
    { label: 'Filmstrip #1', x1: 730, x2: 1060, y1: 1080, y2: 1350, minA: -5, maxA: 5 },
    { label: 'Filmstrip #2', x1: 700, x2: 1040, y1: 1330, y2: 1600, minA: -5, maxA: 5 },
    { label: 'Filmstrip #3', x1: 660, x2: 1020, y1: 1590, y2: 1870, minA: -5, maxA: 5 },
  ];
  const t25Slots = [];
  for (const r of t25Regions) {
    const box = await getOrientedBox(t25.data, t25.info.width, t25.info.height, r.x1, r.x2, r.y1, r.y2, r.minA, r.maxA);
    if (box) {
      console.log(`[${r.label}] inner: ${box.wPx.toFixed(1)}x${box.hPx.toFixed(1)} px, angle: ${box.rotation}°, center: (${box.cxPercent}%, ${box.cyPercent}%)`);
      console.log(`  slot: { x: ${box.slot.x}, y: ${box.slot.y}, width: ${box.slot.width}, height: ${box.slot.height}, rotation: ${box.slot.rotation}, borderRadius: 3, label: '${r.label}' }`);
      t25Slots.push({ ...box.slot, borderRadius: 3, label: r.label });
    }
  }

  return { t17Slots, t16Slots, t25Slots };
}

analyzeAllExact();
