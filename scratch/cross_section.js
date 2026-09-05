const sharp = require('sharp');

async function crossSection(tmpl, boxes) {
  const { data, info } = await sharp('public/images/template/' + tmpl).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  
  console.log(`\n=================== CROSS SECTIONS: ${tmpl} ===================`);
  
  boxes.forEach((box, bIdx) => {
    console.log(`\n*** Box ${bIdx + 1}: ${box.name} ***`);
    const midX = Math.round((box.minX + box.maxX) / 2);
    const midY = Math.round((box.minY + box.maxY) / 2);
    
    // Vertical scan at midX from (box.minY - 20) to (box.maxY + 20)
    console.log(`Vertical scan at midX=${midX}:`);
    for (let y = box.minY - 10; y <= box.maxY + 10; y++) {
      const idx = (y * w + midX) * ch;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Only print transitions (when color type changes)
      if (y === box.minY - 10 || y === box.minY - 1 || y === box.minY || y === box.minY + 1 ||
          y === box.maxY - 1 || y === box.maxY || y === box.maxY + 1 || y === box.maxY + 10) {
        console.log(`  y=${y} (${((y/h)*100).toFixed(2)}%): rgb(${r},${g},${b})`);
      }
    }

    // Horizontal scan at midY from (box.minX - 10) to (box.maxX + 10)
    console.log(`Horizontal scan at midY=${midY}:`);
    for (let x = box.minX - 10; x <= box.maxX + 10; x++) {
      const idx = (midY * w + x) * ch;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (x === box.minX - 10 || x === box.minX - 1 || x === box.minX || x === box.minX + 1 ||
          x === box.maxX - 1 || x === box.maxX || x === box.maxX + 1 || x === box.maxX + 10) {
        console.log(`  x=${x} (${((x/w)*100).toFixed(2)}%): rgb(${r},${g},${b})`);
      }
    }
  });
}

async function run() {
  await crossSection('template 7.png', [
    { name: 'Hero Utama', minX: 38, maxX: 1293, minY: 677, maxY: 1230 },
    { name: 'Foto Tengah (Archived Story)', minX: 511, maxX: 821, minY: 1301, maxY: 1531 },
    { name: 'Foto Bawah Kiri (Polaroid)', minX: 28, maxX: 434, minY: 1573, maxY: 1946 }
  ]);
  
  await crossSection('template 8.png', [
    { name: 'Hero Kanan', minX: 511, maxX: 1293, minY: 673, maxY: 1265 },
    { name: 'Bawah Kiri (Polaroid)', minX: 43, maxX: 429, minY: 1372, maxY: 1738 },
    { name: 'Bawah Kanan (Polaroid)', minX: 907, maxX: 1293, minY: 1372, maxY: 1738 }
  ]);
}

run();
