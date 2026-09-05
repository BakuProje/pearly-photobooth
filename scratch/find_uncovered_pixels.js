const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Canva placeholder detection:
// Canva placeholder has characteristic bright greens (grass), bright blues (sky), and white clouds.
// Green hill: G > 120, R < 180, B < 120, G > R + 20, G > B + 30
// Blue sky: B > 180, R < 180, G < 230, B > R + 30
function isCanvaPlaceholderPixel(r, g, b) {
  // Green grass/hill
  if (g > 110 && g > r * 1.1 && g > b * 1.2 && r < 190 && b < 140) return true;
  // Blue sky
  if (b > 160 && b > r * 1.15 && r < 190 && g > 120 && g < 245) return true;
  // Cloud edge near sky/hill
  return false;
}

async function analyzeTemplate(filename) {
  const filepath = path.join('images/template', filename);
  const img = sharp(filepath);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  
  console.log(`\n=== Analyzing ${filename} (${info.width}x${info.height}) ===`);
  
  // Find connected components or clusters of placeholder pixels
  const w = info.width;
  const h = info.height;
  const channels = info.channels;
  
  const placeholderMap = new Uint8Array(w * h);
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isCanvaPlaceholderPixel(r, g, b)) {
        placeholderMap[y * w + x] = 1;
        count++;
      }
    }
  }
  console.log(`Found ${count} placeholder candidate pixels (${(count / (w * h) * 100).toFixed(2)}% of image)`);
  return { w, h, placeholderMap, data, channels };
}

async function run() {
  await analyzeTemplate('template 16.png');
  await analyzeTemplate('template 17.png');
  await analyzeTemplate('template 22.png');
  await analyzeTemplate('template 23.png');
  await analyzeTemplate('template 25.png');
}

run();
