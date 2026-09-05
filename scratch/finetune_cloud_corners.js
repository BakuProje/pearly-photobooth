const sharp = require('sharp');
const path = require('path');

// Helper to find exact corners of a window in an image given an approximate bounding region
async function findExactWindowCorners(imgName, approxX, approxY, approxW, approxH) {
  const { data, info } = await sharp(path.join('public/images/template', imgName)).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isPlaceholder = (px, py) => {
    if (px < 0 || px >= width || py < 0 || py >= height) return false;
    const idx = (py * width + px) * channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    // Sky blue
    if (b >= 210 && g >= 180 && r >= 140 && b >= r + 15) return true;
    // Hill green
    if (g >= 90 && g > r && g > b + 25 && b <= 130) return true;
    // Cloud
    if (r >= 235 && g >= 235 && b >= 235 && b >= 230) return true;
    return false;
  };

  const x0 = Math.round((approxX / 100) * width);
  const y0 = Math.round((approxY / 100) * height);
  const w0 = Math.round((approxW / 100) * width);
  const h0 = Math.round((approxH / 100) * height);

  const pts = [];
  for (let y = y0; y <= y0 + h0; y++) {
    for (let x = x0; x <= x0 + w0; x++) {
      if (isPlaceholder(x, y)) {
        pts.push({ x, y });
      }
    }
  }

  if (pts.length === 0) return null;

  // Let's compute the principal orientation using moments (covariance matrix)
  let sumX = 0, sumY = 0;
  for (const p of pts) { sumX += p.x; sumY += p.y; }
  const cx = sumX / pts.length;
  const cy = sumY / pts.length;

  let u20 = 0, u02 = 0, u11 = 0;
  for (const p of pts) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    u20 += dx * dx;
    u02 += dy * dy;
    u11 += dx * dy;
  }

  // Angle of principal axis (in radians)
  // For a rectangle, principal axis is along the longer side or horizontal side
  let theta = 0.5 * Math.atan2(2 * u11, u20 - u02);
  let angleDeg = theta * 180 / Math.PI;

  // Normalize angle to be near 0 (within -45 to 45 deg)
  while (angleDeg > 45) angleDeg -= 90;
  while (angleDeg < -45) angleDeg += 90;

  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);

  // Compute unrotated bounding box
  let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
  for (const p of pts) {
    const rx = (p.x - cx) * cos - (p.y - cy) * sin;
    const ry = (p.x - cx) * sin + (p.y - cy) * cos;
    if (rx < rMinX) rMinX = rx;
    if (rx > rMaxX) rMaxX = rx;
    if (ry < rMinY) rMinY = ry;
    if (ry > rMaxY) rMaxY = ry;
  }

  const unrotatedW = rMaxX - rMinX;
  const unrotatedH = rMaxY - rMinY;

  // Re-adjust center if needed
  const unrotatedCX = (rMinX + rMaxX) / 2;
  const unrotatedCY = (rMinY + rMaxY) / 2;
  // Rotate back to image coords
  const finalCX = cx + unrotatedCX * Math.cos(rad) - unrotatedCY * Math.sin(rad);
  const finalCY = cy + unrotatedCX * Math.sin(rad) + unrotatedCY * Math.cos(rad);

  const cxPct = (finalCX / width) * 100;
  const cyPct = (finalCY / height) * 100;
  const wPct = (unrotatedW / width) * 100;
  const hPct = (unrotatedH / height) * 100;

  const slotX = cxPct - wPct / 2;
  const slotY = cyPct - hPct / 2;

  return {
    cxPct, cyPct, wPct, hPct,
    slotX: Number(slotX.toFixed(1)),
    slotY: Number(slotY.toFixed(1)),
    slotW: Number(wPct.toFixed(1)),
    slotH: Number(hPct.toFixed(1)),
    angle: Number(angleDeg.toFixed(1))
  };
}

async function run() {
  console.log('=== Template 27 ===');
  console.log(await findExactWindowCorners('template 27.png', 10, 25, 80, 45));

  console.log('=== Template 26 ===');
  console.log(await findExactWindowCorners('template 26.png', 15, 20, 70, 50));

  console.log('=== Template 25 ===');
  console.log('Strip 1:', await findExactWindowCorners('template 25.png', 5, 18, 30, 22));
  console.log('Strip 2:', await findExactWindowCorners('template 25.png', 5, 38, 30, 22));
  console.log('Strip 3:', await findExactWindowCorners('template 25.png', 5, 58, 30, 25));
  console.log('Polaroid:', await findExactWindowCorners('template 25.png', 32, 25, 60, 45));

  console.log('=== Template 17 ===');
  console.log('Polaroid 1 (Atas Kiri):', await findExactWindowCorners('template 17.png', 15, 2, 35, 25));
  console.log('Polaroid 2 (Tengah Kiri):', await findExactWindowCorners('template 17.png', 5, 28, 40, 25));
  console.log('Polaroid 3 (Bawah Kiri):', await findExactWindowCorners('template 17.png', 0, 60, 42, 28));
  console.log('Strip 1 (Atas Kanan):', await findExactWindowCorners('template 17.png', 50, 5, 45, 30));
  console.log('Strip 2 (Tengah Kanan):', await findExactWindowCorners('template 17.png', 45, 32, 45, 30));
  console.log('Strip 3 (Bawah Kanan):', await findExactWindowCorners('template 17.png', 40, 60, 45, 30));

  console.log('=== Template 16 ===');
  console.log('Slot 1:', await findExactWindowCorners('template 16.png', 10, 1, 80, 26));
  console.log('Slot 2:', await findExactWindowCorners('template 16.png', 10, 27, 80, 26));
  console.log('Slot 3:', await findExactWindowCorners('template 16.png', 10, 53, 80, 26));
}
run();
