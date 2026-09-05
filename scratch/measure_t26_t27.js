const sharp = require('sharp');

async function measureT26andT27() {
  // Template 26: 1080 x 1920
  {
    const { data, info } = await sharp('public/images/template/template 26.png').raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    
    let pts = [];
    for (let y = Math.floor(height*0.22); y <= Math.floor(height*0.78); y++) {
      for (let x = Math.floor(width*0.18); x <= Math.floor(width*0.82); x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 140 && g > 115 && r < 215 && b > r + 10);
        const isGrass = (g > 90 && g > r * 1.02 && g > b * 1.1 && r < 215 && b < 165);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
        if (isSky || isGrass || isCloud) pts.push({ x, y });
      }
    }
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    console.log('Template 26:');
    console.log(`  x: ${((minX/width)*100).toFixed(2)}%, y: ${((minY/height)*100).toFixed(2)}%, w: ${(((maxX-minX+1)/width)*100).toFixed(2)}%, h: ${(((maxY-minY+1)/height)*100).toFixed(2)}% (pts=${pts.length})`);

    // Let's check rotation angle of T26 frame
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx /= pts.length; cy /= pts.length;

    let bestRot = 0, minArea = Infinity;
    for (let deg = -10; deg <= 10; deg += 0.2) {
      const rad = (-deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
      for (let k = 0; k < pts.length; k += 8) {
        const p = pts[k];
        const rx = (p.x - cx) * cos - (p.y - cy) * sin;
        const ry = (p.x - cx) * sin + (p.y - cy) * cos;
        if (rx < minRx) minRx = rx;
        if (rx > maxRx) maxRx = rx;
        if (ry < minRy) minRy = ry;
        if (ry > maxRy) maxRy = ry;
      }
      const a = (maxRx - minRx) * (maxRy - minRy);
      if (a < minArea) { minArea = a; bestRot = deg; }
    }
    console.log(`  bestRot: ${bestRot.toFixed(2)}°`);
  }

  // Template 27: 1080 x 1920
  {
    const { data, info } = await sharp('public/images/template/template 27.png').raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    
    let pts = [];
    for (let y = Math.floor(height*0.20); y <= Math.floor(height*0.80); y++) {
      for (let x = Math.floor(width*0.10); x <= Math.floor(width*0.90); x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isSky = (b > 140 && g > 115 && r < 215 && b > r + 10);
        const isGrass = (g > 90 && g > r * 1.02 && g > b * 1.1 && r < 215 && b < 165);
        const isCloud = (r > 215 && g > 225 && b > 230 && r < 255);
        if (isSky || isGrass || isCloud) pts.push({ x, y });
      }
    }
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    console.log('Template 27:');
    console.log(`  x: ${((minX/width)*100).toFixed(2)}%, y: ${((minY/height)*100).toFixed(2)}%, w: ${(((maxX-minX+1)/width)*100).toFixed(2)}%, h: ${(((maxY-minY+1)/height)*100).toFixed(2)}% (pts=${pts.length})`);

    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx /= pts.length; cy /= pts.length;

    let bestRot = 0, minArea = Infinity;
    for (let deg = -10; deg <= 10; deg += 0.2) {
      const rad = (-deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let minRx = Infinity, maxRx = -Infinity, minRy = Infinity, maxRy = -Infinity;
      for (let k = 0; k < pts.length; k += 8) {
        const p = pts[k];
        const rx = (p.x - cx) * cos - (p.y - cy) * sin;
        const ry = (p.x - cx) * sin + (p.y - cy) * cos;
        if (rx < minRx) minRx = rx;
        if (rx > maxRx) maxRx = rx;
        if (ry < minRy) minRy = ry;
        if (ry > maxRy) maxRy = ry;
      }
      const a = (maxRx - minRx) * (maxRy - minRy);
      if (a < minArea) { minArea = a; bestRot = deg; }
    }
    console.log(`  bestRot: ${bestRot.toFixed(2)}°`);
  }
}

measureT26andT27();
