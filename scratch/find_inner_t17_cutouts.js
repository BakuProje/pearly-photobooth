const sharp = require('sharp');
const fs = require('fs');

function isSky(r, g, b) {
  return (b > 165 && b > r * 1.15 && r < 195 && g > 130 && g < 245);
}
function isHill(r, g, b) {
  return (g > 115 && g > r * 1.1 && g > b * 1.2 && r < 190 && b < 140);
}
function isCloud(r, g, b) {
  return (r > 220 && g > 230 && b > 235 && Math.abs(r - g) < 20);
}
function isPlaceholder(r, g, b) {
  return isSky(r, g, b) || isHill(r, g, b) || isCloud(r, g, b);
}

async function findInnerT17Cutouts() {
  const filepath = 'images/template/template 17.png';
  const { data, info } = await sharp(filepath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // 6 distinct inner cutout regions:
  // 1. Polaroid 1 (Top Left inner photo): y: 50..450, x: 200..650
  // 2. Polaroid 2 (Mid Left inner photo): y: 600..1050, x: 150..580
  // 3. Polaroid 3 (Bot Left inner photo): y: 1250..1750, x: 80..520
  // 4. Strip 1 (Top Right inner photo): y: 120..680, x: 650..1150
  // 5. Strip 2 (Mid Right inner photo): y: 680..1250, x: 600..1100
  // 6. Strip 3 (Bot Right inner photo): y: 1250..1850, x: 550..1050

  const cutouts = [
    { label: 'Polaroid 1 (Atas Kiri)', x1: 220, x2: 640, y1: 70, y2: 480, minA: 2, maxA: 6 },
    { label: 'Polaroid 2 (Tengah Kiri)', x1: 150, x2: 560, y1: 620, y2: 1060, minA: -3, maxA: 1 },
    { label: 'Polaroid 3 (Bawah Kiri)', x1: 90, x2: 520, y1: 1260, y2: 1740, minA: -13, maxA: -9 },
    { label: 'Strip 1 (Atas Kanan)', x1: 660, x2: 1140, y1: 140, y2: 680, minA: 7, maxA: 10 },
    { label: 'Strip 2 (Tengah Kanan)', x1: 600, x2: 1080, y1: 700, y2: 1240, minA: 7, maxA: 10 },
    { label: 'Strip 3 (Bawah Kanan)', x1: 540, x2: 1020, y1: 1260, y2: 1800, minA: 7, maxA: 10 },
  ];

  const results = [];

  for (const c of cutouts) {
    const pts = [];
    for (let y = c.y1; y < c.y2; y++) {
      for (let x = c.x1; x < c.x2; x++) {
        const idx = (y * w + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (isPlaceholder(r, g, b)) {
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

    let bestAngle = 0;
    let minArea = Infinity;
    let bestW = 0, bestH = 0;
    for (let a = c.minA; a <= c.maxA; a += 0.05) {
      const rad = (a * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - cx;
        const dy = pts[i+1] - cy;
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

    // Add +2px margin to snugly fit inside the cutout border
    const padW = bestW + 4;
    const padH = bestH + 4;
    const sx = +(((cx - padW / 2) / w) * 100).toFixed(1);
    const sy = +(((cy - padH / 2) / h) * 100).toFixed(1);
    const sw = +((padW / w) * 100).toFixed(1);
    const sh = +((padH / h) * 100).toFixed(1);
    const rot = +bestAngle.toFixed(1);

    console.log(`\n[${c.label}] pts: ${count}`);
    console.log(`  Centroid: (${cx.toFixed(1)}, ${cy.toFixed(1)}) -> cx%: ${((cx/w)*100).toFixed(2)}%, cy%: ${((cy/h)*100).toFixed(2)}%`);
    console.log(`  Inner size: ${bestW.toFixed(1)} x ${bestH.toFixed(1)} px -> w%: ${((bestW/w)*100).toFixed(2)}%, h%: ${((bestH/h)*100).toFixed(2)}%, angle: ${rot}°`);
    console.log(`  Slot config: { x: ${sx}, y: ${sy}, width: ${sw}, height: ${sh}, rotation: ${rot}, borderRadius: 3, label: '${c.label}' }`);

    results.push({ label: c.label, x: sx, y: sy, width: sw, height: sh, rotation: rot, borderRadius: 3 });
  }

  // Create preview SVG overlay to test visual fit
  let svgRects = '';
  results.forEach((s, idx) => {
    const bx = (s.x / 100) * w;
    const by = (s.y / 100) * h;
    const bw = (s.width / 100) * w;
    const bh = (s.height / 100) * h;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];
    svgRects += `<g transform="rotate(${s.rotation} ${cx} ${cy})">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="${colors[idx]}" fill-opacity="0.9" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${idx+1}</text>
    </g>`;
  });

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  const rendered = await sharp(filepath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = 'scratch/test_t17_exact_fit.png';
  fs.writeFileSync(outPath, rendered);
  console.log('Saved exact fit test to', outPath);
}

findInnerT17Cutouts();
