const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function analyzeAll() {
  const templates = ['template 16.png', 'template 17.png', 'template 22.png', 'template 23.png', 'template 25.png'];
  for (const t of templates) {
    const filepath = path.join('images/template', t);
    const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    
    // Save a downsampled visualization or analyze color histogram
    console.log(`\n============================ ${t} (${w}x${h}) ============================`);
    
    // Find all placeholder regions in this template
    // We can slice the image horizontally into 20 slices and find x-ranges of placeholders
    for (let slice = 0; slice < 20; slice++) {
      const y1 = Math.round((slice / 20) * h);
      const y2 = Math.round(((slice + 1) / 20) * h);
      let pCount = 0;
      let minX = 9999, maxX = -1;
      for (let y = y1; y < y2; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const idx = (y * w + x) * info.channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Check placeholder
          const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
          const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
          if (isSky || isHill) {
            pCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      if (pCount > 50) {
        console.log(`Slice ${slice.toString().padStart(2)} (y: ${((y1/h)*100).toFixed(0)}%..${((y2/h)*100).toFixed(0)}%): count: ${pCount}, x: ${((minX/w)*100).toFixed(1)}%..${((maxX/w)*100).toFixed(1)}%`);
      }
    }
  }
}

analyzeAll();
