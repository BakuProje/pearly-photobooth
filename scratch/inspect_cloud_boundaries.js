const sharp = require('sharp');
const path = require('path');

// Let's sample specific bounding boxes and check colors
async function inspectTemplate(name, regions) {
  const img = sharp(path.join('public/images/template', name));
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`\n=== Checking ${name} (${width}x${height}) ===`);
  
  for (const reg of regions) {
    const x0 = Math.round((reg.x / 100) * width);
    const y0 = Math.round((reg.y / 100) * height);
    const w = Math.round((reg.width / 100) * width);
    const h = Math.round((reg.height / 100) * height);
    console.log(`Region "${reg.label}": x=${x0}, y=${y0}, w=${w}, h=${h}`);
    
    // Check center pixel color and corner colors
    const getPixel = (px, py) => {
      const idx = (py * width + px) * channels;
      return { r: data[idx], g: data[idx+1], b: data[idx+2] };
    };
    
    const center = getPixel(Math.round(x0 + w/2), Math.round(y0 + h/2));
    const topMid = getPixel(Math.round(x0 + w/2), y0 + 5);
    const botMid = getPixel(Math.round(x0 + w/2), y0 + h - 5);
    const leftMid = getPixel(x0 + 5, Math.round(y0 + h/2));
    const rightMid = getPixel(x0 + w - 5, Math.round(y0 + h/2));

    console.log(`  Center: rgb(${center.r},${center.g},${center.b})`);
    console.log(`  Top: rgb(${topMid.r},${topMid.g},${topMid.b}) | Bot: rgb(${botMid.r},${botMid.g},${botMid.b}) | Left: rgb(${leftMid.r},${leftMid.g},${leftMid.b}) | Right: rgb(${rightMid.r},${rightMid.g},${rightMid.b})`);
  }
}

async function run() {
  // Check Template 27
  await inspectTemplate('template 27.png', [
    { label: 'Cloud Window', x: 16.5, y: 30.7, width: 64.9, height: 34.9 }
  ]);

  // Check Template 26
  // Let's inspect different y and heights for T26
  await inspectTemplate('template 26.png', [
    { label: 'Cloud Window T26', x: 23.5, y: 26.5, width: 54.0, height: 37.5 }
  ]);

  // Check Template 25
  await inspectTemplate('template 25.png', [
    { label: 'T25 Strip 1', x: 8.8, y: 19.5, width: 21.0, height: 18.5 },
    { label: 'T25 Strip 2', x: 9.6, y: 40.2, width: 21.0, height: 18.5 },
    { label: 'T25 Strip 3', x: 10.4, y: 60.8, width: 21.0, height: 18.5 },
    { label: 'T25 Polaroid', x: 38.5, y: 27.8, width: 46.0, height: 34.8 },
  ]);

  // Check Template 16
  await inspectTemplate('template 16.png', [
    { label: 'T16 Slot 1', x: 18.5, y: 3.5, width: 74.0, height: 23.0 },
    { label: 'T16 Slot 2', x: 18.5, y: 29.5, width: 74.0, height: 23.0 },
    { label: 'T16 Slot 3', x: 18.5, y: 55.5, width: 74.0, height: 23.0 },
  ]);
}
run();
