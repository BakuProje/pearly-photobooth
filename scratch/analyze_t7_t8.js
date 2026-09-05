const sharp = require('sharp');

async function findBoxes(tmpl) {
  const { data, info } = await sharp('public/images/template/' + tmpl).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  
  console.log('=== Template:', tmpl, `(${w}x${h}) ===`);
  
  // Create a 2D mask of placeholder pixels
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * ch;
      const r = data[idx];
      const g = data[idx+1];
      const b = data[idx+2];
      
      // Canva sky: light blue
      // Canva green hill: olive/green
      // Canva white cloud: very bright whitish inside the sky region
      // Let's identify the frames
      const isSky = (b > 200 && g > 170 && b > r + 20);
      const isGreen = (g > 90 && g > r - 10 && g > b + 25);
      const isCloud = (r > 230 && g > 230 && b > 230); // inside frame
      
      if (isSky || isGreen) {
        mask[y * w + x] = 1;
      }
    }
  }

  // Let's flood fill or label connected components of mask
  const visited = new Uint8Array(w * h);
  const components = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === 1 && !visited[y * w + x]) {
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0;
        const queue = [x, y];
        visited[y * w + x] = 1;
        
        let qHead = 0;
        while(qHead < queue.length) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-way neighbors
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nidx = ny * w + nx;
              if (!visited[nidx]) {
                // If adjacent pixel is sky/green or cloud (bright) within bounding vicinity
                const nch = nidx * ch;
                const nr = data[nch];
                const ng = data[nch+1];
                const nb = data[nch+2];
                const isPlaceholder = mask[nidx] || (nr > 220 && ng > 220 && nb > 220 && cx >= minX - 10 && cx <= maxX + 10);
                if (isPlaceholder) {
                  visited[nidx] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }
        
        if (count > 1000) {
          components.push({
            minX, maxX, minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            count,
            xPct: ((minX / w) * 100).toFixed(2),
            yPct: ((minY / h) * 100).toFixed(2),
            wPct: (((maxX - minX + 1) / w) * 100).toFixed(2),
            hPct: (((maxY - minY + 1) / h) * 100).toFixed(2)
          });
        }
      }
    }
  }

  console.log('Components found:', components);
}

async function run() {
  await findBoxes('template 7.png');
  await findBoxes('template 8.png');
}

run();
