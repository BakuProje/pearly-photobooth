const sharp = require('sharp');
const path = require('path');

async function analyzeT17Frames() {
  const filepath = path.join('images/template', 'template 17.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's sample edges of the 6 frames in T17
  // Frame 1: Top-Left Card (x: 200..600, y: 50..650)
  // Let's find top-left, top-right, bottom-left, bottom-right corners of Frame 1
  function findFrameCorners(name, xmin, xmax, ymin, ymax) {
    let topPts = [], botPts = [], leftPts = [], rightPts = [];
    for (let y = ymin; y < ymax; y += 2) {
      for (let x = xmin; x < xmax; x += 2) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        const isCloud = (r > 225 && g > 230 && b > 235);
        if (isSky || isHill || isCloud) {
          topPts.push({ x, y });
          break;
        }
      }
      for (let x = xmax; x >= xmin; x -= 2) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        const isCloud = (r > 225 && g > 230 && b > 235);
        if (isSky || isHill || isCloud) {
          rightPts.push({ x, y });
          break;
        }
      }
    }

    // Measure bounding box & tilt of topPts / leftPts
    let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
    for (let y = ymin; y < ymax; y++) {
      for (let x = xmin; x < xmax; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        const isCloud = (r > 225 && g > 230 && b > 235);
        if (isSky || isHill || isCloud) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    console.log(`\n=== ${name} ===`);
    console.log(`BBox: [x: ${minX}..${maxX} (w: ${maxX - minX + 1}), y: ${minY}..${maxY} (h: ${maxY - minY + 1})]`);
    console.log(`Percent: x: ${((minX/w)*100).toFixed(2)}%, y: ${((minY/h)*100).toFixed(2)}%, w: ${(((maxX-minX+1)/w)*100).toFixed(2)}%, h: ${(((maxY-ymin+1)/h)*100).toFixed(2)}%`);
    console.log(`Center: cx: ${(((minX+maxX)/2/w)*100).toFixed(2)}%, cy: ${(((minY+maxY)/2/h)*100).toFixed(2)}%`);
  }

  findFrameCorners('Frame 1 (Atas Kiri)', 180, 680, 50, 750);
  findFrameCorners('Frame 2 (Atas Kanan)', 550, 1280, 50, 850);
  findFrameCorners('Frame 3 (Tengah Kiri)', 90, 700, 500, 1150);
  findFrameCorners('Frame 4 (Tengah Kanan)', 500, 1280, 550, 1250);
  findFrameCorners('Frame 5 (Bawah Kiri)', 0, 650, 1050, 1750);
  findFrameCorners('Frame 6 (Bawah Kanan)', 400, 1280, 1050, 1750);
}

analyzeT17Frames();
