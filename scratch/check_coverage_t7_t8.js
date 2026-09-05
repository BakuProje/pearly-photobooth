const sharp = require('sharp');

async function checkUncovered(tmpl, slots) {
  const { data, info } = await sharp('public/images/template/' + tmpl).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  
  let totalPlaceholder = 0;
  let uncovered = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * ch;
      const r = data[idx];
      const g = data[idx+1];
      const b = data[idx+2];
      
      const isSky = (b > 200 && g > 170 && b > r + 20);
      const isGreen = (g > 90 && g > r - 10 && g > b + 25);
      
      if (isSky || isGreen) {
        totalPlaceholder++;
        
        // check if inside any slot
        let inside = false;
        for (const s of slots) {
          const sx1 = (s.x / 100) * w;
          const sy1 = (s.y / 100) * h;
          const sx2 = sx1 + (s.width / 100) * w;
          const sy2 = sy1 + (s.height / 100) * h;
          
          // allow 1px rounding margin
          if (x >= sx1 - 1 && x <= sx2 + 1 && y >= sy1 - 1 && y <= sy2 + 1) {
            inside = true;
            break;
          }
        }
        
        if (!inside) {
          uncovered++;
          if (uncovered <= 5) {
            console.log(`Uncovered pixel at (${x}, ${y}) - [${((x/w)*100).toFixed(2)}%, ${((y/h)*100).toFixed(2)}%]: rgb(${r},${g},${b})`);
          }
        }
      }
    }
  }

  console.log(`\n=== Result for ${tmpl} ===`);
  console.log(`Total placeholder pixels: ${totalPlaceholder}`);
  console.log(`Uncovered pixels: ${uncovered} (${((uncovered/totalPlaceholder)*100).toFixed(3)}%)`);
}

async function run() {
  await checkUncovered('template 7.png', [
    { x: 2.85, y: 33.87, width: 94.22, height: 27.71 },
    { x: 38.33, y: 65.08, width: 23.33, height: 11.56 },
    { x: 2.10, y: 78.69, width: 30.53, height: 18.71 }
  ]);
  
  await checkUncovered('template 8.png', [
    { x: 38.33, y: 33.67, width: 58.74, height: 29.66 },
    { x: 3.23, y: 68.63, width: 29.03, height: 18.36 },
    { x: 68.04, y: 68.63, width: 29.03, height: 18.36 }
  ]);
}

run();
