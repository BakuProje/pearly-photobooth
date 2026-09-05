const sharp = require('sharp');
const fs = require('fs');

async function detectFrames(templatePath) {
  const { data, info } = await sharp(templatePath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  console.log(`\n=== Analyzing ${templatePath} (${w}x${h}) ===`);
  
  // Let's create an edge/placeholder detector
  // Check if pixel is Canva placeholder (sky, cloud, grass, hill)
  function isPlaceholder(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const idx = (y * w + x) * ch;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    
    // Green grass/hill
    if (g > 100 && g > r * 1.05 && g > b * 1.3 && r < 210 && b < 120) return true;
    if (g > 140 && r > 110 && r < 220 && b < 130) return true;
    // Blue sky
    if (b > 210 && g > 165 && r > 130 && b >= g && b > r) return true;
    // Cloud / white
    if (r > 240 && g > 240 && b > 240) return true;
    return false;
  }

  // Find clusters of placeholder
  const visited = new Uint8Array(w * h);
  const clusters = [];
  const step = 4;
  
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (isPlaceholder(x, y) && !visited[y * w + x]) {
        let minX = x, maxX = x, minY = y, maxY = y, count = 0;
        let sumX = 0, sumY = 0;
        const q = [x, y];
        visited[y * w + x] = 1;
        const pts = [];
        
        let head = 0;
        while(head < q.length) {
          const cx = q[head++];
          const cy = q[head++];
          count++;
          sumX += cx; sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          if (count % 3 === 0) pts.push([cx, cy]);
          
          const neighbors = [
            [cx+step, cy], [cx-step, cy], [cx, cy+step], [cx, cy-step]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nidx = ny * w + nx;
              if (isPlaceholder(nx, ny) && !visited[nidx]) {
                visited[nidx] = 1;
                q.push(nx, ny);
              }
            }
          }
        }
        
        if (count > 300) {
          const cx = sumX / count;
          const cy = sumY / count;
          
          let sxx = 0, syy = 0, sxy = 0;
          for (const [px, py] of pts) {
            sxx += (px - cx) * (px - cx);
            syy += (py - cy) * (py - cy);
            sxy += (px - cx) * (py - cy);
          }
          const angleRad = 0.5 * Math.atan2(2 * sxy, sxx - syy);
          let angleDeg = (angleRad * 180 / Math.PI);
          
          // Align angle to [-45, 45] range
          while (angleDeg > 45) angleDeg -= 90;
          while (angleDeg < -45) angleDeg += 90;
          
          const cosA = Math.cos(angleDeg * Math.PI / 180);
          const sinA = Math.sin(angleDeg * Math.PI / 180);
          let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
          for (const [px, py] of pts) {
            const u = (px - cx) * cosA + (py - cy) * sinA;
            const v = -(px - cx) * sinA + (py - cy) * cosA;
            if (u < minU) minU = u;
            if (u > maxU) maxU = u;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
          }
          
          const rotW = maxU - minU;
          const rotH = maxV - minV;
          
          clusters.push({
            minX, maxX, minY, maxY, count,
            cx: +(cx).toFixed(1),
            cy: +(cy).toFixed(1),
            angleDeg: +angleDeg.toFixed(2),
            slotX: +((cx - rotW/2) / w * 100).toFixed(2),
            slotY: +((cy - rotH/2) / h * 100).toFixed(2),
            slotW: +(rotW / w * 100).toFixed(2),
            slotH: +(rotH / h * 100).toFixed(2),
          });
        }
      }
    }
  }
  
  clusters.sort((a,b) => a.cy - b.cy);
  console.log(`Found ${clusters.length} clusters:`);
  clusters.forEach((c, i) => console.log(`#${i+1}:`, c));
}

async function run() {
  await detectFrames('public/images/template/template 16.png');
  await detectFrames('public/images/template/template 17.png');
  await detectFrames('public/images/template/template 25.png');
}
run();
