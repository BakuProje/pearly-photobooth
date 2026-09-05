const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function isSky(r, g, b) {
  return (b > 170 && b > r * 1.15 && r < 200 && g > 130 && g < 245);
}
function isHill(r, g, b) {
  return (g > 115 && g > r * 1.1 && g > b * 1.2 && r < 190 && b < 140);
}
function isCloud(r, g, b) {
  return (r > 225 && g > 230 && b > 235 && Math.abs(r - g) < 20);
}
function isPlaceholder(r, g, b) {
  return isSky(r, g, b) || isHill(r, g, b) || isCloud(r, g, b);
}

async function measureExactT17() {
  const filepath = 'images/template/template 17.png';
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's find connected components of placeholders in T17
  const visited = new Uint8Array(w * h);
  const components = [];

  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      const pIdx = idx * info.channels;
      if (!isPlaceholder(data[pIdx], data[pIdx+1], data[pIdx+2])) continue;

      const queue = [x, y];
      visited[idx] = 1;
      const pts = [];

      let qh = 0;
      while (qh < queue.length) {
        const cx = queue[qh++];
        const cy = queue[qh++];
        pts.push(cx, cy);

        const neighbors = [[cx+2, cy], [cx-2, cy], [cx, cy+2], [cx, cy-2]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (!visited[nIdx]) {
            const npIdx = nIdx * info.channels;
            if (isPlaceholder(data[npIdx], data[npIdx+1], data[npIdx+2])) {
              visited[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      const count = pts.length / 2;
      if (count > 2000) {
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
        for (let a = -20; a <= 20; a += 0.1) {
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

        components.push({
          count,
          cx, cy,
          wPx: bestW, hPx: bestH,
          angle: +bestAngle.toFixed(1),
          percent: {
            cx: +((cx / w) * 100).toFixed(2),
            cy: +((cy / h) * 100).toFixed(2),
            w: +((bestW / w) * 100).toFixed(1),
            h: +((bestH / h) * 100).toFixed(1),
            x: +(((cx - bestW / 2) / w) * 100).toFixed(1),
            y: +(((cy - bestH / 2) / h) * 100).toFixed(1),
          }
        });
      }
    }
  }

  // Sort components by centroid Y
  components.sort((a, b) => a.cy - b.cy);
  console.log(`\nT17 found ${components.length} connected placeholder regions:`);
  components.forEach((c, idx) => {
    console.log(`\nComponent #${idx+1} (count: ${c.count}):`);
    console.log(`  Center: (${c.percent.cx}%, ${c.percent.cy}%), Size: ${c.percent.w}% x ${c.percent.h}%, Angle: ${c.angle}°`);
    console.log(`  Slot config: { x: ${c.percent.x}, y: ${c.percent.y}, width: ${c.percent.w}, height: ${c.percent.h}, rotation: ${c.angle}, borderRadius: 3 }`);
  });
}

measureExactT17();
