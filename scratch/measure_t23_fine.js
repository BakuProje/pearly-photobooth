const sharp = require('sharp');
const path = require('path');

async function measureT23Fine() {
  const filepath = path.join('images/template', 'template 23.png');
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  console.log(`T23 size: ${w}x${h}`);

  // In T23: 6 film cells
  // Let's find placeholder pixels in 6 sub-regions:
  const cells = [
    { name: 'Row 1 Cell 1 (Atas Kiri)', x1: 0, x2: 380, y1: 220, y2: 600 },
    { name: 'Row 1 Cell 2 (Atas Tengah)', x1: 330, x2: 730, y1: 180, y2: 550 },
    { name: 'Row 1 Cell 3 (Atas Kanan)', x1: 680, x2: 1080, y1: 140, y2: 500 },
    { name: 'Row 2 Cell 1 (Bawah Kiri)', x1: 0, x2: 380, y1: 680, y2: 1050 },
    { name: 'Row 2 Cell 2 (Bawah Tengah)', x1: 330, x2: 730, y1: 640, y2: 1000 },
    { name: 'Row 2 Cell 3 (Bawah Kanan)', x1: 680, x2: 1080, y1: 600, y2: 950 },
  ];

  for (const c of cells) {
    const pts = [];
    for (let y = c.y1; y < c.y2; y++) {
      for (let x = c.x1; x < c.x2; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 155 && b > r * 1.15 && r < 195 && g > 115 && g < 245);
        const isHill = (g > 105 && g > r * 1.08 && g > b * 1.12 && r < 195 && b < 145);
        const isCloud = (r > 225 && g > 230 && b > 235);
        if (isSky || isHill || isCloud) {
          pts.push(x, y);
        }
      }
    }

    const count = pts.length / 2;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < pts.length; i += 2) {
      sumX += pts[i];
      sumY += pts[i+1];
    }
    const cx = sumX / count;
    const cy = sumY / count;

    // Best angle search
    let bestAngle = -7.2;
    let minArea = Infinity;
    let bestW = 0, bestH = 0;
    for (let a = -10; a <= -5; a += 0.05) {
      const rad = (a * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - cx;
        const dy = pts[i + 1] - cy;
        const u = dx * cos + dy * sin;
        const v = -dx * sin + dy * cos;
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const area = (maxU - minU) * (maxV - minV);
      if (area < minArea) {
        minArea = area;
        bestAngle = a;
        bestW = maxU - minU;
        bestH = maxV - minV;
      }
    }

    // Add +4% margin to guarantee full cover (menimpah canva placeholder completely)
    const padW = bestW * 1.03;
    const padH = bestH * 1.04;
    console.log(`\n${c.name}:`);
    console.log(`  Count: ${count} pts, Center: (${cx.toFixed(1)}, ${cy.toFixed(1)}) -> cx%: ${((cx/w)*100).toFixed(2)}%, cy%: ${((cy/h)*100).toFixed(2)}%`);
    console.log(`  Local size: ${bestW.toFixed(1)} x ${bestH.toFixed(1)} px -> w%: ${((bestW/w)*100).toFixed(2)}%, h%: ${((bestH/h)*100).toFixed(2)}%, angle: ${bestAngle.toFixed(2)}°`);
    console.log(`  Proposed slot with full cover:`);
    const sx = +(((cx - padW / 2) / w) * 100).toFixed(1);
    const sy = +(((cy - padH / 2) / h) * 100).toFixed(1);
    const sw = +((padW / w) * 100).toFixed(1);
    const sh = +((padH / h) * 100).toFixed(1);
    console.log(`  { x: ${sx}, y: ${sy}, width: ${sw}, height: ${sh}, rotation: ${+bestAngle.toFixed(1)}, borderRadius: 4, label: '${c.name}' }`);
  }
}

measureT23Fine();
