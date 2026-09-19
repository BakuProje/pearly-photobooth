'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
  GalleryItem,
  FilterType,
} from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import { FILTERS } from '@/lib/constants';
import {
  renderPhotoStripCanvas,
  generateDownloadBlob,
  renderFilteredPhotos,
} from '@/lib/canvasRenderer';
import { createAnimatedGif } from '@/lib/gifGenerator';
import { generateQrCodeDataUrl } from '@/lib/qrCode';
import { Print4RModal } from './Print4RModal';
import confetti from 'canvas-confetti';
import {
  Printer,
  Download,
  QrCode,
  RotateCcw,
  Loader2,
  X,
  Sparkles,
  ArrowLeft,
  Check,
  Share2,
  Maximize2,
  ZoomIn,
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
  // Current step in results: 'grid-review' (Gambar 5) -> 'editor-filter' (Gambar 6) -> 'final-gif' (Gambar 7)
  const [resultStep, setResultStep] = useState<'grid-review' | 'editor-filter' | 'final-gif'>(
    isScanView ? 'final-gif' : 'grid-review'
  );

  const [currentPhotos, setCurrentPhotos] = useState<string[]>(initialPhotos);
  const [currentConfig, setCurrentConfig] = useState<PhotoBoothConfig>(initialConfig);
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<number | null>(null);

  const [photostripUrl, setPhotostripUrl] = useState<string | null>(null);
  const [basePhotostripUrl, setBasePhotostripUrl] = useState<string | null>(null);
  const [processedPhotos, setProcessedPhotos] = useState<string[]>(initialPhotos);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isPrint4RModalOpen, setIsPrint4RModalOpen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isGifGenerating, setIsGifGenerating] = useState<boolean>(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('Perbesar Foto');

  // Filter Drag & Swipe States
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [isFilterDragging, setIsFilterDragging] = useState<boolean>(false);
  const [filterStartX, setFilterStartX] = useState<number>(0);
  const [filterScrollLeft, setFilterScrollLeft] = useState<number>(0);
  const [filterDragMoved, setFilterDragMoved] = useState<boolean>(false);

  const handleFilterMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!filterScrollRef.current) return;
    setIsFilterDragging(true);
    setFilterDragMoved(false);
    setFilterStartX(e.pageX - filterScrollRef.current.offsetLeft);
    setFilterScrollLeft(filterScrollRef.current.scrollLeft);
  };

  const handleFilterMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFilterDragging || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - filterStartX) * 1.5;
    if (Math.abs(walk) > 5) {
      setFilterDragMoved(true);
    }
    filterScrollRef.current.scrollLeft = filterScrollLeft - walk;
  };

  const handleFilterMouseUpOrLeave = () => {
    setIsFilterDragging(false);
    setTimeout(() => setFilterDragMoved(false), 60);
  };

  const renderIdRef = useRef(0);
  const hasAutoSavedRef = useRef(false);
  const onSaveToGalleryRef = useRef(onSaveToGallery);
  onSaveToGalleryRef.current = onSaveToGallery;

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

      // Also render unfiltered base photostrip for live filter thumbnail previews
      renderPhotoStripCanvas(photosToRender, { ...cfg, filter: 'normal' }, 600)
        .then((baseCanvas) => {
          if (thisRenderId === renderIdRef.current) {
            setBasePhotostripUrl(baseCanvas.toDataURL('image/jpeg', 0.85));
          }
        })
        .catch(() => { });

      // Save scan session to localStorage
      try {
        localStorage.setItem(
          'snapbooth_scan_session',
          JSON.stringify({ photos: filtered, config: cfg })
        );
      } catch (e) { }

      // Auto save to gallery on initial load
      if (!isScanView && !disableAutoSave && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        onSaveToGalleryRef.current({
          id: `snap_${Date.now()}`,
          previewUrl: url,
          photos: [...filtered],
          config: { ...cfg },
          createdAt: Date.now(),
        });
      }

      // Generate Animated GIF with high clarity and smooth color sampling
      if (generateGif || resultStep === 'final-gif') {
        setIsGifGenerating(true);
        createAnimatedGif(filtered, {
          interval: 0.45,
          sampleInterval: 2,
        })
          .then((gif) => {
            if (thisRenderId === renderIdRef.current) {
              setGifUrl(gif);
              setIsGifGenerating(false);
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

    // Generate Barcode QR Code
    if (typeof window !== 'undefined') {
      const scanUrl = `${window.location.origin}${window.location.pathname}?mode=scan`;
      generateQrCodeDataUrl(scanUrl, '/images/logo.png').then((qr) => {
        setQrCodeUrl(qr);
      });
    }
  };

  // Initial and reactive render
  useEffect(() => {
    renderCurrentSession(currentPhotos, currentConfig, resultStep === 'final-gif');
  }, [currentPhotos, currentConfig.selectedTemplateId]);

  // Filter change handler
  const handleSelectFilter = (filterId: FilterType) => {
    const updated = { ...currentConfig, filter: filterId };
    setCurrentConfig(updated);
    if (onChangeConfig) onChangeConfig(updated);
    renderCurrentSession(currentPhotos, updated, resultStep === 'final-gif');
  };

  // Swap photo positions in slots
  const handleSlotClick = (index: number) => {
    if (selectedSlotForSwap === null) {
      setSelectedSlotForSwap(index);
    } else if (selectedSlotForSwap === index) {
      setSelectedSlotForSwap(null);
    } else {
      // Swap photos
      const updated = [...currentPhotos];
      const temp = updated[selectedSlotForSwap];
      updated[selectedSlotForSwap] = updated[index];
      updated[index] = temp;
      setCurrentPhotos(updated);
      setSelectedSlotForSwap(null);
      renderCurrentSession(updated, currentConfig, resultStep === 'final-gif');
    }
  };

  // Download photostrip PNG
  const handleDownloadPhotostrip = async () => {
    if (!photostripUrl) return;
    const link = document.createElement('a');
    link.download = `Pearly-Photobooth-${Date.now()}.png`;
    link.href = photostripUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download animated GIF
  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const link = document.createElement('a');
    link.download = `Pearly-Photobooth-${Date.now()}.gif`;
    link.href = gifUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print photostrip directly without page navigation or blank tabs
  const handlePrint = () => {
    if (!photostripUrl) return;

    try {
      let iframe = document.getElementById('snapbooth-hidden-print-frame') as HTMLIFrameElement | null;
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
                @page {
                  size: auto;
                  margin: 0mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 100vw;
                  height: 100vh;
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justifyContent: center;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                img {
                  width: 100vw;
                  height: 100vh;
                  max-width: 100vw;
                  max-height: 100vh;
                  object-fit: cover;
                  object-position: center;
                  display: block;
                  margin: 0;
                  padding: 0;
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
    } catch {
      // Fallback
    }

    // Fallback: window.print() (styled via @media print to only show #snapbooth-print-area)
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

  // Fullscreen Lightbox Zoom Modal Component (Close Button Only)
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
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* Floating Close Button in Top-Right Corner */}
          <button
            type="button"
            onClick={() => setPreviewModalUrl(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              zIndex: 100000,
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
            }}
            title="Tutup (Esc)"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          {/* Enlarged Image Preview */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              maxWidth: '94vw',
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
              alt="Enlarged Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: '12px',
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
  // VIEW 1: Gambar 5 - Grid Overview & Retake
  // =========================================================================
  if (resultStep === 'grid-review') {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#ffffff',
          padding: '12px 16px 36px 16px',
        }}
      >
        {/* Header as in Gambar 5: "photo results" & "Selesai" button */}
        <div className="results-header-container">
          <h1 className="results-header-title">
            photo results
          </h1>

          <button
            onClick={() => setResultStep('editor-filter')}
            className="btn-pill-dark"
            style={{
              padding: '10px 24px',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            Selesai
          </button>
        </div>

        {/* Main Photo Grid (Gambar 5: # hasil 1, # hasil 2, ...) */}
        <div className="results-grid-container">
          {currentPhotos.map((photo, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onRetakeSinglePhoto) {
                  onRetakeSinglePhoto(idx);
                }
              }}
              style={{
                background: '#cbd5e1',
                borderRadius: '14px',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                border: '2.5px solid #ffffff',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                  style={{
                    color: '#ef4444',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                  }}
                >
                  # hasil {idx + 1}
                </span>
              )}

              {/* Zoom Button in Top-Right Corner */}
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
                    background: 'rgba(15, 23, 42, 0.75)',
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

              {/* Retake Prompt Badge Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.75)',
                  color: '#ffffff',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                }}
              >
                <RotateCcw size={11} />
                <span>Foto Ulang</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Universal Lightbox Modal */}
        {renderLightboxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Gambar 6 - Layout Customizer & Circular Filter Picker
  // =========================================================================
  if (resultStep === 'editor-filter') {
    const activeFilterObj = FILTERS.find((f) => f.id === currentConfig.filter) || FILTERS[0];
    const activeCssFilter = activeFilterObj && activeFilterObj.id !== 'normal' ? activeFilterObj.cssFilter : undefined;

    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#ffffff',
          padding: '12px 16px 36px 16px',
        }}
      >
        {/* Header as in Gambar 6: "photo results" & "Selesai" button */}
        <div className="results-header-container">
          <h1 className="results-header-title">
            photo results
          </h1>

          <button
            onClick={() => {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.4 },
              });
              setResultStep('final-gif');
              renderCurrentSession(currentPhotos, currentConfig, true);
            }}
            className="btn-pill-dark"
            style={{
              padding: '10px 24px',
              fontSize: '0.95rem',
              flexShrink: 0,
            }}
          >
            Selesai
          </button>
        </div>

        {/* Main Content Area (Gambar 6: Left = Frame/layout photostrip, Right = Photos & Circular Filters) */}
        <div className="results-card-container">
          {/* Left Column / Mobile Top: Frame / layout Photostrip Preview (Clickable to Enlarge) */}
          <div
            className="photo-prototype-box"
            onClick={() => {
              if (photostripUrl) {
                setPreviewModalUrl(photostripUrl);
                setPreviewModalTitle('Preview Photostrip');
              }
            }}
            title="Klik untuk memperbesar Photostrip"
            style={{
              cursor: photostripUrl ? 'zoom-in' : 'default',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              position: 'relative',
            }}
          >
            {photostripUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photostripUrl}
                  alt="Frame Layout Preview"
                  style={{
                    width: '100%',
                    maxHeight: '460px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    transition: 'opacity 0.2s ease',
                  }}
                />

                {isRendering && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 10,
                    }}
                  >
                    <Loader2 size={12} className="animate-spin text-sky-400" />
                    <span>Filter Aktif...</span>
                  </div>
                )}

                {/* Floating Zoom Button */}
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
                    top: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Maximize2 size={16} />
                </button>

                {/* Bottom Zoom Cue */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ZoomIn size={12} />
                  <span>Klik untuk perbesar</span>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#1e293b',
                  fontWeight: 700,
                }}
              >
                <Loader2 size={32} className="animate-spin" />
                <span>Memproses Photostrip...</span>
              </div>
            )}
          </div>

          {/* Right Column / Mobile Lower: Top = Photo Slots Reorder, Bottom = Circular Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
            {/* Top: Photo Cards (Foto, Foto, ...) */}
            <div>
              <p
                style={{
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Tata Letak Foto (Klik 2 foto untuk tukar posisi):
              </p>
              <div className="swap-photos-grid">
                {currentPhotos.map((photo, idx) => {
                  const isSelected = selectedSlotForSwap === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSlotClick(idx)}
                      style={{
                        background: '#cbd5e1',
                        borderRadius: '14px',
                        aspectRatio: '4 / 3',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '4px solid #38bdf8' : '2.5px solid #ffffff',
                        boxShadow: isSelected
                          ? '0 0 16px rgba(56, 189, 248, 0.6)'
                          : '0 3px 10px rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: activeCssFilter,
                            transition: 'filter 0.2s ease',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: '#ef4444',
                            fontSize: '1.3rem',
                            fontWeight: 900,
                          }}
                        >
                          Foto {idx + 1}
                        </span>
                      )}

                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: isSelected ? '#38bdf8' : 'rgba(0, 0, 0, 0.6)',
                          color: isSelected ? '#000000' : '#ffffff',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Circular Filters with Smooth Swipe & Drag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 2px',
                }}
              >
                <p
                  style={{
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Pilih Filter Estetik ({FILTERS.length} Pilihan):
                </p>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  {FILTERS.find((f) => f.id === currentConfig.filter)?.name || 'Natural'}
                </span>
              </div>

              {/* Swipeable & Draggable Filter Bar */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.18)',
                  padding: '4px 2px',
                }}
              >
                {/* Horizontal Scroll Track */}
                <div
                  ref={filterScrollRef}
                  onMouseDown={handleFilterMouseDown}
                  onMouseMove={handleFilterMouseMove}
                  onMouseUp={handleFilterMouseUpOrLeave}
                  onMouseLeave={handleFilterMouseUpOrLeave}
                  onWheel={(e) => {
                    if (filterScrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                      filterScrollRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '8px 10px 10px 10px',
                    scrollbarWidth: 'none',
                    cursor: isFilterDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    touchAction: 'pan-x',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {FILTERS.map((flt) => {
                    const isActive = currentConfig.filter === flt.id;
                    const samplePhoto = currentPhotos[0] || basePhotostripUrl || currentTemplate.imageSrc;
                    return (
                      <motion.button
                        key={flt.id}
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (!filterDragMoved) {
                            handleSelectFilter(flt.id);
                          }
                        }}
                        title={flt.desc}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: isFilterDragging ? 'grabbing' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#cbd5e1',
                            border: isActive ? '3.5px solid #38bdf8' : '2.5px solid #ffffff',
                            boxShadow: isActive
                              ? '0 0 16px rgba(56, 189, 248, 0.85)'
                              : '0 3px 8px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'border 0.2s ease, box-shadow 0.2s ease',
                          }}
                        >
                          {samplePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={samplePhoto}
                              alt={flt.name}
                              draggable={false}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: flt.cssFilter,
                                pointerEvents: 'none',
                              }}
                            />
                          ) : (
                            <span>Filter</span>
                          )}

                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(56, 189, 248, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={20} color="#ffffff" strokeWidth={3.5} />
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            color: isActive ? '#38bdf8' : '#ffffff',
                            fontSize: '0.74rem',
                            fontWeight: isActive ? 800 : 600,
                            maxWidth: '72px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {flt.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Universal Lightbox Modal */}
        {renderLightboxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: Gambar 7 - Final Photostrip & Animated GIF Preview
  // =========================================================================
  const activeFilterObj = FILTERS.find((f) => f.id === currentConfig.filter) || FILTERS[0];
  const activeCssFilter = activeFilterObj && activeFilterObj.id !== 'normal' ? activeFilterObj.cssFilter : undefined;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 16px 36px 16px',
      }}
    >
      {/* Header as in Gambar 7: "photo results" & "Sesi Baru" */}
      <div className="results-header-container">
        <h1 className="results-header-title">
          photo results
        </h1>

        <button
          onClick={onRetakeNewSession}
          style={{
            background: '#f1f5f9',
            border: '1.5px solid #cbd5e1',
            borderRadius: '999px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#1e293b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <RotateCcw size={14} />
          <span>Sesi Baru</span>
        </button>
      </div>

      {/* Main Content Area (Gambar 7: Left = Photostrip, Right Top = GIF, Right Bottom = barcode button) */}
      <div className="final-result-card-container">
        {/* Left Column / Mobile Top: Final Photostrip Canvas ("Foto") */}
        <div
          className="photo-prototype-box"
          onClick={() => {
            if (photostripUrl) {
              setPreviewModalUrl(photostripUrl);
              setPreviewModalTitle('Final Photostrip');
            }
          }}
          style={{
            cursor: photostripUrl ? 'pointer' : 'default',
          }}
        >
          {photostripUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photostripUrl}
                alt="Final Photostrip"
                style={{
                  width: '100%',
                  maxHeight: '460px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewModalUrl(photostripUrl);
                  setPreviewModalTitle('Final Photostrip');
                }}
                title="Perbesar Photostrip"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <Maximize2 size={15} />
              </button>
            </>
          ) : (
            <span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900 }}>
              Foto
            </span>
          )}
        </div>

        {/* Right Column / Mobile Middle & Bottom: Top = GIF (Foto/Video), Bottom = barcode button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
          }}
        >
          {/* Animated GIF Container */}
          <div
            className="gif-preview-box"
            onClick={() => {
              if (gifUrl) {
                setPreviewModalUrl(gifUrl);
                setPreviewModalTitle('Animated Moment GIF');
              }
            }}
            style={{
              cursor: gifUrl ? 'pointer' : 'default',
            }}
          >
            {isGifGenerating ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '12px',
                }}
              >
                {currentPhotos.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPhotos[activeFrameIndex]}
                    alt="Membuat Animasi GIF..."
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: `${activeCssFilter ? activeCssFilter + ' ' : ''}blur(2px) brightness(0.7)`,
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#ffffff',
                    fontWeight: 700,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <Loader2 size={32} className="animate-spin text-sky-400" />
                  <span style={{ fontSize: '0.88rem' }}>Membuat Animasi GIF...</span>
                </div>
              </div>
            ) : gifUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gifUrl}
                  alt="Animated Moment GIF"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewModalUrl(gifUrl);
                    setPreviewModalTitle('Animated Moment GIF');
                  }}
                  title="Perbesar GIF"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <Maximize2 size={15} />
                </button>
              </>
            ) : currentPhotos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPhotos[activeFrameIndex]}
                alt="GIF Animation Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  filter: activeCssFilter,
                }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900 }}>
                  gif
                </p>
                <p style={{ color: '#2563eb', fontSize: '1.1rem', fontWeight: 800 }}>
                  (Foto / Video)
                </p>
              </div>
            )}
          </div>

          {/* Barcode & 4R Print Buttons Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsQrModalOpen(true)}
                className="btn-pill-dark"
                style={{
                  padding: '13px 36px',
                  fontSize: '1.15rem',
                  letterSpacing: '1px',
                  background: '#474747',
                }}
              >
                barcode
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPrint4RModalOpen(true)}
                className="btn-pill-dark"
                style={{
                  padding: '13px 26px',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Printer size={18} />
                <span>Cetak 4R</span>
              </motion.button>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
              Scan barcode untuk unduh ke HP atau cetak ukuran kertas foto 4R
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 4: Gambar 8 - Barcode / QR Popup Screen
          ========================================================================= */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsQrModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                maxWidth: '460px',
                width: '100%',
                background: '#ffffff',
                borderRadius: '24px',
                padding: '28px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsQrModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <X size={18} />
              </button>

              {/* Title as in Gambar 4: "Thank You" */}
              <h2
                className="font-script"
                style={{
                  fontSize: 'clamp(2.7rem, 6.5vw, 3.6rem)',
                  color: '#1e293b',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Thank You
              </h2>

              {/* QR Code Container as in Gambar 8 */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Barcode"
                    style={{
                      width: '210px',
                      height: '210px',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '210px',
                      height: '210px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Loader2 size={32} className="animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              {/* Subtitle as in Gambar 4 */}
              <p
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#334155',
                  lineHeight: 1.4,
                  maxWidth: '360px',
                }}
              >
                Jangan sampai hilang! Yuk, foto atau scan barcode ini buat download soft file foto seru kalian!📸
              </p>

              {/* Action Buttons inside QR Barcode Modal */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '4px',
                }}
              >
                {/* Row 1: Cetak 4R (Special) & Print Biasa */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsQrModalOpen(false);
                      setIsPrint4RModalOpen(true);
                    }}
                    className="btn-pill-dark"
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      fontSize: '0.90rem',
                      background: '#0284c7',
                      borderRadius: '999px',
                      gap: '6px',
                    }}
                  >
                    <Printer size={16} />
                    <span>Cetak 4R</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-pill-dark"
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      fontSize: '0.90rem',
                      background: '#1e293b',
                      borderRadius: '999px',
                      gap: '6px',
                    }}
                  >
                    <Printer size={16} />
                    <span>Print Biasa</span>
                  </button>
                </div>

                {/* Row 2: Download Photostrip & Download Gif */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDownloadPhotostrip}
                    className="btn-pill-dark"
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      fontSize: '0.90rem',
                      background: '#0f172a',
                      borderRadius: '999px',
                      gap: '6px',
                    }}
                  >
                    <Download size={16} />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGif}
                    disabled={!gifUrl}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      fontSize: '0.90rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      border: '1.5px solid #cbd5e1',
                      cursor: gifUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: gifUrl ? 1 : 0.5,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Download Gif</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Fullscreen Lightbox Zoom Modal */}
      {renderLightboxModal()}

      {/* 4R Print & Export Modal (4x6 Inch / 10x15 cm @ 300 DPI) */}
      <Print4RModal
        isOpen={isPrint4RModalOpen}
        onClose={() => setIsPrint4RModalOpen(false)}
        photos={currentPhotos}
        config={currentConfig}
      />

      {/* Dedicated Photostrip Print Area for Clean In-Page Printing */}
      {photostripUrl && (
        <div id="snapbooth-print-area" style={{ display: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photostripUrl} alt="Pearly Photostrip Print" />
        </div>
      )}
    </div>
  );
};
