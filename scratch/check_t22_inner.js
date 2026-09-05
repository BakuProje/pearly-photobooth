const sharp = require('sharp');
const path = require('path');

async function checkT22Inner() {
  const filepath = path.join('images/template', 'template 22.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's sample along vertical line at x = 540 (middle of image)
  console.log('Sampling column x=540:');
  let inInner = false;
  let startY = 0, endY = 0;
  for (let y = 100; y < 1800; y++) {
    const idx = (y * w + 540) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
    const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
    const isCloud = (r > 225 && g > 230 && b > 235);
    const isPlaceholder = isSky || isHill || isCloud;
    
    if (isPlaceholder && !inInner) {
      inInner = true;
      startY = y;
      console.log(`Inner placeholder starts at y=${y} (${((y/h)*100).toFixed(2)}%) rgb(${r},${g},${b})`);
    } else if (!isPlaceholder && inInner) {
      inInner = false;
      endY = y - 1;
      console.log(`Inner placeholder ends at y=${y-1} (${(((y-1)/h)*100).toFixed(2)}%) rgb(${r},${g},${b})`);
    }
  }

  // Also sample along horizontal line in the middle of inner (e.g. y = (startY + endY) / 2)
  const midY = Math.round((startY + endY) / 2);
  console.log(`\nSampling row y=${midY}:`);
  let inInnerX = false;
  let startX = 0, endX = 0;
  for (let x = 50; x < 1000; x++) {
    const idx = (midY * w + x) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
    const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
    const isCloud = (r > 225 && g > 230 && b > 235);
    const isPlaceholder = isSky || isHill || isCloud;

    if (isPlaceholder && !inInnerX) {
      inInnerX = true;
      startX = x;
      console.log(`Inner placeholder starts at x=${x} (${((x/w)*100).toFixed(2)}%) rgb(${r},${g},${b})`);
    } else if (!isPlaceholder && inInnerX) {
      inInnerX = false;
      endX = x - 1;
      console.log(`Inner placeholder ends at x=${x-1} (${(((x-1)/w)*100).toFixed(2)}%) rgb(${r},${g},${b})`);
    }
  }

  // Let's check rotation if any:
  // sample top edge x-coords
  console.log('\nTop edge at startY:', startY);
  // sample bottom edge x-coords
  console.log('Bottom edge at endY:', endY);

  console.log(`\nExact T22 Inner Cutout in px: [x: ${startX}..${endX} (w: ${endX - startX + 1}), y: ${startY}..${endY} (h: ${endY - startY + 1})]`);
  console.log(`In percentage: { x: ${((startX/w)*100).toFixed(1)}, y: ${((startY/h)*100).toFixed(1)}, width: ${(((endX - startX + 1)/w)*100).toFixed(1)}, height: ${(((endY - startY + 1)/h)*100).toFixed(1)} }`);
}

checkT22Inner();
