'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
  GalleryItem,
  FilterType,
  SoftFileSession,
} from '@/lib/types';
import { saveSoftFileSession } from '@/lib/storageManager';
import { getTemplateById } from '@/lib/templateManager';
import { FILTERS } from '@/lib/constants';
import {
  renderPhotoStripCanvas,
  renderFilteredPhotos,
} from '@/lib/canvasRenderer';
import { createAnimatedGif } from '@/lib/gifGenerator';
import { generateQrCodeDataUrl } from '@/lib/qrCode';
import { downloadMediaFile } from '@/lib/downloadHelper';
import { Print4RModal } from './Print4RModal';
import { Print2RModal } from './Print2RModal';
import { PrintChooserModal } from './PrintChooserModal';
import {
  Printer,
  Download,
  RotateCcw,
  Loader2,
  X,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultViewProps {
  photos: string[];
  config: PhotoBoothConfig;
  onChangeConfig?: React.Dispatch<React.SetStateAction<PhotoBoothConfig>>;
  isScanView?: boolean;
  disableAutoSave?: boolean;
  onRetakeNewSession: () => void;
  onRetakeSinglePhoto?: (slotIndex: number) => void;
  onSaveToGallery: (item: GalleryItem) => void;
  onOpenGallery?: () => void;
  galleryCount?: number;
}

export const ResultView: React.FC<ResultViewProps> = ({
  photos: initialPhotos,
  config: initialConfig,
  onChangeConfig,
  isScanView = false,
  disableAutoSave = false,
  onRetakeNewSession,
  onRetakeSinglePhoto,
  onSaveToGallery,
  onOpenGallery,
  galleryCount = 0,
}) => {
  // 4 Steps: 'grid-review' -> 'editor-filter' (Gambar 1) -> 'final-gif' (Gambar 2) -> 'scan-barcode' (Gambar 3)
  const [resultStep, setResultStep] = useState<
    'grid-review' | 'editor-filter' | 'final-gif' | 'scan-barcode'
  >(isScanView ? 'scan-barcode' : 'grid-review');

  const [currentPhotos, setCurrentPhotos] = useState<string[]>(initialPhotos);
  const [currentConfig, setCurrentConfig] = useState<PhotoBoothConfig>(initialConfig);

  const [photostripUrl, setPhotostripUrl] = useState<string | null>(null);
  const [basePhotostripUrl, setBasePhotostripUrl] = useState<string | null>(null);
  const [processedPhotos, setProcessedPhotos] = useState<string[]>(initialPhotos);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [publicScanUrl, setPublicScanUrl] = useState<string>('');
  const [isPrint4RModalOpen, setIsPrint4RModalOpen] = useState<boolean>(false);
  const [isPrint2RModalOpen, setIsPrint2RModalOpen] = useState<boolean>(false);
  const [isPrintChooserOpen, setIsPrintChooserOpen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isGifGenerating, setIsGifGenerating] = useState<boolean>(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('Perbesar Foto');

  const renderIdRef = useRef(0);
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const hasAutoSavedRef = useRef(false);
  const onSaveToGalleryRef = useRef(onSaveToGallery);
  onSaveToGalleryRef.current = onSaveToGallery;
  const sessionIdRef = useRef<string>(
    `pb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );
  const sessionCreatedAtRef = useRef<number>(Date.now());

  const scrollFilters = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({
        left: direction === 'left' ? -280 : 280,
        behavior: 'smooth',
      });
    }
  };

  const currentTemplate: PhotoboothTemplate = getTemplateById(currentConfig.selectedTemplateId);

  // Sync photos and config when props update
  useEffect(() => {
    setCurrentPhotos(initialPhotos);
  }, [initialPhotos]);

  useEffect(() => {
    setCurrentConfig(initialConfig);
  }, [initialConfig]);

  // Cycling preview for GIF animation
  useEffect(() => {
    if (processedPhotos.length === 0) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % processedPhotos.length);
    }, 450);
    return () => clearInterval(interval);
  }, [processedPhotos.length]);

  // Render Photostrip Canvas and generate GIF when needed
  const renderCurrentSession = async (
    photosToRender: string[],
    cfg: PhotoBoothConfig,
    generateGif: boolean = false
  ) => {
    if (photosToRender.length === 0) return;
    const thisRenderId = ++renderIdRef.current;
    setIsRendering(true);

    try {
      const [canvas, filtered] = await Promise.all([
        renderPhotoStripCanvas(photosToRender, cfg, 1333),
        renderFilteredPhotos(photosToRender, cfg),
      ]);

      if (thisRenderId !== renderIdRef.current) return;

      const url = canvas.toDataURL('image/png', 0.95);
      setPhotostripUrl(url);
      setProcessedPhotos(filtered);
      setIsRendering(false);

      // Render base photostrip for live filter thumbnail previews
      renderPhotoStripCanvas(photosToRender, { ...cfg, filter: 'normal' }, 600)
        .then((baseCanvas) => {
          if (thisRenderId === renderIdRef.current) {
            setBasePhotostripUrl(baseCanvas.toDataURL('image/jpeg', 0.85));
          }
        })
        .catch(() => { });

      // Save soft file session to IndexedDB & storage
      const sessionData: SoftFileSession = {
        id: sessionIdRef.current,
        templateId: cfg.selectedTemplateId,
        templateName: currentTemplate.name,
        photostripUrl: url,
        gifUrl: gifUrl,
        photos: filtered,
        config: { ...cfg },
        createdAt: sessionCreatedAtRef.current,
      };
      saveSoftFileSession(sessionData);

      // Auto save to gallery on initial load
      if (!isScanView && !disableAutoSave && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        onSaveToGalleryRef.current({
          id: sessionIdRef.current,
          previewUrl: url,
          photos: [...filtered],
          config: { ...cfg },
          createdAt: sessionCreatedAtRef.current,
        });
      }

      // Generate Animated GIF with smooth loop
      if (generateGif || resultStep === 'final-gif' || resultStep === 'scan-barcode') {
        setIsGifGenerating(true);
        createAnimatedGif(filtered, {
          interval: 0.45,
          sampleInterval: 2,
        })
          .then((gif) => {
            if (thisRenderId === renderIdRef.current) {
              setGifUrl(gif);
              setIsGifGenerating(false);

              saveSoftFileSession({
                id: sessionIdRef.current,
                templateId: cfg.selectedTemplateId,
                templateName: currentTemplate.name,
                photostripUrl: url,
                gifUrl: gif,
                photos: filtered,
                config: { ...cfg },
                createdAt: sessionCreatedAtRef.current,
              });
            }
          })
          .catch((err) => {
            console.error('Failed to create GIF:', err);
            if (thisRenderId === renderIdRef.current) {
              setIsGifGenerating(false);
            }
          });
      }
    } catch (err) {
      console.error('Failed to render session:', err);
      if (thisRenderId === renderIdRef.current) {
        setIsRendering(false);
        setIsGifGenerating(false);
      }
    }

    // Generate Barcode QR Code with Pearly Booth logo centered
    if (typeof window !== 'undefined') {
      const generateQr = async () => {
        let baseOrigin = window.location.origin;

        if (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        ) {
          try {
            const hostRes = await fetch('/api/host');
            if (hostRes.ok) {
              const hostData = await hostRes.json();
              if (hostData.localIp && hostData.localIp !== 'localhost') {
                const port = window.location.port ? `:${window.location.port}` : '';
                baseOrigin = `${window.location.protocol}//${hostData.localIp}${port}`;
              }
            }
          } catch { }
        }

        const scanUrl = `${baseOrigin}${window.location.pathname}?session=${sessionIdRef.current}`;
        setPublicScanUrl(scanUrl);
        // withLogo = false (clean barcode without logo)
        generateQrCodeDataUrl(scanUrl, false).then((qr) => {
          setQrCodeUrl(qr);
        });
      };

      generateQr();
    }
  };

  // Initial and reactive render
  useEffect(() => {
    renderCurrentSession(currentPhotos, currentConfig, true);
  }, [currentPhotos, currentConfig.selectedTemplateId]);

  // Filter change handler
  const handleSelectFilter = (filterId: FilterType) => {
    const updated = { ...currentConfig, filter: filterId };
    setCurrentConfig(updated);
    if (onChangeConfig) onChangeConfig(updated);
    renderCurrentSession(currentPhotos, updated, true);
  };

  // Print photostrip directly
  const handlePrint = () => {
    if (!photostripUrl) return;

    try {
      let iframe = document.getElementById(
        'snapbooth-hidden-print-frame'
      ) as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'snapbooth-hidden-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Photostrip</title>
              <style>
                @page { size: auto; margin: 0mm; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                  width: 100vw; height: 100vh; margin: 0; padding: 0;
                  overflow: hidden; background: #ffffff;
                  display: flex; align-items: center; justify-content: center;
                  -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                img {
                  width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh;
                  object-fit: cover; object-position: center; display: block;
                }
              </style>
            </head>
            <body>
              <img id="print-target" src="${photostripUrl}" />
            </body>
          </html>
        `);
        doc.close();

        const img = doc.getElementById('print-target') as HTMLImageElement | null;
        const triggerIframePrint = () => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            window.print();
          }
        };

        if (img) {
          if (img.complete) {
            setTimeout(triggerIframePrint, 80);
          } else {
            img.onload = () => setTimeout(triggerIframePrint, 80);
          }
          return;
        }
      }
    } catch { }

    window.print();
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewModalUrl) {
        setPreviewModalUrl(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModalUrl]);

  // Fullscreen Lightbox Zoom Modal Component
  const renderLightboxModal = () => (
    <AnimatePresence>
      {previewModalUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setPreviewModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <button
            onClick={() => setPreviewModalUrl(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1a0f07',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              zIndex: 100000,
            }}
          >
            <X size={22} />
          </button>

          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.85 }}
            transition={{ duration: 0.2 }}
            style={{
              maxWidth: '90vw',
              maxHeight: '88vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewModalUrl}
              alt={previewModalTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
                border: '3px solid rgba(255, 255, 255, 0.25)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =========================================================================
  // VIEW 1: Gambar 5 - Grid Overview & Single Pose Retake
  // =========================================================================
  if (resultStep === 'grid-review') {
    return (
      <div
        className="vintage-parchment-bg"
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px 14px 20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header: "Photo Result" */}
        <div style={{ textAlign: 'center', margin: '2px 0 6px 0', flexShrink: 0 }}>
          <h1
            className="font-gothic"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
              fontWeight: 700,
              color: '#1a0f07',
              letterSpacing: '1px',
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            }}
          >
            Photo Result
          </h1>
        </div>

        {/* Main Photo Grid (Gambar 5: 2x2 Full Photo Grid) */}
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns:
              currentPhotos.length === 6 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: '14px',
            alignContent: 'center',
            marginBottom: '6px',
            overflow: 'hidden',
          }}
        >
          {currentPhotos.map((photo, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                if (onRetakeSinglePhoto) {
                  onRetakeSinglePhoto(idx);
                }
              }}
              style={{
                background: '#c5d1dc',
                borderRadius: '4px',
                aspectRatio: '16 / 10',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                border: '3px solid #3d2616',
                boxShadow: '0 4px 16px rgba(45, 25, 12, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '100%',
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={`Hasil Foto ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span
                  className="font-gothic"
                  style={{
                    color: '#8c2415',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                  }}
                >
                  Foto {idx + 1}
                </span>
              )}

              {/* Zoom Button in Top-Right */}
              {photo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewModalUrl(photo);
                    setPreviewModalTitle(`Hasil Foto ${idx + 1}`);
                  }}
                  title="Perbesar Foto"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(26, 15, 7, 0.8)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <Maximize2 size={14} />
                </button>
              )}

              {/* Retake Badge Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(26, 15, 7, 0.82)',
                  color: '#fdf7ee',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                <RotateCcw size={11} />
                <span>Foto Ulang #{idx + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar: Vintage "Select" Tag Button */}
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            paddingTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setResultStep('editor-filter')}
            className="btn-vintage-tag"
            style={{
              minWidth: '150px',
              fontSize: '1.65rem',
              padding: '9px 46px 9px 30px',
            }}
          >
            Select
          </button>
        </div>

        {renderLightboxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Gambar 1 - Photo Result (Preview & Filter Selection)
  // =========================================================================
  if (resultStep === 'editor-filter') {
    return (
      <div
        className="vintage-parchment-bg"
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 14px 20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header: "Photo Result" */}
        <div style={{ textAlign: 'center', margin: '2px 0 6px 0', flexShrink: 0 }}>
          <h1
            className="font-gothic"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
              fontWeight: 700,
              color: '#1a0f07',
              letterSpacing: '1px',
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            }}
          >
            Photo Result
          </h1>
        </div>

        {/* Main Content Split (Gambar 1: Left = Preview with Tab, Right = Filter Box) */}
        <div
          style={{
            width: '100%',
            maxWidth: '1240px',
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 340px) minmax(320px, 1fr)',
            gap: '20px',
            alignItems: 'center',
            marginBottom: '4px',
            overflow: 'hidden',
          }}
          className="result-split-container"
        >
          {/* ================= LEFT PANEL: PREVIEW PHOTOSTRIP (Snug fit, no empty gaps) ================= */}
          <div
            style={{
              height: '100%',
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '4px',
                border: '3px solid #3d2616',
                background: '#d5dee6',
                padding: '3px',
                maxHeight: '100%',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(45, 25, 12, 0.25)',
                boxSizing: 'border-box',
              }}
            >
              {/* White Tab "Preview" on Top Left as in Gambar 1 */}
              <div
                className="font-vintage-serif"
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-2px',
                  background: '#ffffff',
                  border: '2px solid #3d2616',
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0',
                  padding: '1px 16px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#1a0f07',
                  letterSpacing: '0.5px',
                  zIndex: 10,
                }}
              >
                Preview
              </div>

              {/* Photostrip Image (Full hasil Frame foto) */}
              <div
                onClick={() => {
                  if (photostripUrl) {
                    setPreviewModalUrl(photostripUrl);
                    setPreviewModalTitle('Preview Photostrip');
                  }
                }}
                style={{
                  maxHeight: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: photostripUrl ? 'zoom-in' : 'default',
                  position: 'relative',
                }}
              >
                {photostripUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photostripUrl}
                    alt="Full hasil Frame foto"
                    style={{
                      maxHeight: 'calc(100vh - 175px)',
                      maxWidth: 'min(360px, 30vw)',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'drop-shadow(0 2px 8px rgba(45, 25, 12, 0.25))',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px' }}>
                    <Loader2 size={32} className="animate-spin text-amber-900" />
                    <span style={{ fontSize: '0.85rem', color: '#3d2616', fontWeight: 600 }}>
                      Menyiapkan Frame...
                    </span>
                  </div>
                )}

                {/* Floating Zoom Button */}
                {photostripUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewModalUrl(photostripUrl);
                      setPreviewModalTitle('Preview Photostrip');
                    }}
                    title="Perbesar Photostrip"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(26, 15, 7, 0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <Maximize2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANEL: FILTER SELECTION (Horizontal Swipeable Row) ================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 0,
              boxSizing: 'border-box',
              overflow: 'hidden',
              padding: '4px 8px',
            }}
          >
            {/* Title "Filter" as in Canva Slide 10 */}
            <h2
              className="font-vintage-serif"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
                fontWeight: 700,
                color: '#1a0f07',
                margin: '0 0 16px 0',
                textAlign: 'center',
                letterSpacing: '1px',
                fontStyle: 'italic',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
              }}
            >
              Filter
            </h2>

            {/* Horizontal Scrollable Filter Cards Row (Swipeable without buttons) */}
            <div
              ref={filterScrollRef}
              onWheel={(e) => {
                if (filterScrollRef.current) {
                  filterScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '12px 14px 18px 14px',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                width: '100%',
                maxWidth: '740px',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              {FILTERS.map((flt) => {
                const isSelected = currentConfig.filter === flt.id;
                const sampleSinglePhoto = currentPhotos[0] || currentPhotos[1] || currentPhotos[2] || photostripUrl || currentTemplate.imageSrc;

                return (
                  <motion.div
                    key={flt.id}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelectFilter(flt.id)}
                    style={{
                      flex: '0 0 auto',
                      width: 'clamp(160px, 18vw, 200px)',
                      aspectRatio: '1 / 1.25',
                      borderRadius: '6px',
                      background: isSelected ? '#ebd7bc' : '#3d2616',
                      border: isSelected ? '3.5px solid #1a0f07' : '2px solid #3d2616',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isSelected
                        ? '0 8px 24px rgba(26, 15, 7, 0.5), 0 0 10px rgba(61, 38, 22, 0.3)'
                        : '0 4px 14px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Live Filter Preview Image (Single Photo with Cover) */}
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        background: '#1a0f07',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {sampleSinglePhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sampleSinglePhoto}
                          alt={flt.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: flt.cssFilter,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: '#1a0f07',
                            color: '#fdf7ee',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                            border: '1.5px solid #ffd79a',
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Filter Name Label Banner */}
                    <div
                      style={{
                        padding: '8px 10px',
                        background: isSelected ? '#3d2616' : '#2b180d',
                        color: isSelected ? '#ffd79a' : '#fdf7ee',
                        textAlign: 'center',
                        borderTop: '1.5px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="font-vintage-serif"
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: isSelected ? 800 : 700,
                          letterSpacing: '0.4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                        }}
                      >
                        {flt.name}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Vintage "Select" Tag Button (Always Visible!) */}
        <div
          style={{
            width: '100%',
            maxWidth: '1240px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            paddingTop: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setResultStep('final-gif');
              renderCurrentSession(currentPhotos, currentConfig, true);
            }}
            className="btn-vintage-tag"
            style={{
              minWidth: '150px',
              fontSize: '1.65rem',
              padding: '9px 46px 9px 30px',
            }}
          >
            Select
          </button>
        </div>

        {renderLightboxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: Gambar 2 - Photo Result (Preview & Animated GIF Display)
  // =========================================================================
  if (resultStep === 'final-gif') {
    return (
      <div
        className="vintage-parchment-bg"
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 14px 20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header: "Photo Result" */}
        <div style={{ textAlign: 'center', margin: '2px 0 6px 0', flexShrink: 0 }}>
          <h1
            className="font-gothic"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
              fontWeight: 700,
              color: '#1a0f07',
              letterSpacing: '1px',
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            }}
          >
            Photo Result
          </h1>
        </div>

        {/* Main Content Split (Gambar 2: Left = Preview with Tab, Right = GIF Box) */}
        <div
          style={{
            width: '100%',
            maxWidth: '1240px',
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 340px) minmax(320px, 1fr)',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '4px',
            overflow: 'hidden',
          }}
          className="result-split-container"
        >
          {/* ================= LEFT PANEL: PREVIEW PHOTOSTRIP ================= */}
          <div
            style={{
              height: '100%',
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              padding: '6px 0',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '4px',
                border: '3px solid #3d2616',
                background: '#d5dee6',
                padding: '3px',
                maxHeight: '100%',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(45, 25, 12, 0.25)',
                boxSizing: 'border-box',
              }}
            >
              {/* White Tab "Preview" */}
              <div
                className="font-vintage-serif"
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-2px',
                  background: '#ffffff',
                  border: '2px solid #3d2616',
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0',
                  padding: '1px 16px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#1a0f07',
                  letterSpacing: '0.5px',
                  zIndex: 10,
                }}
              >
                Preview
              </div>

              {/* Photostrip Image (Full hasil Frame photo) */}
              <div
                onClick={() => {
                  if (photostripUrl) {
                    setPreviewModalUrl(photostripUrl);
                    setPreviewModalTitle('Final Photostrip');
                  }
                }}
                style={{
                  maxHeight: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: photostripUrl ? 'zoom-in' : 'default',
                  position: 'relative',
                }}
              >
                {photostripUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photostripUrl}
                    alt="Full hasil Frame photo"
                    style={{
                      maxHeight: 'calc(100vh - 175px)',
                      maxWidth: 'min(360px, 30vw)',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'drop-shadow(0 2px 8px rgba(45, 25, 12, 0.25))',
                    }}
                  />
                ) : (
                  <Loader2 size={32} className="animate-spin text-amber-900" />
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANEL: GIF DISPLAY ================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px',
              height: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '6px',
                border: '3px solid #3d2616',
                padding: '3px',
                maxHeight: '100%',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(45, 25, 12, 0.35)',
                boxSizing: 'border-box',
              }}
            >
              {gifUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gifUrl}
                  alt="GIF Animation"
                  style={{
                    maxHeight: 'calc(100vh - 175px)',
                    maxWidth: 'min(520px, 45vw)',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : processedPhotos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={processedPhotos[activeFrameIndex]}
                  alt="GIF Frame Preview"
                  style={{
                    maxHeight: 'calc(100vh - 175px)',
                    maxWidth: 'min(520px, 45vw)',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '30px',
                    color: '#3d2616',
                  }}
                >
                  <Loader2 size={32} className="animate-spin text-amber-900" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                    Menyiapkan Animasi GIF...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Vintage "Select" Tag Button */}
        <div
          style={{
            width: '100%',
            maxWidth: '1240px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            paddingTop: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setResultStep('scan-barcode')}
            className="btn-vintage-tag"
            style={{
              minWidth: '150px',
              fontSize: '1.65rem',
              padding: '9px 46px 9px 30px',
            }}
          >
            Select
          </button>
        </div>

        {renderLightboxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: Gambar 3 - Scan Your Barcode & Print (Thank You!)
  // =========================================================================
  return (
    <div
      className="vintage-parchment-bg"
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px 20px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Header Row with "Sesi Baru" Button */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          margin: '4px 0 6px 0',
        }}
      >
        <div style={{ width: '130px' }} />

        <h1
          className="font-gothic"
          style={{
            fontSize: 'clamp(2.4rem, 6.5vw, 3.8rem)',
            fontWeight: 700,
            color: '#1a0f07',
            letterSpacing: '1.5px',
            lineHeight: 1.1,
            margin: 0,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
          }}
        >
          Scan you barcode !
        </h1>

        {/* Sesi Baru Button */}
        <button
          type="button"
          onClick={onRetakeNewSession}
          style={{
            background: 'rgba(235, 218, 195, 0.95)',
            border: '2px solid #3d2616',
            borderRadius: '999px',
            padding: '7px 20px',
            fontSize: '0.98rem',
            fontWeight: 800,
            color: '#1a0f07',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(45, 25, 12, 0.22)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'serif',
            transition: 'all 0.15s ease',
          }}
          title="Mulai sesi foto baru"
        >
          <RotateCcw size={15} />
          <span>Sesi Baru</span>
        </button>
      </div>

      {/* Center QR Code Container (Logo Pearly Booth di Tengah) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '4px',
            border: '3px solid #3d2616',
            boxShadow: '0 8px 30px rgba(45, 25, 12, 0.35)',
          }}
        >
          {qrCodeUrl ? (
            <a
              href={publicScanUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Soft File"
              style={{ display: 'block' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Scan Barcode Soft File"
                style={{
                  width: 'min(270px, 62vw, 38vh)',
                  height: 'min(270px, 62vw, 38vh)',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </a>
          ) : (
            <div
              style={{
                width: 'min(270px, 62vw, 38vh)',
                height: 'min(270px, 62vw, 38vh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={36} className="animate-spin text-stone-700" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: "Thank You!" (Center) & "Print" Button (Right) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        {/* Calligraphy "Thank You!" as in Gambar 3 */}
        <div
          className="font-script"
          style={{
            fontSize: 'clamp(3.2rem, 7.5vw, 4.8rem)',
            color: '#1a0f07',
            textAlign: 'center',
            lineHeight: 1,
            margin: '0 0 6px 0',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
            userSelect: 'none',
          }}
        >
          Thank You!
        </div>

        {/* Bottom Actions Row: Single Clean Print Button (Right) */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* Gothic "Print" Tag Button - Opens Print Chooser Modal */}
          <button
            type="button"
            onClick={() => setIsPrintChooserOpen(true)}
            className="btn-vintage-tag"
            style={{
              minWidth: '150px',
              fontSize: '1.65rem',
              padding: '10px 42px 10px 28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Print
          </button>
        </div>
      </div>

      {/* Print Chooser Modal (Popup Pilihan Cetak: Biasa, 4R, 2R) */}
      <PrintChooserModal
        isOpen={isPrintChooserOpen}
        onClose={() => setIsPrintChooserOpen(false)}
        onSelectPrintStandard={handlePrint}
        onSelectPrint4R={() => setIsPrint4RModalOpen(true)}
        onSelectPrint2R={() => setIsPrint2RModalOpen(true)}
      />

      {/* Print 2R Modal */}
      <Print2RModal
        isOpen={isPrint2RModalOpen}
        onClose={() => setIsPrint2RModalOpen(false)}
        photos={currentPhotos}
        config={currentConfig}
      />

      {/* Print 4R Modal */}
      <Print4RModal
        isOpen={isPrint4RModalOpen}
        onClose={() => setIsPrint4RModalOpen(false)}
        photos={currentPhotos}
        config={currentConfig}
      />
    </div>
  );
};
