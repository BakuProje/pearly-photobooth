import { PhotoBoothConfig, PhotoboothTemplate } from './types';
import { TEMPLATES, FILTERS } from './constants';

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

  const template: PhotoboothTemplate =
    TEMPLATES.find((t) => t.id === config.selectedTemplateId) || TEMPLATES[0];

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

  // Enhance
  if (config.enhance && config.enhance > 0) {
    const boost = config.enhance / 100;
    brightnessVal *= 1 + boost * 0.06;
    contrastVal *= 1 + boost * 0.14;
    saturationVal *= 1 + boost * 0.18;
  }

  // Highlights
  if (config.highlights && config.highlights !== 0) {
    brightnessVal += (config.highlights / 100) * 0.25;
  }

  // Shadows
  if (config.shadows && config.shadows !== 0) {
    contrastVal += (config.shadows / 100) * 0.2;
  }

  // Fade
  if (config.fade && config.fade > 0) {
    const fadeRatio = config.fade / 100;
    contrastVal *= Math.max(0.7, 1 - fadeRatio * 0.25);
    brightnessVal += fadeRatio * 0.08;
  }

  let adjustString = `brightness(${Math.max(0.2, brightnessVal)}) contrast(${Math.max(0.2, contrastVal)}) saturate(${Math.max(0, saturationVal)})`;
  
  // Warmth
  if (config.warmth && config.warmth !== 0) {
    if (config.warmth > 0) {
      const warmthSepia = Math.min(0.6, config.warmth / 100);
      adjustString += ` sepia(${warmthSepia}) hue-rotate(${-config.warmth * 0.25}deg)`;
    } else {
      adjustString += ` hue-rotate(${Math.abs(config.warmth) * 0.3}deg)`;
    }
  }

  const combinedFilter = filterBase ? `${filterBase} ${adjustString}` : adjustString;

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
    const photoImg = loadedPhotos[sIdx] || loadedPhotos[loadedPhotos.length - 1];

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
      if (slot.borderRadius) {
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

  let adjustString = `brightness(${Math.max(0.2, brightnessVal)}) contrast(${Math.max(0.2, contrastVal)}) saturate(${Math.max(0, saturationVal)})`;

  if (config.warmth && config.warmth !== 0) {
    if (config.warmth > 0) {
      const warmthSepia = Math.min(0.6, config.warmth / 100);
      adjustString += ` sepia(${warmthSepia}) hue-rotate(${-config.warmth * 0.25}deg)`;
    } else {
      adjustString += ` hue-rotate(${Math.abs(config.warmth) * 0.3}deg)`;
    }
  }

  const combinedFilter = filterBase ? `${filterBase} ${adjustString}` : adjustString;

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

