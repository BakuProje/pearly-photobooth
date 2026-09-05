const sharp = require('sharp');
const fs = require('fs');

async function analyzeCloudHills(file) {
  const filepath = 'public/images/template/' + file;
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n======================================================`);
  console.log(`TEMPLATE: ${file} (${width}x${height}, ratio: ${(width/height).toFixed(4)})`);
  console.log(`======================================================`);

  // Mask Canva frame cutout (cloud, blue sky, green hill)
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      
      const isSky = (b > 170 && g > 130 && r < 210 && b > r + 10);
      const isGrass = (g > 110 && g > r * 1.05 && g > b * 1.15 && r < 215 && b < 165);
      const isDarkGrass = (g > 75 && g < 155 && g > r * 1.02 && g > b * 1.1);

      if (isSky || isGrass || isDarkGrass) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Cloud expansion (flood from sky into white cloud)
  for (let iter = 0; iter < 20; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (!mask[idx]) {
          const r = data[idx*channels], g = data[idx*channels+1], b = data[idx*channels+2];
          if (r > 215 && g > 220 && b > 225) {
            if (mask[idx-1] || mask[idx+1] || mask[idx-width] || mask[idx+width]) {
              mask[idx] = 1;
            }
          }
        }
      }
    }
  }

  // Save mask to disk for visual check
  const maskRgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (mask[i]) {
      maskRgba[i*4] = 255;
      maskRgba[i*4+1] = 0;
      maskRgba[i*4+2] = 0;
      maskRgba[i*4+3] = 255;
    }
  }
  await sharp(maskRgba, { raw: { width, height, channels: 4 } }).png().toFile(`scratch/mask_${file}`);

  // Find components
  const visited = new Uint8Array(width * height);
  const comps = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (mask[idx] && !visited[idx]) {
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0, sumX = 0, sumY = 0;
        const pts = [];
        const q = [x, y];
        visited[idx] = 1;
        let qh = 0;
        while (qh < q.length) {
          const cx = q[qh++], cy = q[qh++];
          count++;
          sumX += cx; sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          if (count % 4 === 0) pts.push({ x: cx, y: cy });

          for (const [nx, ny] of [[cx+2, cy], [cx-2, cy], [cx, cy+2], [cx, cy-2]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (mask[nidx] && !visited[nidx]) {
                visited[nidx] = 1;
                q.push(nx, ny);
              }
            }
          }
        }

        if (count > (width * height * 0.002)) {
          const cx = sumX / count;
          const cy = sumY / count;

          let bestRot = 0, minArea = Infinity, bestBox = null;
          for (let deg = -15; deg <= 15; deg += 0.2) {
            const rad = (-deg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
            for (const p of pts) {
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
              bestBox = { w: maxRx - minRx, h: maxRy - minRy, minRx, maxRx, minRy, maxRy };
            }
          }

          comps.push({
            count, minX, maxX, minY, maxY,
            cx: +((cx/width)*100).toFixed(2),
            cy: +((cy/height)*100).toFixed(2),
            rot: +bestRot.toFixed(1),
            x: +((minX/width)*100).toFixed(2),
            y: +((minY/height)*100).toFixed(2),
            w: +(((maxX-minX+1)/width)*100).toFixed(2),
            h: +(((maxY-minY+1)/height)*100).toFixed(2),
            rotW: +((bestBox.w/width)*100).toFixed(2),
            rotH: +((bestBox.h/height)*100).toFixed(2),
          });
        }
      }
    }
  }

  comps.sort((a,b) => a.y - b.y);
  comps.forEach((c, i) => {
    console.log(`Frame #${i+1} (${c.count} px):`);
    console.log(`  Axis-aligned: x=${c.x}%, y=${c.y}%, w=${c.w}%, h=${c.h}%`);
    console.log(`  Center-Rotated: cx=${c.cx}%, cy=${c.cy}%, rot=${c.rot}°, rotW=${c.rotW}%, rotH=${c.rotH}%`);
  });
}

async function run() {
  await analyzeCloudHills('template 25.png');
  await analyzeCloudHills('template 26.png');
  await analyzeCloudHills('template 27.png');
  await analyzeCloudHills('template 17.png');
}

run();
