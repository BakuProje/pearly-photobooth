const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function visualizeT17() {
  const filepath = path.join('images/template', 'template 17.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's create an image where placeholders are bright magenta
  const debugBuf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const oIdx = (y * w + x) * 3;

      const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
      const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
      const isCloud = (r > 225 && g > 230 && b > 235);
      if (isSky || isHill || isCloud) {
        debugBuf[oIdx] = 255;
        debugBuf[oIdx + 1] = 0;
        debugBuf[oIdx + 2] = 255;
      } else {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        debugBuf[oIdx] = gray;
        debugBuf[oIdx + 1] = gray;
        debugBuf[oIdx + 2] = gray;
      }
    }
  }

  await sharp(debugBuf, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile('scratch/t17_placeholder_map.png');
  console.log('Saved scratch/t17_placeholder_map.png');
}

visualizeT17();
