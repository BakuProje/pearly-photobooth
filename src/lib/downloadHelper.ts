/**
 * Cross-platform media download helper
 * Directly triggers file download on Desktop & Mobile (Chrome, Safari, Edge, Firefox)
 */

export function base64ToBlob(base64Data: string): { blob: Blob; contentType: string } {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0]?.split(':')[1] || 'image/png';
  const raw = atob(parts[1] || '');
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return {
    blob: new Blob([uInt8Array], { type: contentType }),
    contentType,
  };
}

/**
 * Triggers a direct, immediate file download without share dialogs or opening empty tabs.
 */
export async function downloadMediaFile(url: string, filename: string): Promise<boolean> {
  if (!url) return false;

  try {
    let blob: Blob | null = null;

    if (url.startsWith('data:')) {
      const { blob: b } = base64ToBlob(url);
      blob = b;
    } else if (url.startsWith('blob:')) {
      const res = await fetch(url);
      blob = await res.blob();
    } else {
      // Remote URL (e.g. Supabase Storage)
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (e) {
        console.warn('Fetch remote image blob note:', e);
      }

      // If fetch failed (e.g. strict CORS), load via Image canvas to extract blob
      if (!blob && !filename.toLowerCase().endsWith('.gif')) {
        try {
          blob = await new Promise<Blob | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
                } else {
                  resolve(null);
                }
              } catch {
                resolve(null);
              }
            };
            img.onerror = () => resolve(null);
            img.src = url;
          });
        } catch {}
      }
    }

    if (blob) {
      // Determine proper MIME
      let mimeType = blob.type;
      if (filename.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif';
      } else if (filename.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      }

      const cleanBlob = new Blob([blob], { type: mimeType });
      const blobUrl = URL.createObjectURL(cleanBlob);

      const link = document.createElement('a');
      link.style.position = 'fixed';
      link.style.left = '-9999px';
      link.style.top = '-9999px';
      link.style.opacity = '0';
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }, 5000);

      return true;
    } else {
      // Direct anchor click fallback
      const link = document.createElement('a');
      link.style.position = 'fixed';
      link.style.left = '-9999px';
      link.style.top = '-9999px';
      link.style.opacity = '0';
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        } catch {}
      }, 5000);

      return true;
    }
  } catch (err) {
    console.error('downloadMediaFile error:', err);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch {
      return false;
    }
  }
}
