'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Loader2,
  Check,
  Maximize2,
  FileImage,
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

  // Accurate detection: twin-2in1 only for true twin strip templates (6 slots dual strip)
  const isTwinStrip = (currentTemplate.category === 'Twin Strip' && currentTemplate.slots.length >= 6) || currentTemplate.isTwin === true;

  const [layoutMode, setLayoutMode] = useState<'fit-center' | 'twin-2in1' | 'full-bleed'>(
    isTwinStrip ? 'twin-2in1' : 'fit-center'
  );
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [preview4RUrl, setPreview4RUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Render 4R Preview whenever options change
  useEffect(() => {
    if (!isOpen || photos.length === 0) return;

    let isMounted = true;
    setIsRendering(true);

    const printOptions: Print4ROptions = {
      layoutMode,
      bgColor,
      showCutGuides,
      orientation: 'portrait',
    };

    render4RPrintCanvas(photos, config, printOptions)
      .then((canvas) => {
        if (isMounted) {
          setPreview4RUrl(canvas.toDataURL('image/jpeg', 0.92));
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
        showCutGuides,
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
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            maxWidth: '820px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '94vh',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1.5px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                }}
              >
                <Printer size={22} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  Cetak Ukuran 4R
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            {/* Left: Interactive 4R Paper Preview */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '20px',
                border: '1.5px solid #e2e8f0',
                position: 'relative',
              }}
            >
              {/* 4R Paper Canvas Frame (Ratio 2:3) */}
              <div
                style={{
                  width: '240px',
                  aspectRatio: '2 / 3',
                  background: bgColor,
                  borderRadius: '6px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isRendering ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                    <Loader2 size={28} className="animate-spin text-sky-500" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Menyiapkan 4R...</span>
                  </div>
                ) : preview4RUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                ) : null}
              </div>

              {/* 4R Dimension Label */}
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#475569',
                }}
              >
                <FileImage size={13} color="#0284c7" />
                <span>4R (102 × 152 mm / 1200 × 1800 px)</span>
              </div>
            </div>

            {/* Right: Controls & Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Option 1: Layout Mode */}
              <div>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <Layers size={14} color="#0284c7" />
                  <span>Tata Letak Cetak 4R</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Mode 1: Twin 2-in-1 */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('twin-2in1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: layoutMode === 'twin-2in1' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                      background: layoutMode === 'twin-2in1' ? '#f0f9ff' : '#ffffff',
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
                          borderRadius: '8px',
                          background: layoutMode === 'twin-2in1' ? '#0284c7' : '#f1f5f9',
                          color: layoutMode === 'twin-2in1' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Scissors size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          Twin 2-in-1 (Gunting Tengah)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          2 strip sejajar di 1 lembar 4R (Hemat kertas foto!)
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'twin-2in1' && <Check size={18} color="#0284c7" strokeWidth={3} />}
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
                      borderRadius: '12px',
                      border: layoutMode === 'fit-center' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                      background: layoutMode === 'fit-center' ? '#f0f9ff' : '#ffffff',
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
                          borderRadius: '8px',
                          background: layoutMode === 'fit-center' ? '#0284c7' : '#f1f5f9',
                          color: layoutMode === 'fit-center' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileImage size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          1 Desain di Tengah (Fit Studio)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Pas di tengah kertas 4R dengan margin studio rapi
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'fit-center' && <Check size={18} color="#0284c7" strokeWidth={3} />}
                  </button>

                  {/* Mode 3: Full Bleed */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('full-bleed')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: layoutMode === 'full-bleed' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                      background: layoutMode === 'full-bleed' ? '#f0f9ff' : '#ffffff',
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
                          borderRadius: '8px',
                          background: layoutMode === 'full-bleed' ? '#0284c7' : '#f1f5f9',
                          color: layoutMode === 'full-bleed' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Maximize2 size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          Penuh 1 Lembar (Full Bleed)
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Mengisi seluruh kertas 4R tanpa border putih
                        </p>
                      </div>
                    </div>
                    {layoutMode === 'full-bleed' && <Check size={18} color="#0284c7" strokeWidth={3} />}
                  </button>
                </div>
              </div>

              {/* Option 2: Background Color & Cut Guides */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Background Theme Selector (Putih & Hitam) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
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
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: isActive ? '2.5px solid #0284c7' : `1.5px solid ${theme.border}`,
                            background: theme.bg,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: theme.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isActive ? '0 0 10px rgba(2, 132, 199, 0.4)' : 'none',
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Garis Potong (Cut Guide)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCutGuides(!showCutGuides)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: showCutGuides ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: showCutGuides ? '#e0f2fe' : '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: showCutGuides ? '#0369a1' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Scissors size={13} />
                    <span>{showCutGuides ? 'Aktif (Ada Garis)' : 'Mati (Polos)'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Print & Download */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                {/* Primary Button: Direct 4R Print */}
                <button
                  type="button"
                  onClick={handlePrint4R}
                  disabled={isRendering || !preview4RUrl}
                  className="btn-pill-dark"
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                    opacity: preview4RUrl ? 1 : 0.6,
                  }}
                >
                  <Printer size={18} />
                  <span>Cetak Langsung Ukuran 4R</span>
                </button>

                {/* Secondary: Download Ready-to-Print 4R Image */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownload4R('image/png')}
                    disabled={isDownloading || !preview4RUrl}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e293b',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={15} />
                    <span>Unduh 4R (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload4R('image/jpeg')}
                    disabled={isDownloading || !preview4RUrl}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e293b',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: preview4RUrl ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={15} />
                    <span>Unduh 4R (JPG)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
