'use client';

import React, { useState, useEffect } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
} from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import {
  render2RPrintCanvas,
  generate2RDownloadBlob,
  Print2ROptions,
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
  Grid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Print2RModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  config: PhotoBoothConfig;
}

export const Print2RModal: React.FC<Print2RModalProps> = ({
  isOpen,
  onClose,
  photos,
  config,
}) => {
  const currentTemplate: PhotoboothTemplate = getTemplateById(config.selectedTemplateId);

  // Default to full-bleed so the template fills the 2R sheet edge-to-edge
  const [layoutMode, setLayoutMode] = useState<'full-bleed' | 'wallet-single' | 'twin-2in1' | 'grid-4in1'>('full-bleed');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [preview2RUrl, setPreview2RUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Render 2R Preview whenever options change
  useEffect(() => {
    if (!isOpen || photos.length === 0) return;

    let isMounted = true;
    setIsRendering(true);

    const printOptions: Print2ROptions = {
      layoutMode,
      bgColor,
      showCutGuides: layoutMode !== 'full-bleed' ? showCutGuides : false,
      orientation: 'portrait',
    };

    render2RPrintCanvas(photos, config, printOptions)
      .then((canvas) => {
        if (isMounted) {
          setPreview2RUrl(canvas.toDataURL('image/jpeg', 0.95));
          setIsRendering(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render 2R preview:', err);
        if (isMounted) setIsRendering(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, photos, config, layoutMode, bgColor, showCutGuides]);

  if (!isOpen) return null;

  // Print 2R directly formatted for 2.5x3.5 inch (or 4x6 inch if 2-in-1 / 4-in-1)
  const handlePrint2R = () => {
    if (!preview2RUrl) return;

    const is4RPaper = layoutMode === 'twin-2in1' || layoutMode === 'grid-4in1';
    const paperWidth = is4RPaper ? '4in' : '2.5in';
    const paperHeight = is4RPaper ? '6in' : '3.5in';

    try {
      let iframe = document.getElementById('snapbooth-2r-print-frame') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'snapbooth-2r-print-frame';
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
              <title>Cetak Foto 2R (${is4RPaper ? '4x6 Inch Paper' : '2.5x3.5 Inch Wallet'})</title>
              <style>
                @page {
                  size: ${paperWidth} ${paperHeight};
                  margin: 0mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: ${paperWidth};
                  height: ${paperHeight};
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
                  width: ${paperWidth};
                  height: ${paperHeight};
                  max-width: ${paperWidth};
                  max-height: ${paperHeight};
                  object-fit: cover;
                  display: block;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              <img id="print-2r-target" src="${preview2RUrl}" />
            </body>
          </html>
        `);
        doc.close();

        const img = doc.getElementById('print-2r-target') as HTMLImageElement | null;
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

  // Download 2R file (300 DPI high resolution)
  const handleDownload2R = async (format: 'image/png' | 'image/jpeg') => {
    setIsDownloading(true);
    try {
      const printOptions: Print2ROptions = {
        layoutMode,
        bgColor,
        showCutGuides: layoutMode !== 'full-bleed' ? showCutGuides : false,
        orientation: 'portrait',
      };
      const blob = await generate2RDownloadBlob(photos, config, printOptions, format);
      const ext = format === 'image/png' ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pearly-Photobooth-2R-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download 2R:', err);
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
                  color: '#ffd79a',
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
                  Cetak Ukuran 2R (Wallet Size)
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#543720', fontWeight: 500 }}>
                  Format Standar 2.5 × 3.5 Inch (63.5 × 88.9 mm) / Dompet
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
            {/* Left: Interactive 2R Paper Preview with Zoom Click */}
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
              {/* 2R Paper Canvas Frame */}
              <div
                onClick={() => preview2RUrl && setIsZoomed(true)}
                title="Klik untuk memperbesar preview 2R"
                style={{
                  width: '230px',
                  aspectRatio: (layoutMode === 'twin-2in1' || layoutMode === 'grid-4in1') ? '2 / 3' : '2.5 / 3.5',
                  background: bgColor,
                  borderRadius: '4px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #3d2616',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: preview2RUrl ? 'zoom-in' : 'default',
                  transition: 'transform 0.15s ease',
                }}
              >
                {isRendering ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#3d2616' }}>
                    <Loader2 size={28} className="animate-spin text-amber-900" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Menyiapkan 2R...</span>
                  </div>
                ) : preview2RUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview2RUrl}
                      alt="2R Print Sheet Preview"
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

              {/* 2R Dimension & Zoom Hint Label */}
              <div
                onClick={() => preview2RUrl && setIsZoomed(true)}
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
                  cursor: preview2RUrl ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <ZoomIn size={13} color="#ffd79a" />
                <span>Klik untuk Perbesar ({layoutMode === 'twin-2in1' || layoutMode === 'grid-4in1' ? '1200 × 1800 px (4R Sheet)' : '750 × 1050 px (2R)'})</span>
              </div>
            </div>

            {/* Right: Controls & Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  <span>Pilihan Tata Letak Cetak 2R</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {/* Mode 1: Full Bleed 2R */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('full-bleed')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
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
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: layoutMode === 'full-bleed' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'full-bleed' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Maximize2 size={15} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1a0f07' }}>
                          Penuh 1 Lembar 2R (Full Bleed)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: '#543720', fontWeight: 500 }}>
                          Foto mengisi penuh ukuran kartu dompet 2.5 × 3.5 inch
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'full-bleed' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>

                  {/* Mode 2: Wallet Single Centered */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('wallet-single')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: layoutMode === 'wallet-single' ? '2.5px solid #3d2616' : '1.5px solid rgba(61, 38, 22, 0.35)',
                      background: layoutMode === 'wallet-single' ? '#ebd7bc' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: layoutMode === 'wallet-single' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'wallet-single' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileImage size={15} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1a0f07' }}>
                          1 Foto 2R di Tengah (Border Margin)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: '#543720', fontWeight: 500 }}>
                          Pas di tengah lembar 2R dengan bingkai margin rapi
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'wallet-single' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>

                  {/* Mode 3: Twin 2-in-1 on 4R Paper */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('twin-2in1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
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
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: layoutMode === 'twin-2in1' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'twin-2in1' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Scissors size={15} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1a0f07' }}>
                          Twin 2-in-1 (2 Foto 2R di Kertas 4R)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: '#543720', fontWeight: 500 }}>
                          2 lembar 2R pada 1 kertas 4R untuk dipotong tengah
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'twin-2in1' && <Check size={18} color="#3d2616" strokeWidth={3} />}
                  </button>

                  {/* Mode 4: 4-in-1 Grid on 4R Paper */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('grid-4in1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: layoutMode === 'grid-4in1' ? '2.5px solid #3d2616' : '1.5px solid rgba(61, 38, 22, 0.35)',
                      background: layoutMode === 'grid-4in1' ? '#ebd7bc' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: layoutMode === 'grid-4in1' ? '#3d2616' : 'rgba(61, 38, 22, 0.12)',
                          color: layoutMode === 'grid-4in1' ? '#fdf7ee' : '#3d2616',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Grid size={15} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1a0f07' }}>
                          Grid 4-in-1 (4 Mini Foto di Kertas 4R)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: '#543720', fontWeight: 500 }}>
                          4 mini foto wallet dalam 1 lembar kertas 4R (2×2 grid)
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'grid-4in1' && <Check size={18} color="#3d2616" strokeWidth={3} />}
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
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #3d2616',
                  }}
                >
                  {/* Background Color */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#3d2616', marginBottom: '6px' }}>
                      Warna Kertas
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
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
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: isActive ? '2.5px solid #3d2616' : `1.5px solid ${theme.border}`,
                              background: theme.bg,
                              fontSize: '0.78rem',
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
                {/* Primary Button: Direct 2R Print */}
                <button
                  type="button"
                  onClick={handlePrint2R}
                  disabled={isRendering || !preview2RUrl}
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
                    cursor: preview2RUrl ? 'pointer' : 'not-allowed',
                    opacity: preview2RUrl ? 1 : 0.6,
                    boxShadow: '0 6px 18px rgba(32, 17, 7, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Printer size={19} />
                  <span>Cetak Ukuran 2R</span>
                </button>

                {/* Secondary: Download Ready-to-Print 2R Image */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownload2R('image/png')}
                    disabled={isDownloading || !preview2RUrl}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1.5px solid #3d2616',
                      color: '#1a0f07',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview2RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={14} />
                    <span>Unduh 2R (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload2R('image/jpeg')}
                    disabled={isDownloading || !preview2RUrl}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1.5px solid #3d2616',
                      color: '#1a0f07',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview2RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={14} />
                    <span>Unduh 2R (JPG)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            LIGHTBOX MODAL: FULL RESOLUTION ZOOMED 2R PREVIEW
            ========================================================================= */}
        {isZoomed && preview2RUrl && (
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
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Preview Cetak 2R HD ({layoutMode === 'twin-2in1' || layoutMode === 'grid-4in1' ? '1200 × 1800 px' : '750 × 1050 px'})</span>
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
                src={preview2RUrl}
                alt="2R Enlarged High Resolution Preview"
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
