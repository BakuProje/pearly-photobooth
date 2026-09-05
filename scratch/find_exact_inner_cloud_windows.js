const sharp = require('sharp');
const fs = require('fs');

async function findInnerCloudWindow(templateFile, searchBox) {
  const filepath = 'public/images/template/' + templateFile;
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`\n========================================`);
  console.log(`ANALYZING INNER WINDOW: ${templateFile} (${width}x${height})`);
  console.log(`========================================`);

  const minPxX = Math.floor((searchBox.xRange[0] / 100) * width);
  const maxPxX = Math.ceil((searchBox.xRange[1] / 100) * width);
  const minPxY = Math.floor((searchBox.yRange[0] / 100) * height);
  const maxPxY = Math.ceil((searchBox.yRange[1] / 100) * height);

  let pts = [];
  for (let y = minPxY; y <= maxPxY; y++) {
    for (let x = minPxX; x <= maxPxX; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];

      // Exact Canva placeholder colors:
      // Blue sky: (e.g. R: 180..220, G: 215..245, B: 245..255)
      const isSky = (b > 210 && g > 180 && r < 235 && b > r + 15);
      // Green hill (light): (R: 150..200, G: 190..230, B: 40..100)
      const isHill1 = (g > 160 && g > r && g > b + 70 && b < 120);
      // Green hill (dark): (R: 100..150, G: 140..180, B: 10..60)
      const isHill2 = (g > 110 && g > r + 10 && g > b + 60 && b < 80);
      // White cloud:
      const isCloud = (r > 240 && g > 245 && b > 250);

      if (isSky || isHill1 || isHill2) {
        pts.push({ x, y });
      }
    }
  }

  // Flood fill cloud from sky
  // Points bounding box:
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let sumX = 0, sumY = 0;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x; sumY += p.y;
  }

  // Include cloud inside [minX..maxX, minY..maxY]
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > 235 && g > 240 && b > 245) {
        pts.push({ x, y });
      }
    }
  }

  sumX = 0; sumY = 0;
  minX = width; maxX = 0; minY = height; maxY = 0;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x; sumY += p.y;
  }
  const cx = sumX / pts.length;
  const cy = sumY / pts.length;

  console.log(`Points: ${pts.length}, Center: (${((cx/width)*100).toFixed(2)}%, ${((cy/height)*100).toFixed(2)}%)`);
  console.log(`Raw bounding box: x=${((minX/width)*100).toFixed(2)}%, y=${((minY/height)*100).toFixed(2)}%, w=${(((maxX-minX+1)/width)*100).toFixed(2)}%, h=${(((maxY-minY+1)/height)*100).toFixed(2)}%`);

  // Find best rotation
  let bestRot = 0, minArea = Infinity, bestBox = null;
  for (let deg = -10; deg <= 10; deg += 0.1) {
    const rad = (-deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
    for (let k = 0; k < pts.length; k += 4) {
      const p = pts[k];
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
      bestBox = { w: maxRx - minRx, h: maxRy - minRy };
    }
  }

  // Top-left before rotation:
  const finalW = bestBox.w;
  const finalH = bestBox.h;
  const finalX = cx - finalW / 2;
  const finalY = cy - finalH / 2;

  const result = {
    x: +((finalX / width) * 100).toFixed(1),
    y: +((finalY / height) * 100).toFixed(1),
    width: +((finalW / width) * 100).toFixed(1),
    height: +((finalH / height) * 100).toFixed(1),
    rotation: Math.abs(bestRot) < 0.3 ? 0 : +bestRot.toFixed(1),
    label: searchBox.name
  };

  console.log(`Rotated Best Angle: ${bestRot.toFixed(2)}°`);
  console.log(`Result Slot:`, JSON.stringify(result));
  return result;
}

async function main() {
  // 1. Template 27 (1080 x 1920)
  await findInnerCloudWindow('template 27.png', {
    name: 'Template 27 Inner Cloud Window',
    xRange: [10, 85],
    yRange: [25, 65]
  });

  // 2. Template 26 (1080 x 1920)
  await findInnerCloudWindow('template 26.png', {
    name: 'Template 26 Inner Cloud Window',
    xRange: [15, 80],
    yRange: [25, 65]
  });

  // 3. Template 25 (1080 x 1350)
  await findInnerCloudWindow('template 25.png', {
    name: 'Template 25 Right Polaroid Window',
    xRange: [38, 88],
    yRange: [25, 65]
  });
  await findInnerCloudWindow('template 25.png', {
    name: 'Template 25 Left Strip #1',
    xRange: [8, 30],
    yRange: [20, 36]
  });
  await findInnerCloudWindow('template 25.png', {
    name: 'Template 25 Left Strip #2',
    xRange: [8, 30],
    yRange: [41, 57]
  });
  await findInnerCloudWindow('template 25.png', {
    name: 'Template 25 Left Strip #3',
    xRange: [8, 30],
    yRange: [62, 78]
  });
}

main();
