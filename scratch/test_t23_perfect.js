const sharp = require('sharp');
const path = require('path');

async function testT23Perfect() {
  const tPath = path.join('public/images/template', 'template 23.png');
  const meta = await sharp(tPath).metadata();
  const W = meta.width;
  const H = meta.height;

  // Let's define the 6 frames
  // Top strip center line: y = (336.7 + 618.3)/2 - 0.1289 * x = 477.5 - 0.1289 * x
  // Height = 282px -> 20.9%
  // Top Strip:
  // Frame 1: center x = 157, center y = 477.5 - 0.1289 * 157 = 457.3
  // Frame 2: center x = 521, center y = 477.5 - 0.1289 * 521 = 410.3
  // Frame 3: center x = 904, center y = 477.5 - 0.1289 * 904 = 361.0

  // Bottom strip center line: y = (798.3 + 1086.7)/2 - 0.1296 * x = 942.5 - 0.1296 * x
  // Height = 288px -> 21.4%
  // Bottom Strip:
  // Frame 4: center x = 162, center y = 942.5 - 0.1296 * 162 = 921.5
  // Frame 5: center x = 546, center y = 942.5 - 0.1296 * 546 = 871.7
  // Frame 6: center x = 924, center y = 942.5 - 0.1296 * 924 = 822.7

  const slots = [
    // Top Strip
    {
      label: '#1 Film Atas Kiri',
      cx: 157 / W * 100,
      cy: 457.3 / H * 100,
      width: 355 / W * 100,
      height: 282 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    },
    {
      label: '#2 Film Atas Tengah',
      cx: 521 / W * 100,
      cy: 410.3 / H * 100,
      width: 372 / W * 100,
      height: 282 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    },
    {
      label: '#3 Film Atas Kanan',
      cx: 904 / W * 100,
      cy: 361.0 / H * 100,
      width: 393 / W * 100,
      height: 282 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    },
    // Bottom Strip
    {
      label: '#4 Film Bawah Kiri',
      cx: 162 / W * 100,
      cy: 921.5 / H * 100,
      width: 364 / W * 100,
      height: 288 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    },
    {
      label: '#5 Film Bawah Tengah',
      cx: 546 / W * 100,
      cy: 871.7 / H * 100,
      width: 404 / W * 100,
      height: 288 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    },
    {
      label: '#6 Film Bawah Kanan',
      cx: 924 / W * 100,
      cy: 822.7 / H * 100,
      width: 352 / W * 100,
      height: 288 / H * 100,
      rotation: -7.4,
      borderRadius: 2
    }
  ];

  const cssSlots = slots.map(s => ({
    x: Number((s.cx - s.width / 2).toFixed(1)),
    y: Number((s.cy - s.height / 2).toFixed(1)),
    width: Number(s.width.toFixed(1)),
    height: Number(s.height.toFixed(1)),
    rotation: s.rotation,
    borderRadius: s.borderRadius,
    label: s.label
  }));

  console.log('CSS Slots:', JSON.stringify(cssSlots, null, 2));

  // Render simulation
  const rects = cssSlots.map((s, i) => {
    const sw = (s.width / 100) * W;
    const sh = (s.height / 100) * H;
    const sx = (s.x / 100) * W;
    const sy = (s.y / 100) * H;
    const rot = s.rotation || 0;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const colors = ['#E63946', '#457B9D', '#2A9D8F', '#E76F51', '#9B5DE5', '#F15BB5'];
    const col = colors[i % colors.length];

    return `
      <g transform="rotate(${rot}, ${cx}, ${cy})">
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="${col}" fill-opacity="0.88" />
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${(s.borderRadius || 2) * 2}" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="${cx}" y="${cy}" font-size="22" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">PHOTO #${i+1}</text>
      </g>
    `;
  }).join('\n');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

  await sharp(tPath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(path.join('scratch', 'perfect_t23.png'));

  console.log('Rendered perfect_t23.png');
}
testT23Perfect();
