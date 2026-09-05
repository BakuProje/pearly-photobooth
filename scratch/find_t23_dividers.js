const sharp = require('sharp');
const path = require('path');

async function findT23Dividers() {
  const imgPath = path.join('public/images/template', 'template 23.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's inspect the vertical lines in the image
  // In Canva filmstrip templates:
  // The dividers are thin lines or vertical edges drawn across the placeholder.
  // Or let's unrotate the top strip and bottom strip and visualize the cross-section!

  function getUnrotatedStrip(angleDeg, centerY, stripH) {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Create a 2D image of width 1080 x stripH
    const stripData = new Uint8Array(width * stripH * channels);

    for (let dy = 0; dy < stripH; dy++) {
      for (let x = 0; x < width; x++) {
        // Image coord:
        const imgX = x;
        const imgY = Math.round(centerY + (x - width/2) * Math.tan(rad) + (dy - stripH/2));

        if (imgX >= 0 && imgX < width && imgY >= 0 && imgY < height) {
          const srcIdx = (imgY * width + imgX) * channels;
          const dstIdx = (dy * width + x) * channels;
          for (let c = 0; c < channels; c++) {
            stripData[dstIdx + c] = data[srcIdx + c];
          }
        }
      }
    }
    return stripData;
  }

  // Top Strip: angle -7.38 deg, center at x=540, y ~ 410
  const topStripH = 340;
  const topStripData = getUnrotatedStrip(-7.38, 410, topStripH);

  // Bottom Strip: angle -7.85 deg, center at x=540, y ~ 855
  const botStripH = 340;
  const botStripData = getUnrotatedStrip(-7.85, 855, botStripH);

  // Save unrotated strips as pngs to inspect
  await sharp(topStripData, { raw: { width, height: topStripH, channels } })
    .png().toFile('scratch/unrotated_t23_top.png');

  await sharp(botStripData, { raw: { width, height: botStripH, channels } })
    .png().toFile('scratch/unrotated_t23_bot.png');

  console.log('Saved unrotated strips: scratch/unrotated_t23_top.png and bot.png');

  // Let's analyze vertical columns in top strip to find the 2 divider lines
  // Sum color difference or brightness across columns
  for (let sIdx = 0; sIdx < 2; sIdx++) {
    const sData = sIdx === 0 ? topStripData : botStripData;
    const sH = sIdx === 0 ? topStripH : botStripH;
    const name = sIdx === 0 ? 'Top Strip' : 'Bottom Strip';

    // Measure vertical line intensity (white lines)
    console.log(`\n=== ${name} Divider Search ===`);
    const colBright = [];
    for (let x = 100; x < width - 100; x++) {
      let bSum = 0;
      for (let y = 50; y < sH - 50; y++) {
        const idx = (y * width + x) * channels;
        const r = sData[idx], g = sData[idx+1], b = sData[idx+2];
        bSum += (r + g + b) / 3;
      }
      colBright.push({ x, avg: bSum / (sH - 100) });
    }

    // Let's find peaks in brightness or high-contrast vertical lines (dividers)
    // The dividers are near x ~ 340-380 and x ~ 700-740
    console.log('Searching near x ~ 360 and x ~ 720:');
    const d1Candidates = colBright.filter(c => c.x >= 320 && c.x <= 400);
    const d2Candidates = colBright.filter(c => c.x >= 680 && c.x <= 760);

    // Also let's inspect the exact pixel values at y=100 in the unrotated strip
    console.log('Sample around x=330..370:');
    for (let x = 330; x <= 370; x += 5) {
      const idx = (100 * width + x) * channels;
      console.log(`x=${x}: rgb(${sData[idx]}, ${sData[idx+1]}, ${sData[idx+2]})`);
    }

    console.log('Sample around x=690..730:');
    for (let x = 690; x <= 730; x += 5) {
      const idx = (100 * width + x) * channels;
      console.log(`x=${x}: rgb(${sData[idx]}, ${sData[idx+1]}, ${sData[idx+2]})`);
    }
  }
}
findT23Dividers();
