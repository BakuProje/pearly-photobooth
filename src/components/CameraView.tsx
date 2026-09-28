'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { FilterType, PhotoboothTemplate, PhotoBoothConfig } from '@/lib/types';
import { FILTERS } from '@/lib/constants';
import { getTemplateById } from '@/lib/templateManager';
import { soundEffects } from '@/lib/soundEffects';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewProps {
  selectedTemplateId: string;
  initialMode?: 'camera' | 'upload';
  config?: PhotoBoothConfig;
  onChangeConfig?: React.Dispatch<React.SetStateAction<PhotoBoothConfig>>;
  onBackToTemplateSelect: () => void;
  onPhotosCompleted: (photos: string[]) => void;
  activeFilter: FilterType;
  onChangeFilter: (filter: FilterType) => void;
  retakeSlotIndex?: number | null;
  existingPhotos?: string[];
}

export const CameraView: React.FC<CameraViewProps> = ({
  selectedTemplateId,
  initialMode = 'camera',
  config,
  onChangeConfig,
  onBackToTemplateSelect,
  onPhotosCompleted,
  activeFilter,
  onChangeFilter,
  retakeSlotIndex = null,
  existingPhotos = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const isMirror = true;
  const [timerDuration, setTimerDuration] = useState<number>(5); // 3, 5, 7, 10

  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(
    retakeSlotIndex !== null ? retakeSlotIndex : 0
  );
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const currentTemplate: PhotoboothTemplate = getTemplateById(selectedTemplateId);
  const totalRequired = currentTemplate?.requiredPhotos || 4;

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(() => {
    if (existingPhotos && existingPhotos.length > 0) {
      const arr = [...existingPhotos];
      while (arr.length < totalRequired) arr.push('');
      return arr;
    }
    return Array(totalRequired).fill('');
  });

  // Start webcam
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }

      setHasCameraAccess(true);
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasCameraAccess(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Mohon aktifkan izin kamera di browser.'
          : 'Tidak dapat mengakses kamera pada perangkat ini.'
      );
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, startCamera]);

  // Capture single high-res frame from video
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    if (isMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [isMirror]);

  // Trigger flash effect and shutter sound
  const triggerShutterFlash = useCallback(() => {
    setIsFlashing(true);
    soundEffects.playShutter();
    setTimeout(() => setIsFlashing(false), 220);
  }, []);

  // Run countdown and capture sequence
  const startCaptureSequence = useCallback(async () => {
    if (isShooting) return;
    setIsShooting(true);

    const isSingleRetake = retakeSlotIndex !== null;
    const startIndex = isSingleRetake ? retakeSlotIndex : 0;
    const endIndex = isSingleRetake ? retakeSlotIndex + 1 : totalRequired;

    let currentPhotos = [...capturedPhotos];

    for (let slot = startIndex; slot < endIndex; slot++) {
      setCurrentShotIndex(slot);

      // Countdown loop
      for (let c = timerDuration; c > 0; c--) {
        setCountdownValue(c);
        soundEffects.playBeep();
        await new Promise((r) => setTimeout(r, 1000));
      }

      setCountdownValue(null);
      triggerShutterFlash();

      // Take photo
      const photo = captureFrame();
      if (photo) {
        currentPhotos[slot] = photo;
        setCapturedPhotos([...currentPhotos]);
      }

      // Small delay between shots if multiple
      if (slot < endIndex - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setIsShooting(false);
    // Sequence completed!
    const finalPhotos = currentPhotos.filter((p) => Boolean(p));
    onPhotosCompleted(finalPhotos);
  }, [
    isShooting,
    retakeSlotIndex,
    totalRequired,
    capturedPhotos,
    timerDuration,
    triggerShutterFlash,
    captureFrame,
    onPhotosCompleted,
  ]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        height: '100vh',
        position: 'relative',
        background: '#1a1a1a',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Live Video Feed - Fullscreen Edge-to-Edge */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isMirror ? 'scaleX(-1)' : 'none',
          filter:
            activeFilter !== 'normal'
              ? FILTERS.find((f) => f.id === activeFilter)?.cssFilter
              : 'none',
        }}
      />

      {/* Flash Effect */}
      <div className={`flash-overlay ${isFlashing ? 'flash-active' : ''}`} />

      {/* Camera permission error banner */}
      {cameraError && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.92)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '12px',
            zIndex: 40,
            maxWidth: '90%',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          {cameraError}
        </div>
      )}

      {/* Countdown Display Centered with Photo Counter */}
      <AnimatePresence>
        {countdownValue !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 35,
              pointerEvents: 'none',
              gap: '6px',
            }}
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {/* Penanda Foto keberapa tepat di atas detik countdown (Putih, Tanpa Emoji) */}
              <div
                className="font-vintage-serif"
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(1.35rem, 4vw, 2.2rem)',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  textAlign: 'center',
                  textShadow:
                    '0 3px 18px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.8)',
                  marginBottom: '2px',
                }}
              >
                Foto {currentShotIndex + 1} dari {totalRequired}
              </div>

              <div
                className="font-gothic"
                style={{
                  fontSize: 'clamp(6.5rem, 20vw, 11rem)',
                  color: '#ffffff',
                  lineHeight: 1,
                  textShadow:
                    '0 4px 24px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 0, 0, 0.6)',
                }}
              >
                {countdownValue}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gambar 4: Center Overlay with Gothic "start" and Timer Selection Pill Widget */}
      {!isShooting && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            userSelect: 'none',
          }}
        >
          {/* Gothic "start" Button as in Gambar 4 */}
          <button
            type="button"
            onClick={startCaptureSequence}
            className="font-gothic"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: 'clamp(3.8rem, 11vw, 5.8rem)',
              lineHeight: 1,
              cursor: 'pointer',
              textShadow:
                '0 4px 18px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.95)',
              padding: '8px 24px',
              transition: 'transform 0.18s ease, text-shadow 0.18s ease',
              letterSpacing: '1.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.textShadow =
                '0 6px 24px rgba(255, 255, 255, 0.4), 0 2px 10px rgba(0, 0, 0, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.textShadow =
                '0 4px 18px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.95)';
            }}
          >
            start
          </button>

          {/* Timer Duration Selection Pill Widget as in Gambar 4 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffffff',
              padding: '5px 8px',
              borderRadius: '999px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              border: '1.5px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: '#1e293b' }}>
              <Clock size={16} strokeWidth={2.2} />
            </div>

            {[3, 5, 7, 10].map((sec) => {
              const isActive = timerDuration === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimerDuration(sec)}
                  style={{
                    background: isActive ? '#1e293b' : 'transparent',
                    color: isActive ? '#ffffff' : '#1e293b',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sec}s
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
