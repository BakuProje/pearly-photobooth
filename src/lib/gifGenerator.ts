import gifshot from 'gifshot';

export async function createAnimatedGif(
  images: string[],
  options?: {
    interval?: number; // seconds between frames (e.g. 0.4)
    gifWidth?: number;
    gifHeight?: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!images || images.length === 0) {
      return reject(new Error('No images provided for GIF generation'));
    }

    // Default to 400x500 or standard aspect
    const gifWidth = options?.gifWidth || 600;
    const gifHeight = options?.gifHeight || 450;
    const interval = options?.interval || 0.45;

    gifshot.createGIF(
      {
        images,
        gifWidth,
        gifHeight,
        interval,
        numWorkers: 2,
        progressCallback: () => {},
      },
      (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => {
        if (!obj.error && obj.image) {
          resolve(obj.image);
        } else {
          console.error('gifshot error:', obj.errorMsg);
          // Fallback: return first image
          resolve(images[0]);
        }
      }
    );
  });
}
