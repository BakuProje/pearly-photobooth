'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ArrowLeft,
  Clock,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react';
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
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  // Mirror mode state (persisted in localStorage, defaults to true for natural front camera selfie)
  const [isMirror, setIsMirror] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snapbooth_camera_mirror');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [timerDuration, setTimerDuration] = useState<number>(5); // 3, 5, 7, 10

  const handleToggleMirror = () => {
    setIsMirror((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('snapbooth_camera_mirror', String(next));
      }
      return next;
    });
  };

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

  const handleToggleCamera = () => {
    setIsSwitchingCamera(true);
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setTimeout(() => setIsSwitchingCamera(false), 500);
  };

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
    setTimeout(() => setIsFlashing(false), 200);
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
        await new Promise((r) => setTimeout(r, 900));
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
        background: '#525252',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Live Video Feed - Truly Fullscreen Edge-to-Edge */}
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

      {/* Floating Top Header Overlay: Back Button, Title, and Mirror Toggle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px 36px 20px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        {/* Back to Frame Selection */}
        <button
          type="button"
          onClick={onBackToTemplateSelect}
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '999px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.15s ease',
          }}
          title="Kembali ke Pilih Frame"
        >
          <ArrowLeft size={16} />
          <span>Frame</span>
        </button>

        {/* Title as in Gambar 3 */}
        <h1
          className="font-script"
          style={{
            fontSize: 'clamp(2.2rem, 6.5vw, 3.8rem)',
            color: '#ffffff',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.8), 0 4px 28px rgba(0, 0, 0, 0.5)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: '0.5px',
            pointerEvents: 'none',
          }}
        >
          ! Take Your Picture !
        </h1>

        {/* Right Controls: Mirror Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleToggleMirror}
            style={{
              background: isMirror ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              border: isMirror ? '1.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '999px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.15s ease',
            }}
            title={isMirror ? 'Mirror: Aktif (Klik untuk nonaktifkan mirror)' : 'Mirror: Nonaktif (Klik untuk aktifkan mirror)'}
          >
            <RefreshCw size={14} style={{ color: isMirror ? '#38bdf8' : '#94a3b8' }} />
            <span>{isMirror ? 'Mirror: ON' : 'Mirror: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Countdown Display Exactly Centered on Camera Screen */}
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
            }}
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="countdown-circle">
                <span>{countdownValue}</span>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '6px 20px',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                Pose {currentShotIndex + 1} dari {totalRequired}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Paw Trigger Button at Bottom Center (Gambar 3 & 5) */}
      {!isShooting && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Instruction Prompt as in Gambar 5 */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '7px 20px',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            Tekan paw untuk memulai foto !
          </div>

          {/* Duration Picker Pills before Paw click */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '4px 8px',
              borderRadius: '999px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #333333',
            }}
          >
            <Clock size={13} style={{ color: '#333333', marginLeft: '4px' }} />
            {[3, 5, 7, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setTimerDuration(sec)}
                style={{
                  background: timerDuration === sec ? '#333333' : 'transparent',
                  color: timerDuration === sec ? '#ffffff' : '#333333',
                  border: 'none',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Paw Trigger Button with /images/paww.png */}
          <button
            type="button"
            onClick={startCaptureSequence}
            className="paw-trigger-btn"
            title="Tekan untuk mulai foto!"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/paww.png"
              alt="Ambil Foto"
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
};
