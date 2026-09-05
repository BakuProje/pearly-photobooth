const sharp = require('sharp');
const path = require('path');

async function checkT22Tilt() {
  const filepath = path.join('images/template', 'template 22.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's find top-left, top-right, bottom-left, bottom-right corners of the photo in T22
  console.log('Finding corners in T22:');

  // Top-left: scan x around 220, y around 285
  for (let y = 275; y <= 295; y++) {
    for (let x = 210; x <= 230; x++) {
      const idx = (y * w + x) * info.channels;
      const isPlaceholder = (data[idx+2] > 220 && data[idx+1] > 210);
      if (isPlaceholder) {
        console.log(`Top-left corner around (${x}, ${y}) -> x%: ${(x/w*100).toFixed(2)}%, y%: ${(y/h*100).toFixed(2)}%`);
        break;
      }
    }
  }

  // Top-right: scan x around 845, y around 285
  for (let y = 275; y <= 295; y++) {
    for (let x = 855; x >= 835; x--) {
      const idx = (y * w + x) * info.channels;
      const isPlaceholder = (data[idx+2] > 220 && data[idx+1] > 210);
      if (isPlaceholder) {
        console.log(`Top-right corner around (${x}, ${y}) -> x%: ${(x/w*100).toFixed(2)}%, y%: ${(y/h*100).toFixed(2)}%`);
        break;
      }
    }
  }

  // Bottom-left: scan x around 220, y around 1135
  for (let y = 1145; y >= 1125; y--) {
    for (let x = 210; x <= 230; x++) {
      const idx = (y * w + x) * info.channels;
      const isGreen = (data[idx+1] > 140 && data[idx] < 150 && data[idx+2] < 50);
      if (isGreen) {
        console.log(`Bottom-left corner around (${x}, ${y}) -> x%: ${(x/w*100).toFixed(2)}%, y%: ${(y/h*100).toFixed(2)}%`);
        break;
      }
    }
  }

  // Bottom-right: scan x around 845, y around 1135
  for (let y = 1145; y >= 1125; y--) {
    for (let x = 855; x >= 835; x--) {
      const idx = (y * w + x) * info.channels;
      const isGreen = (data[idx+1] > 140 && data[idx] < 150 && data[idx+2] < 50);
      if (isGreen) {
        console.log(`Bottom-right corner around (${x}, ${y}) -> x%: ${(x/w*100).toFixed(2)}%, y%: ${(y/h*100).toFixed(2)}%`);
        break;
      }
    }
  }
}

checkT22Tilt();
