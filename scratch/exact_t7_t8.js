const sharp = require('sharp');

async function inspectExact(tmpl, regions) {
  const { data, info } = await sharp('public/images/template/' + tmpl).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  
  console.log(`\n=================== ${tmpl} ===================`);
  
  regions.forEach((reg, i) => {
    console.log(`\n--- Region ${i+1}: ${reg.name} (approx: ${JSON.stringify(reg.approx)}) ---`);
    
    // Scan horizontal lines around minY and maxY
    const { approx } = reg;
    
    // Find left/right bounds by scanning middle Y
    const midY = Math.round(((approx.minY + approx.maxY) / 2));
    let exactMinX = null, exactMaxX = null;
    
    for (let x = approx.minX - 20; x <= approx.maxX + 20; x++) {
      const idx = (midY * w + x) * ch;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isInner = (b > 150 && g > 150) || (g > r && g > b); // sky or green
      if (isInner) {
        if (exactMinX === null) exactMinX = x;
        exactMaxX = x;
      }
    }
    
    // Find top/bottom bounds by scanning middle X
    const midX = Math.round(((approx.minX + approx.maxX) / 2));
    let exactMinY = null, exactMaxY = null;
    
    for (let y = approx.minY - 30; y <= approx.maxY + 30; y++) {
      const idx = (y * w + midX) * ch;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isInner = (b > 150 && g > 150) || (g > r && g > b); // sky or green
      if (isInner) {
        if (exactMinY === null) exactMinY = y;
        exactMaxY = y;
      }
    }
    
    console.log(`Exact Bounds: minX=${exactMinX}, maxX=${exactMaxX}, minY=${exactMinY}, maxY=${exactMaxY}`);
    const width = exactMaxX - exactMinX + 1;
    const height = exactMaxY - exactMinY + 1;
    console.log(`Size: width=${width}, height=${height}`);
    
    const xPct = ((exactMinX / w) * 100).toFixed(2);
    const yPct = ((exactMinY / h) * 100).toFixed(2);
    const wPct = ((width / w) * 100).toFixed(2);
    const hPct = ((height / h) * 100).toFixed(2);
    
    console.log(`Percentages: { x: ${xPct}, y: ${yPct}, width: ${wPct}, height: ${hPct} }`);
    
    // Print edge colors
    console.log(`Top-left pixel [${exactMinX}, ${exactMinY}]: rgb(${data[(exactMinY*w+exactMinX)*ch]}, ${data[(exactMinY*w+exactMinX)*ch+1]}, ${data[(exactMinY*w+exactMinX)*ch+2]})`);
    console.log(`Top-1 pixel [${exactMinX}, ${exactMinY-1}]: rgb(${data[((exactMinY-1)*w+exactMinX)*ch]}, ${data[((exactMinY-1)*w+exactMinX)*ch+1]}, ${data[((exactMinY-1)*w+exactMinX)*ch+2]})`);
    console.log(`Bottom+1 pixel [${exactMinX}, ${exactMaxY+1}]: rgb(${data[((exactMaxY+1)*w+exactMinX)*ch]}, ${data[((exactMaxY+1)*w+exactMinX)*ch+1]}, ${data[((exactMaxY+1)*w+exactMinX)*ch+2]})`);
  });
}

async function run() {
  await inspectExact('template 7.png', [
    { name: 'Hero Utama', approx: { minX: 38, maxX: 1293, minY: 677, maxY: 1230 } },
    { name: 'Foto Tengah (Archived Story)', approx: { minX: 511, maxX: 821, minY: 1301, maxY: 1531 } },
    { name: 'Foto Bawah Kiri (Polaroid)', approx: { minX: 28, maxX: 434, minY: 1573, maxY: 1946 } }
  ]);
  
  await inspectExact('template 8.png', [
    { name: 'Hero Kanan', approx: { minX: 511, maxX: 1293, minY: 673, maxY: 1265 } },
    { name: 'Bawah Kiri (Polaroid)', approx: { minX: 43, maxX: 429, minY: 1372, maxY: 1738 } },
    { name: 'Bawah Kanan (Polaroid)', approx: { minX: 907, maxX: 1293, minY: 1372, maxY: 1738 } }
  ]);
}

run();
