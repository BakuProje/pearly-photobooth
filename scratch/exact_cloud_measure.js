const sharp = require('sharp');
const path = require('path');

// Measure exact bounding boxes for cloud windows by checking where the sky/hills/clouds exist
async function getExactCloudBoxes(filename) {
  const { data, info } = await sharp(path.join('public/images/template', filename)).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`\n========================================`);
  console.log(`EXACT CLOUD SCAN FOR: ${filename} (${width}x${height})`);
  console.log(`========================================`);

  // We scan row by row and col by col for each region
  // Canva placeholder pixel condition:
  const isCloudPlaceholder = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    
    // Sky blue:
    if (b >= 210 && g >= 180 && r >= 140 && b >= r + 15) return true;
    // Hill green:
    if (g >= 90 && g > r && g > b + 25 && b <= 120) return true;
    // White cloud inside sky:
    if (r >= 235 && g >= 235 && b >= 235) return true;
    return false;
  };

  return { width, height, isCloudPlaceholder, data, channels };
}

async function analyzeT16() {
  const { width, height, isCloudPlaceholder } = await getExactCloudBoxes('template 16.png');
  // In T16, there are 3 slots.
  // Let's find top and bottom for each of the 3 slots at x = 300 (center of strip)
  const x = 300;
  let inSlot = false;
  let slots = [];
  let curSlot = null;

  for (let y = 0; y < height; y++) {
    const isP = isCloudPlaceholder(x, y);
    if (isP && !inSlot) {
      inSlot = true;
      curSlot = { startY: y };
    } else if (!isP && inSlot) {
      inSlot = false;
      curSlot.endY = y - 1;
      slots.push(curSlot);
    }
  }
  if (inSlot) {
    curSlot.endY = height - 1;
    slots.push(curSlot);
  }

  console.log('T16 Vertical Slots at x=300:', slots);

  // For each slot, find minX and maxX
  slots.forEach((s, idx) => {
    let midY = Math.round((s.startY + s.endY) / 2);
    let minX = 0, maxX = width - 1;
    for (let x = 0; x < width; x++) {
      if (isCloudPlaceholder(x, midY)) { minX = x; break; }
    }
    for (let x = width - 1; x >= 0; x--) {
      if (isCloudPlaceholder(x, midY)) { maxX = x; break; }
    }
    const w = maxX - minX + 1;
    const h = s.endY - s.startY + 1;
    console.log(`T16 Slot #${idx+1}: [x=${minX}, y=${s.startY}, w=${w}, h=${h}]`);
    console.log(`  Percent: x=${(minX/width*100).toFixed(2)}%, y=${(s.startY/height*100).toFixed(2)}%, w=${(w/width*100).toFixed(2)}%, h=${(h/height*100).toFixed(2)}%`);
  });
}

async function analyzeT26() {
  const { width, height, isCloudPlaceholder } = await getExactCloudBoxes('template 26.png');
  // Find boundaries at center of polaroid x ~ 540
  // Let's find all points that are cloud placeholder
  let pts = [];
  for (let y = 400; y < 1500; y += 2) {
    for (let x = 150; x < 900; x += 2) {
      if (isCloudPlaceholder(x, y)) {
        pts.push({ x, y });
      }
    }
  }
  // Find min/max
  let minX = Math.min(...pts.map(p => p.x));
  let maxX = Math.max(...pts.map(p => p.x));
  let minY = Math.min(...pts.map(p => p.y));
  let maxY = Math.max(...pts.map(p => p.y));
  console.log(`T26 Cloud Box: [x=${minX}, y=${minY}, w=${maxX-minX}, h=${maxY-minY}]`);
  console.log(`  Percent: x=${(minX/width*100).toFixed(2)}%, y=${(minY/height*100).toFixed(2)}%, w=${((maxX-minX)/width*100).toFixed(2)}%, h=${((maxY-minY)/height*100).toFixed(2)}%`);
}

async function analyzeT27() {
  const { width, height, isCloudPlaceholder } = await getExactCloudBoxes('template 27.png');
  let pts = [];
  for (let y = 450; y < 1400; y += 2) {
    for (let x = 100; x < 950; x += 2) {
      if (isCloudPlaceholder(x, y)) {
        pts.push({ x, y });
      }
    }
  }
  let minX = Math.min(...pts.map(p => p.x));
  let maxX = Math.max(...pts.map(p => p.x));
  let minY = Math.min(...pts.map(p => p.y));
  let maxY = Math.max(...pts.map(p => p.y));
  console.log(`T27 Cloud Box: [x=${minX}, y=${minY}, w=${maxX-minX}, h=${maxY-minY}]`);
  console.log(`  Percent: x=${(minX/width*100).toFixed(2)}%, y=${(minY/height*100).toFixed(2)}%, w=${((maxX-minX)/width*100).toFixed(2)}%, h=${((maxY-minY)/height*100).toFixed(2)}%`);
}

async function analyzeT25() {
  const { width, height, isCloudPlaceholder } = await getExactCloudBoxes('template 25.png');
  // Strip 1: y 200..600, x 50..350
  // Strip 2: y 500..850, x 50..350
  // Strip 3: y 800..1150, x 50..350
  // Polaroid: y 300..950, x 350..1000
  const findBox = (name, x1, y1, x2, y2) => {
    let pts = [];
    for (let y = y1; y <= y2; y += 2) {
      for (let x = x1; x <= x2; x += 2) {
        if (isCloudPlaceholder(x, y)) pts.push({ x, y });
      }
    }
    if (pts.length === 0) return;
    let minX = Math.min(...pts.map(p => p.x));
    let maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y));
    let maxY = Math.max(...pts.map(p => p.y));
    console.log(`T25 ${name}: [x=${minX}, y=${minY}, w=${maxX-minX}, h=${maxY-minY}]`);
    console.log(`  Percent: x=${(minX/width*100).toFixed(2)}%, y=${(minY/height*100).toFixed(2)}%, w=${((maxX-minX)/width*100).toFixed(2)}%, h=${((maxY-minY)/height*100).toFixed(2)}%`);
  };

  findBox('Strip 1', 50, 200, 350, 550);
  findBox('Strip 2', 50, 500, 350, 830);
  findBox('Strip 3', 50, 800, 350, 1100);
  findBox('Polaroid', 350, 300, 980, 920);
}

async function main() {
  await analyzeT16();
  await analyzeT26();
  await analyzeT27();
  await analyzeT25();
}
main();
