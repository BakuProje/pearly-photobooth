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
  Info,
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

  // GIF state: initialized from session.gifUrl, or automatically generated if missing
  const [effectiveGifUrl, setEffectiveGifUrl] = useState<string | null>(session.gifUrl || null);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(
    !session.gifUrl && !!(session.photos && session.photos.length > 0)
  );

  const template = getTemplateById(session.templateId || session.config?.selectedTemplateId);

  // Auto-generate GIF on the fly if session.gifUrl was missing or not yet uploaded
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

  // Robust download single file handler
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

  // Robust download all photos handler
  const handleDownloadAllPhotos = async () => {
    if (!session.photos || session.photos.length === 0 || downloadingStatus['all_photos']) return;

    setDownloadingStatus((prev) => ({ ...prev, all_photos: true }));

    try {
      for (let idx = 0; idx < session.photos.length; idx++) {
        const src = session.photos[idx];
        const filename = `PearlyBooth-Photo-${idx + 1}-${Date.now()}.jpg`;
        await downloadMediaFile(src, filename);
        // Small delay between downloads so mobile browsers don't block concurrent file triggers
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
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#1e293b',
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
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
          marginBottom: '16px',
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
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '999px',
            padding: '5px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#475569',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <span>SOFT FILE FOTO KAMU</span>
        </div>

        {/* User-friendly Mobile Tip Banner */}
        <div
          style={{
            marginTop: '4px',
            background: '#f1f5f9',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
            lineHeight: 1.35,
          }}
        >
          <Info size={16} className="text-slate-500 shrink-0" />
          <span>
            Tekan tombol <strong>Download</strong> untuk simpan ke HP, atau tekan & tahan foto untuk <strong>Simpan Gambar</strong>.
          </span>
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

              {/* Perbesar Button in bottom right */}
              <button
                type="button"
                onClick={() =>
                  setZoomedItem({
                    url: session.photostripUrl,
                    title: 'Photostrip',
                    filename: `Pearly-Photostrip-${Date.now()}.png`,
                  })
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

            {/* Download Photostrip Button (Gray color #4b5563, not blue) */}
            <button
              type="button"
              onClick={() =>
                handleDownloadFile(
                  session.photostripUrl,
                  `Pearly-Photostrip-${Date.now()}.png`,
                  'strip'
                )
              }
              disabled={downloadingStatus['strip']}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '13px 20px',
                borderRadius: '14px',
                background: downloadedStatus['strip']
                  ? '#22c55e'
                  : downloadingStatus['strip']
                  ? '#374151'
                  : '#4b5563',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.96rem',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: downloadingStatus['strip'] ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(75, 85, 99, 0.35)',
                transition: 'transform 0.1s ease, background-color 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            >
              {downloadingStatus['strip'] ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menyiapkan Unduhan...</span>
                </>
              ) : downloadedStatus['strip'] ? (
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
        {(effectiveGifUrl || isGeneratingGif) && (
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
                minHeight: '260px',
              }}
            >
              {isGeneratingGif && !effectiveGifUrl ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px 16px',
                    color: '#94a3b8',
                    gap: '10px',
                  }}
                >
                  <Loader2 size={32} className="animate-spin text-white" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Menyiapkan Animasi GIF...
                  </span>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={effectiveGifUrl!}
                    alt="Animated GIF"
                    style={{
                      width: '100%',
                      height: '300px',
                      objectFit: 'cover',
                      display: 'block',
                      cursor: 'zoom-in',
                    }}
                    onClick={() =>
                      setZoomedItem({
                        url: effectiveGifUrl!,
                        title: 'Animated GIF',
                        filename: `Pearly-Moment-${Date.now()}.gif`,
                      })
                    }
                  />

                  {/* Perbesar Button in bottom right */}
                  <button
                    type="button"
                    onClick={() =>
                      setZoomedItem({
                        url: effectiveGifUrl!,
                        title: 'Animated GIF',
                        filename: `Pearly-Moment-${Date.now()}.gif`,
                      })
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
                </>
              )}
            </div>

            {/* Download GIF Button (Gray color #4b5563, not blue) */}
            <button
              type="button"
              onClick={() => {
                if (effectiveGifUrl) {
                  handleDownloadFile(
                    effectiveGifUrl,
                    `Pearly-Moment-${Date.now()}.gif`,
                    'gif'
                  );
                }
              }}
              disabled={isGeneratingGif || !effectiveGifUrl || downloadingStatus['gif']}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '13px 20px',
                borderRadius: '14px',
                background: downloadedStatus['gif']
                  ? '#22c55e'
                  : isGeneratingGif || !effectiveGifUrl
                  ? '#94a3b8'
                  : downloadingStatus['gif']
                  ? '#374151'
                  : '#4b5563',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.96rem',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isGeneratingGif || !effectiveGifUrl || downloadingStatus['gif'] ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(75, 85, 99, 0.35)',
                transition: 'transform 0.1s ease, background-color 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            >
              {isGeneratingGif || !effectiveGifUrl ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memproses GIF...</span>
                </>
              ) : downloadingStatus['gif'] ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menyiapkan Unduhan...</span>
                </>
              ) : downloadedStatus['gif'] ? (
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
                disabled={downloadingStatus['all_photos']}
                style={{
                  background: downloadedStatus['all_photos']
                    ? '#22c55e'
                    : downloadingStatus['all_photos']
                    ? '#374151'
                    : '#1e293b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '7px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: downloadingStatus['all_photos'] ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 41, 59, 0.25)',
                  transition: 'transform 0.1s ease, background-color 0.15s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
              >
                {downloadingStatus['all_photos'] ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : downloadedStatus['all_photos'] ? (
                  <>
                    <Check size={14} />
                    <span>Semua Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download Semua</span>
                  </>
                )}
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
                      setZoomedItem({
                        url: photo,
                        title: `Foto Pose ${idx + 1}`,
                        filename: `PearlyBooth-Photo-${idx + 1}-${Date.now()}.jpg`,
                      })
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
                    disabled={downloadingStatus[`photo_${idx}`]}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      background: downloadedStatus[`photo_${idx}`]
                        ? '#22c55e'
                        : downloadingStatus[`photo_${idx}`]
                        ? '#374151'
                        : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: downloadingStatus[`photo_${idx}`] ? 'wait' : 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    title={`Download Foto Pose ${idx + 1}`}
                  >
                    {downloadingStatus[`photo_${idx}`] ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : downloadedStatus[`photo_${idx}`] ? (
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
        {zoomedItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setZoomedItem(null)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setZoomedItem(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <X size={22} />
            </button>

            {/* Enlarged Image */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{
                maxWidth: '94vw',
                maxHeight: '76vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedItem.url}
                alt={zoomedItem.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                }}
              />
            </motion.div>

            {/* Action Bar in Lightbox Modal */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(zoomedItem.url, zoomedItem.filename, 'zoom_item')
                }
                style={{
                  background: downloadedStatus['zoom_item'] ? '#22c55e' : '#4b5563',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '10px 24px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                }}
              >
                {downloadingStatus['zoom_item'] ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : downloadedStatus['zoom_item'] ? (
                  <>
                    <Check size={16} />
                    <span>Tersimpan di Perangkat!</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download {zoomedItem.title}</span>
                  </>
                )}
              </button>

              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                💡 Tekan & tahan gambar di atas untuk simpan langsung ke galeri HP
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
