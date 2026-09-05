const sharp = require('sharp');

async function detectT25Slots() {
  const { data, info } = await sharp('public/images/template/template 25.png').raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isSky = (b > 150 && g > 120 && r < 210 && b > r + 10);
      const isGrass = (g > 95 && g > r * 1.05 && g > b * 1.15 && r < 210 && b < 160);
      const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
      if (isSky || isGrass || isCloud) mask[y * width + x] = 1;
    }
  }

  // Right Polaroid
  let minX_R = width, maxX_R = 0, minY_R = height, maxY_R = 0, count_R = 0;
  for (let y = 0; y < height; y++) {
    for (let x = Math.floor(width * 0.36); x < width; x++) {
      if (mask[y * width + x]) {
        if (x < minX_R) minX_R = x;
        if (x > maxX_R) maxX_R = x;
        if (y < minY_R) minY_R = y;
        if (y > maxY_R) maxY_R = y;
        count_R++;
      }
    }
  }
  console.log('Right Polaroid:');
  console.log(`  x: ${((minX_R/width)*100).toFixed(2)}%, y: ${((minY_R/height)*100).toFixed(2)}%, w: ${(((maxX_R-minX_R)/width)*100).toFixed(2)}%, h: ${(((maxY_R-minY_R)/height)*100).toFixed(2)}% (count=${count_R})`);

  // Left Strip: how many separate boxes?
  const rowCounts = new Int32Array(height);
  for (let y = 0; y < height; y++) {
    for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.35); x++) {
      if (mask[y * width + x]) rowCounts[y]++;
    }
  }

  const boxes = [];
  let inB = false, start = 0;
  for (let y = 0; y < height; y++) {
    if (rowCounts[y] > width * 0.08) {
      if (!inB) { inB = true; start = y; }
    } else {
      if (inB) {
        inB = false;
        if (y - start > height * 0.05) {
          boxes.push({ startY: start, endY: y });
        }
      }
    }
  }
  if (inB) boxes.push({ startY: start, endY: height - 1 });

  console.log(`Left Strip separate boxes: ${boxes.length}`);
  boxes.forEach((b, i) => {
    let bMinX = width, bMaxX = 0;
    for (let y = b.startY; y <= b.endY; y++) {
      for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.35); x++) {
        if (mask[y * width + x]) {
          if (x < bMinX) bMinX = x;
          if (x > bMaxX) bMaxX = x;
        }
      }
    }
    console.log(`  Box #${i+1}: x: ${((bMinX/width)*100).toFixed(2)}%, y: ${((b.startY/height)*100).toFixed(2)}%, w: ${(((bMaxX-bMinX)/width)*100).toFixed(2)}%, h: ${(((b.endY-b.startY)/height)*100).toFixed(2)}%`);
  });
}

detectT25Slots();
