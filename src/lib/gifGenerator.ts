import gifshot from 'gifshot';

/**
 * Loads an image from a base64 Data URL or path.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Normalizes and pre-processes every frame to a unified high-resolution canvas
 * with anti-aliased scaling, consistent dimensions, and crisp rendering.
 */
async function prepareHighResFrames(
  images: string[],
  targetWidth: number,
  targetHeight: number
): Promise<string[]> {
  const prepared: string[] = [];

  for (const src of images) {
    try {
      const img = await loadImage(src);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        prepared.push(src);
        continue;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clean background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Cover-fit calculation to maintain crispness and avoid any distortion or stretching
      const naturalW = img.naturalWidth || img.width || targetWidth;
      const naturalH = img.naturalHeight || img.height || targetHeight;
      const imgRatio = naturalW / naturalH;
      const targetRatio = targetWidth / targetHeight;

      let drawW = targetWidth;
      let drawH = targetHeight;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > targetRatio) {
        // Image is wider than target
        drawH = targetHeight;
        drawW = targetHeight * imgRatio;
        drawX = (targetWidth - drawW) / 2;
      } else {
        // Image is taller than target
        drawW = targetWidth;
        drawH = targetWidth / imgRatio;
        drawY = (targetHeight - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      prepared.push(canvas.toDataURL('image/jpeg', 0.95));
    } catch (e) {
      console.warn('Failed to pre-process frame for GIF:', e);
      prepared.push(src);
    }
  }

  return prepared;
}

export interface CreateGifOptions {
  interval?: number; // seconds between frames (e.g. 0.45)
  gifWidth?: number;
  gifHeight?: number;
  sampleInterval?: number; // 1-2 for maximum color clarity and minimum noise
  numWorkers?: number;
}

/**
 * Generates a crystal-clear, high-definition animated GIF from an array of image frames.
 */
export async function createAnimatedGif(
  images: string[],
  options?: CreateGifOptions
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (!images || images.length === 0) {
      return reject(new Error('No images provided for GIF generation'));
    }

    try {
      // Determine optimal resolution & aspect ratio
      let targetWidth = options?.gifWidth || 720;
      let targetHeight = options?.gifHeight || 540;

      if (!options?.gifWidth || !options?.gifHeight) {
        try {
          const firstImg = await loadImage(images[0]);
          const naturalW = firstImg.naturalWidth || firstImg.width || 1280;
          const naturalH = firstImg.naturalHeight || firstImg.height || 960;
          const ratio = naturalW / naturalH;

          if (ratio >= 1.6) {
            // 16:9 Widescreen
            targetWidth = 720;
            targetHeight = 405;
          } else if (ratio >= 1.2) {
            // 4:3 Standard Landscape
            targetWidth = 720;
            targetHeight = 540;
          } else if (ratio >= 0.85) {
            // ~1:1 Square
            targetWidth = 600;
            targetHeight = 600;
          } else {
            // Portrait 3:4 or 9:16
            targetWidth = 540;
            targetHeight = 720;
          }
        } catch {
          targetWidth = 720;
          targetHeight = 540;
        }
      }

      // Pre-process frames onto normalized high-res canvas
      const preparedFrames = await prepareHighResFrames(images, targetWidth, targetHeight);
      const interval = options?.interval ?? 0.45;
      const sampleInterval = options?.sampleInterval ?? 2; // Sample every 2nd pixel for optimal color fidelity
      const numWorkers = options?.numWorkers ?? 4;

      gifshot.createGIF(
        {
          images: preparedFrames,
          gifWidth: targetWidth,
          gifHeight: targetHeight,
          interval,
          sampleInterval,
          numWorkers,
          progressCallback: () => {},
        },
        (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => {
          if (!obj.error && obj.image) {
            resolve(obj.image);
          } else {
            console.error('gifshot error:', obj.errorMsg);
            // Fallback to first image if encoding fails
            resolve(images[0]);
          }
        }
      );
    } catch (err) {
      console.error('Error generating high-quality GIF:', err);
      resolve(images[0]);
    }
  });
}
