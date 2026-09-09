'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoboothTemplate, TemplateSlot } from '@/lib/types';
import { detectTemplateSlots } from '@/lib/slotDetector';
import { saveCustomTemplate, getNextCustomTemplateNumber } from '@/lib/templateManager';

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSaved: (savedTemplate: PhotoboothTemplate) => void;
}

export const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateSaved,
}) => {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scanning flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedSlots, setDetectedSlots] = useState<TemplateSlot[]>([]);
  const [scanStatus, setScanStatus] = useState<string>('Memindai bingkai foto...');
  const [isScanSuccess, setIsScanSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset modal states when closed
  const handleModalClose = () => {
    setIsProcessing(false);
    setPreviewImage(null);
    setDetectedSlots([]);
    setIsScanSuccess(false);
    setScanProgress(0);
    setScanStatus('Memindai bingkai foto...');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // 1. Show scanning screen with preview & initial 0% progress
      setPreviewImage(dataUrl);
      setIsProcessing(true);
      setIsScanSuccess(false);
      setDetectedSlots([]);
      setScanProgress(0);
      setScanStatus('Mempersiapkan gambar template...');

      // 2. Start smooth continuous progress bar animation (0% -> ~88%)
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 4) + 3; // +3 to +6 per tick
        if (currentProgress >= 88) {
          currentProgress = 88;
          clearInterval(progressTimer);
        }
        setScanProgress(currentProgress);

        if (currentProgress >= 20 && currentProgress < 60) {
          setScanStatus('Memindai bingkai foto (AI Vision)...');
        } else if (currentProgress >= 60) {
          setScanStatus('Menganalisis sudut kemiringan & tata letak...');
        }
      }, 50);

      try {
        // Run AI slot detection
        const result = await detectTemplateSlots(dataUrl);
        const slotCount = result.slots.length;

        clearInterval(progressTimer);
        setScanProgress(94);
        setScanStatus(`Mengkalibrasi ${slotCount} area bingkai...`);
        setDetectedSlots(result.slots);

        setTimeout(async () => {
          setScanProgress(100);
          setIsScanSuccess(true);
          setScanStatus(`Selesai! Ditemukan ${slotCount} Bingkai Foto`);

          const nextNum = getNextCustomTemplateNumber();
          const templateId = `custom-template-${Date.now()}`;

          const newTemplate: PhotoboothTemplate = {
            id: templateId,
            name: `Template ${nextNum}`,
            category: 'Kustom',
            imageSrc: dataUrl,
            requiredPhotos: slotCount,
            aspectRatio: result.aspectRatio,
            description: `Template Kustom (${slotCount} Foto)`,
            slots: result.slots,
            isCustom: true,
            createdAt: Date.now(),
          };

          // Save to IndexedDB safely
          await saveCustomTemplate(newTemplate);

          setTimeout(() => {
            onTemplateSaved(newTemplate);
            handleModalClose();
          }, 800);
        }, 450);
      } catch (err) {
        clearInterval(progressTimer);
        console.error('Error analyzing template:', err);
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={handleModalClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="neo-card"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              overflow: 'hidden',
              padding: 0,
              boxShadow: '8px 8px 0px var(--neo-black)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Modal Header Bar */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '2.5px solid var(--neo-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--neo-primary)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--neo-black)', margin: 0 }}>
                  {isProcessing ? 'Memindai Template' : 'Upload Template'}
                </h2>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--neo-black)' }}>
                  {isProcessing ? 'Membaca slot bingkai foto otomatis' : 'Membaca bingkai foto secara otomatis'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                style={{
                  background: '#ffffff',
                  border: '2px solid var(--neo-black)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px var(--neo-black)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isProcessing && previewImage ? (
                /* ================= LASER SCANNING EFFECT VIEW ================= */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                  {/* Scanner Screen Box */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '300px',
                      background: '#090d16',
                      borderRadius: '16px',
                      border: '2.5px solid var(--neo-black)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '4px 4px 0px var(--neo-black)',
                    }}
                  >
                    {/* Container wrapping image and overlays */}
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    >
                      {/* Template Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Scan Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '290px',
                          objectFit: 'contain',
                          display: 'block',
                          opacity: isScanSuccess ? 0.95 : 0.85,
                          transition: 'opacity 0.3s ease',
                        }}
                      />

                      {/* Detected Slots Overlays mapped directly over image */}
                      {detectedSlots.map((slot, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.25, delay: idx * 0.08 }}
                          style={{
                            position: 'absolute',
                            left: `${slot.x}%`,
                            top: `${slot.y}%`,
                            width: `${slot.width}%`,
                            height: `${slot.height}%`,
                            transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                            transformOrigin: 'center center',
                            border: '2.5px dashed #22c55e',
                            background: 'rgba(34, 197, 94, 0.3)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(34, 197, 94, 0.7)',
                            pointerEvents: 'none',
                          }}
                        >
                          <span
                            style={{
                              background: '#22c55e',
                              color: '#000000',
                              fontWeight: 900,
                              fontSize: '0.68rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              boxShadow: '1px 1px 0px #000000',
                            }}
                          >
                            #{idx + 1}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Scanner Grid Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                          'linear-gradient(rgba(6, 182, 212, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* 4 Corner Reticles */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 14,
                        height: 14,
                        borderTop: '2.5px solid #06b6d4',
                        borderLeft: '2.5px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 14,
                        height: 14,
                        borderTop: '2.5px solid #06b6d4',
                        borderRight: '2.5px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        width: 14,
                        height: 14,
                        borderBottom: '2.5px solid #06b6d4',
                        borderLeft: '2.5px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 14,
                        height: 14,
                        borderBottom: '2.5px solid #06b6d4',
                        borderRight: '2.5px solid #06b6d4',
                      }}
                    />

                    {/* Animated Laser Scan Line */}
                    {!isScanSuccess && (
                      <motion.div
                        animate={{
                          top: ['0%', '95%', '0%'],
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '24px',
                          background:
                            'linear-gradient(to bottom, rgba(6, 182, 212, 0), rgba(6, 182, 212, 0.45) 80%, #22d3ee 100%)',
                          borderBottom: '2.5px solid #38bdf8',
                          boxShadow: '0 0 16px #06b6d4, 0 0 6px #22d3ee',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>

                  {/* Scanning Status & Progress HUD */}
                  <div
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: isScanSuccess ? '#f0fdf4' : '#f8fafc',
                      border: `2px solid ${isScanSuccess ? '#16a34a' : 'var(--neo-black)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '3px 3px 0px var(--neo-black)',
                    }}
                  >
                    {/* Top line: Status text & Percentage badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isScanSuccess ? (
                          <CheckCircle2 size={18} color="#16a34a" />
                        ) : (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{
                              width: '14px',
                              height: '14px',
                              border: '2.5px solid #0284c7',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            color: isScanSuccess ? '#15803d' : 'var(--neo-black)',
                          }}
                        >
                          {scanStatus}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          background: isScanSuccess ? '#dcfce7' : '#e0f2fe',
                          color: isScanSuccess ? '#166534' : '#0369a1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: `1.5px solid ${isScanSuccess ? '#16a34a' : '#0284c7'}`,
                        }}
                      >
                        {scanProgress}%
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        background: '#e2e8f0',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        border: '1.5px solid var(--neo-black)',
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        style={{
                          height: '100%',
                          background: isScanSuccess
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                          borderRadius: '9999px',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ================= INITIAL UPLOAD DROPZONE ================= */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '3px dashed var(--neo-black)',
                    borderRadius: '16px',
                    background: '#f8fafc',
                    padding: '36px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="neo-card-interactive"
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '4px' }}>
                      Pilih Template dari Galeri
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, maxWidth: '380px', margin: '0 auto' }}>
                      Format didukung: <strong>PNG</strong>, <strong>JPG</strong>, atau <strong>WEBP</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="neo-btn neo-btn-primary"
                    style={{ padding: '10px 24px', fontSize: '0.92rem', marginTop: '4px' }}
                  >
                    <Upload size={16} />
                    <span>Buka Galeri</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
