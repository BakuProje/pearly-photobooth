const sharp = require('sharp');
const path = require('path');

async function checkT22Image() {
  const filepath = path.join('images/template', 'template 22.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's print out what colors are at different points in T22
  console.log('T22 dimensions:', w, h);
  // Polaroids in T22:
  // Let's check center of the photo around (540, 600)
  const idxCenter = (600 * w + 540) * info.channels;
  console.log(`Center (540, 600): rgb(${data[idxCenter]}, ${data[idxCenter+1]}, ${data[idxCenter+2]})`);

  // Let's find the top border of the photo inside polaroid:
  // Scan y from 200 to 400 at x=540:
  for (let y = 250; y <= 350; y += 5) {
    const idx = (y * w + 540) * info.channels;
    console.log(`y=${y} (${((y/h)*100).toFixed(2)}%): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }

  // Scan bottom of the photo inside polaroid:
  console.log('\nScanning bottom of photo inside polaroid (y: 1100..1300 at x=540):');
  for (let y = 1100; y <= 1250; y += 5) {
    const idx = (y * w + 540) * info.channels;
    console.log(`y=${y} (${((y/h)*100).toFixed(2)}%): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }

  // Scan left and right of the photo inside polaroid at y=600:
  console.log('\nScanning left edge at y=600 (x: 180..260):');
  for (let x = 180; x <= 260; x += 5) {
    const idx = (600 * w + x) * info.channels;
    console.log(`x=${x} (${((x/w)*100).toFixed(2)}%): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }
  console.log('\nScanning right edge at y=600 (x: 800..900):');
  for (let x = 800; x <= 900; x += 5) {
    const idx = (600 * w + x) * info.channels;
    console.log(`x=${x} (${((x/w)*100).toFixed(2)}%): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }
}

checkT22Image();
