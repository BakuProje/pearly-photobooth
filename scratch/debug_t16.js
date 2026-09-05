const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function debugT16() {
  const filepath = path.join('images/template', 'template 16.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's create an image showing ONLY detected placeholder pixels in bright magenta
  const debugBuf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const oIdx = (y * w + x) * 3;

      const isSky = (b > 160 && b > r * 1.15 && r < 190 && g > 120 && g < 245);
      const isHill = (g > 110 && g > r * 1.1 && g > b * 1.15 && r < 190 && b < 140);
      if (isSky || isHill) {
        debugBuf[oIdx] = 255;
        debugBuf[oIdx + 1] = 0;
        debugBuf[oIdx + 2] = 255;
      } else {
        // grayscale of original
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        debugBuf[oIdx] = gray;
        debugBuf[oIdx + 1] = gray;
        debugBuf[oIdx + 2] = gray;
      }
    }
  }

  await sharp(debugBuf, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile('scratch/t16_placeholder_map.png');
  console.log('Saved t16_placeholder_map.png');
}

debugT16();
