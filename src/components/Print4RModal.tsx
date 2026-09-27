'use client';

import React, { useState, useEffect } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
} from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import {
  render4RPrintCanvas,
  generate4RDownloadBlob,
  Print4ROptions,
} from '@/lib/canvasRenderer';
import {
  X,
  Printer,
  Download,
  Scissors,
  Layers,
  Loader2,
  Check,
  Maximize2,
  FileImage,
  ZoomIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Print4RModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  config: PhotoBoothConfig;
}

export const Print4RModal: React.FC<Print4RModalProps> = ({
  isOpen,
  onClose,
  photos,
  config,
}) => {
  const currentTemplate: PhotoboothTemplate = getTemplateById(config.selectedTemplateId);

  // Default to full-bleed so the template fills the 4R sheet edge-to-edge with no blank white background
  const [layoutMode, setLayoutMode] = useState<'fit-center' | 'twin-2in1' | 'full-bleed'>('full-bleed');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(false);
  const [preview4RUrl, setPreview4RUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Render 4R Preview whenever options change
  useEffect(() => {
    if (!isOpen || photos.length === 0) return;

    let isMounted = true;
    setIsRendering(true);

    const printOptions: Print4ROptions = {
      layoutMode,
      bgColor,
      showCutGuides: layoutMode === 'twin-2in1' ? showCutGuides : false,
      orientation: 'portrait',
    };

    render4RPrintCanvas(photos, config, printOptions)
      .then((canvas) => {
        if (isMounted) {
          setPreview4RUrl(canvas.toDataURL('image/jpeg', 0.95));
          setIsRendering(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render 4R preview:', err);
        if (isMounted) setIsRendering(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, photos, config, layoutMode, bgColor, showCutGuides]);

  if (!isOpen) return null;

  // Print 4R directly formatted for 4x6 inch paper
  const handlePrint4R = () => {
    if (!preview4RUrl) return;

    try {
      let iframe = document.getElementById('snapbooth-4r-print-frame') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'snapbooth-4r-print-frame';
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
              <title>Cetak Foto 4R (4x6 Inch)</title>
              <style>
                @page {
                  size: 4in 6in;
                  margin: 0mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 4in;
                  height: 6in;
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  background: ${bgColor};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                img {
                  width: 4in;
                  height: 6in;
                  max-width: 4in;
                  max-height: 6in;
                  object-fit: cover;
                  display: block;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              <img id="print-4r-target" src="${preview4RUrl}" />
            </body>
          </html>
        `);
        doc.close();

        const img = doc.getElementById('print-4r-target') as HTMLImageElement | null;
        const triggerPrint = () => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            window.print();
          }
        };

        if (img) {
          if (img.complete) {
            setTimeout(triggerPrint, 80);
          } else {
            img.onload = () => setTimeout(triggerPrint, 80);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Iframe print error', e);
    }

    // Fallback direct window print
    window.print();
  };

  // Download 4R file (300 DPI high resolution)
  const handleDownload4R = async (format: 'image/png' | 'image/jpeg') => {
    setIsDownloading(true);
    try {
      const printOptions: Print4ROptions = {
        layoutMode,
        bgColor,
        showCutGuides: layoutMode === 'twin-2in1' ? showCutGuides : false,
        orientation: 'portrait',
      };
      const blob = await generate4RDownloadBlob(photos, config, printOptions, format);
      const ext = format === 'image/png' ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pearly-Photobooth-4R-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download 4R:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(26, 15, 7, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="vintage-parchment-bg"
          style={{
            maxWidth: '840px',
            width: '100%',
            borderRadius: '16px',
            border: '3px solid #3d2616',
            boxShadow: '0 25px 60px -15px rgba(26, 15, 7, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '94vh',
            overflow: 'hidden',
            color: '#1a0f07',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Clean readable font) */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '2px solid #3d2616',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(235, 218, 195, 0.9)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: '#3d2616',
                  color: '#fdf7ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(45, 25, 12, 0.25)',
                }}
              >
                <Printer size={20} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#1a0f07',
                    margin: 0,
                    letterSpacing: '-0.2px',
                  }}
                >
                  Cetak Ukuran 4R
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#543720', fontWeight: 500 }}>
                  Format Standar 4 × 6 Inch (102 × 152 mm)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#3d2616',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fdf7ee',
                transition: 'all 0.15s ease',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '22px',
              padding: '22px',
              overflowY: 'auto',
            }}
          >
            {/* Left: Interactive 4R Paper Preview with Zoom Click */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(235, 218, 195, 0.65)',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #3d2616',
                position: 'relative',
              }}
            >
              {/* 4R Paper Canvas Frame (Ratio 2:3) */}
              <div
                onClick={() => preview4RUrl && setIsZoomed(true)}
                title="Klik untuk memperbesar preview 4R"
                style={{
                  width: '240px',
                  aspectRatio: '2 / 3',
                  background: bgColor,
                  borderRadius: '4px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #3d2616',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: preview4RUrl ? 'zoom-in' : 'default',
                  transition: 'transform 0.15s ease',
                }}
              >
                {isRendering ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#3d2616' }}>
                    <Loader2 size={28} className="animate-spin text-amber-900" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Menyiapkan 4R...</span>
                  </div>
                ) : preview4RUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview4RUrl}
                      alt="4R Print Sheet Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {/* Floating Zoom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomed(true);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(26, 15, 7, 0.8)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                      title="Perbesar Preview"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </>
                ) : null}
              </div>

              {/* 4R Dimension & Zoom Hint Label */}
              <div
                onClick={() => preview4RUrl && setIsZoomed(true)}
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#3d2616',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  border: '1px solid #543720',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#fdf7ee',
                  cursor: preview4RUrl ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <ZoomIn size={13} color="#ffd79a" />
                <span>Klik untuk Perbesar (1200 × 1800 px)</span>
              </div>
            </div>

            {/* Right: Controls & Options (Clean, readable text) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Option 1: Layout Mode */}
              <div>
                <label
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#1a0f07',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <Layers size={16} color="#543720" />
                  <span>Pilihan Tata Letak Cetak</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Mode 1: Full Bleed (Default & Recommended) */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('full-bleed')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: layoutMode === 'full-bleed' ? '2.5px solid #3d2616' : '1.5px solid rgba(61, 38, 22, 0.35)',
                      background: layoutMode === 'full-bleed' ? '#ebd7bc' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: layoutMode === 'full-bleed' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'full-bleed' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Maximize2 size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1a0f07' }}>
                          Penuh 1 Lembar 4R
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#543720', fontWeight: 500 }}>
                          Hasil foto mengisi penuh seluruh kertas 4R tanpa border putih
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'full-bleed' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>

                  {/* Mode 2: Fit Center */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('fit-center')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: layoutMode === 'fit-center' ? '2.5px solid #3d2616' : '1.5px solid rgba(61, 38, 22, 0.35)',
                      background: layoutMode === 'fit-center' ? '#ebd7bc' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: layoutMode === 'fit-center' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'fit-center' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileImage size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1a0f07' }}>
                          1 Desain di Tengah
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#543720', fontWeight: 500 }}>
                          Pas di tengah kertas 4R dengan bingkai margin rapi
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'fit-center' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>

                  {/* Mode 3: Twin 2-in-1 */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('twin-2in1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: layoutMode === 'twin-2in1' ? '2.5px solid #3d2616' : '1.5px solid rgba(61, 38, 22, 0.35)',
                      background: layoutMode === 'twin-2in1' ? '#ebd7bc' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: layoutMode === 'twin-2in1' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'twin-2in1' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Scissors size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1a0f07' }}>
                          Twin 2-in-1 (Gunting Tengah)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#543720', fontWeight: 500 }}>
                          2 strip sejajar untuk dipotong tengah (Ukuran strip 2×6 inch)
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'twin-2in1' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>
                </div>
              </div>

              {/* Option 2: Background Color & Cut Guides (Only shown when not full-bleed) */}
              {layoutMode !== 'full-bleed' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    background: 'rgba(235, 218, 195, 0.6)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #3d2616',
                  }}
                >
                  {/* Background Color */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#3d2616', marginBottom: '6px' }}>
                      Warna Kertas
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {[
                        { id: '#ffffff', label: 'Putih', bg: '#ffffff', text: '#0f172a', border: '#cbd5e1' },
                        { id: '#111827', label: 'Hitam', bg: '#111827', text: '#ffffff', border: '#374151' },
                      ].map((theme) => {
                        const isActive = bgColor === theme.id || (theme.id === '#111827' && (bgColor === '#000000' || bgColor === '#111827'));
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setBgColor(theme.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: isActive ? '2.5px solid #3d2616' : `1.5px solid ${theme.border}`,
                              background: theme.bg,
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              color: theme.text,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isActive ? '0 0 8px rgba(61, 38, 22, 0.3)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {theme.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cut Guide Toggle */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#3d2616', marginBottom: '6px' }}>
                      Garis Potong
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCutGuides(!showCutGuides)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: showCutGuides ? '2px solid #3d2616' : '1px solid rgba(61, 38, 22, 0.4)',
                        background: showCutGuides ? '#ebd7bc' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#1a0f07',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Scissors size={13} />
                      <span>{showCutGuides ? 'Aktif (Garis)' : 'Mati (Polos)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: Print & Download (Clean, Normal, Highly Readable) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                {/* Primary Button: Direct 4R Print */}
                <button
                  type="button"
                  onClick={handlePrint4R}
                  disabled={isRendering || !preview4RUrl}
                  style={{
                    width: '100%',
                    padding: '13px 24px',
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: '2px solid #2b180d',
                    background: 'linear-gradient(180deg, #3d2616 0%, #201107 100%)',
                    color: '#fdf7ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                    opacity: preview4RUrl ? 1 : 0.6,
                    boxShadow: '0 6px 18px rgba(32, 17, 7, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Printer size={19} />
                  <span>Cetak Ukuran 4R</span>
                </button>

                {/* Secondary: Download Ready-to-Print 4R Image */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownload4R('image/png')}
                    disabled={isDownloading || !preview4RUrl}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1.5px solid #3d2616',
                      color: '#1a0f07',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={14} />
                    <span>Unduh 4R (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload4R('image/jpeg')}
                    disabled={isDownloading || !preview4RUrl}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1.5px solid #3d2616',
                      color: '#1a0f07',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={14} />
                    <span>Unduh 4R (JPG)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            LIGHTBOX MODAL: FULL RESOLUTION ZOOMED 4R PREVIEW
            ========================================================================= */}
        {isZoomed && preview4RUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setIsZoomed(false)}
          >
            {/* Top Bar with Title & Close Button */}
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#ffffff',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Preview Cetak 4R HD (1200 × 1800 px)</span>
              </div>

              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Large Image Frame */}
            <div
              style={{
                maxWidth: '92vw',
                maxHeight: '84vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview4RUrl}
                alt="4R Enlarged High Resolution Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '84vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  display: 'block',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
