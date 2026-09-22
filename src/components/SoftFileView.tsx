'use client';

import React, { useState } from 'react';
import { SoftFileSession } from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import {
  Download,
  Maximize2,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SoftFileViewProps {
  session: SoftFileSession;
  onStartNewSession?: () => void;
}

export const SoftFileView: React.FC<SoftFileViewProps> = ({
  session,
}) => {
  const [zoomedUrl, setZoomedUrl] = useState<{ url: string; title: string } | null>(null);
  const [downloadedStatus, setDownloadedStatus] = useState<{ [key: string]: boolean }>({});

  const template = getTemplateById(session.templateId || session.config?.selectedTemplateId);

  // Download single file helper
  const handleDownloadFile = (url: string, filename: string, keyId: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedStatus((prev) => ({ ...prev, [keyId]: true }));
    setTimeout(() => {
      setDownloadedStatus((prev) => ({ ...prev, [keyId]: false }));
    }, 2500);
  };

  // Download all photos
  const handleDownloadAllPhotos = () => {
    if (!session.photos || session.photos.length === 0) return;
    session.photos.forEach((src, idx) => {
      setTimeout(() => {
        handleDownloadFile(
          src,
          `PearlyBooth-Photo-${idx + 1}-${Date.now()}.jpg`,
          `photo_${idx}`
        );
      }, idx * 250);
    });
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 60px 16px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header matching Pearly Photobooth branding */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <h1
          className="font-script"
          style={{
            fontSize: 'clamp(2.4rem, 7vw, 3.2rem)',
            color: '#1e293b',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Pearly Booth
        </h1>

        <div
          style={{
            background: '#f1f5f9',
            border: '1.5px solid #e2e8f0',
            borderRadius: '999px',
            padding: '4px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#475569',
          }}
        >
          <span>SOFT FILE FOTO KAMU</span>
        </div>
      </div>

      {/* Centered Content Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* ================= CARD 1: PHOTOSTRIP ================= */}
        {session.photostripUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#1e293b',
                margin: '0 0 14px 0',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                letterSpacing: '-0.3px',
              }}
            >
              Photostrip
            </h2>

            {/* Inner Image Container with Clean Frame */}
            <div
              style={{
                width: '100%',
                background: '#1e293b',
                border: '2px solid #1e293b',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.photostripUrl}
                alt="Photostrip"
                style={{
                  maxWidth: '100%',
                  maxHeight: '480px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />

              {/* Perbesar Button in bottom right */}
              <button
                type="button"
                onClick={() =>
                  setZoomedUrl({ url: session.photostripUrl, title: 'Photostrip' })
                }
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(30, 41, 59, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Maximize2 size={13} />
                <span>Perbesar</span>
              </button>
            </div>

            {/* Download Photostrip Button */}
            <button
              type="button"
              onClick={() =>
                handleDownloadFile(
                  session.photostripUrl,
                  `Pearly-Photostrip-${Date.now()}.png`,
                  'strip'
                )
              }
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '13px 20px',
                borderRadius: '14px',
                background: downloadedStatus['strip'] ? '#22c55e' : '#4b5563',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.96rem',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(75, 85, 99, 0.35)',
                transition: 'transform 0.1s ease, background-color 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            >
              {downloadedStatus['strip'] ? (
                <>
                  <Check size={18} />
                  <span>Tersimpan di Perangkat!</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Photostrip</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ================= CARD 2: ANIMATED GIF ================= */}
        {session.gifUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            style={{
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#1e293b',
                margin: '0 0 14px 0',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                letterSpacing: '-0.3px',
              }}
            >
              Animated GIF
            </h2>

            {/* Inner GIF Container */}
            <div
              style={{
                width: '100%',
                background: '#1e293b',
                border: '2px solid #1e293b',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.gifUrl}
                alt="Animated GIF"
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Perbesar Button in bottom right */}
              <button
                type="button"
                onClick={() =>
                  setZoomedUrl({ url: session.gifUrl!, title: 'Animated GIF' })
                }
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(30, 41, 59, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Maximize2 size={13} />
                <span>Perbesar</span>
              </button>
            </div>

            {/* Download GIF Button */}
            <button
              type="button"
              onClick={() =>
                handleDownloadFile(
                  session.gifUrl!,
                  `Pearly-Moment-${Date.now()}.gif`,
                  'gif'
                )
              }
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '13px 20px',
                borderRadius: '14px',
                background: downloadedStatus['gif'] ? '#22c55e' : '#4b5563',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.96rem',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(75, 85, 99, 0.35)',
                transition: 'transform 0.1s ease, background-color 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            >
              {downloadedStatus['gif'] ? (
                <>
                  <Check size={18} />
                  <span>GIF Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download GIF</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ================= CARD 3: PHOTOS (N) ================= */}
        {session.photos && session.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            style={{
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header: Photos (N) & Download Semua */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#1e293b',
                  margin: 0,
                  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '-0.3px',
                }}
              >
                Photos ({session.photos.length})
              </h2>

              <button
                type="button"
                onClick={handleDownloadAllPhotos}
                style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '7px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 41, 59, 0.25)',
                  transition: 'transform 0.1s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
              >
                <Download size={14} />
                <span>Download Semua</span>
              </button>
            </div>

            {/* Photos Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              {session.photos.map((photo, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#1e293b',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Photo Preview Thumbnail */}
                  <div
                    onClick={() =>
                      setZoomedUrl({ url: photo, title: `Foto Pose ${idx + 1}` })
                    }
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                      background: '#0f172a',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Pose ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Dark Bottom Bar with Download Icon Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(
                        photo,
                        `PearlyBooth-Photo-${idx + 1}-${Date.now()}.jpg`,
                        `photo_${idx}`
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      background: downloadedStatus[`photo_${idx}`] ? '#22c55e' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    title={`Download Foto Pose ${idx + 1}`}
                  >
                    {downloadedStatus[`photo_${idx}`] ? (
                      <Check size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Universal Lightbox Zoom Modal */}
      <AnimatePresence>
        {zoomedUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setZoomedUrl(null)}
          >
            <button
              type="button"
              onClick={() => setZoomedUrl(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
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
                src={zoomedUrl.url}
                alt={zoomedUrl.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '88vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


