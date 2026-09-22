'use client';

import React, { useState } from 'react';
import { SoftFileSession } from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import { Print4RModal } from './Print4RModal';
import {
  Download,
  Image as ImageIcon,
  Film,
  Camera,
  Layers,
  Sparkles,
  Maximize2,
  X,
  Printer,
  RotateCcw,
  Check,
  Calendar,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SoftFileViewProps {
  session: SoftFileSession;
  onStartNewSession: () => void;
}

export const SoftFileView: React.FC<SoftFileViewProps> = ({
  session,
  onStartNewSession,
}) => {
  const [zoomedUrl, setZoomedUrl] = useState<{ url: string; title: string } | null>(null);
  const [isPrint4RModalOpen, setIsPrint4RModalOpen] = useState(false);
  const [downloadedStatus, setDownloadedStatus] = useState<{ [key: string]: boolean }>({});

  const template = getTemplateById(session.templateId || session.config?.selectedTemplateId);

  // Format date
  const sessionDate = new Date(session.createdAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Download single item helper
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
    }, 3000);
  };

  // Download all photos sequentially
  const handleDownloadAllIndividualPhotos = () => {
    session.photos.forEach((src, idx) => {
      setTimeout(() => {
        handleDownloadFile(
          src,
          `PearlyBooth-Pose-${idx + 1}-${Date.now()}.jpg`,
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
        background: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 60px 16px',
        overflowX: 'hidden',
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Pearly Photobooth Logo"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.4))',
            }}
          />
          <h1
            className="font-script"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '0.5px',
            }}
          >
            Pearly Booth
          </h1>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            backdropFilter: 'blur(12px)',
            borderRadius: '999px',
            padding: '6px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#e2e8f0' }}>
            Soft File Download • {template.name} ({session.photos.length} Pose)
          </span>
        </div>

        <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
          <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
          Disimpan pada: {sessionDate}
        </p>
      </div>

      {/* Main Grid Content */}
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* ================= CARD 1: PHOTOSTRIP PROTOTYPE ================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: '#1e293b',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                Hasil Photostrip
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              HD PNG
            </span>
          </div>

          {/* Photostrip Image Preview (Clickable to Zoom) */}
          <div
            onClick={() => setZoomedUrl({ url: session.photostripUrl, title: 'Hasil Photostrip' })}
            style={{
              width: '100%',
              maxHeight: '440px',
              background: '#0f172a',
              borderRadius: '16px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-in',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.photostripUrl}
              alt="Hasil Photostrip"
              style={{
                maxWidth: '100%',
                maxHeight: '420px',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedUrl({ url: session.photostripUrl, title: 'Hasil Photostrip' });
              }}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
              }}
              title="Perbesar"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '16px',
            }}
          >
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
                padding: '13px 20px',
                borderRadius: '999px',
                background: downloadedStatus['strip'] ? '#15803d' : '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.94rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {downloadedStatus['strip'] ? (
                <>
                  <Check size={18} />
                  <span>Tersimpan di Perangkat!</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Photostrip (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPrint4RModalOpen(true)}
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Printer size={16} />
              <span>Cetak Ukuran Kertas 4R</span>
            </button>
          </div>
        </motion.div>

        {/* ================= CARD 2: ANIMATED GIF MOMENT ================= */}
        {session.gifUrl && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              background: '#1e293b',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#8b5cf6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Film size={18} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                  Animasi Moment GIF
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#a78bfa',
                  background: 'rgba(139, 92, 246, 0.15)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                Bergerak (GIF)
              </span>
            </div>

            {/* GIF Preview */}
            <div
              onClick={() => setZoomedUrl({ url: session.gifUrl!, title: 'Animasi Moment GIF' })}
              style={{
                width: '100%',
                maxHeight: '440px',
                height: '380px',
                background: '#0f172a',
                borderRadius: '16px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'zoom-in',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.gifUrl}
                alt="Animasi Moment GIF"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedUrl({ url: session.gifUrl!, title: 'Animasi Moment GIF' });
                }}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
                title="Perbesar"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Action Button */}
            <div style={{ width: '100%', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(
                    session.gifUrl!,
                    `Pearly-Animated-${Date.now()}.gif`,
                    'gif'
                  )
                }
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '999px',
                  background: downloadedStatus['gif'] ? '#15803d' : '#8b5cf6',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {downloadedStatus['gif'] ? (
                  <>
                    <Check size={18} />
                    <span>Animasi Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download Animasi GIF</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ================= CARD 3: INDIVIDUAL PHOTO POSES ================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          background: '#1e293b',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ec4899',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Foto Satuan Tiap Pose ({session.photos.length} Foto)
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
                Download foto per pose beresolusi tinggi dengan filter aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllIndividualPhotos}
            style={{
              padding: '9px 18px',
              borderRadius: '999px',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
            }}
          >
            <Download size={15} />
            <span>Unduh Semua Sekaligus</span>
          </button>
        </div>

        {/* Photo Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '14px',
          }}
        >
          {session.photos.map((photo, idx) => (
            <div
              key={idx}
              style={{
                background: '#0f172a',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                onClick={() => setZoomedUrl({ url: photo, title: `Pose #${idx + 1}` })}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Pose #${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  Pose {idx + 1}
                </div>
              </div>

              <div style={{ padding: '10px' }}>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      photo,
                      `PearlyBooth-Pose-${idx + 1}-${Date.now()}.jpg`,
                      `photo_${idx}`
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: downloadedStatus[`photo_${idx}`]
                      ? '#15803d'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {downloadedStatus[`photo_${idx}`] ? (
                    <>
                      <Check size={14} />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Unduh JPG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Start New Session Button */}
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={onStartNewSession}
          className="btn-pill-dark"
          style={{
            padding: '14px 36px',
            fontSize: '1rem',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 800,
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(255, 255, 255, 0.25)',
          }}
        >
          <RotateCcw size={18} />
          <span>Buat Sesi Photobooth Baru</span>
        </button>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Pearly PhotoBooth • Self Photo Studio Online Aesthetic
        </span>
      </div>

      {/* Lightbox Zoom Modal */}
      <AnimatePresence>
        {zoomedUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setZoomedUrl(null)}
          >
            <button
              type="button"
              onClick={() => setZoomedUrl(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
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

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                maxWidth: '92vw',
                maxHeight: '85vh',
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
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4R Print Modal */}
      <Print4RModal
        isOpen={isPrint4RModalOpen}
        onClose={() => setIsPrint4RModalOpen(false)}
        photos={session.photos}
        config={session.config}
      />
    </div>
  );
};
