const sharp = require('sharp');
const path = require('path');

async function measureInnerFilmBoundaries() {
  const imgPath = path.join('public/images/template', 'template 23.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's sample every 10 pixels in X for top strip and bottom strip
  // For top strip:
  // yTop: where r,g,b goes from dark (<100) to light (>150, blue sky) in y range [200..450]
  // yBot: where r,g,b goes from green (g>b+20) to dark (<100) in y range [450..650]

  const getTransitions = (yMin, yMid, yMax) => {
    const samples = [];
    for (let x = 30; x <= 1050; x += 10) {
      let topY = null;
      for (let y = yMin; y < yMid; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        // Blue sky
        if (b > 180 && g > 150 && r > 120 && b >= r + 10) {
          topY = y;
          break;
        }
      }

      let botY = null;
      for (let y = yMax; y > yMid; y--) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        // Green hill
        if (g > 80 && g > r && g > b + 20) {
          botY = y;
          break;
        }
      }

      if (topY !== null && botY !== null) {
        samples.push({ x, topY, botY, h: botY - topY });
      }
    }
    return samples;
  };

  const topStrip = getTransitions(200, 420, 620);
  const botStrip = getTransitions(600, 840, 1080);

  // Linear regression on topY and botY
  const getLine = (pts, key) => {
    let n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const p of pts) {
      sumX += p.x;
      sumY += p[key];
      sumXY += p.x * p[key];
      sumXX += p.x * p.x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const angleDeg = Math.atan(slope) * 180 / Math.PI;
    return { slope, intercept, angleDeg };
  };

  console.log('Top Strip Top Line:', getLine(topStrip, 'topY'));
  console.log('Top Strip Bot Line:', getLine(topStrip, 'botY'));
  console.log('Bot Strip Top Line:', getLine(botStrip, 'topY'));
  console.log('Bot Strip Bot Line:', getLine(botStrip, 'botY'));
}
measureInnerFilmBoundaries();
