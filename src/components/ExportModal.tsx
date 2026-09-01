'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoBoothConfig,
  GalleryItem,
} from '@/lib/types';
import { renderPhotoStripCanvas, generateDownloadBlob } from '@/lib/canvasRenderer';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Bookmark,
  Loader2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  config: PhotoBoothConfig;
  onSaveToGallery: (item: GalleryItem) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  photos,
  config,
  onSaveToGallery,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const previewImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen && photos.length > 0) {
      setIsGenerating(true);
      setIsSaved(false);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#93c5fd', '#ffffff'],
        });
      } catch (e) {
        // fallback
      }

      renderPhotoStripCanvas(photos, config, 1333)
        .then((canvas) => {
          const url = canvas.toDataURL('image/png', 0.95);
          setPreviewUrl(url);
          setIsGenerating(false);
        })
        .catch((err) => {
          console.error('Export canvas render failed:', err);
          setIsGenerating(false);
        });
    }
  }, [isOpen, photos, config]);

  if (!isOpen) return null;

  const handleDownloadPNG = async () => {
    try {
      const blob = await generateDownloadBlob(photos, config, 'image/png');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapbooth-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download PNG', e);
    }
  };

  const handleDownloadJPEG = async () => {
    try {
      const blob = await generateDownloadBlob(photos, config, 'image/jpeg');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapbooth-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download JPEG', e);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const blob = await generateDownloadBlob(photos, config, 'image/png');
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  const handlePrint = () => {
    if (!previewUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Snapbooth Photo Strip</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 8mm;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #ffffff;
            }
            img {
              max-height: 95vh;
              max-width: 95vw;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${previewUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveGallery = () => {
    if (!previewUrl || isSaved) return;

    const item: GalleryItem = {
      id: `snapbooth_${Date.now()}`,
      previewUrl,
      photos: [...photos],
      config: { ...config },
      createdAt: Date.now(),
    };

    onSaveToGallery(item);
    setIsSaved(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
      }}
    >
      <div
        className="soft-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto',
          border: '1.5px solid var(--border-blue)',
          boxShadow: 'var(--shadow-soft-lg)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Snapbooth"
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>Foto Kamu Sudah Siap!</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Siap untuk diunduh kualitas HD (300 DPI) atau dicetak langsung.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ width: '36px', height: '36px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Preview (Left) + Actions (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'center' }}>
          {/* Render Preview Container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--brand-blue-50)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              minHeight: '420px',
              border: '1px solid var(--border-blue)',
            }}
          >
            {isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--brand-blue-700)' }}>
                <Loader2 className="animate-spin" size={36} color="var(--brand-blue-600)" />
                <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Sedang Merender Template HD...</span>
              </div>
            ) : previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={previewImgRef}
                src={previewUrl}
                alt="Snapbooth Final Result"
                style={{
                  maxHeight: '440px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 12px 30px rgba(2, 132, 199, 0.2)',
                }}
              />
            ) : null}
          </div>

          {/* Action List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleDownloadPNG}
              disabled={!previewUrl || isGenerating}
              className="btn btn-primary"
              style={{ padding: '14px 20px', fontSize: '0.95rem', justifyContent: 'flex-start' }}
            >
              <Download size={18} />
              <span>Unduh Format PNG (HD)</span>
            </button>

            <button
              onClick={handleDownloadJPEG}
              disabled={!previewUrl || isGenerating}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
            >
              <Download size={18} />
              <span>Unduh Format JPEG</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!previewUrl || isGenerating}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
            >
              <Printer size={18} />
              <span>Cetak / Print Langsung</span>
            </button>

            <button
              onClick={handleCopyToClipboard}
              disabled={!previewUrl || isGenerating}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
            >
              {copied ? <Check size={18} color="#16a34a" /> : <Copy size={18} />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin ke Clipboard'}</span>
            </button>

            <button
              onClick={handleSaveGallery}
              disabled={!previewUrl || isSaved}
              className="btn btn-secondary"
              style={{
                padding: '12px 20px',
                fontSize: '0.9rem',
                justifyContent: 'flex-start',
                marginTop: '6px',
                background: isSaved ? '#f0fdf4' : '#ffffff',
                borderColor: isSaved ? '#86efac' : 'var(--border-blue)',
                color: isSaved ? '#166534' : 'var(--brand-blue-700)',
              }}
            >
              {isSaved ? <Check size={18} color="#16a34a" /> : <Bookmark size={18} />}
              <span>{isSaved ? 'Tersimpan di Galeri Sesi' : 'Simpan ke Galeri Sesi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
