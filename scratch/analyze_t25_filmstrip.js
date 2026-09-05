const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function analyzeT25Filmstrip() {
  const filepath = path.join('images/template', 'template 25.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  console.log(`T25 dimensions: ${w}x${h}`);

  // Let's inspect the bottom right area (x: 600..1080, y: 1000..1920)
  // Let's check where the filmstrip cells are:
  for (let y = 1000; y < 1920; y += 10) {
    let rowPlaceholders = [];
    for (let x = 600; x < 1080; x += 5) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Canva placeholder:
      const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
      const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
      if (isSky || isHill) {
        rowPlaceholders.push(x);
      }
    }
    if (rowPlaceholders.length > 0) {
      const min = Math.min(...rowPlaceholders);
      const max = Math.max(...rowPlaceholders);
      console.log(`y=${y} (${((y/h)*100).toFixed(1)}%): x: ${min}..${max} (${((min/w)*100).toFixed(1)}%..${((max/w)*100).toFixed(1)}%) count: ${rowPlaceholders.length}`);
    }
  }
}

analyzeT25Filmstrip();
