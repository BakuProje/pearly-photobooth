'use client';

import React, { useState, useEffect } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
  GalleryItem,
} from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';
import { renderPhotoStripCanvas, generateDownloadBlob, renderFilteredPhotos } from '@/lib/canvasRenderer';
import { createAnimatedGif } from '@/lib/gifGenerator';
import { generateQrCodeDataUrl } from '@/lib/qrCode';
import confetti from 'canvas-confetti';
import {
  Printer,
  Download,
  QrCode,
  RotateCcw,
  Loader2,
  X,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultViewProps {
  photos: string[];
  config: PhotoBoothConfig;
  isScanView?: boolean;
  disableAutoSave?: boolean;
  onRetakeNewSession: () => void;
  onSaveToGallery: (item: GalleryItem) => void;
  onOpenGallery?: () => void;
  galleryCount?: number;
}

export const ResultView: React.FC<ResultViewProps> = ({
  photos,
  config,
  isScanView = false,
  disableAutoSave = false,
  onRetakeNewSession,
  onSaveToGallery,
  onOpenGallery,
  galleryCount = 0,
}) => {
  const [photostripUrl, setPhotostripUrl] = useState<string | null>(null);
  const [processedPhotos, setProcessedPhotos] = useState<string[]>(photos);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [isGifGenerating, setIsGifGenerating] = useState(true);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  // Lightbox Zoom Modal State
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  // Prevent duplicate saves & duplicate re-renders for the same session
  const hasAutoSavedRef = React.useRef(false);
  const onSaveToGalleryRef = React.useRef(onSaveToGallery);
  onSaveToGalleryRef.current = onSaveToGallery;
  const renderedSessionKeyRef = React.useRef<string>('');

  const currentTemplate: PhotoboothTemplate =
    TEMPLATES.find((t) => t.id === config.selectedTemplateId) || TEMPLATES[0];

  // Cycling preview if GIF is rendering (only depends on length of processedPhotos)
  useEffect(() => {
    if (processedPhotos.length === 0) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % processedPhotos.length);
    }, 450);
    return () => clearInterval(interval);
  }, [processedPhotos.length]);

  // Generate Photostrip Canvas + Filtered Photos + Animated GIF + QR Code ONCE on mount or when actual session changes
  useEffect(() => {
    if (photos.length === 0) return;

    // Unique signature of current session
    const sessionKey = `${config.selectedTemplateId}_${config.filter}_${config.brightness}_${config.contrast}_${config.saturation}_${photos.join('|')}`;

    // If already rendered for this exact session, do NOT re-render (prevents infinite flicker)
    if (renderedSessionKeyRef.current === sessionKey) {
      return;
    }
    renderedSessionKeyRef.current = sessionKey;

    setIsRendering(true);
    setIsGifGenerating(true);

    // Launch celebration confetti only ONCE
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#38bdf8', '#0284c7', '#34d399', '#0f172a', '#ffffff'],
      });
    } catch (e) {
      // fallback
    }

    // 1. Render Photostrip Canvas & Filtered Photos in parallel
    Promise.all([
      renderPhotoStripCanvas(photos, config, 1333),
      renderFilteredPhotos(photos, config),
    ])
      .then(([canvas, filtered]) => {
        const url = canvas.toDataURL('image/png', 0.95);
        setPhotostripUrl(url);
        setProcessedPhotos(filtered);
        setIsRendering(false);

        // Save scan session to localStorage with filtered photos
        try {
          localStorage.setItem('snapbooth_scan_session', JSON.stringify({ photos: filtered, config }));
        } catch (e) {
          console.warn('Failed to save scan session', e);
        }

        // Otomatis Simpan ke Galeri Sesi (Hanya 1x saat selesai sesi baru, tidak menduplikasi saat melihat kembali)
        if (!isScanView && !disableAutoSave && !hasAutoSavedRef.current) {
          hasAutoSavedRef.current = true;
          onSaveToGalleryRef.current({
            id: `snap_${Date.now()}`,
            previewUrl: url,
            photos: [...filtered],
            config: { ...config },
            createdAt: Date.now(),
          });
        }

        // Create animated GIF from filtered photos with adjustments applied
        return createAnimatedGif(filtered, { interval: 0.45, gifWidth: 600, gifHeight: 450 });
      })
      .then((gif) => {
        setGifUrl(gif);
        setIsGifGenerating(false);
      })
      .catch((err) => {
        console.error('Failed to generate photostrip or GIF:', err);
        setIsRendering(false);
        setIsGifGenerating(false);
      });

    // 2. Generate QR Code with direct scan result URL and center logo
    if (typeof window !== 'undefined') {
      const scanUrl = `${window.location.origin}${window.location.pathname}?mode=scan`;
      generateQrCodeDataUrl(scanUrl, '/images/logo.png').then((qr) => {
        setQrCodeUrl(qr);
      });
    }
  }, [photos, config, isScanView, disableAutoSave]);

  // 1. Download Photostrip
  const handleDownloadPhotostrip = async () => {
    try {
      const blob = await generateDownloadBlob(photos, config, 'image/png');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapbooth-photostrip-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download photostrip error', e);
    }
  };

  // 2. Download Animated GIF
  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const link = document.createElement('a');
    link.href = gifUrl;
    link.download = `snapbooth-animated-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Download Individual Photo (with active filter & adjustments)
  const handleDownloadRawPhoto = (photoSrc: string, index: number) => {
    const link = document.createElement('a');
    link.href = photoSrc;
    link.download = `snapbooth-photo-${index + 1}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Download All Photos (with active filter & adjustments)
  const handleDownloadAllRaw = () => {
    processedPhotos.forEach((src, idx) => {
      setTimeout(() => {
        handleDownloadRawPhoto(src, idx);
      }, idx * 250);
    });
  };

  // 5. Direct Silent Print (Ultra High-Res, Exact Colors, Beautiful Layout)
  const handlePrint = async () => {
    let printDataUrl = photostripUrl;
    if (!printDataUrl && photos.length > 0) {
      try {
        const canvas = await renderPhotoStripCanvas(photos, config, 2000);
        printDataUrl = canvas.toDataURL('image/png', 1.0);
      } catch (e) {
        console.error('Print canvas render error', e);
      }
    }
    if (!printDataUrl) return;

    let iframe = document.getElementById('snapbooth-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'snapbooth-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const isTwinStrip = currentTemplate.isTwin || currentTemplate.category === 'Twin Strip';

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Snapbooth - ${currentTemplate.name}</title>
            <style>
              @page {
                size: auto;
                margin: 0mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100vw;
                height: 100vh;
                background: #ffffff !important;
                display: flex;
                align-items: center;
                justify-content: center;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .print-wrap {
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                page-break-inside: avoid;
                padding: 4px;
              }
              img.single-print {
                max-width: 98vw;
                max-height: 98vh;
                width: auto;
                height: auto;
                object-fit: contain;
                display: block;
                margin: auto;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                image-rendering: -webkit-optimize-contrast;
              }
              img.twin-print {
                max-width: 48vw;
                max-height: 98vh;
                width: auto;
                height: auto;
                object-fit: contain;
                display: block;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                image-rendering: -webkit-optimize-contrast;
              }
            </style>
          </head>
          <body>
            <div class="print-wrap">
              ${isTwinStrip ? `
                <img class="twin-print" src="${printDataUrl}" alt="Photostrip Left" />
                <img class="twin-print" src="${printDataUrl}" alt="Photostrip Right" />
              ` : `
                <img class="single-print" src="${printDataUrl}" alt="Photostrip" />
              `}
            </div>
          </body>
        </html>
      `);
      doc.close();

      const imgs = doc.querySelectorAll('img');
      let loaded = 0;
      const total = imgs.length;

      const triggerPrint = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 150);
      };

      if (total === 0) {
        triggerPrint();
      } else {
        imgs.forEach((img) => {
          if (img.complete) {
            loaded++;
            if (loaded === total) triggerPrint();
          } else {
            img.onload = () => {
              loaded++;
              if (loaded === total) triggerPrint();
            };
          }
        });
      }
    }
  };

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto',
      padding: '16px 12px 36px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
    }}>
      {/* Top Action Buttons (Atas: Foto Ulang, Bawah: Cetak | Scan QR) */}
      <div
        className="neo-card"
        style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '560px',
          margin: '0 auto',
          width: '100%',
          background: 'var(--neo-white)',
        }}
      >
        {/* Row 1 (Top): Foto Ulang / Sesi Baru + Galeri Button (Hidden when opened via QR Scan link) */}
        {!isScanView && (
          <div style={{ display: 'grid', gridTemplateColumns: onOpenGallery ? '1fr auto' : '1fr', gap: '8px', width: '100%' }}>
            <button
              onClick={onRetakeNewSession}
              className="neo-btn neo-btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              <RotateCcw size={17} />
              <span>Sesi Baru</span>
            </button>

            {onOpenGallery && (
              <button
                onClick={onOpenGallery}
                className="neo-btn neo-btn-secondary"
                style={{ padding: '12px 18px', fontSize: '0.92rem', position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Buka Galeri Sesi"
              >
                <ImageIcon size={17} />
                <span>Galeri</span>
                {galleryCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--neo-primary)',
                    color: 'var(--neo-black)',
                    border: '2px solid var(--neo-black)',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '2px 2px 0px var(--neo-black)',
                  }}>
                    {galleryCount}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Row 2 (Bottom): Cetak / Print | Scan Qr */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handlePrint}
            disabled={!photostripUrl}
            className="neo-btn neo-btn-secondary"
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
          >
            <Printer size={18} />
            <span>Cetak</span>
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="neo-btn neo-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
          >
            <QrCode size={18} />
            <span>SCAN QR</span>
          </button>
        </div>
      </div>

      {/* Main Content: Left (Photostrip) + Right (GIF & Raw Photos) - 100% Mobile Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* SECTION 1: Photostrip */}
        <div
          className="neo-card"
          style={{
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#ffffff',
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neo-black)' }}>
              Photostrip
            </h2>
          </div>

          {/* Photostrip Preview (Click to Zoom) */}
          <div
            onClick={() => photostripUrl && setZoomedImage({ src: photostripUrl, title: 'Photostrip' })}
            style={{
              width: '100%',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '12px',
              border: '2.5px solid var(--neo-black)',
              cursor: photostripUrl ? 'zoom-in' : 'default',
              position: 'relative',
              boxShadow: '4px 4px 0px var(--neo-black)',
            }}
          >
            {isRendering ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--neo-black)' }}>
                <Loader2 className="animate-spin" size={36} />
                <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>Sedang Merender Photostrip...</span>
              </div>
            ) : photostripUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photostripUrl}
                  alt="Photostrip"
                  style={{
                    maxHeight: '580px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    right: '14px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'var(--neo-black)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1.5px solid #ffffff',
                  }}
                >
                  <Maximize2 size={13} />
                  <span>Perbesar</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Download Photostrip Button (Brand Blue) */}
          <button
            onClick={handleDownloadPhotostrip}
            disabled={!photostripUrl || isRendering}
            className="neo-btn neo-btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1.05rem',
              fontWeight: 900,
            }}
          >
            <Download size={19} />
            <span>Download Photostrip</span>
          </button>
        </div>

        {/* Right Column: Animated GIF & Photos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 2: Animated GIF */}
          <div
            className="neo-card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                Animated GIF
              </h2>
            </div>

            {/* GIF Preview (Click to Zoom) */}
            <div
              onClick={() => {
                const targetSrc = gifUrl || processedPhotos[activeFrameIndex] || processedPhotos[0];
                if (targetSrc) setZoomedImage({ src: targetSrc, title: 'Animated GIF' });
              }}
              style={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#0f172a',
                aspectRatio: '4 / 3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2.5px solid var(--neo-black)',
                boxShadow: '4px 4px 0px var(--neo-black)',
                cursor: 'zoom-in',
                position: 'relative',
              }}
            >
              {gifUrl ? (
                <img
                  src={gifUrl}
                  alt="Animated GIF"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={processedPhotos[activeFrameIndex] || processedPhotos[0]}
                  alt="Frame Cycler"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'var(--neo-black)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1.5px solid #ffffff',
                }}
              >
                <Maximize2 size={13} />
                <span>Perbesar</span>
              </div>
            </div>

            {/* Download GIF Button */}
            <button
              onClick={handleDownloadGif}
              disabled={isGifGenerating && !gifUrl}
              className="neo-btn neo-btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: 900,
              }}
            >
              <Download size={18} />
              <span>Download GIF</span>
            </button>
          </div>

          {/* SECTION 3: Photos */}
          <div
            className="neo-card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                Photos ({processedPhotos.length})
              </h2>

              <button
                onClick={handleDownloadAllRaw}
                className="neo-btn neo-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Download size={13} /> Download Semua
              </button>
            </div>

            {/* Grid of Photos */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '10px',
              }}
            >
              {processedPhotos.map((photoSrc, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: '2px solid var(--neo-black)',
                    boxShadow: '3px 3px 0px var(--neo-black)',
                  }}
                >
                  {/* Thumbnail Click to Zoom */}
                  <div
                    onClick={() => setZoomedImage({ src: photoSrc, title: `Photo #${pIdx + 1}` })}
                    style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', cursor: 'zoom-in' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoSrc}
                      alt={`Photo ${pIdx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Individual Download Button */}
                  <button
                    onClick={() => handleDownloadRawPhoto(photoSrc, pIdx)}
                    style={{
                      width: '100%',
                      padding: '7px 0',
                      background: 'var(--neo-black)',
                      color: '#ffffff',
                      border: 'none',
                      borderTop: '1.5px solid var(--neo-black)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={`Download Foto ${pIdx + 1}`}
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX ZOOM MODAL (Neo-Brutalism) */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            cursor: 'zoom-out',
          }}
        >
          {/* Close button & title bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '860px',
              marginBottom: '12px',
              color: '#ffffff',
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>{zoomedImage.title}</span>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <a
                href={zoomedImage.src}
                download={`${zoomedImage.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`}
                className="neo-btn neo-btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={15} /> Unduh
              </a>
              <button
                onClick={() => setZoomedImage(null)}
                className="neo-btn-icon"
                style={{ width: '36px', height: '36px', background: '#ffffff' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Large Image Frame */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '94vw',
              maxHeight: '82vh',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '3px solid #ffffff',
              boxShadow: '8px 8px 0px #000000',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage.src}
              alt={zoomedImage.title}
              style={{
                maxWidth: '94vw',
                maxHeight: '82vh',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}

      {/* QR CODE MODAL (Clean, Mobile Responsive Blue Neo-Brutalism with Framer Motion) */}
      <AnimatePresence>
        {isQrModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQrModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="neo-card"
              style={{
                width: '100%',
                maxWidth: '380px',
                background: '#ffffff',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                boxShadow: '8px 8px 0px var(--neo-black)',
              }}
            >
              {/* Header Title Centered (Tanpa Tombol X) */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--neo-black)', textAlign: 'center' }}>
                  Scan QR Code
                </h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Buka kamera HP kamu untuk memindai dan mengunduh Photostrip, GIF, serta Raw Photos langsung ke galeri smartphone!
              </p>

              {/* QR Code Container */}
              {qrCodeUrl && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '3px solid var(--neo-black)',
                    boxShadow: '5px 5px 0px var(--neo-black)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Scan to Phone"
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>
              )}

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="neo-btn neo-btn-primary"
                style={{ width: '100%', padding: '11px', fontSize: '0.92rem' }}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
