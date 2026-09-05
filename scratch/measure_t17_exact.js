const sharp = require('sharp');
const fs = require('fs');

async function measureT17() {
  const { data, info } = await sharp('images/template/template 17.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  // Let's sample along horizontal & vertical lines to find the exact inner boundaries of the 6 frames
  // For each of the 6 frames, let's find the Canva placeholder pixels (or frame boundaries)
  function getPixel(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0];
    const idx = (Math.round(y) * w + Math.round(x)) * ch;
    return [data[idx], data[idx+1], data[idx+2]];
  }

  function isCanva(x, y) {
    const [r, g, b] = getPixel(x, y);
    // Green
    if (g > 100 && g > r * 1.05 && g > b * 1.3 && r < 210 && b < 120) return true;
    if (g > 140 && r > 110 && r < 220 && b < 130) return true;
    // Blue
    if (b > 200 && g > 160 && r > 120 && b >= g && b > r) return true;
    // White cloud
    if (r > 240 && g > 240 && b > 240) return true;
    return false;
  }

  // Let's test a search over rotation and center for each slot to find the maximal inscribed rectangle
  function findMaxInscribed(cx_pct, cy_pct, approxW_pct, approxH_pct, approxRot, name) {
    let best = null;
    let maxArea = 0;
    
    for (let rot = approxRot - 3; rot <= approxRot + 3; rot += 0.2) {
      const rotRad = rot * Math.PI / 180;
      const cosR = Math.cos(rotRad);
      const sinR = Math.sin(rotRad);
      
      for (let cx = (cx_pct - 3) * w / 100; cx <= (cx_pct + 3) * w / 100; cx += 2) {
        for (let cy = (cy_pct - 3) * h / 100; cy <= (cy_pct + 3) * h / 100; cy += 2) {
          
          // Test candidate width & height
          for (let bw = (approxW_pct - 4) * w / 100; bw <= (approxW_pct + 4) * w / 100; bw += 3) {
            for (let bh = (approxH_pct - 4) * h / 100; bh <= (approxH_pct + 4) * h / 100; bh += 3) {
              
              // Check if all 4 corners and midpoints are inside Canva placeholder
              let allInside = true;
              const testPoints = [
                [-bw/2, -bh/2], [bw/2, -bh/2], [bw/2, bh/2], [-bw/2, bh/2],
                [0, -bh/2], [0, bh/2], [-bw/2, 0], [bw/2, 0],
                [-bw/4, -bh/4], [bw/4, -bh/4], [bw/4, bh/4], [-bw/4, bh/4]
              ];
              
              for (const [px, py] of testPoints) {
                const rx = cx + px * cosR - py * sinR;
                const ry = cy + px * sinR + py * cosR;
                if (!isCanva(rx, ry)) {
                  allInside = false;
                  break;
                }
              }
              
              if (allInside) {
                const area = bw * bh;
                if (area > maxArea) {
                  maxArea = area;
                  best = {
                    name,
                    cx: +(cx / w * 100).toFixed(2),
                    cy: +(cy / h * 100).toFixed(2),
                    x: +((cx - bw/2) / w * 100).toFixed(2),
                    y: +((cy - bh/2) / h * 100).toFixed(2),
                    width: +(bw / w * 100).toFixed(2),
                    height: +(bh / h * 100).toFixed(2),
                    rotation: +rot.toFixed(2),
                  };
                }
              }
            }
          }
        }
      }
    }
    return best;
  }

  console.log('Finding T17 exact slots...');
  const s1 = findMaxInscribed(34.0, 14.5, 30.0, 22.0, -3.8, 'Polaroid 1 (Atas Kiri)');
  const s2 = findMaxInscribed(27.0, 42.0, 27.5, 21.5, 0.0, 'Polaroid 2 (Tengah Kiri)');
  const s3 = findMaxInscribed(23.5, 75.5, 28.0, 22.0, 8.8, 'Polaroid 3 (Bawah Kiri)');
  const s4 = findMaxInscribed(70.0, 21.0, 27.0, 23.0, -8.3, 'Strip 1 (Atas Kanan)');
  const s5 = findMaxInscribed(65.0, 49.0, 27.0, 23.0, -8.3, 'Strip 2 (Tengah Kanan)');
  const s6 = findMaxInscribed(60.0, 77.5, 27.0, 23.0, -8.3, 'Strip 3 (Bawah Kanan)');

  console.log('T17 fitted slots:');
  console.log([s1, s2, s3, s4, s5, s6]);
}
measureT17();
