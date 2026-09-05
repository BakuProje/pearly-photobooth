const sharp = require('sharp');
const fs = require('fs');

async function analyzePlaceholders(templateName) {
  const filepath = 'public/images/template/' + templateName;
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`\n======================================================`);
  console.log(`TEMPLATE: ${templateName} (${width}x${height}, ratio: ${(width/height).toFixed(4)})`);
  console.log(`======================================================`);

  // Create mask of Canva placeholder pixels (sky, grass, dark grass, cloud)
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      
      // Canva sky: blue tones
      const isSky = (b > 150 && g > 120 && r < 210 && b > r + 12);
      // Canva grass: vibrant green
      const isGrass = (g > 95 && g > r * 1.05 && g > b * 1.15 && r < 210 && b < 160);
      // Canva dark green hill
      const isDarkGrass = (g > 70 && g < 150 && g > r + 10 && g > b + 20);
      // Canva cloud inside placeholder (white/soft cyan with sky nearby)
      const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);

      if (isSky || isGrass || isDarkGrass || isCloud) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Connected component labeling (BFS)
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (mask[idx] && !visited[idx]) {
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0;
        let sumX = 0, sumY = 0;
        const queue = [x, y];
        visited[idx] = 1;
        let qHead = 0;
        const allPoints = [];

        while (qHead < queue.length) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];
          count++;
          sumX += cx;
          sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          if (count % 4 === 0) allPoints.push({ x: cx, y: cy });

          const neighbors = [
            [cx + 2, cy], [cx - 2, cy], [cx, cy + 2], [cx, cy - 2]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (mask[nidx] && !visited[nidx]) {
                visited[nidx] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }

        // Filter out small noise
        if (count > (width * height * 0.003)) {
          const wPx = maxX - minX + 1;
          const hPx = maxY - minY + 1;
          const cx = sumX / count;
          const cy = sumY / count;

          // Find best rotation angle
          let bestRot = 0;
          let bestArea = Infinity;
          let bestBounds = null;

          for (let angleDeg = -20; angleDeg <= 20; angleDeg += 0.5) {
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(-rad);
            const sin = Math.sin(-rad);

            let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
            for (const p of allPoints) {
              const dx = p.x - cx;
              const dy = p.y - cy;
              const rx = dx * cos - dy * sin;
              const ry = dx * sin + dy * cos;
              if (rx < rMinX) rMinX = rx;
              if (rx > rMaxX) rMaxX = rx;
              if (ry < rMinY) rMinY = ry;
              if (ry > rMaxY) rMaxY = ry;
            }

            const rw = rMaxX - rMinX;
            const rh = rMaxY - rMinY;
            const area = rw * rh;
            if (area < bestArea) {
              bestArea = area;
              bestRot = angleDeg;
              bestBounds = { rMinX, rMaxX, rMinY, rMaxY, rw, rh };
            }
          }

          components.push({
            count,
            minX, maxX, minY, maxY,
            wPx, hPx,
            cx: +((cx / width) * 100).toFixed(2),
            cy: +((cy / height) * 100).toFixed(2),
            xPct: +((minX / width) * 100).toFixed(2),
            yPct: +((minY / height) * 100).toFixed(2),
            wPct: +((wPx / width) * 100).toFixed(2),
            hPct: +((hPx / height) * 100).toFixed(2),
            rot: +bestRot.toFixed(1),
            rotatedBounds: bestBounds
          });
        }
      }
    }
  }

  // Sort components top to bottom, then left to right
  components.sort((a, b) => a.yPct - b.yPct);
  console.log(`Detected ${components.length} slots:`);
  components.forEach((c, idx) => {
    console.log(`Slot #${idx + 1}: x=${c.xPct}%, y=${c.yPct}%, w=${c.wPct}%, h=${c.hPct}%, rot=${c.rot}°, cx=${c.cx}%, cy=${c.cy}%, pixels=${c.count}`);
  });

  return components;
}

async function run() {
  await analyzePlaceholders('template 16.png');
  await analyzePlaceholders('template 17.png');
  await analyzePlaceholders('template 25.png');
  await analyzePlaceholders('template 26.png');
  await analyzePlaceholders('template 27.png');
}

run();
