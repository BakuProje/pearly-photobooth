import { PhotoBoothConfig, PhotoboothTemplate } from './types';
import { FILTERS } from './constants';
import { getTemplateById } from './templateManager';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

export async function renderPhotoStripCanvas(
  photos: string[],
  config: PhotoBoothConfig,
  targetWidth: number = 1333
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  const template: PhotoboothTemplate = getTemplateById(config.selectedTemplateId);

  // Load Template Frame Image
  let templateImg: HTMLImageElement | null = null;
  try {
    templateImg = await loadImage(template.imageSrc);
  } catch (e) {
    console.error('Failed to load template image:', template.imageSrc, e);
  }

  const width = templateImg ? templateImg.naturalWidth || targetWidth : targetWidth;
  const height = templateImg ? templateImg.naturalHeight || Math.round(targetWidth * 1.5) : Math.round(targetWidth * 1.5);

  canvas.width = width;
  canvas.height = height;

  // 1. Draw Template Frame Image as Base Background
  if (templateImg) {
    ctx.save();
    ctx.filter = 'none';
    ctx.drawImage(templateImg, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Compute Filter & Adjustments
  const activeFilter = FILTERS.find((f) => f.id === config.filter);
  const filterBase = activeFilter && activeFilter.id !== 'normal' ? activeFilter.cssFilter : '';

  let brightnessVal = 1 + (config.brightness || 0) / 100;
  let contrastVal = 1 + (config.contrast || 0) / 100;
  let saturationVal = 1 + (config.saturation || 0) / 100;

  if (config.enhance && config.enhance > 0) {
    const boost = config.enhance / 100;
    brightnessVal *= 1 + boost * 0.06;
    contrastVal *= 1 + boost * 0.14;
    saturationVal *= 1 + boost * 0.18;
  }

  if (config.highlights && config.highlights !== 0) {
    brightnessVal += (config.highlights / 100) * 0.25;
  }

  if (config.shadows && config.shadows !== 0) {
    contrastVal += (config.shadows / 100) * 0.2;
  }

  if (config.fade && config.fade > 0) {
    const fadeRatio = config.fade / 100;
    contrastVal *= Math.max(0.7, 1 - fadeRatio * 0.25);
    brightnessVal += fadeRatio * 0.08;
  }

  const hasManualAdjust =
    (config.brightness && config.brightness !== 0) ||
    (config.contrast && config.contrast !== 0) ||
    (config.saturation && config.saturation !== 0) ||
    (config.enhance && config.enhance > 0) ||
    (config.highlights && config.highlights !== 0) ||
    (config.shadows && config.shadows !== 0) ||
    (config.fade && config.fade > 0) ||
    (config.warmth && config.warmth !== 0);

  let adjustString = '';
  if (hasManualAdjust) {
    adjustString = `brightness(${Math.max(0.2, brightnessVal)}) contrast(${Math.max(0.2, contrastVal)}) saturate(${Math.max(0, saturationVal)})`;
    if (config.warmth && config.warmth !== 0) {
      if (config.warmth > 0) {
        const warmthSepia = Math.min(0.6, config.warmth / 100);
        adjustString += ` sepia(${warmthSepia}) hue-rotate(${-config.warmth * 0.25}deg)`;
      } else {
        adjustString += ` hue-rotate(${Math.abs(config.warmth) * 0.3}deg)`;
      }
    }
  }

  const combinedFilter = filterBase
    ? (adjustString ? `${filterBase} ${adjustString}` : filterBase)
    : (adjustString || 'none');

  const slots = template.slots;
  const loadedPhotos: (HTMLImageElement | null)[] = [];

  // Preload all user photos
  for (let i = 0; i < photos.length; i++) {
    try {
      const img = await loadImage(photos[i]);
      loadedPhotos.push(img);
    } catch {
      loadedPhotos.push(null);
    }
  }

  // Draw photos into each slot
  for (let sIdx = 0; sIdx < slots.length; sIdx++) {
    const slot = slots[sIdx];
    const photoImg = loadedPhotos[sIdx] || null;

    if (photoImg) {
      ctx.save();

      const boxX = (slot.x / 100) * width;
      const boxY = (slot.y / 100) * height;
      const boxW = (slot.width / 100) * width;
      const boxH = (slot.height / 100) * height;

      if (slot.rotation) {
        const centerX = boxX + boxW / 2;
        const centerY = boxY + boxH / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((slot.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Clip slot
      ctx.beginPath();
      if (slot.shape === 'ellipse' || slot.shape === 'circle') {
        const cx = boxX + boxW / 2;
        const cy = boxY + boxH / 2;
        const rx = boxW / 2;
        const ry = boxH / 2;
        if (typeof ctx.ellipse === 'function') {
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(cx, cy, Math.min(rx, ry), 0, Math.PI * 2);
        }
      } else if (slot.shape === 'heart') {
        const hx = boxX;
        const hy = boxY;
        const hw = boxW;
        const hh = boxH;
        ctx.moveTo(hx + hw * 0.50, hy + hh * 0.18);
        // Left lobe inner (cleft to top)
        ctx.bezierCurveTo(
          hx + hw * 0.48, hy,
          hx + hw * 0.40, hy - hh * 0.02,
          hx + hw * 0.28, hy - hh * 0.02
        );
        // Left lobe outer (top to left tip)
        ctx.bezierCurveTo(
          hx + hw * 0.12, hy - hh * 0.02,
          hx - hw * 0.02, hy + hh * 0.10,
          hx - hw * 0.02, hy + hh * 0.28
        );
        // Left bottom (left tip to bottom point)
        ctx.bezierCurveTo(
          hx - hw * 0.02, hy + hh * 0.60,
          hx + hw * 0.30, hy + hh * 0.88,
          hx + hw * 0.50, hy + hh * 1.02
        );
        // Right bottom (bottom point to right tip)
        ctx.bezierCurveTo(
          hx + hw * 0.70, hy + hh * 0.88,
          hx + hw * 1.02, hy + hh * 0.60,
          hx + hw * 1.02, hy + hh * 0.28
        );
        // Right lobe outer (right tip to top)
        ctx.bezierCurveTo(
          hx + hw * 1.02, hy + hh * 0.10,
          hx + hw * 0.88, hy - hh * 0.02,
          hx + hw * 0.72, hy - hh * 0.02
        );
        // Right lobe inner (top to cleft)
        ctx.bezierCurveTo(
          hx + hw * 0.60, hy - hh * 0.02,
          hx + hw * 0.52, hy,
          hx + hw * 0.50, hy + hh * 0.18
        );
        ctx.closePath();
      } else if (slot.borderRadius) {
        const radius = (slot.borderRadius / 1000) * width;
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.clip();

      // Apply filter
      ctx.filter = combinedFilter;

      // Draw photo cover with per-slot user scale & offset
      const userScale = config.photoScales?.[sIdx] || 1;
      const userOffX = (config.photoOffsets?.[sIdx]?.x || 0) * boxW;
      const userOffY = (config.photoOffsets?.[sIdx]?.y || 0) * boxH;

      const imgAspect = photoImg.width / photoImg.height;
      const boxAspect = boxW / boxH;
      let renderW = boxW;
      let renderH = boxH;

      if (imgAspect > boxAspect) {
        renderH = boxH * userScale;
        renderW = boxH * imgAspect * userScale;
      } else {
        renderW = boxW * userScale;
        renderH = (boxW / imgAspect) * userScale;
      }
      const offsetX = boxX - (renderW - boxW) / 2 + userOffX;
      const offsetY = boxY - (renderH - boxH) / 2 + userOffY;

      ctx.drawImage(photoImg, offsetX, offsetY, renderW, renderH);

      // Vignette effect if specified
      if (config.vignette && config.vignette > 0) {
        ctx.filter = 'none';
        const vignetteAlpha = Math.min(0.85, config.vignette / 100);
        const radius = Math.max(boxW, boxH) * 0.75;
        const grad = ctx.createRadialGradient(
          boxX + boxW / 2,
          boxY + boxH / 2,
          radius * 0.35,
          boxX + boxW / 2,
          boxY + boxH / 2,
          radius
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${vignetteAlpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
      }

      ctx.restore();
    }
  }

  // 3. Render User Doodles
  if (config.doodles && config.doodles.length > 0) {
    ctx.save();
    for (const path of config.doodles) {
      if (path.points.length < 2) continue;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size * (width / 500);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo((path.points[0].x / 100) * width, (path.points[0].y / 100) * height);
      for (let p = 1; p < path.points.length; p++) {
        ctx.lineTo((path.points[p].x / 100) * width, (path.points[p].y / 100) * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Render User Custom Stickers
  if (config.stickers && config.stickers.length > 0) {
    for (const sticker of config.stickers) {
      ctx.save();
      const stickerX = (sticker.x / 100) * width;
      const stickerY = (sticker.y / 100) * height;
      const baseSize = Math.round(width * 0.11 * (sticker.scale || 1));

      ctx.translate(stickerX, stickerY);
      ctx.rotate(((sticker.rotation || 0) * Math.PI) / 180);

      if (sticker.isEmoji || !sticker.src.startsWith('data:image')) {
        if (sticker.src.length > 3) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = Math.round(width * 0.004);
          ctx.font = `900 ${Math.round(baseSize * 0.36)}px "Outfit", "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(sticker.src);
          const badgeW = textMetrics.width + Math.round(width * 0.03);
          const badgeH = baseSize * 0.55;

          ctx.beginPath();
          ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.fillText(sticker.src, 0, 0);
        } else {
          ctx.font = `${baseSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sticker.src, 0, 0);
        }
      } else {
        try {
          const stickerImg = await loadImage(sticker.src);
          ctx.drawImage(stickerImg, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
        } catch (e) {
          console.error('Failed to load sticker img', e);
        }
      }
      ctx.restore();
    }
  }

  return canvas;
}

export async function generateDownloadBlob(
  photos: string[],
  config: PhotoBoothConfig,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<Blob> {
  const canvas = await renderPhotoStripCanvas(photos, config, 1333);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      },
      format,
      0.95
    );
  });
}

/**
 * Applies active filter and all user adjustments (Enhance, Brightness, Contrast, Saturation, Warmth, Fade, Highlights, Shadows, Vignette)
 * to an array of raw photo data URLs, returning the filtered photo data URLs.
 */
export async function renderFilteredPhotos(
  photos: string[],
  config: PhotoBoothConfig
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];

  const activeFilter = FILTERS.find((f) => f.id === config.filter);
  const filterBase = activeFilter && activeFilter.id !== 'normal' ? activeFilter.cssFilter : '';

  let brightnessVal = 1 + (config.brightness || 0) / 100;
  let contrastVal = 1 + (config.contrast || 0) / 100;
  let saturationVal = 1 + (config.saturation || 0) / 100;

  if (config.enhance && config.enhance > 0) {
    const boost = config.enhance / 100;
    brightnessVal *= 1 + boost * 0.06;
    contrastVal *= 1 + boost * 0.14;
    saturationVal *= 1 + boost * 0.18;
  }

  if (config.highlights && config.highlights !== 0) {
    brightnessVal += (config.highlights / 100) * 0.25;
  }

  if (config.shadows && config.shadows !== 0) {
    contrastVal += (config.shadows / 100) * 0.2;
  }

  if (config.fade && config.fade > 0) {
    const fadeRatio = config.fade / 100;
    contrastVal *= Math.max(0.7, 1 - fadeRatio * 0.25);
    brightnessVal += fadeRatio * 0.08;
  }

  const hasManualAdjust =
    (config.brightness && config.brightness !== 0) ||
    (config.contrast && config.contrast !== 0) ||
    (config.saturation && config.saturation !== 0) ||
    (config.enhance && config.enhance > 0) ||
    (config.highlights && config.highlights !== 0) ||
    (config.shadows && config.shadows !== 0) ||
    (config.fade && config.fade > 0) ||
    (config.warmth && config.warmth !== 0);

  let adjustString = '';
  if (hasManualAdjust) {
    adjustString = `brightness(${Math.max(0.2, brightnessVal)}) contrast(${Math.max(0.2, contrastVal)}) saturate(${Math.max(0, saturationVal)})`;
    if (config.warmth && config.warmth !== 0) {
      if (config.warmth > 0) {
        const warmthSepia = Math.min(0.6, config.warmth / 100);
        adjustString += ` sepia(${warmthSepia}) hue-rotate(${-config.warmth * 0.25}deg)`;
      } else {
        adjustString += ` hue-rotate(${Math.abs(config.warmth) * 0.3}deg)`;
      }
    }
  }

  const combinedFilter = filterBase
    ? (adjustString ? `${filterBase} ${adjustString}` : filterBase)
    : (adjustString || 'none');

  const filteredResults: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    try {
      const img = await loadImage(photos[i]);
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) {
        filteredResults.push(photos[i]);
        continue;
      }

      offCanvas.width = img.naturalWidth || img.width || 1280;
      offCanvas.height = img.naturalHeight || img.height || 960;

      offCtx.save();
      offCtx.filter = combinedFilter;
      offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

      if (config.vignette && config.vignette > 0) {
        offCtx.filter = 'none';
        const vignetteAlpha = Math.min(0.85, config.vignette / 100);
        const radius = Math.max(offCanvas.width, offCanvas.height) * 0.75;
        const grad = offCtx.createRadialGradient(
          offCanvas.width / 2,
          offCanvas.height / 2,
          radius * 0.35,
          offCanvas.width / 2,
          offCanvas.height / 2,
          radius
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${vignetteAlpha})`);
        offCtx.fillStyle = grad;
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      }

      offCtx.restore();
      filteredResults.push(offCanvas.toDataURL('image/jpeg', 0.95));
    } catch (e) {
      console.warn('Failed to process photo filter at index', i, e);
      filteredResults.push(photos[i]);
    }
  }

  return filteredResults;
}

export interface Print4ROptions {
  layoutMode: 'fit-center' | 'twin-2in1' | 'full-bleed';
  bgColor?: string; // '#ffffff' or '#000000'
  showCutGuides?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Renders a high-resolution 4R photo sheet (4x6 inches / 10x15 cm @ 300 DPI = 1200 x 1800 px)
 * optimized for photo lab & photobooth printers (Canon Selphy, Epson L805, DNP DS-RX1, Citizen).
 */
export async function render4RPrintCanvas(
  photos: string[],
  config: PhotoBoothConfig,
  options: Print4ROptions = { layoutMode: 'fit-center', bgColor: '#ffffff', showCutGuides: true, orientation: 'portrait' }
): Promise<HTMLCanvasElement> {
  const { layoutMode = 'fit-center', bgColor = '#ffffff', showCutGuides = true } = options;

  // 4R @ 300 DPI: 4 inches x 6 inches = 1200 x 1800 px
  const isLandscape = options.orientation === 'landscape';
  const paperW = isLandscape ? 1800 : 1200;
  const paperH = isLandscape ? 1200 : 1800;

  const canvas = document.createElement('canvas');
  canvas.width = paperW;
  canvas.height = paperH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context for 4R print');

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, paperW, paperH);

  // Render the core photostrip in high quality
  const stripCanvas = await renderPhotoStripCanvas(photos, config, 1800);
  const stripW = stripCanvas.width;
  const stripH = stripCanvas.height;
  const stripAspect = stripW / stripH;

  if (layoutMode === 'twin-2in1') {
    // Twin 2-in-1: Two duplicate strips side-by-side on 1200x1800 paper
    // Each half is 600px wide x 1800px tall (ratio 1:3 = 2x6 inches)
    const halfW = paperW / 2;
    const halfH = paperH;
    const margin = 20; // safety margin in px

    const availW = halfW - margin * 2;
    const availH = halfH - margin * 2;
    const availAspect = availW / availH;

    let finalW = availW;
    let finalH = availH;

    if (stripAspect > availAspect) {
      finalW = availW;
      finalH = availW / stripAspect;
    } else {
      finalH = availH;
      finalW = availH * stripAspect;
    }

    // Left strip
    const leftX = (halfW - finalW) / 2;
    const leftY = (halfH - finalH) / 2;
    ctx.drawImage(stripCanvas, leftX, leftY, finalW, finalH);

    // Right strip
    const rightX = halfW + (halfW - finalW) / 2;
    const rightY = (halfH - finalH) / 2;
    ctx.drawImage(stripCanvas, rightX, rightY, finalW, finalH);

    // Draw Cut Guide Line (garis putus-putus tengah)
    if (showCutGuides) {
      const isDark = bgColor === '#000000' || bgColor === '#111827';
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, paperH);
      ctx.stroke();

      // Scissor markers
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#ffffff' : '#475569';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('✂ POTONG DISINI (CUT HERE)', halfW, 8);
      ctx.textBaseline = 'bottom';
      ctx.fillText('✂ POTONG DISINI (CUT HERE)', halfW, paperH - 8);
      ctx.restore();
    }
  } else if (layoutMode === 'full-bleed') {
    // Fill the 4R canvas
    const paperAspect = paperW / paperH;
    let drawW = paperW;
    let drawH = paperH;
    let drawX = 0;
    let drawY = 0;

    if (stripAspect > paperAspect) {
      drawW = paperH * stripAspect;
      drawX = (paperW - drawW) / 2;
    } else {
      drawH = paperW / stripAspect;
      drawY = (paperH - drawH) / 2;
    }
    ctx.drawImage(stripCanvas, drawX, drawY, drawW, drawH);
  } else {
    // 'fit-center' (Default): Centered with elegant studio border
    const margin = 32; // studio margin
    const availW = paperW - margin * 2;
    const availH = paperH - margin * 2;
    const availAspect = availW / availH;

    let finalW = availW;
    let finalH = availH;

    if (stripAspect > availAspect) {
      finalW = availW;
      finalH = availW / stripAspect;
    } else {
      finalH = availH;
      finalW = availH * stripAspect;
    }

    const drawX = (paperW - finalW) / 2;
    const drawY = (paperH - finalH) / 2;

    ctx.drawImage(stripCanvas, drawX, drawY, finalW, finalH);

    // Subtle corner cut guides if enabled
    if (showCutGuides) {
      const isDark = bgColor === '#000000' || bgColor === '#111827';
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1.5;
      const guideLen = 22;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(drawX - 6, drawY); ctx.lineTo(drawX - 6 - guideLen, drawY);
      ctx.moveTo(drawX, drawY - 6); ctx.lineTo(drawX, drawY - 6 - guideLen);
      // Top-right
      ctx.moveTo(drawX + finalW + 6, drawY); ctx.lineTo(drawX + finalW + 6 + guideLen, drawY);
      ctx.moveTo(drawX + finalW, drawY - 6); ctx.lineTo(drawX + finalW, drawY - 6 - guideLen);
      // Bottom-left
      ctx.moveTo(drawX - 6, drawY + finalH); ctx.lineTo(drawX - 6 - guideLen, drawY + finalH);
      ctx.moveTo(drawX, drawY + finalH + 6); ctx.lineTo(drawX, drawY + finalH + 6 + guideLen);
      // Bottom-right
      ctx.moveTo(drawX + finalW + 6, drawY + finalH); ctx.lineTo(drawX + finalW + 6 + guideLen, drawY + finalH);
      ctx.moveTo(drawX + finalW, drawY + finalH + 6); ctx.lineTo(drawX + finalW, drawY + finalH + 6 + guideLen);
      ctx.stroke();
      ctx.restore();
    }
  }

  return canvas;
}

export async function generate4RDownloadBlob(
  photos: string[],
  config: PhotoBoothConfig,
  options: Print4ROptions = { layoutMode: 'fit-center', bgColor: '#ffffff', showCutGuides: true },
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<Blob> {
  const canvas = await render4RPrintCanvas(photos, config, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('4R canvas blob generation failed'));
      },
      format,
      0.95
    );
  });
}


