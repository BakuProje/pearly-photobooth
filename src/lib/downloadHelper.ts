/**
 * Cross-platform media download helper
 * Supports desktop browsers, mobile Safari (iOS), mobile Chrome (Android), and In-App webviews.
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

export async function downloadMediaFile(url: string, filename: string): Promise<boolean> {
  if (!url) return false;

  try {
    let blob: Blob;

    if (url.startsWith('data:')) {
      const { blob: b } = base64ToBlob(url);
      blob = b;
    } else if (url.startsWith('blob:')) {
      const res = await fetch(url);
      blob = await res.blob();
    } else {
      // Remote URL (e.g. Supabase Storage https://...)
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        blob = await res.blob();
      } catch (fetchErr) {
        console.warn('CORS/Direct fetch failed, trying direct window open:', fetchErr);
        const win = window.open(url, '_blank');
        if (!win) {
          window.location.href = url;
        }
        return true;
      }
    }

    // Determine correct MIME type from filename if needed
    let mimeType = blob.type || 'image/png';
    if (filename.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (filename.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    }

    // On iOS Safari / Android mobile browsers, try Web Share API if available.
    // This triggers the native OS "Save Image" sheet into Photo Library.
    const isMobile =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');

    if (
      isMobile &&
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof File !== 'undefined'
    ) {
      try {
        const file = new File([blob], filename, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
          });
          return true;
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          // User intentionally closed/dismissed share sheet
          return true;
        }
      }
    }

    // Fallback for standard browsers or when share is not preferred/available:
    // Create same-origin object URL from Blob to allow `<a download>` attribute to work.
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 2000);

    return true;
  } catch (err) {
    console.error('downloadMediaFile error:', err);
    try {
      const win = window.open(url, '_blank');
      if (!win) window.location.href = url;
    } catch {
      window.location.href = url;
    }
    return false;
  }
}
