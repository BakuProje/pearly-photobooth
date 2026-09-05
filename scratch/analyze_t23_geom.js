const sharp = require('sharp');
const path = require('path');

async function analyzeTemplate23() {
  const imgPath = path.join('public/images/template', 'template 23.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Analyzing template 23.png: ${width}x${height}`);

  // Let's identify the 2 film strips
  // Film strip 1: y in [250..650]
  // Film strip 2: y in [680..1100]

  // Detect sky or hill placeholder
  const isPlaceholder = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    // Sky blue: b in [200..255], g in [180..250], r in [140..240], b >= r + 15
    const isSky = (b >= 200 && g >= 170 && r >= 130 && b >= r + 10);
    // Hill green: g in [90..200], g > r + 10, g > b + 25, b <= 130
    const isHill = (g >= 85 && g >= r + 5 && g >= b + 25 && b <= 135);
    // Cloud
    const isCloud = (r >= 235 && g >= 235 && b >= 235);
    return isSky || isHill || isCloud;
  };

  // Let's also check for black borders of the film:
  const isBlackBar = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    return r < 40 && g < 40 && b < 40;
  };

  // Find angle of top strip:
  // Let's find top black edge of top strip at x=100 and x=900
  // Or find the placeholder top edge at various x
  const findTopEdge = (x, yStart, yEnd) => {
    for (let y = yStart; y <= yEnd; y++) {
      if (isPlaceholder(x, y)) return y;
    }
    return null;
  };

  const findBottomEdge = (x, yStart, yEnd) => {
    for (let y = yEnd; y >= yStart; y--) {
      if (isPlaceholder(x, y)) return y;
    }
    return null;
  };

  console.log('\n--- TOP FILM STRIP (Strip 1) ---');
  const topStripSamples = [];
  for (let x = 50; x <= 1000; x += 50) {
    const topY = findTopEdge(x, 200, 600);
    const botY = findBottomEdge(x, 200, 600);
    if (topY !== null && botY !== null) {
      topStripSamples.push({ x, topY, botY, h: botY - topY });
    }
  }
  console.log('Sample points top strip:', topStripSamples.slice(0, 5), '...', topStripSamples.slice(-3));

  // Compute angle of top strip:
  const p1 = topStripSamples[0];
  const p2 = topStripSamples[topStripSamples.length - 1];
  const topStripAngle = Math.atan2(p2.topY - p1.topY, p2.x - p1.x) * 180 / Math.PI;
  console.log(`Top Strip Angle: ${topStripAngle.toFixed(2)} deg`);

  console.log('\n--- BOTTOM FILM STRIP (Strip 2) ---');
  const botStripSamples = [];
  for (let x = 50; x <= 1000; x += 50) {
    const topY = findTopEdge(x, 650, 1100);
    const botY = findBottomEdge(x, 650, 1100);
    if (topY !== null && botY !== null) {
      botStripSamples.push({ x, topY, botY, h: botY - topY });
    }
  }
  const bp1 = botStripSamples[0];
  const bp2 = botStripSamples[botStripSamples.length - 1];
  const botStripAngle = Math.atan2(bp2.topY - bp1.topY, bp2.x - bp1.x) * 180 / Math.PI;
  console.log(`Bottom Strip Angle: ${botStripAngle.toFixed(2)} deg`);

  // Now let's detect the 2 vertical white dividers in the top strip and bottom strip!
  // In each strip, there are 3 frames separated by vertical lines.
  // Let's find the vertical divider lines by scanning along the strip's rotated midline.
  const scanStripDividers = (stripName, angle, yMidAtX0) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    console.log(`\nScanning dividers for ${stripName}...`);
    // Along the strip from x = 0 to 1080:
    // Let's measure color along the strip
    const profile = [];
    for (let x = 0; x < width; x++) {
      const y = Math.round(yMidAtX0 + x * Math.tan(rad));
      if (y >= 0 && y < height) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        // Check if white divider (r > 240, g > 240, b > 230 and neighboring pixels are different or check gradient)
        profile.push({ x, y, r, g, b });
      }
    }
    return profile;
  };

  scanStripDividers('Top Strip', topStripAngle, topStripSamples[0].topY + 100 - topStripSamples[0].x * Math.tan(topStripAngle * Math.PI / 180));
  scanStripDividers('Bottom Strip', botStripAngle, botStripSamples[0].topY + 100 - botStripSamples[0].x * Math.tan(botStripAngle * Math.PI / 180));
}
analyzeTemplate23();
