const sharp = require('sharp');
const path = require('path');

function isSkyOrHill(r, g, b) {
  const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
  const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
  const isCloud = (r > 225 && g > 230 && b > 235);
  return isSky || isHill || isCloud;
}

async function findCorners(filename) {
  const filepath = path.join('images/template', filename);
  const img = sharp(filepath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's create an exact binary mask
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      if (isSkyOrHill(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * w + x] = 1;
      }
    }
  }

  // Define search regions for known frames
  return { w, h, mask, data, channels: info.channels };
}

async function analyzeT16() {
  const { w, h, mask } = await findCorners('template 16.png');

  // Let's find connected components in T16
  const visited = new Uint8Array(w * h);
  const frames = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!mask[idx] || visited[idx]) continue;

      const q = [x, y];
      visited[idx] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
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
          if (mask[nidx] && !visited[nidx]) {
            visited[nidx] = 1;
            q.push(nx, ny);
          }
        }
      }

      if (pts.length / 2 > 5000) {
        // Compute centroid & best bounding box with angle
        const count = pts.length / 2;
        let sumX = 0, sumY = 0;
        for (let i = 0; i < pts.length; i += 2) {
          sumX += pts[i];
          sumY += pts[i + 1];
        }
        const cx = sumX / count;
        const cy = sumY / count;

        // Try rotation angles from -15 to +15 deg in 0.1 deg steps to find the rotation that minimizes bounding box area (or aligns best with box edges)
        let bestAngle = 0;
        let minArea = Infinity;
        let bestLocalW = 0, bestLocalH = 0;

        for (let a = -20; a <= 20; a += 0.1) {
          const rad = (a * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
          for (let i = 0; i < pts.length; i += 2) {
            const dx = pts[i] - cx;
            const dy = pts[i + 1] - cy;
            // rotated coords
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
            bestLocalW = maxU - minU;
            bestLocalH = maxV - minV;
          }
        }

        frames.push({
          count,
          minX, maxX, minY, maxY,
          cx, cy,
          bestAngle: +bestAngle.toFixed(2),
          localW: Math.round(bestLocalW),
          localH: Math.round(bestLocalH),
          // Bounding box in percentage
          slot: {
            x: +(((cx - bestLocalW / 2) / w) * 100).toFixed(1),
            y: +(((cy - bestLocalH / 2) / h) * 100).toFixed(1),
            width: +((bestLocalW / w) * 100).toFixed(1),
            height: +((bestLocalH / h) * 100).toFixed(1),
            rotation: +bestAngle.toFixed(1),
          }
        });
      }
    }
  }

  frames.sort((a, b) => a.cy - b.cy);
  console.log(`\nT16 found ${frames.length} frames:`);
  frames.forEach((f, i) => {
    console.log(`Frame #${i + 1}: count: ${f.count}, cx: ${f.cx.toFixed(1)}, cy: ${f.cy.toFixed(1)}, localW: ${f.localW}, localH: ${f.localH}, angle: ${f.bestAngle}°`);
    console.log(`  Proposed slot: { x: ${f.slot.x}, y: ${f.slot.y}, width: ${f.slot.width}, height: ${f.slot.height}, rotation: ${f.slot.rotation} }`);
  });
}

analyzeT16();
