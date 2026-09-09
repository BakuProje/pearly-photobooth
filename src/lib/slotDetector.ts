import { TemplateSlot } from './types';

export interface DetectionResult {
  slots: TemplateSlot[];
  aspectRatio: string;
  width: number;
  height: number;
  detectedCount: number;
  detectionType: 'transparency' | 'canva_placeholder' | 'solid_box' | 'preset_fallback';
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixelCount: number;
  centerX?: number;
  centerY?: number;
  rotation?: number;
}

/**
 * Loads an image from File or Data URL into an HTMLImageElement
 */
export const loadImage = (src: string | File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(src);
    }
  });
};

/**
 * Helper: Check if pixel is Canva Sky Blue
 */
export function isCanvaSky(r: number, g: number, b: number, a: number): boolean {
  if (a < 100) return false;
  // Sky in Canva: Light/medium blue with high B and medium/high G
  return b >= 160 && g >= 125 && b > r + 12 && r < 220;
}

/**
 * Helper: Check if pixel is Canva Hill Green
 */
export function isCanvaGreen(r: number, g: number, b: number, a: number): boolean {
  if (a < 100) return false;
  // Grass in Canva: High G, Medium R, Low B
  return g >= 110 && g > r + 6 && g > b + 20 && b < 165;
}

/**
 * Helper: Check if pixel is Canva Cloud White inside placeholder
 */
export function isCanvaCloud(r: number, g: number, b: number, a: number): boolean {
  if (a < 100) return false;
  return r >= 225 && g >= 225 && b >= 225;
}

/**
 * Helper: Check if pixel belongs to a Canva frame graphic
 */
export function isCanvaPlaceholderPixel(r: number, g: number, b: number, a: number): boolean {
  return isCanvaSky(r, g, b, a) || isCanvaGreen(r, g, b, a) || isCanvaCloud(r, g, b, a);
}

/**
 * Smart Auto-Detector for Template Image Slots (AI-Powered with Gemini Vision)
 */
export async function detectTemplateSlots(imageSource: string | File): Promise<DetectionResult> {
  const img = await loadImage(imageSource);
  const naturalWidth = img.naturalWidth || img.width || 1080;
  const naturalHeight = img.naturalHeight || img.height || 1920;
  const aspectRatio = `${naturalWidth} / ${naturalHeight}`;

  // 1. Try Gemini Vision AI via /api/detect-slots
  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof imageSource === 'string') {
      base64Data = imageSource;
      if (imageSource.startsWith('data:image/png')) mimeType = 'image/png';
      else if (imageSource.startsWith('data:image/webp')) mimeType = 'image/webp';
    } else {
      mimeType = imageSource.type || 'image/jpeg';
      base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageSource);
      });
    }

    const aiRes = await fetch('/api/detect-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, mimeType }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      if (aiData.success && Array.isArray(aiData.slots) && aiData.slots.length > 0) {
        return {
          slots: aiData.slots,
          aspectRatio,
          width: naturalWidth,
          height: naturalHeight,
          detectedCount: aiData.slots.length,
          detectionType: 'canva_placeholder',
        };
      }
    }
  } catch (aiErr) {
    console.warn('AI slot detection fallback to local vision engine:', aiErr);
  }

  // 2. High-resolution local vision scan fallback
  const maxScanDim = 800;
  const scale = Math.min(1, maxScanDim / Math.max(naturalWidth, naturalHeight));
  const scanW = Math.max(100, Math.round(naturalWidth * scale));
  const scanH = Math.max(100, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = scanW;
  canvas.height = scanH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      slots: getPresetSlots('4_grid', naturalWidth, naturalHeight),
      aspectRatio,
      width: naturalWidth,
      height: naturalHeight,
      detectedCount: 4,
      detectionType: 'preset_fallback',
    };
  }

  ctx.drawImage(img, 0, 0, scanW, scanH);
  const imgData = ctx.getImageData(0, 0, scanW, scanH);
  const data = imgData.data;

  // -------------------------------------------------------------
  // 1. TRANSPARENCY DETECTION (Alpha < 60)
  // -------------------------------------------------------------
  const transparentBoxes = findConnectedRegions(
    scanW,
    scanH,
    (r, g, b, a) => a < 60,
    data,
    2
  );

  const minSlotArea = scanW * scanH * 0.012;
  const validTransparent: BoundingBox[] = [];

  for (const b of transparentBoxes) {
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    if (w < scanW * 0.05 || h < scanH * 0.03 || w * h < minSlotArea) continue;

    const subSlots = decomposeTallStrip(b, scanW, scanH, data);
    if (subSlots.length > 1) {
      validTransparent.push(...subSlots);
    } else {
      validTransparent.push(b);
    }
  }

  if (validTransparent.length > 0 && validTransparent.length <= 16) {
    const slots = formatBoxesToSlots(validTransparent, scanW, scanH);
    return {
      slots: sortSlotsTopToBottom(slots),
      aspectRatio,
      width: naturalWidth,
      height: naturalHeight,
      detectedCount: slots.length,
      detectionType: 'transparency',
    };
  }

  // -------------------------------------------------------------
  // 2. CANVA PLACEHOLDER DETECTION (Primary: Green Hill Islands)
  // -------------------------------------------------------------
  // Each individual Canva photo frame has its own distinct green hill island!
  const greenIslands = findConnectedRegions(
    scanW,
    scanH,
    (r, g, b, a) => isCanvaGreen(r, g, b, a),
    data,
    2
  );

  // Filter valid green islands (must have sufficient size)
  const validGreenIslands = greenIslands.filter((b) => {
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    return b.pixelCount >= 14 && (w >= scanW * 0.02 || h >= scanH * 0.015);
  });

  if (validGreenIslands.length >= 1 && validGreenIslands.length <= 12) {
    // Sort green islands by Y (top to bottom)
    const sortedIslands = [...validGreenIslands].sort(
      (a, b) => (a.centerY ?? (a.minY + a.maxY) / 2) - (b.centerY ?? (b.minY + b.maxY) / 2)
    );

    // Check if islands form a diagonal strip
    if (sortedIslands.length >= 2) {
      const first = sortedIslands[0];
      const last = sortedIslands[sortedIslands.length - 1];
      const firstCX = first.centerX ?? (first.minX + first.maxX) / 2;
      const firstCY = first.centerY ?? (first.minY + first.maxY) / 2;
      const lastCX = last.centerX ?? (last.minX + last.maxX) / 2;
      const lastCY = last.centerY ?? (last.minY + last.maxY) / 2;

      const dx = lastCX - firstCX;
      const dy = lastCY - firstCY;
      const distTotal = Math.hypot(dx, dy);

      // If significantly diagonal (both dx and dy are notable)
      if (Math.abs(dx) > scanW * 0.05 && Math.abs(dy) > scanH * 0.05 && distTotal > 10) {
        const distSlot = distTotal / (sortedIslands.length - 1);
        const theta = Math.atan2(dy, dx);
        let rotDeg = (theta * 180.0) / Math.PI - 90.0;
        while (rotDeg > 180) rotDeg -= 360;
        while (rotDeg < -180) rotDeg += 360;

        const slotW = Math.max(scanW * 0.20, Math.min(scanW * 0.35, distSlot * 0.88));
        const slotH = Math.max(scanH * 0.12, Math.min(scanH * 0.22, distSlot * 0.58));

        // Direction towards sky (along strip upwards towards top-right)
        const uSkyX = -dx / distTotal;
        const uSkyY = -dy / distTotal;

        const stripSlots: BoundingBox[] = [];
        for (const island of sortedIslands) {
          const iCX = island.centerX ?? (island.minX + island.maxX) / 2;
          const iCY = island.centerY ?? (island.minY + island.maxY) / 2;
          const slotCX = iCX + uSkyX * (slotH * 0.30);
          const slotCY = iCY + uSkyY * (slotH * 0.30);

          stripSlots.push({
            minX: Math.round(slotCX - slotW / 2),
            minY: Math.round(slotCY - slotH / 2),
            maxX: Math.round(slotCX + slotW / 2),
            maxY: Math.round(slotCY + slotH / 2),
            pixelCount: island.pixelCount,
            centerX: Math.round(slotCX),
            centerY: Math.round(slotCY),
            rotation: Number(rotDeg.toFixed(1)),
          });
        }

        const slots = formatBoxesToSlots(stripSlots, scanW, scanH);
        return {
          slots: sortSlotsTopToBottom(slots),
          aspectRatio,
          width: naturalWidth,
          height: naturalHeight,
          detectedCount: slots.length,
          detectionType: 'canva_placeholder',
        };
      }
    }

    // Upright Canva photo slots
    const canvaSlots: BoundingBox[] = [];
    for (const gBox of sortedIslands) {
      const slotBox = expandGreenIslandToFullSlot(gBox, scanW, scanH, data, 0);
      canvaSlots.push(slotBox);
    }

    const mergedSlots = mergeContainedBoxes(canvaSlots);
    if (mergedSlots.length > 0) {
      const slots = formatBoxesToSlots(mergedSlots, scanW, scanH);
      return {
        slots: sortSlotsTopToBottom(slots),
        aspectRatio,
        width: naturalWidth,
        height: naturalHeight,
        detectedCount: slots.length,
        detectionType: 'canva_placeholder',
      };
    }
  }

  // Fallback Canva detection: Full placeholder connected regions
  const canvaRawBoxes = findConnectedRegions(
    scanW,
    scanH,
    (r, g, b, a) => isCanvaPlaceholderPixel(r, g, b, a),
    data,
    2
  );

  let validCanvaBoxes: BoundingBox[] = [];
  for (const b of canvaRawBoxes) {
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    if (w < scanW * 0.05 || h < scanH * 0.03 || w * h < minSlotArea) continue;

    const stats = analyzeCanvaRegion(b, scanW, scanH, data);
    if (stats.greenPixels < 12 || stats.skyPixels < 12) continue;

    const decomposed = decomposeCanvaStrip(b, scanW, scanH, data);
    if (decomposed.length > 1) {
      validCanvaBoxes.push(...decomposed);
    } else {
      validCanvaBoxes.push(b);
    }
  }

  if (validCanvaBoxes.length > 0 && validCanvaBoxes.length <= 16) {
    const slots = formatBoxesToSlots(validCanvaBoxes, scanW, scanH);
    return {
      slots: sortSlotsTopToBottom(slots),
      aspectRatio,
      width: naturalWidth,
      height: naturalHeight,
      detectedCount: slots.length,
      detectionType: 'canva_placeholder',
    };
  }

  // -------------------------------------------------------------
  // 3. SOLID COLOR PLACEHOLDER FRAMES
  // -------------------------------------------------------------
  const solidBoxes = findSolidRectangles(scanW, scanH, data);
  if (solidBoxes.length > 0 && solidBoxes.length <= 12) {
    const slots = formatBoxesToSlots(solidBoxes, scanW, scanH);
    return {
      slots: sortSlotsTopToBottom(slots),
      aspectRatio,
      width: naturalWidth,
      height: naturalHeight,
      detectedCount: slots.length,
      detectionType: 'solid_box',
    };
  }

  // -------------------------------------------------------------
  // 4. PRESET FALLBACK
  // -------------------------------------------------------------
  const ratioVal = naturalHeight / naturalWidth;
  let presetKey: PresetKey = '4_strip';

  if (ratioVal > 2.2) {
    presetKey = '4_strip';
  } else if (ratioVal > 1.4) {
    presetKey = '4_grid';
  } else if (ratioVal > 1.1) {
    presetKey = '4_grid';
  } else {
    presetKey = '1_hero';
  }

  const fallbackSlots = getPresetSlots(presetKey, naturalWidth, naturalHeight);
  return {
    slots: fallbackSlots,
    aspectRatio,
    width: naturalWidth,
    height: naturalHeight,
    detectedCount: fallbackSlots.length,
    detectionType: 'preset_fallback',
  };
}

/**
 * Expands a green hill island to the full enclosing Canva frame (including sky and clouds)
 */
function expandGreenIslandToFullSlot(
  gBox: BoundingBox,
  scanW: number,
  scanH: number,
  data: Uint8ClampedArray,
  rotation: number = 0
): BoundingBox {
  const gW = gBox.maxX - gBox.minX;
  const gH = gBox.maxY - gBox.minY;

  // Search in a local bounding window around this green hill
  const searchMarginX = Math.max(20, Math.round(gW * 1.2));
  const searchMarginY = Math.max(28, Math.round(gH * 2.5));

  const minXLimit = Math.max(0, gBox.minX - searchMarginX);
  const maxXLimit = Math.min(scanW - 1, gBox.maxX + searchMarginX);
  const minYLimit = Math.max(0, gBox.minY - searchMarginY);
  const maxYLimit = Math.min(scanH - 1, gBox.maxY + Math.round(searchMarginY * 0.8));

  let fullMinX = gBox.minX;
  let fullMaxX = gBox.maxX;
  let fullMinY = gBox.minY;
  let fullMaxY = gBox.maxY;
  let count = gBox.pixelCount;

  for (let py = minYLimit; py <= maxYLimit; py += 2) {
    for (let px = minXLimit; px <= maxXLimit; px += 2) {
      const idx = (py * scanW + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (isCanvaPlaceholderPixel(r, g, b, a)) {
        fullMinX = Math.min(fullMinX, px);
        fullMaxX = Math.max(fullMaxX, px + 2);
        fullMinY = Math.min(fullMinY, py);
        fullMaxY = Math.max(fullMaxY, py + 2);
        count++;
      }
    }
  }

  const cx = Math.round((fullMinX + fullMaxX) / 2);
  const cy = Math.round((fullMinY + fullMaxY) / 2);

  let w = fullMaxX - fullMinX;
  let h = fullMaxY - fullMinY;

  if (Math.abs(rotation) > 15) {
    w = Math.round(Math.max(scanW * 0.18, w * 0.72));
    h = Math.round(Math.max(scanH * 0.13, h * 0.72));
    fullMinX = Math.round(cx - w / 2);
    fullMaxX = Math.round(cx + w / 2);
    fullMinY = Math.round(cy - h / 2);
    fullMaxY = Math.round(cy + h / 2);
  }

  return {
    minX: fullMinX,
    minY: fullMinY,
    maxX: fullMaxX,
    maxY: fullMaxY,
    pixelCount: count,
    centerX: cx,
    centerY: cy,
    rotation,
  };
}

/**
 * Connected component labeling with BFS
 */
function findConnectedRegions(
  width: number,
  height: number,
  predicate: (r: number, g: number, b: number, a: number) => boolean,
  data: Uint8ClampedArray,
  step: number = 2
): BoundingBox[] {
  const gridW = Math.floor(width / step);
  const gridH = Math.floor(height / step);
  const visited = new Uint8Array(gridW * gridH);
  const boxes: BoundingBox[] = [];

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const gIdx = gy * gridW + gx;
      if (visited[gIdx]) continue;

      const px = gx * step;
      const py = gy * step;
      const pIdx = (py * width + px) * 4;

      if (!predicate(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3])) {
        continue;
      }

      const queue: [number, number][] = [[gx, gy]];
      visited[gIdx] = 1;

      let minX = px;
      let maxX = px;
      let minY = py;
      let maxY = py;
      let count = 0;

      while (queue.length > 0) {
        const [curGX, curGY] = queue.pop()!;
        const curPX = curGX * step;
        const curPY = curGY * step;

        minX = Math.min(minX, curPX);
        maxX = Math.max(maxX, curPX + step);
        minY = Math.min(minY, curPY);
        maxY = Math.max(maxY, curPY + step);
        count++;

        const neighbors: [number, number][] = [
          [curGX + 1, curGY],
          [curGX - 1, curGY],
          [curGX, curGY + 1],
          [curGX, curGY - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
            const nIdx = ny * gridW + nx;
            if (!visited[nIdx]) {
              const npx = nx * step;
              const npy = ny * step;
              const npIdx = (npy * width + npx) * 4;
              if (predicate(data[npIdx], data[npIdx + 1], data[npIdx + 2], data[npIdx + 3])) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }
      }

      if (count > 15) {
        boxes.push({
          minX,
          minY,
          maxX,
          maxY,
          pixelCount: count,
          centerX: Math.round((minX + maxX) / 2),
          centerY: Math.round((minY + maxY) / 2),
        });
      }
    }
  }

  return mergeContainedBoxes(boxes);
}

/**
 * Analyzes pixel distribution within a Canva region
 */
function analyzeCanvaRegion(
  box: BoundingBox,
  scanW: number,
  scanH: number,
  data: Uint8ClampedArray
): { greenPixels: number; skyPixels: number } {
  let greenPixels = 0;
  let skyPixels = 0;

  const stepX = Math.max(1, Math.floor((box.maxX - box.minX) / 25));
  const stepY = Math.max(1, Math.floor((box.maxY - box.minY) / 25));

  for (let py = box.minY; py <= box.maxY; py += stepY) {
    for (let px = box.minX; px <= box.maxX; px += stepX) {
      const idx = (py * scanW + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (isCanvaGreen(r, g, b, a)) greenPixels++;
      if (isCanvaSky(r, g, b, a)) skyPixels++;
    }
  }

  return { greenPixels, skyPixels };
}

/**
 * Decomposes a Canva strip with repeating cycles into distinct slots
 */
function decomposeCanvaStrip(
  box: BoundingBox,
  scanW: number,
  scanH: number,
  data: Uint8ClampedArray
): BoundingBox[] {
  const boxW = box.maxX - box.minX;
  const boxH = box.maxY - box.minY;

  const rows = 40;
  const rowH = boxH / rows;
  const greenProfile = new Array(rows).fill(0);

  for (let r = 0; r < rows; r++) {
    const yStart = Math.floor(box.minY + r * rowH);
    const yEnd = Math.floor(box.minY + (r + 1) * rowH);

    for (let py = yStart; py < yEnd; py += 2) {
      for (let px = box.minX; px <= box.maxX; px += 2) {
        const idx = (py * scanW + px) * 4;
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];
        const alpha = data[idx + 3];

        if (isCanvaGreen(red, green, blue, alpha)) greenProfile[r]++;
      }
    }
  }

  const peaks: number[] = [];
  const maxVal = Math.max(...greenProfile);
  const threshold = maxVal * 0.35;

  let inPeak = false;
  let peakMaxIdx = 0;
  let peakMaxVal = 0;

  for (let r = 0; r < rows; r++) {
    if (greenProfile[r] > threshold && maxVal > 8) {
      if (!inPeak) {
        inPeak = true;
        peakMaxIdx = r;
        peakMaxVal = greenProfile[r];
      } else if (greenProfile[r] > peakMaxVal) {
        peakMaxIdx = r;
        peakMaxVal = greenProfile[r];
      }
    } else {
      if (inPeak) {
        peaks.push(peakMaxIdx);
        inPeak = false;
        peakMaxVal = 0;
      }
    }
  }
  if (inPeak) {
    peaks.push(peakMaxIdx);
  }

  if (peaks.length >= 2 && peaks.length <= 6) {
    const count = peaks.length;
    const subBoxes: BoundingBox[] = [];
    const slotH = boxH / count;
    const gap = Math.min(6, slotH * 0.05);

    for (let i = 0; i < count; i++) {
      subBoxes.push({
        minX: box.minX,
        minY: Math.round(box.minY + i * slotH + gap),
        maxX: box.maxX,
        maxY: Math.round(box.minY + (i + 1) * slotH - gap),
        pixelCount: Math.round(box.pixelCount / count),
      });
    }
    return subBoxes;
  }

  const ratio = boxH / boxW;
  if (ratio >= 3.0) {
    const count = 4;
    const subBoxes: BoundingBox[] = [];
    const slotH = boxH / count;
    const gap = Math.min(6, slotH * 0.05);

    for (let i = 0; i < count; i++) {
      subBoxes.push({
        minX: box.minX,
        minY: Math.round(box.minY + i * slotH + gap),
        maxX: box.maxX,
        maxY: Math.round(box.minY + (i + 1) * slotH - gap),
        pixelCount: Math.round(box.pixelCount / count),
      });
    }
    return subBoxes;
  } else if (ratio >= 2.0) {
    const count = 3;
    const subBoxes: BoundingBox[] = [];
    const slotH = boxH / count;
    const gap = Math.min(6, slotH * 0.05);

    for (let i = 0; i < count; i++) {
      subBoxes.push({
        minX: box.minX,
        minY: Math.round(box.minY + i * slotH + gap),
        maxX: box.maxX,
        maxY: Math.round(box.minY + (i + 1) * slotH - gap),
        pixelCount: Math.round(box.pixelCount / count),
      });
    }
    return subBoxes;
  }

  return [box];
}

/**
 * Decomposes tall transparent strips
 */
function decomposeTallStrip(
  box: BoundingBox,
  scanW: number,
  scanH: number,
  data: Uint8ClampedArray
): BoundingBox[] {
  const boxW = box.maxX - box.minX;
  const boxH = box.maxY - box.minY;
  const ratio = boxH / boxW;

  if (ratio >= 3.0) {
    const count = 4;
    const subBoxes: BoundingBox[] = [];
    const slotH = boxH / count;
    const gap = Math.min(6, slotH * 0.05);

    for (let i = 0; i < count; i++) {
      subBoxes.push({
        minX: box.minX,
        minY: Math.round(box.minY + i * slotH + gap),
        maxX: box.maxX,
        maxY: Math.round(box.minY + (i + 1) * slotH - gap),
        pixelCount: Math.round(box.pixelCount / count),
      });
    }
    return subBoxes;
  } else if (ratio >= 2.0) {
    const count = 3;
    const subBoxes: BoundingBox[] = [];
    const slotH = boxH / count;
    const gap = Math.min(6, slotH * 0.05);

    for (let i = 0; i < count; i++) {
      subBoxes.push({
        minX: box.minX,
        minY: Math.round(box.minY + i * slotH + gap),
        maxX: box.maxX,
        maxY: Math.round(box.minY + (i + 1) * slotH - gap),
        pixelCount: Math.round(box.pixelCount / count),
      });
    }
    return subBoxes;
  }

  return [box];
}

/**
 * Merges bounding boxes only if one is substantially contained within another
 */
function mergeContainedBoxes(boxes: BoundingBox[]): BoundingBox[] {
  if (boxes.length <= 1) return boxes;

  const result: BoundingBox[] = [];
  const suppressed = new Array(boxes.length).fill(false);

  for (let i = 0; i < boxes.length; i++) {
    if (suppressed[i]) continue;
    const b1 = boxes[i];
    const area1 = (b1.maxX - b1.minX) * (b1.maxY - b1.minY);

    for (let j = 0; j < boxes.length; j++) {
      if (i === j || suppressed[j]) continue;
      const b2 = boxes[j];
      const area2 = (b2.maxX - b2.minX) * (b2.maxY - b2.minY);

      const ix1 = Math.max(b1.minX, b2.minX);
      const iy1 = Math.max(b1.minY, b2.minY);
      const ix2 = Math.min(b1.maxX, b2.maxX);
      const iy2 = Math.min(b1.maxY, b2.maxY);

      if (ix2 > ix1 && iy2 > iy1) {
        const intersection = (ix2 - ix1) * (iy2 - iy1);
        const minArea = Math.min(area1, area2);

        if (intersection / minArea > 0.65) {
          if (area1 >= area2) {
            b1.minX = Math.min(b1.minX, b2.minX);
            b1.minY = Math.min(b1.minY, b2.minY);
            b1.maxX = Math.max(b1.maxX, b2.maxX);
            b1.maxY = Math.max(b1.maxY, b2.maxY);
            b1.pixelCount += b2.pixelCount;
            suppressed[j] = true;
          } else {
            b2.minX = Math.min(b1.minX, b2.minX);
            b2.minY = Math.min(b1.minY, b2.minY);
            b2.maxX = Math.max(b1.maxX, b2.maxX);
            b2.maxY = Math.max(b1.maxY, b2.maxY);
            b2.pixelCount += b1.pixelCount;
            suppressed[i] = true;
            break;
          }
        }
      }
    }

    if (!suppressed[i]) {
      result.push(b1);
    }
  }

  return result;
}

/**
 * Finds solid color rectangular placeholder frames
 */
function findSolidRectangles(width: number, height: number, data: Uint8ClampedArray): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const minW = width * 0.12;
  const minH = height * 0.08;

  const colorMatches = (r: number, g: number, b: number, a: number) => {
    if (a < 150) return false;
    if (g > 180 && r < 70 && b < 70) return true;
    if (r > 180 && b > 180 && g < 70) return true;
    if (g > 180 && b > 180 && r < 70) return true;
    return false;
  };

  const step = 2;
  const gridW = Math.floor(width / step);
  const gridH = Math.floor(height / step);
  const visited = new Uint8Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const gIdx = gy * gridW + gx;
      if (visited[gIdx]) continue;

      const px = gx * step;
      const py = gy * step;
      const pIdx = (py * width + px) * 4;

      if (!colorMatches(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3])) {
        continue;
      }

      const queue: [number, number][] = [[gx, gy]];
      visited[gIdx] = 1;

      let minX = px;
      let maxX = px;
      let minY = py;
      let maxY = py;
      let count = 0;

      while (queue.length > 0) {
        const [curGX, curGY] = queue.pop()!;
        const curPX = curGX * step;
        const curPY = curGY * step;

        minX = Math.min(minX, curPX);
        maxX = Math.max(maxX, curPX + step);
        minY = Math.min(minY, curPY);
        maxY = Math.max(maxY, curPY + step);
        count++;

        const neighbors: [number, number][] = [
          [curGX + 1, curGY],
          [curGX - 1, curGY],
          [curGX, curGY + 1],
          [curGX, curGY - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
            const nIdx = ny * gridW + nx;
            if (!visited[nIdx]) {
              const npx = nx * step;
              const npy = ny * step;
              const npIdx = (npy * width + npx) * 4;
              if (colorMatches(data[npIdx], data[npIdx + 1], data[npIdx + 2], data[npIdx + 3])) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }
      }

      if (maxX - minX >= minW && maxY - minY >= minH) {
        boxes.push({ minX, minY, maxX, maxY, pixelCount: count });
      }
    }
  }

  return mergeContainedBoxes(boxes);
}

/**
 * Formats pixel bounding boxes to percentage TemplateSlot objects
 */
function formatBoxesToSlots(boxes: BoundingBox[], scanW: number, scanH: number): TemplateSlot[] {
  return boxes.map((box, idx) => {
    const x = Number(((box.minX / scanW) * 100).toFixed(1));
    const y = Number(((box.minY / scanH) * 100).toFixed(1));
    const width = Number((((box.maxX - box.minX) / scanW) * 100).toFixed(1));
    const height = Number((((box.maxY - box.minY) / scanH) * 100).toFixed(1));

    return {
      x,
      y,
      width,
      height,
      borderRadius: 4,
      rotation: Number((box.rotation || 0).toFixed(1)),
      label: `Foto #${idx + 1}`,
    };
  });
}

/**
 * Sorts slots top-to-bottom, left-to-right (or diagonal order)
 */
function sortSlotsTopToBottom(slots: TemplateSlot[]): TemplateSlot[] {
  return [...slots]
    .sort((a, b) => {
      // Check if mostly vertical
      if (Math.abs(a.y - b.y) > 6) {
        return a.y - b.y;
      }
      return a.x - b.x;
    })
    .map((s, idx) => ({
      ...s,
      label: `Foto #${idx + 1}`,
    }));
}

export type PresetKey =
  | '1_hero'
  | '2_stack'
  | '3_strip'
  | '4_grid'
  | '4_strip'
  | '6_twin'
  | '8_twin';

/**
 * Built-in Quick Layout Presets
 */
export function getPresetSlots(
  preset: PresetKey,
  width: number = 1080,
  height: number = 1920
): TemplateSlot[] {
  switch (preset) {
    case '1_hero':
      return [
        { x: 12, y: 18, width: 76, height: 60, borderRadius: 6, rotation: 0, label: 'Foto #1' },
      ];

    case '2_stack':
      return [
        { x: 14, y: 12, width: 72, height: 36, borderRadius: 6, rotation: 0, label: 'Foto #1 (Atas)' },
        { x: 14, y: 52, width: 72, height: 36, borderRadius: 6, rotation: 0, label: 'Foto #2 (Bawah)' },
      ];

    case '3_strip':
      return [
        { x: 14, y: 8, width: 72, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #1' },
        { x: 14, y: 37, width: 72, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #2' },
        { x: 14, y: 66, width: 72, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #3' },
      ];

    case '4_strip':
      return [
        { x: 14, y: 6, width: 72, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #1' },
        { x: 14, y: 28, width: 72, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #2' },
        { x: 14, y: 50, width: 72, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #3' },
        { x: 14, y: 72, width: 72, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #4' },
      ];

    case '4_grid':
      return [
        { x: 8, y: 8, width: 40, height: 38, borderRadius: 4, rotation: 0, label: 'Foto #1' },
        { x: 52, y: 8, width: 40, height: 38, borderRadius: 4, rotation: 0, label: 'Foto #2' },
        { x: 8, y: 52, width: 40, height: 38, borderRadius: 4, rotation: 0, label: 'Foto #3' },
        { x: 52, y: 52, width: 40, height: 38, borderRadius: 4, rotation: 0, label: 'Foto #4' },
      ];

    case '6_twin':
      return [
        { x: 8, y: 6, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #1' },
        { x: 52, y: 6, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #2' },
        { x: 8, y: 35, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #3' },
        { x: 52, y: 35, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #4' },
        { x: 8, y: 64, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #5' },
        { x: 52, y: 64, width: 40, height: 26, borderRadius: 4, rotation: 0, label: 'Foto #6' },
      ];

    case '8_twin':
      return [
        { x: 8, y: 5, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #1' },
        { x: 52, y: 5, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #2' },
        { x: 8, y: 28, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #3' },
        { x: 52, y: 28, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #4' },
        { x: 8, y: 51, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #5' },
        { x: 52, y: 51, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #6' },
        { x: 8, y: 74, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #7' },
        { x: 52, y: 74, width: 40, height: 20, borderRadius: 4, rotation: 0, label: 'Foto #8' },
      ];

    default:
      return [
        { x: 10, y: 10, width: 80, height: 80, borderRadius: 4, rotation: 0, label: 'Foto #1' },
      ];
  }
}
