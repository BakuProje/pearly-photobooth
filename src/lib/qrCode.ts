import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(url: string, logoSrc: string = '/images/logo.png'): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');

    // Load and draw center logo directly (NO black border, NO white box background)
    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = logoSrc;
      });

      const qrSize = canvas.width;
      const logoSize = Math.round(qrSize * 0.26); // 26% for prominent, clear logo
      const center = qrSize / 2;
      const x = center - logoSize / 2;
      const y = center - logoSize / 2;

      ctx.save();
      // Clean subtle white backdrop to make logo stand out clearly against QR pixels
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, logoSize + 6, logoSize + 6, 8);
      ctx.fill();

      // Draw the logo with high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      ctx.restore();
    } catch (logoErr) {
      console.warn('Failed to draw logo on QR code, returning base QR code', logoErr);
    }

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('QR Code generation failed', err);
    return '';
  }
}
