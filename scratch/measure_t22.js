const sharp = require('sharp');
const path = require('path');

async function measureT22() {
  const filepath = path.join('images/template', 'template 22.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's find all pixels of the placeholder inside the polaroid frame in T22
  let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
      const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
      const isCloud = (r > 225 && g > 230 && b > 235);
      // in T22, polaroid is roughly in x: 150..950, y: 200..1500
      if ((isSky || isHill || isCloud) && x > 150 && x < 950 && y > 200 && y < 1500) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }

  console.log('T22 Placeholder bounds:');
  console.log(`minX: ${minX}, maxX: ${maxX}, width: ${maxX - minX + 1} px`);
  console.log(`minY: ${minY}, maxY: ${maxY}, height: ${maxY - minY + 1} px`);
  console.log(`In %: x: ${((minX / w) * 100).toFixed(2)}%, y: ${((minY / h) * 100).toFixed(2)}%, w: ${(((maxX - minX + 1) / w) * 100).toFixed(2)}%, h: ${(((maxY - minY + 1) / h) * 100).toFixed(2)}%`);
  
  // Let's also check the polaroid white inner frame edge:
  // sample across row minY - 10 to maxY + 10
  console.log('\nChecking bottom edge near y =', maxY);
  for (let y = maxY - 5; y <= maxY + 15; y++) {
    const idx = (y * w + Math.round((minX + maxX)/2)) * info.channels;
    console.log(`y=${y} (h%=${((y/h)*100).toFixed(2)}%): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }
}

measureT22();
