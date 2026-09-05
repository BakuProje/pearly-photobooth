const sharp = require('sharp');
const path = require('path');

async function findPureCloudWindows(filename) {
  const { data, info } = await sharp(path.join('public/images/template', filename)).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isSkyOrHill = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    
    // Sky blue: b in [210..255], g in [180..250], r in [140..240], b > r + 15
    const isSky = (b >= 210 && g >= 180 && r >= 140 && b >= r + 15 && b >= g);
    // Hill green: g in [100..200], g > r + 15, g > b + 40, b <= 120
    const isHill = (g >= 95 && g >= r + 10 && g >= b + 35 && b <= 125);
    return isSky || isHill;
  };

  // Find all bounding components
  const visited = new Uint8Array(width * height);
  const boxes = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (!isSkyOrHill(x, y)) continue;

      let minX = x, maxX = x, minY = y, maxY = y;
      let count = 0;
      let sumX = 0, sumY = 0;
      const pts = [];
      const queue = [x, y];
      visited[idx] = 1;

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        count++;
        sumX += cx;
        sumY += cy;
        pts.push({ x: cx, y: cy });

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [[cx+2, cy], [cx-2, cy], [cx, cy+2], [cx, cy-2]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && isSkyOrHill(nx, ny)) {
              visited[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      if (count > 300) {
        // Calculate corners & angle
        let tl = pts[0], tr = pts[0], bl = pts[0], br = pts[0];
        for (const p of pts) {
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

        const centerX = sumX / count;
        const centerY = sumY / count;

        let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
        for (const p of pts) {
          const rx = (p.x - centerX) * cos - (p.y - centerY) * sin;
          const ry = (p.x - centerX) * sin + (p.y - centerY) * cos;
          if (rx < rMinX) rMinX = rx;
          if (rx > rMaxX) rMaxX = rx;
          if (ry < rMinY) rMinY = ry;
          if (ry > rMaxY) rMaxY = ry;
        }

        const unrotatedW = rMaxX - rMinX;
        const unrotatedH = rMaxY - rMinY;

        boxes.push({
          minX, maxX, minY, maxY,
          count,
          centerX, centerY,
          avgAngle,
          tl, tr, bl, br,
          unrotatedW, unrotatedH,
          xPct: ((minX / width) * 100).toFixed(2),
          yPct: ((minY / height) * 100).toFixed(2),
          wPct: (((maxX - minX) / width) * 100).toFixed(2),
          hPct: (((maxY - minY) / height) * 100).toFixed(2),
          cssX: (((centerX - unrotatedW/2) / width) * 100).toFixed(1),
          cssY: (((centerY - unrotatedH/2) / height) * 100).toFixed(1),
          cssW: ((unrotatedW / width) * 100).toFixed(1),
          cssH: ((unrotatedH / height) * 100).toFixed(1),
          cssRot: avgAngle.toFixed(1)
        });
      }
    }
  }

  boxes.sort((a, b) => a.minY - b.minY);

  console.log(`\n========================================`);
  console.log(`RESULTS FOR: ${filename} (${width}x${height}) -> Found ${boxes.length} cloud regions`);
  console.log(`========================================`);
  boxes.forEach((b, i) => {
    console.log(`Region #${i+1}:`);
    console.log(`  Pixels: ${b.count}, Bounding: [${b.minX}, ${b.minY}, ${b.maxX}, ${b.maxY}]`);
    console.log(`  Angle: ${b.avgAngle.toFixed(2)} deg`);
    console.log(`  Corners: TL(${b.tl.x}, ${b.tl.y}) TR(${b.tr.x}, ${b.tr.y}) BL(${b.bl.x}, ${b.bl.y}) BR(${b.br.x}, ${b.br.y})`);
    console.log(`  CSS Slot: { x: ${b.cssX}, y: ${b.cssY}, width: ${b.cssW}, height: ${b.cssH}, rotation: ${b.cssRot} }`);
  });

  return boxes;
}

async function run() {
  await findPureCloudWindows('template 27.png');
  await findPureCloudWindows('template 26.png');
  await findPureCloudWindows('template 25.png');
  await findPureCloudWindows('template 17.png');
  await findPureCloudWindows('template 16.png');
}
run();
