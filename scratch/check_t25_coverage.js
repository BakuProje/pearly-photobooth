const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function checkT25Coverage() {
  const filepath = 'scratch/test_t25_out.png';
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Check the filmstrip region (x: 600..1080, y: 1000..1920)
  // Check the polaroid region
  // Check the notebook region
  // Check the hanging photos region
  let filmLeaks = 0, notebookLeaks = 0, polaroidLeaks = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const isRedCover = (r > 200 && g < 100);
      if (!isRedCover) {
        // Is placeholder?
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        if (isSky || isHill) {
          if (x > 600 && y > 1000) filmLeaks++;
          else if (y > 400 && y < 1400 && x < 600) notebookLeaks++;
          else if (y > 1100 && x < 700) polaroidLeaks++;
        }
      }
    }
  }

  console.log(`T25 Coverage check: Filmstrip leaks: ${filmLeaks}, Notebook leaks: ${notebookLeaks}, Polaroid leaks: ${polaroidLeaks}`);
}

checkT25Coverage();
