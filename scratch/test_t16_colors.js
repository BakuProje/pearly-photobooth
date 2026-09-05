const sharp = require('sharp');

async function inspectColors() {
  const { data, info } = await sharp('public/images/template/template 16.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  const pts = [
    [0.35, 0.22, 'Hero Atas center'],
    [0.35, 0.55, 'Hero Bawah center'],
    [0.70, 0.20, 'Strip 1 center'],
    [0.68, 0.72, 'Strip 4 center'],
    [0.10, 0.10, 'Top left sky'],
  ];
  for (const [fx, fy, name] of pts) {
    const x = Math.round(fx * w), y = Math.round(fy * h);
    const idx = (y * w + x) * ch;
    console.log(name, `at (${x}, ${y}): RGB(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }
}
inspectColors();
