const sharp = require('sharp');
const path = require('path');

function isPlaceholder(r, g, b) {
  // Green grass/hill: bright green, olive green, yellow-green
  if (g > 100 && g > r * 1.05 && g > b * 1.15 && r < 205 && b < 160) return true;
  // Sky blue:
  if (b > 150 && b > r * 1.1 && r < 200 && g > 115 && g < 245) return true;
  // Cloud: bright whitish-blue
  if (r > 210 && g > 220 && b > 230 && Math.abs(r - g) < 20 && b >= g) return true;
  return false;
}

async function analyzeComponents(filename, minSize = 1000) {
  const filepath = path.join('images/template', filename);
  const img = sharp(filepath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);

  const components = [];

  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      const pIdx = idx * info.channels;
      if (!isPlaceholder(data[pIdx], data[pIdx + 1], data[pIdx + 2])) continue;

      // BFS to find component
      const queue = [x, y];
      visited[idx] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
      let sumX = 0, sumY = 0, count = 0;
      const points = [];

      let qHead = 0;
      while (qHead < queue.length) {
        const cx = queue[qHead++];
        const cy = queue[qHead++];
        sumX += cx;
        sumY += cy;
        count++;
        if (count < 20000) points.push(cx, cy);

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
          [cx + 2, cy], [cx - 2, cy], [cx, cy + 2], [cx, cy - 2]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (visited[nIdx]) continue;
          const npIdx = nIdx * info.channels;
          if (isPlaceholder(data[npIdx], data[npIdx + 1], data[npIdx + 2])) {
            visited[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }

      if (count >= minSize) {
        const centroidX = sumX / count;
        const centroidY = sumY / count;

        // Estimate orientation angle using moments
        let mu20 = 0, mu02 = 0, mu11 = 0;
        for (let i = 0; i < points.length; i += 2) {
          const dx = points[i] - centroidX;
          const dy = points[i + 1] - centroidY;
          mu20 += dx * dx;
          mu02 += dy * dy;
          mu11 += dx * dy;
        }
        const angleRad = 0.5 * Math.atan2(2 * mu11, mu20 - mu02);
        const angleDeg = (angleRad * 180) / Math.PI;

        components.push({
          count,
          minX, maxX, minY, maxY,
          widthPx: maxX - minX + 1,
          heightPx: maxY - minY + 1,
          centroidX, centroidY,
          angleDeg,
          percent: {
            x: ((minX / w) * 100).toFixed(1),
            y: ((minY / h) * 100).toFixed(1),
            width: (((maxX - minX + 1) / w) * 100).toFixed(1),
            height: (((maxY - minY + 1) / h) * 100).toFixed(1),
            centerX: ((centroidX / w) * 100).toFixed(1),
            centerY: ((centroidY / h) * 100).toFixed(1),
          }
        });
      }
    }
  }

  // Sort components by centroid Y
  components.sort((a, b) => a.centroidY - b.centroidY);
  console.log(`\n================== ${filename} (${w}x${h}) ==================`);
  console.log(`Found ${components.length} components:`);
  components.forEach((c, idx) => {
    console.log(`\n[Component #${idx + 1}] count: ${c.count} px`);
    console.log(`  Bounding Box Px: [x: ${c.minX}..${c.maxX} (w: ${c.widthPx}), y: ${c.minY}..${c.maxY} (h: ${c.heightPx})]`);
    console.log(`  Centroid Px: (${c.centroidX.toFixed(1)}, ${c.centroidY.toFixed(1)}), angle: ${c.angleDeg.toFixed(2)}°`);
    console.log(`  Percent: x: ${c.percent.x}%, y: ${c.percent.y}%, w: ${c.percent.width}%, h: ${c.percent.height}%, cX: ${c.percent.centerX}%, cY: ${c.percent.centerY}%`);
  });
  return components;
}

async function run() {
  await analyzeComponents('template 16.png', 3000);
  await analyzeComponents('template 17.png', 3000);
  await analyzeComponents('template 22.png', 3000);
  await analyzeComponents('template 23.png', 3000);
  await analyzeComponents('template 25.png', 2000);
}

run();
