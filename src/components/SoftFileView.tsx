'use client';

import React, { useState, useEffect } from 'react';
import { SoftFileSession } from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import { downloadMediaFile } from '@/lib/downloadHelper';
import { createAnimatedGif } from '@/lib/gifGenerator';
import {
  Download,
  Maximize2,
  X,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SoftFileViewProps {
  session: SoftFileSession;
  onStartNewSession?: () => void;
}

export const SoftFileView: React.FC<SoftFileViewProps> = ({ session }) => {
  const [zoomedItem, setZoomedItem] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);

  const [downloadingStatus, setDownloadingStatus] = useState<{ [key: string]: boolean }>({});
  const [downloadedStatus, setDownloadedStatus] = useState<{ [key: string]: boolean }>({});

  const [effectiveGifUrl, setEffectiveGifUrl] = useState<string | null>(session.gifUrl || null);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(
    !session.gifUrl && !!(session.photos && session.photos.length > 0)
  );

  const template = getTemplateById(session.templateId || session.config?.selectedTemplateId);

  useEffect(() => {
    if (session.gifUrl) {
      setEffectiveGifUrl(session.gifUrl);
      setIsGeneratingGif(false);
    } else if (session.photos && session.photos.length > 0) {
      let isMounted = true;
      setIsGeneratingGif(true);

      createAnimatedGif(session.photos, {
        interval: 0.45,
        sampleInterval: 2,
      })
        .then((generatedGif) => {
          if (isMounted) {
            setEffectiveGifUrl(generatedGif);
            setIsGeneratingGif(false);
          }
        })
        .catch((err) => {
          console.warn('On-the-fly GIF generation warning:', err);
          if (isMounted) {
            setIsGeneratingGif(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [session.gifUrl, session.photos]);

  const handleDownloadFile = async (url: string, filename: string, keyId: string) => {
    if (!url || downloadingStatus[keyId]) return;

    setDownloadingStatus((prev) => ({ ...prev, [keyId]: true }));

    try {
      await downloadMediaFile(url, filename);
      setDownloadedStatus((prev) => ({ ...prev, [keyId]: true }));
      setTimeout(() => {
        setDownloadedStatus((prev) => ({ ...prev, [keyId]: false }));
      }, 2500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingStatus((prev) => ({ ...prev, [keyId]: false }));
    }
  };

  const handleDownloadAllPhotos = async () => {
    if (!session.photos || session.photos.length === 0 || downloadingStatus['all_photos']) return;

    setDownloadingStatus((prev) => ({ ...prev, all_photos: true }));

    try {
      for (let idx = 0; idx < session.photos.length; idx++) {
        const src = session.photos[idx];
        const filename = `PearlyBooth-Photo-${idx + 1}-${Date.now()}.jpg`;
        await downloadMediaFile(src, filename);
        if (idx < session.photos.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      setDownloadedStatus((prev) => ({ ...prev, all_photos: true }));
      setTimeout(() => {
        setDownloadedStatus((prev) => ({ ...prev, all_photos: false }));
      }, 2500);
    } catch (err) {
      console.error('Download all error:', err);
    } finally {
      setDownloadingStatus((prev) => ({ ...prev, all_photos: false }));
    }
  };

  return (
    <div
      className="vintage-parchment-bg"
      style={{
        width: '100%',
        minHeight: '100vh',
        color: '#1a0f07',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 60px 16px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '6px',
          marginBottom: '20px',
        }}
      >
        <h1
          className="font-script"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 3.8rem)',
            color: '#1a0f07',
            margin: 0,
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
          }}
        >
          Pearly Booth
        </h1>

        <div
          className="font-vintage-serif"
          style={{
            background: 'linear-gradient(135deg, #f2e2cb 0%, #deb887 100%)',
            border: '2px solid #3d2616',
            borderRadius: '999px',
            padding: '6px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#1a0f07',
            boxShadow: '0 3px 8px rgba(45, 25, 12, 0.22)',
            letterSpacing: '0.5px',
          }}
        >
          <span>Soft File Foto Kamu</span>
        </div>
      </div>

      {/* Centered Content Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
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
              background: 'rgba(245, 238, 225, 0.92)',
              border: '3px solid #3d2616',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 8px 24px rgba(45, 25, 12, 0.28)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '1.25rem',
                color: '#1a0f07',
                margin: '0 0 12px 0',
                fontWeight: 800,
                letterSpacing: '0.2px',
              }}
            >
              Photostrip HD
            </h2>

            {/* Inner Image Container */}
            <div
              style={{
                width: '100%',
                background: '#c5d1dc',
                border: '2px solid #3d2616',
                borderRadius: '4px',
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
                  borderRadius: '4px',
                  cursor: 'zoom-in',
                }}
                onClick={() =>
                  setZoomedItem({
                    url: session.photostripUrl,
                    title: 'Photostrip',
                    filename: `Pearly-Photostrip-${Date.now()}.png`,
                  })
                }
              />

              <button
                onClick={() =>
                  setZoomedItem({
                    url: session.photostripUrl,
                    title: 'Photostrip',
                    filename: `Pearly-Photostrip-${Date.now()}.png`,
                  })
                }
                title="Perbesar"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(26, 15, 7, 0.8)',
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
                  zIndex: 5,
                }}
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* Action Download Photostrip Button (Icon Only) */}
            <button
              onClick={() =>
                handleDownloadFile(
                  session.photostripUrl,
                  `Pearly-Photostrip-${Date.now()}.png`,
                  'photostrip'
                )
              }
              disabled={downloadingStatus['photostrip']}
              className="btn-vintage-tag"
              title="Download Photostrip"
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {downloadingStatus['photostrip'] ? (
                <Loader2 size={24} className="animate-spin" />
              ) : downloadedStatus['photostrip'] ? (
                <Check size={24} />
              ) : (
                <Download size={24} />
              )}
            </button>
          </motion.div>
        )}

        {/* ================= CARD 2: ANIMATED GIF ================= */}
        {(effectiveGifUrl || isGeneratingGif) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            style={{
              background: 'rgba(245, 238, 225, 0.92)',
              border: '3px solid #3d2616',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 8px 24px rgba(45, 25, 12, 0.28)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '1.25rem',
                  color: '#1a0f07',
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: '0.2px',
                }}
              >
                Animated GIF
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: '#543720',
                  color: '#fdf7ee',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}
              >
                LOOP
              </span>
            </div>

            <div
              style={{
                width: '100%',
                background: '#e8dbca',
                border: '2px solid #3d2616',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                padding: '10px',
              }}
            >
              {effectiveGifUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveGifUrl}
                  alt="Animated GIF"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '380px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    cursor: 'zoom-in',
                  }}
                  onClick={() =>
                    setZoomedItem({
                      url: effectiveGifUrl,
                      title: 'Animasi GIF',
                      filename: `Pearly-GIF-${Date.now()}.gif`,
                    })
                  }
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#3d2616' }}>
                  <Loader2 size={28} className="animate-spin text-amber-900" />
                  <span className="font-vintage-serif" style={{ fontSize: '0.92rem', fontWeight: 700 }}>Menyiapkan Animasi GIF...</span>
                </div>
              )}
            </div>

            {effectiveGifUrl && (
              <button
                onClick={() =>
                  handleDownloadFile(
                    effectiveGifUrl,
                    `Pearly-GIF-${Date.now()}.gif`,
                    'gif'
                  )
                }
                disabled={downloadingStatus['gif']}
                className="btn-vintage-tag"
                title="Download Animasi GIF"
                style={{
                  width: '100%',
                  marginTop: '14px',
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {downloadingStatus['gif'] ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : downloadedStatus['gif'] ? (
                  <Check size={24} />
                ) : (
                  <Download size={24} />
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* ================= CARD 3: SINGLE PHOTOS PER POSE ================= */}
        {session.photos && session.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            style={{
              background: 'rgba(245, 238, 225, 0.92)',
              border: '3px solid #3d2616',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 8px 24px rgba(45, 25, 12, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '1.25rem',
                  color: '#1a0f07',
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: '0.2px',
                }}
              >
                Foto Satuan ({session.photos.length} Pose)
              </h2>

              <button
                type="button"
                onClick={handleDownloadAllPhotos}
                disabled={downloadingStatus['all_photos']}
                className="btn-vintage-tag"
                title="Unduh Semua Foto"
                style={{
                  padding: '6px 20px 6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {downloadingStatus['all_photos'] ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : downloadedStatus['all_photos'] ? (
                  <Check size={16} />
                ) : (
                  <Download size={16} />
                )}
              </button>
            </div>

            {/* Grid of photos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {session.photos.map((pUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#c5d1dc',
                    border: '2px solid #3d2616',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pUrl}
                    alt={`Pose ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'zoom-in',
                    }}
                    onClick={() =>
                      setZoomedItem({
                        url: pUrl,
                        title: `Pose ${idx + 1}`,
                        filename: `PearlyBooth-Pose-${idx + 1}-${Date.now()}.jpg`,
                      })
                    }
                  />

                  <button
                    onClick={() =>
                      handleDownloadFile(
                        pUrl,
                        `PearlyBooth-Pose-${idx + 1}-${Date.now()}.jpg`,
                        `photo_${idx}`
                      )
                    }
                    title="Unduh Pose"
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(26, 15, 7, 0.85)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={11} />
                    <span>#{idx + 1}</span>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {zoomedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoomedItem(null)}
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
              onClick={() => setZoomedItem(null)}
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
                zIndex: 100000,
              }}
            >
              <X size={22} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedItem.url}
              alt={zoomedItem.title}
              style={{
                maxWidth: '90vw',
                maxHeight: '86vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '3px solid rgba(255, 255, 255, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
