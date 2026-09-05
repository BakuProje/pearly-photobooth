const sharp = require('sharp');
const path = require('path');

async function measureStripAngles() {
  const imgPath = path.join('public/images/template', 'template 23.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's sample the top black bar of the bottom strip
  // At x=100, x=300, x=500, x=700, x=900
  // Find where the white canvas background changes to black film border (r < 50, g < 50, b < 50)
  const isBlack = (x, y) => {
    const idx = (y * width + x) * channels;
    return data[idx] < 60 && data[idx+1] < 60 && data[idx+2] < 60;
  };

  console.log('--- Measuring Bottom Strip Film Border ---');
  const botTopBorder = [];
  const botBottomBorder = [];
  for (let x = 50; x <= 1000; x += 50) {
    // Search between y=650 and y=900 for first black pixel
    for (let y = 600; y < 900; y++) {
      if (isBlack(x, y)) {
        botTopBorder.push({ x, y });
        break;
      }
    }
    // Search between y=900 and y=1200 for last black pixel
    for (let y = 1200; y > 850; y--) {
      if (isBlack(x, y)) {
        botBottomBorder.push({ x, y });
        break;
      }
    }
  }

  console.log('Bottom Strip Top Border:', botTopBorder.slice(0, 4), '...', botTopBorder.slice(-3));
  const b1 = botTopBorder[0], b2 = botTopBorder[botTopBorder.length - 1];
  const botAngle = Math.atan2(b2.y - b1.y, b2.x - b1.x) * 180 / Math.PI;
  console.log(`Bottom Strip Top Border Angle: ${botAngle.toFixed(2)} deg`);

  // Measure Top Strip Film Border
  console.log('\n--- Measuring Top Strip Film Border ---');
  const topTopBorder = [];
  for (let x = 50; x <= 1000; x += 50) {
    for (let y = 150; y < 450; y++) {
      if (isBlack(x, y)) {
        topTopBorder.push({ x, y });
        break;
      }
    }
  }
  const t1 = topTopBorder[0], t2 = topTopBorder[topTopBorder.length - 1];
  const topAngle = Math.atan2(t2.y - t1.y, t2.x - t1.x) * 180 / Math.PI;
  console.log(`Top Strip Top Border Angle: ${topAngle.toFixed(2)} deg`);
}
measureStripAngles();
