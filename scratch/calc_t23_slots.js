const sharp = require('sharp');
const path = require('path');

async function measureExactT23Frames() {
  const imgPath = path.join('public/images/template', 'template 23.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's sample the exact 4 corners of each frame in the original image coordinates!
  // Top Strip (Angle ~ -7.4 deg):
  // Top sprocket bottom edge:
  // At x=0: y ~ 340
  // At x=1080: y ~ 200
  // Bottom sprocket top edge:
  // At x=0: y ~ 620
  // At x=1080: y ~ 480
  
  // Let's trace the divider lines:
  // Divider 1 Top Strip: crosses top edge at (x1, y1) and bottom edge at (x2, y2)
  // Divider 2 Top Strip: crosses top edge at (x3, y3) and bottom edge at (x4, y4)

  // In unrotated_t23_top.png (topStripH = 340, centerY = 410, angle = -7.38 deg):
  // Top opening is at unrotated y ~ 26
  // Bottom opening is at unrotated y ~ 308 (height = 282)
  // Divider 1 is at unrotated x_top ~ 316, x_bot ~ 352
  // Divider 2 is at unrotated x_top ~ 690, x_bot ~ 726

  // In unrotated_t23_bot.png (botStripH = 340, centerY = 855, angle = -7.85 deg):
  // Top opening is at unrotated y ~ 40
  // Bottom opening is at unrotated y ~ 324 (height = 284)
  // Divider 1 is at unrotated x_top ~ 320, x_bot ~ 362
  // Divider 2 is at unrotated x_top ~ 730, x_bot ~ 768

  function mapUnrotatedToOriginal(unrotX, unrotY, stripCenterY, angleDeg, stripH) {
    const rad = angleDeg * Math.PI / 180;
    const imgX = unrotX;
    const imgY = stripCenterY + (unrotX - width/2) * Math.tan(rad) + (unrotY - stripH/2);
    return { x: imgX, y: imgY };
  }

  // Top Strip Frames:
  // Frame 1: x in [0 .. 330]
  // Frame 2: x in [335 .. 705]
  // Frame 3: x in [710 .. 1080]
  const topFrames = [
    { label: '#1 Film Atas Kiri', xStart: -30, xEnd: 334, unrotYTop: 28, unrotYBot: 308, centerY: 410, angle: -7.38, stripH: 340 },
    { label: '#2 Film Atas Tengah', xStart: 336, xEnd: 706, unrotYTop: 28, unrotYBot: 308, centerY: 410, angle: -7.38, stripH: 340 },
    { label: '#3 Film Atas Kanan', xStart: 708, xEnd: 1110, unrotYTop: 28, unrotYBot: 308, centerY: 410, angle: -7.38, stripH: 340 },
  ];

  // Bottom Strip Frames:
  // Frame 4: x in [0 .. 345]
  // Frame 5: x in [350 .. 745]
  // Frame 6: x in [750 .. 1080]
  const botFrames = [
    { label: '#4 Film Bawah Kiri', xStart: -30, xEnd: 342, unrotYTop: 40, unrotYBot: 324, centerY: 855, angle: -7.85, stripH: 340 },
    { label: '#5 Film Bawah Tengah', xStart: 344, xEnd: 746, unrotYTop: 40, unrotYBot: 324, centerY: 855, angle: -7.85, stripH: 340 },
    { label: '#6 Film Bawah Kanan', xStart: 748, xEnd: 1110, unrotYTop: 40, unrotYBot: 324, centerY: 855, angle: -7.85, stripH: 340 },
  ];

  const allFrames = [...topFrames, ...botFrames];

  const calculatedSlots = allFrames.map(f => {
    const unrotW = f.xEnd - f.xStart;
    const unrotH = f.unrotYBot - f.unrotYTop;
    const unrotMidX = (f.xStart + f.xEnd) / 2;
    const unrotMidY = (f.unrotYTop + f.unrotYBot) / 2;

    const center = mapUnrotatedToOriginal(unrotMidX, unrotMidY, f.centerY, f.angle, f.stripH);

    const wPct = (unrotW / width) * 100;
    const hPct = (unrotH / height) * 100;
    const cxPct = (center.x / width) * 100;
    const cyPct = (center.y / height) * 100;

    const slotX = cxPct - wPct / 2;
    const slotY = cyPct - hPct / 2;

    return {
      x: Number(slotX.toFixed(1)),
      y: Number(slotY.toFixed(1)),
      width: Number(wPct.toFixed(1)),
      height: Number(hPct.toFixed(1)),
      rotation: Number(f.angle.toFixed(1)),
      borderRadius: 2,
      label: f.label
    };
  });

  console.log('\n=== CALCULATED SLOTS FOR TEMPLATE 23 ===');
  console.log(JSON.stringify(calculatedSlots, null, 2));

  return calculatedSlots;
}
measureExactT23Frames();
