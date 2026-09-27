import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(
  url: string,
  withLogo: boolean = false,
  logoSrc: string = '/images/logo.png'
): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
      width: 440,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    if (!withLogo) {
      return canvas.toDataURL('image/png');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');

    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = logoSrc;
      });

      const qrSize = canvas.width;
      const logoSize = Math.round(qrSize * 0.24);
      const center = qrSize / 2;
      const x = center - logoSize / 2;
      const y = center - logoSize / 2;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, logoSize + 6, logoSize + 6, 8);
      ctx.fill();

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
