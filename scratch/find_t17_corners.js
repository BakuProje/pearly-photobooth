const sharp = require('sharp');
const path = require('path');

async function findT17Corners() {
  const filepath = path.join('public/images/template', 'template 17.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  function isPlaceholder(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const idx = (y * w + x) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
    const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
    const isCloud = (r > 225 && g > 230 && b > 235);
    return isSky || isHill || isCloud;
  }

  // Find tightest bounding polygon for each frame
  const frames = [
    { name: 'Card 1', seedX: 440, seedY: 300 },
    { name: 'Card 2', seedX: 900, seedY: 450 },
    { name: 'Card 3', seedX: 350, seedY: 850 },
    { name: 'Card 4', seedX: 880, seedY: 900 },
    { name: 'Card 5', seedX: 300, seedY: 1400 },
    { name: 'Card 6', seedX: 800, seedY: 1400 },
  ];

  for (const f of frames) {
    // Flood fill
    const visited = new Uint8Array(w * h);
    const q = [f.seedX, f.seedY];
    visited[f.seedY * w + f.seedX] = 1;
    let minX = f.seedX, maxX = f.seedX, minY = f.seedY, maxY = f.seedY;
    const pts = [];

    let qh = 0;
    while (qh < q.length) {
      const cx = q[qh++];
      const cy = q[qh++];
      pts.push(cx, cy);
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      const nbs = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
      for (const [nx, ny] of nbs) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nidx = ny * w + nx;
        if (!visited[nidx] && isPlaceholder(nx, ny)) {
          visited[nidx] = 1;
          q.push(nx, ny);
        }
      }
    }

    const count = pts.length / 2;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < pts.length; i += 2) {
      sumX += pts[i];
      sumY += pts[i+1];
    }
    const cx = sumX / count;
    const cy = sumY / count;

    // Search best angle
    let bestAngle = 0;
    let minArea = Infinity;
    let bestW = 0, bestH = 0;
    for (let a = -30; a <= 30; a += 0.1) {
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

    const padW = bestW * 1.05;
    const padH = bestH * 1.05;
    const sx = +(((cx - padW/2)/w)*100).toFixed(1);
    const sy = +(((cy - padH/2)/h)*100).toFixed(1);
    const sw = +((padW/w)*100).toFixed(1);
    const sh = +((padH/h)*100).toFixed(1);

    console.log(`\n${f.name}: count=${count}, cx=${cx.toFixed(1)} (${((cx/w)*100).toFixed(1)}%), cy=${cy.toFixed(1)} (${((cy/h)*100).toFixed(1)}%)`);
    console.log(`  bestAngle: ${bestAngle.toFixed(2)}°, bestW: ${bestW.toFixed(1)} px (${((bestW/w)*100).toFixed(1)}%), bestH: ${bestH.toFixed(1)} px (${((bestH/h)*100).toFixed(1)}%)`);
    console.log(`  slot: { x: ${sx}, y: ${sy}, width: ${sw}, height: ${sh}, rotation: ${+bestAngle.toFixed(1)}, borderRadius: 4, label: '${f.name}' }`);
  }
}

findT17Corners();
