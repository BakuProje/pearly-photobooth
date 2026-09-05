const sharp = require('sharp');
const path = require('path');

async function findCloudRegions(filename) {
  const { data, info } = await sharp(path.join('public/images/template', filename)).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      
      const pIdx = (y * width + x) * channels;
      const r = data[pIdx], g = data[pIdx+1], b = data[pIdx+2];
      
      // Strict Canva sky or hill
      const isSky = (b > 220 && g > 195 && r > 160 && b >= g && g >= r);
      const isHill = (g > 110 && g > r && g > b + 40 && b < 100);
      
      if (!isSky && !isHill) continue;

      const queue = [x, y];
      visited[idx] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
      let pixelCount = 0;
      let sumX = 0, sumY = 0;
      const pts = [];

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        pixelCount++;
        sumX += cx;
        sumY += cy;
        pts.push({ x: cx, y: cy });

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 2, cy], [cx - 2, cy], [cx, cy + 2], [cx, cy - 2],
          [cx + 2, cy + 2], [cx - 2, cy - 2], [cx + 2, cy - 2], [cx - 2, cy + 2]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx]) {
              const npIdx = (ny * width + nx) * channels;
              const nr = data[npIdx], ng = data[npIdx+1], nb = data[npIdx+2];
              
              // Only sky, hill, or cloud inside sky (cloud is pure white 250+ with sky nearby)
              const nIsSky = (nb > 215 && ng > 190 && nr > 150 && nb >= ng && ng >= nr);
              const nIsHill = (ng > 100 && ng > nr && ng > nb + 30 && nb < 110);
              const nIsCloud = (nr > 245 && ng > 245 && nb > 245); // Cloud white
              
              // Avoid leaking into cream paper (which usually has r > g > b, e.g. 245, 240, 230)
              if (nIsSky || nIsHill || (nIsCloud && nb >= 245 && nr >= 245 && ng >= 245)) {
                // If it's pure white, check that it's not the polaroid border: polaroid border is wide, cloud is localized in upper sky
                visited[nIdx] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }
      }

      if (pixelCount > 1000) {
        components.push({
          minX, maxX, minY, maxY,
          w: maxX - minX, h: maxY - minY,
          pixelCount,
          centerX: sumX / pixelCount,
          centerY: sumY / pixelCount,
          pts
        });
      }
    }
  }

  console.log('\n=============================');
  console.log(filename, 'Dimensions:', width + 'x' + height, 'Components:', components.length);
  console.log('=============================');
  
  components.sort((a, b) => a.minY - b.minY);
  components.forEach((c, i) => {
    let tl = c.pts[0], tr = c.pts[0], bl = c.pts[0], br = c.pts[0];
    for (const p of c.pts) {
      if (p.x + p.y < tl.x + tl.y) tl = p;
      if (p.x - p.y > tr.x - tr.y) tr = p;
      if (p.y - p.x > bl.y - bl.x) bl = p;
      if (p.x + p.y > br.x + br.y) br = p;
    }
    
    let topAngle = Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180 / Math.PI;
    let leftAngle = (Math.atan2(bl.y - tl.y, bl.x - tl.x) * 180 / Math.PI) - 90;
    let avgAngle = (topAngle + leftAngle) / 2;

    const rad = avgAngle * Math.PI / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);
    
    let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
    for (const p of c.pts) {
      const rx = (p.x - c.centerX) * cos - (p.y - c.centerY) * sin;
      const ry = (p.x - c.centerX) * sin + (p.y - c.centerY) * cos;
      if (rx < rMinX) rMinX = rx;
      if (rx > rMaxX) rMaxX = rx;
      if (ry < rMinY) rMinY = ry;
      if (ry > rMaxY) rMaxY = ry;
    }
    
    const unrotatedW = rMaxX - rMinX;
    const unrotatedH = rMaxY - rMinY;
    const unrotatedWPct = (unrotatedW / width) * 100;
    const unrotatedHPct = (unrotatedH / height) * 100;
    const cxPct = (c.centerX / width) * 100;
    const cyPct = (c.centerY / height) * 100;

    console.log(`Slot #${i+1}:`);
    console.log(`  Pixel Box: [${c.minX}, ${c.minY}, ${c.maxX}, ${c.maxY}] -> size ${c.w}x${c.h}`);
    console.log(`  Angle: ${avgAngle.toFixed(2)} deg`);
    console.log(`  Corners (px): TL(${tl.x}, ${tl.y}) TR(${tr.x}, ${tr.y}) BL(${bl.x}, ${bl.y}) BR(${br.x}, ${br.y})`);
    console.log(`  CSS Slot: { x: ${(cxPct - unrotatedWPct / 2).toFixed(1)}, y: ${(cyPct - unrotatedHPct / 2).toFixed(1)}, width: ${unrotatedWPct.toFixed(1)}, height: ${unrotatedHPct.toFixed(1)}, rotation: ${avgAngle.toFixed(1)} }`);
  });
}

async function run() {
  await findCloudRegions('template 27.png');
  await findCloudRegions('template 26.png');
  await findCloudRegions('template 25.png');
  await findCloudRegions('template 17.png');
  await findCloudRegions('template 16.png');
}
run();
