'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, CheckCircle2, Sparkles, Wand2, Scan, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  const [scanStatus, setScanStatus] = useState<string>('Mempersiapkan gambar template...');
  const [currentPhase, setCurrentPhase] = useState<number>(1);
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
    setCurrentPhase(1);
    setScanStatus('Mempersiapkan gambar template...');
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
      setCurrentPhase(1);
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

        if (currentProgress < 30) {
          setCurrentPhase(1);
          setScanStatus('Mempersiapkan gambar template...');
        } else if (currentProgress >= 30 && currentProgress < 65) {
          setCurrentPhase(2);
          setScanStatus('Memindai bingkai foto (AI Vision)...');
        } else if (currentProgress >= 65) {
          setCurrentPhase(3);
          setScanStatus('Menganalisis sudut kemiringan & tata letak...');
        }
      }, 50);

      try {
        // Run AI slot detection
        const result = await detectTemplateSlots(dataUrl);
        const slotCount = result.slots.length;

        clearInterval(progressTimer);
        setScanProgress(94);
        setCurrentPhase(3);
        setScanStatus(`Mengkalibrasi ${slotCount} area bingkai...`);
        setDetectedSlots(result.slots);

        setTimeout(async () => {
          setScanProgress(100);
          setCurrentPhase(4);
          setIsScanSuccess(true);
          setScanStatus(`Selesai! Ditemukan ${slotCount} Bingkai Foto`);

          // Confetti celebration burst
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#3b82f6', '#22c55e', '#a855f7', '#fbbf24'],
            });
          } catch {
            // Ignore if confetti fails
          }

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
          }, 900);
        }, 500);
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
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="neo-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              overflow: 'hidden',
              padding: 0,
              boxShadow: '10px 10px 0px var(--neo-black)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '2px solid var(--neo-black)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '2px 2px 0px var(--neo-black)',
                  }}
                >
                  <Wand2 size={18} color="var(--neo-black)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--neo-black)', margin: 0 }}>
                    {isProcessing ? 'Memindai Template' : 'Upload Template'}
                  </h2>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--neo-black)' }}>
                    {isProcessing ? 'AI Vision mendeteksi bingkai otomatis' : 'Membaca bingkai foto secara otomatis'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                style={{
                  background: '#ffffff',
                  border: '2px solid var(--neo-black)',
                  borderRadius: '10px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px var(--neo-black)',
                  transition: 'transform 0.1s ease',
                }}
              >
                <X size={18} color="var(--neo-black)" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isProcessing && previewImage ? (
                /* ================= LASER SCANNING EFFECT VIEW ================= */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                  {/* Scanner Screen Box */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '310px',
                      background: 'radial-gradient(circle at 50% 50%, #0d1527 0%, #060913 100%)',
                      borderRadius: '18px',
                      border: '2.5px solid var(--neo-black)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '5px 5px 0px var(--neo-black)',
                    }}
                  >
                    {/* Top HUD Status Tag */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 14,
                        right: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 20,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: isScanSuccess ? '#22c55e' : '#06b6d4',
                            boxShadow: isScanSuccess ? '0 0 8px #22c55e' : '0 0 8px #06b6d4',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 900,
                            letterSpacing: '0.06em',
                            color: isScanSuccess ? '#4ade80' : '#38bdf8',
                            fontFamily: 'monospace',
                          }}
                        >
                          {isScanSuccess ? 'AI SCAN COMPLETE' : 'AI NEURAL SCANNER ACTIVE'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontFamily: 'monospace',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        MATRIX 4K
                      </div>
                    </div>

                    {/* Container wrapping image and overlays */}
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        padding: '16px',
                      }}
                    >
                      {/* Template Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Scan Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '275px',
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: '8px',
                          opacity: isScanSuccess ? 0.98 : 0.88,
                          transition: 'opacity 0.3s ease',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                      />

                      {/* Detected Slots Overlays mapped directly over image */}
                      {detectedSlots.map((slot, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 18, stiffness: 300, delay: idx * 0.07 }}
                          style={{
                            position: 'absolute',
                            left: `${slot.x}%`,
                            top: `${slot.y}%`,
                            width: `${slot.width}%`,
                            height: `${slot.height}%`,
                            transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                            transformOrigin: 'center center',
                            border: '2.5px dashed #22c55e',
                            background: 'rgba(34, 197, 94, 0.28)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(34, 197, 94, 0.8), inset 0 0 10px rgba(34, 197, 94, 0.3)',
                            pointerEvents: 'none',
                          }}
                        >
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.07 + 0.1 }}
                            style={{
                              background: '#22c55e',
                              color: '#090d16',
                              fontWeight: 900,
                              fontSize: '0.72rem',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1.5px solid #000000',
                              boxShadow: '1.5px 1.5px 0px #000000',
                            }}
                          >
                            #{idx + 1}
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Futuristic Grid Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                          'linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* 4 Corner Reticles */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 16,
                        height: 16,
                        borderTop: '3px solid #06b6d4',
                        borderLeft: '3px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 16,
                        height: 16,
                        borderTop: '3px solid #06b6d4',
                        borderRight: '3px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        width: 16,
                        height: 16,
                        borderBottom: '3px solid #06b6d4',
                        borderLeft: '3px solid #06b6d4',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 16,
                        height: 16,
                        borderBottom: '3px solid #06b6d4',
                        borderRight: '3px solid #06b6d4',
                      }}
                    />

                    {/* High-Tech Dual Laser Sweep Effect */}
                    {!isScanSuccess && (
                      <motion.div
                        animate={{
                          top: ['0%', '92%', '0%'],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '28px',
                          background:
                            'linear-gradient(to bottom, rgba(6, 182, 212, 0) 0%, rgba(139, 92, 246, 0.25) 40%, rgba(6, 182, 212, 0.6) 85%, #38bdf8 100%)',
                          borderBottom: '3px solid #22d3ee',
                          boxShadow: '0 0 20px #06b6d4, 0 0 8px #a855f7',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>

                  {/* ================= REFINED PROGRESS & STATUS HUD ================= */}
                  <div
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      borderRadius: '18px',
                      background: isScanSuccess ? '#f0fdf4' : '#ffffff',
                      border: `2.5px solid ${isScanSuccess ? '#16a34a' : 'var(--neo-black)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '4px 4px 0px var(--neo-black)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Top Line: Dynamic Animated Icon + Smooth Text + Percentage Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {/* Dynamic Animated Status Icon Badge */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: isScanSuccess
                              ? '#dcfce7'
                              : 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)',
                            border: `2px solid ${isScanSuccess ? '#16a34a' : 'var(--neo-black)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '1.5px 1.5px 0px var(--neo-black)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {isScanSuccess ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                            >
                              <CheckCircle2 size={20} color="#15803d" />
                            </motion.div>
                          ) : (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Sparkles size={18} color="#0284c7" />
                            </motion.div>
                          )}
                        </div>

                        {/* Animated Status Text with Smooth Fade & Slide */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={scanStatus}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              style={{
                                fontSize: '0.92rem',
                                fontWeight: 900,
                                color: isScanSuccess ? '#15803d' : 'var(--neo-black)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {scanStatus}
                            </motion.span>
                          </AnimatePresence>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: isScanSuccess ? '#16a34a' : 'var(--text-muted)',
                            }}
                          >
                            {isScanSuccess
                              ? 'Template siap digunakan di photobooth'
                              : 'Memproses kecerdasan visual Gemini...'}
                          </span>
                        </div>
                      </div>

                      {/* Percentage Pill Badge with Pulse on Tick */}
                      <motion.span
                        key={scanProgress}
                        initial={{ scale: 0.94 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 900,
                          background: isScanSuccess
                            ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                            : 'linear-gradient(135deg, #e0f2fe, #ede9fe)',
                          color: isScanSuccess ? '#166534' : '#0369a1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: `2px solid ${isScanSuccess ? '#16a34a' : 'var(--neo-black)'}`,
                          boxShadow: '2px 2px 0px var(--neo-black)',
                          flexShrink: 0,
                          fontFamily: 'monospace',
                        }}
                      >
                        {scanProgress}%
                      </motion.span>
                    </div>

                    {/* Premium Shimmer Progress Bar Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '12px',
                        background: '#e2e8f0',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        border: '2px solid var(--neo-black)',
                        position: 'relative',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <motion.div
                        style={{
                          height: '100%',
                          background: isScanSuccess
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                          borderRadius: '9999px',
                          position: 'relative',
                          boxShadow: isScanSuccess
                            ? '0 0 10px rgba(34, 197, 94, 0.6)'
                            : '0 0 12px rgba(6, 182, 212, 0.7)',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        {/* Shimmer Light Reflection Sweep */}
                        {!isScanSuccess && (
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              width: '40%',
                              background:
                                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
                              transform: 'skewX(-20deg)',
                            }}
                          />
                        )}
                      </motion.div>
                    </div>

                    {/* 4 Visual Step Chips Indicator */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      {[
                        { step: 1, label: 'Upload' },
                        { step: 2, label: 'AI Vision' },
                        { step: 3, label: 'Geometri' },
                        { step: 4, label: 'Selesai' },
                      ].map((item) => {
                        const isDone = currentPhase > item.step || (item.step === 4 && isScanSuccess);
                        const isCurrent = currentPhase === item.step && !isScanSuccess;

                        return (
                          <div
                            key={item.step}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '4px 2px',
                              borderRadius: '6px',
                              background: isDone
                                ? '#dcfce7'
                                : isCurrent
                                ? '#e0f2fe'
                                : '#f1f5f9',
                              border: `1.5px solid ${
                                isDone
                                  ? '#16a34a'
                                  : isCurrent
                                  ? '#0284c7'
                                  : '#cbd5e1'
                              }`,
                              color: isDone
                                ? '#166534'
                                : isCurrent
                                ? '#0369a1'
                                : '#94a3b8',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isDone ? (
                              <Check size={11} strokeWidth={3} />
                            ) : isCurrent ? (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: '#0284c7',
                                }}
                              />
                            ) : null}
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* ================= INITIAL UPLOAD DROPZONE ================= */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '3px dashed var(--neo-black)',
                    borderRadius: '20px',
                    background: '#f8fafc',
                    padding: '38px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="neo-card-interactive"
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'var(--neo-primary)',
                      border: '2.5px solid var(--neo-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '3px 3px 0px var(--neo-black)',
                    }}
                  >
                    <Scan size={30} color="var(--neo-black)" />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '4px' }}>
                      Pilih Template dari Galeri
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600, maxWidth: '380px', margin: '0 auto' }}>
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
                    style={{ padding: '12px 28px', fontSize: '0.95rem', marginTop: '2px' }}
                  >
                    <Upload size={18} />
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
