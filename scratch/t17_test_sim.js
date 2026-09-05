const sharp = require('sharp');
const fs = require('fs');

async function testT17Fine() {
  const w = 1333, h = 2000;
  const slots = [
    // Polaroids left:
    { x: 21.0, y: 5.2, width: 25.0, height: 18.2, rotation: 4.0, label: 'P1' },
    { x: 12.5, y: 31.5, width: 27.5, height: 20.5, rotation: 0.0, label: 'P2' },
    { x: 8.5, y: 64.0, width: 28.0, height: 20.5, rotation: 10.5, label: 'P3' },
    // Strip right:
    { x: 56.5, y: 9.0, width: 32.5, height: 24.5, rotation: 8.3, label: 'S1' },
    { x: 52.4, y: 37.5, width: 32.5, height: 24.5, rotation: 8.3, label: 'S2' },
    { x: 48.2, y: 65.8, width: 32.5, height: 24.5, rotation: 8.3, label: 'S3' },
  ];

  let svgOverlays = '';
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const boxX = (s.x / 100) * w;
    const boxY = (s.y / 100) * h;
    const boxW = (s.width / 100) * w;
    const boxH = (s.height / 100) * h;
    const cx = boxX + boxW/2;
    const cy = boxY + boxH/2;
    const rot = s.rotation || 0;
    svgOverlays += `<g transform="rotate(${rot} ${cx} ${cy})">
      <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#3b82f6" fill-opacity="0.85" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${i+1}</text>
    </g>`;
  }
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgOverlays}</svg>`;
  const res = await sharp('public/images/template/template 17.png').composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  fs.writeFileSync('scratch/t17_test_sim.png', res);
  console.log('Saved t17_test_sim.png');
}
testT17Fine();
