'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ArrowLeft,
  X,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Search,
  Loader2,
  Move,
  ArrowUp,
  ArrowDown,
  Camera,
  Upload,
  ImagePlus,
  FolderUp,
} from 'lucide-react';
import { FilterType, PhotoboothTemplate, PhotoBoothConfig } from '@/lib/types';
import { FILTERS, TEMPLATES } from '@/lib/constants';
import { soundEffects } from '@/lib/soundEffects';
import { renderPhotoStripCanvas } from '@/lib/canvasRenderer';
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
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mode: 'camera' (live webcam) vs 'upload' (import/upload from files)
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>(initialMode);
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeUploadSlotRef = useRef<number | null>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isMirror, setIsMirror] = useState(true);
  const [timerDuration, setTimerDuration] = useState<number>(3); // 3, 5, 7, 10 seconds
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEmptyPhotoModalOpen, setIsEmptyPhotoModalOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // States: 'setup' (sebelum foto) | 'shooting' (sedang foto) | 'review' (selesai foto)
  const [sessionState, setSessionState] = useState<'setup' | 'shooting' | 'review'>(
    initialMode === 'upload' ? 'review' : 'setup'
  );
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<(string | null)[]>([]);

  // Review Mode States
  const [photostripPreviewUrl, setPhotostripPreviewUrl] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  // Photostrip Zoom Lightbox
  const [isPhotostripZoomOpen, setIsPhotostripZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Single Pose Detail Modal (When user clicks a pose thumbnail)
  const [selectedPoseIndex, setSelectedPoseIndex] = useState<number | null>(null);
  const [poseZoomLevel, setPoseZoomLevel] = useState<number>(1);

  // Filter list scroll ref with mouse drag & touch swipe support
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingFilter = useRef(false);
  const startFilterX = useRef(0);
  const scrollFilterLeft = useRef(0);

  const onFilterMouseDown = (e: React.MouseEvent) => {
    if (!filterScrollRef.current) return;
    isDraggingFilter.current = true;
    startFilterX.current = e.pageX - filterScrollRef.current.offsetLeft;
    scrollFilterLeft.current = filterScrollRef.current.scrollLeft;
  };

  const onFilterMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFilter.current || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - startFilterX.current) * 1.5;
    filterScrollRef.current.scrollLeft = scrollFilterLeft.current - walk;
  };

  const onFilterMouseUp = () => {
    isDraggingFilter.current = false;
  };

  // Clean Sliders State (Enhance, Brightness, Contrast, Saturation, Warmth, Fade, Highlights, Shadows, Vignette)
  const [enhance, setEnhance] = useState(config?.enhance || 0);
  const [brightness, setBrightness] = useState(config?.brightness || 0);
  const [contrast, setContrast] = useState(config?.contrast || 0);
  const [saturation, setSaturation] = useState(config?.saturation || 0);
  const [warmth, setWarmth] = useState(config?.warmth || 0);
  const [fade, setFade] = useState(config?.fade || 0);
  const [highlights, setHighlights] = useState(config?.highlights || 0);
  const [shadows, setShadows] = useState(config?.shadows || 0);
  const [vignette, setVignette] = useState(config?.vignette || 0);

  // Per-photo Zoom Scale & Pan Offsets
  const [photoScales, setPhotoScales] = useState<number[]>([]);
  const [photoOffsets, setPhotoOffsets] = useState<{ x: number; y: number }[]>([]);

  // Dragging / Panning on Photostrip Slots
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const isDraggingSlotRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const handleUpdatePoseZoom = (newScale: number) => {
    const clamped = Math.max(0.8, Math.min(3.5, Number(newScale.toFixed(2))));
    setPoseZoomLevel(clamped);
    if (selectedPoseIndex !== null) {
      setPhotoScales((prev) => {
        const updated = [...prev];
        updated[selectedPoseIndex] = clamped;
        return updated;
      });
    }
  };

  const handleUpdatePoseOffset = (sIdx: number, deltaX: number, deltaY: number) => {
    setPhotoOffsets((prev) => {
      const updated = [...prev];
      const current = updated[sIdx] || { x: 0, y: 0 };
      const newX = Math.max(-0.6, Math.min(0.6, Number((current.x + deltaX).toFixed(3))));
      const newY = Math.max(-0.6, Math.min(0.6, Number((current.y + deltaY).toFixed(3))));
      updated[sIdx] = { x: newX, y: newY };
      return updated;
    });
  };

  const handleResetPoseOffset = (sIdx: number) => {
    setPhotoOffsets((prev) => {
      const updated = [...prev];
      updated[sIdx] = { x: 0, y: 0 };
      return updated;
    });
  };

  const handleSlotPointerDown = (e: React.PointerEvent<HTMLDivElement>, sIdx: number) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingSlotRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetRef.current = photoOffsets[sIdx] || { x: 0, y: 0 };
    setActiveSlotIndex(sIdx);
  };

  const handleSlotPointerMove = (e: React.PointerEvent<HTMLDivElement>, sIdx: number) => {
    if (!isDraggingSlotRef.current) return;
    e.stopPropagation();
    const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
    if (dist > 3) {
      hasMovedRef.current = true;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const boxW = rect.width || 100;
    const boxH = rect.height || 100;
    const dx = (e.clientX - dragStartPosRef.current.x) / boxW;
    const dy = (e.clientY - dragStartPosRef.current.y) / boxH;

    const newX = Math.max(-0.6, Math.min(0.6, Number((dragStartOffsetRef.current.x + dx).toFixed(3))));
    const newY = Math.max(-0.6, Math.min(0.6, Number((dragStartOffsetRef.current.y + dy).toFixed(3))));

    setPhotoOffsets((prev) => {
      const updated = [...prev];
      updated[sIdx] = { x: newX, y: newY };
      return updated;
    });
  };

  const handleSlotPointerUp = (e: React.PointerEvent<HTMLDivElement>, sIdx: number) => {
    e.stopPropagation();
    isDraggingSlotRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!hasMovedRef.current) {
      setSelectedPoseIndex(sIdx);
      setPoseZoomLevel(photoScales[sIdx] || 1);
    }
  };

  const currentTemplate: PhotoboothTemplate =
    TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const totalShots = currentTemplate.requiredPhotos;

  // Initialize slots and photo scales
  useEffect(() => {
    setCapturedPhotos(new Array(totalShots).fill(null));
    setPhotoScales(new Array(totalShots).fill(1));
    setPhotoOffsets(new Array(totalShots).fill({ x: 0, y: 0 }));
    if (initialMode === 'upload') {
      setInputMode('upload');
      setSessionState('review');
    } else {
      setInputMode('camera');
      setSessionState('setup');
    }
  }, [totalShots, initialMode]);

  // Trigger file picker for specific slot
  const triggerUploadForSlot = (slotIndex: number) => {
    activeUploadSlotRef.current = slotIndex;
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
      singleFileInputRef.current.click();
    }
  };

  // Trigger batch file picker for all slots
  const triggerBatchUpload = () => {
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
      batchFileInputRef.current.click();
    }
  };

  // Handle single photo upload
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetSlot = activeUploadSlotRef.current;
    if (!file || targetSlot === null || targetSlot === undefined) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedPhotos((prev) => {
          const updated = [...prev];
          updated[targetSlot] = dataUrl;
          return updated;
        });
        setSessionState('review');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle batch photos upload (multiple files selected at once)
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).slice(0, totalShots);
    let loadedCount = 0;
    const newPhotos = [...capturedPhotos];

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          newPhotos[index] = dataUrl;
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setCapturedPhotos(newPhotos);
          setSessionState('review');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Sync adjustments to parent config
  useEffect(() => {
    if (onChangeConfig) {
      onChangeConfig((prev) => ({
        ...prev,
        filter: activeFilter,
        enhance,
        brightness,
        contrast,
        saturation,
        warmth,
        fade,
        highlights,
        shadows,
        vignette,
        photoScales,
        photoOffsets,
      }));
    }
  }, [activeFilter, enhance, brightness, contrast, saturation, warmth, fade, highlights, shadows, vignette, photoScales, photoOffsets, onChangeConfig]);

  // Start webcam
  const startCamera = useCallback(async (modeOverride?: 'user' | 'environment') => {
    const targetFacingMode = modeOverride || facingMode;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: { ideal: targetFacingMode },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.warn('Video play error:', e);
          }
        }
      }

      setHasCameraAccess(true);
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback without facingMode constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setHasCameraAccess(true);
        setCameraError(null);
      } catch (fallbackErr) {
        setHasCameraAccess(false);
        setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.');
      }
    }
  }, [facingMode]);

  const handleToggleFacingMode = async () => {
    if (isSwitchingCamera) return;
    setIsSwitchingCamera(true);
    soundEffects.playClick();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    // Auto-adjust mirror: user (selfie) -> mirror on, environment (rear) -> mirror off
    if (nextMode === 'environment') {
      setIsMirror(false);
    } else {
      setIsMirror(true);
    }

    await startCamera(nextMode);
    setTimeout(() => {
      setIsSwitchingCamera(false);
    }, 450);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Ensure stream is always attached to video element even if state switches
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((e) => {
        if (e.name !== 'AbortError') console.warn(e);
      });
    }
  }, [sessionState]);

  // Re-render live photostrip preview in review state whenever photos or adjustments change
  useEffect(() => {
    const hasAnyPhoto = capturedPhotos.some((p) => p !== null);
    if ((sessionState === 'review' || inputMode === 'upload') && hasAnyPhoto) {
      setIsRenderingPreview(true);
      const validPhotos = capturedPhotos.map((p) => p || '');
      const currentConfig: PhotoBoothConfig = {
        selectedTemplateId,
        filter: activeFilter,
        headerText: 'SNAPBOOTH',
        footerText: 'MEMORIES • 2026',
        showDate: true,
        showWatermark: false,
        stickers: [],
        doodles: [],
        enhance,
        brightness,
        contrast,
        saturation,
        warmth,
        fade,
        highlights,
        shadows,
        vignette,
        photoScales,
        photoOffsets,
      };

      renderPhotoStripCanvas(validPhotos, currentConfig, 900)
        .then((canvas) => {
          setPhotostripPreviewUrl(canvas.toDataURL('image/png', 0.9));
          setIsRenderingPreview(false);
        })
        .catch((err) => {
          console.error('Preview render error', err);
          setIsRenderingPreview(false);
        });
    }
  }, [sessionState, inputMode, capturedPhotos, selectedTemplateId, activeFilter, enhance, brightness, contrast, saturation, warmth, fade, highlights, shadows, vignette, photoScales, photoOffsets]);

  // Capture single photo from live video element
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;

    // Check if video is playing and has valid dimensions
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (isMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  }, [isMirror]);

  // Trigger flash effect and shutter sound
  const triggerShutterFlash = useCallback(() => {
    setIsFlashing(true);
    soundEffects.playShutterSound();
    setTimeout(() => {
      setIsFlashing(false);
    }, 150);
  }, []);

  // Run Countdown for a single shot
  const runCountdown = useCallback(
    (seconds: number): Promise<void> => {
      return new Promise((resolve) => {
        let count = seconds;
        setCountdownValue(count);
        soundEffects.playCountdownBeep(false);

        const timer = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setCountdownValue(count);
            soundEffects.playCountdownBeep(false);
          } else {
            clearInterval(timer);
            setCountdownValue(null);
            soundEffects.playCountdownBeep(true);
            resolve();
          }
        }, 1000);
      });
    },
    []
  );

  // Take Full Automated Sequence of Photos
  const startFullSequence = async () => {
    setCapturedPhotos(new Array(totalShots).fill(null));
    setSessionState('shooting');

    // Ensure stream is playing
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((e) => {
        if (e.name !== 'AbortError') console.warn(e);
      });
    }

    const newPhotos: string[] = [];

    for (let i = 0; i < totalShots; i++) {
      setCurrentShotIndex(i);
      await runCountdown(timerDuration);
      triggerShutterFlash();

      const photoData = captureFrame();
      if (photoData) {
        newPhotos.push(photoData);
        setCapturedPhotos((prev) => {
          const updated = [...prev];
          updated[i] = photoData;
          return updated;
        });
      }

      if (i < totalShots - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setSessionState('review');
  };

  // Retake a specific slot during review (with zero black frames)
  const retakeSingleSlot = async (slotIndex: number) => {
    setSelectedPoseIndex(null); // close detail modal if open
    setSessionState('shooting');
    setCurrentShotIndex(slotIndex);

    // Make sure video stream is live before countdown begins
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((e) => {
        if (e.name !== 'AbortError') console.warn(e);
      });
    }

    await runCountdown(timerDuration);
    triggerShutterFlash();

    const photoData = captureFrame();
    if (photoData) {
      setCapturedPhotos((prev) => {
        const updated = [...prev];
        updated[slotIndex] = photoData;
        return updated;
      });
    }

    setSessionState('review');
  };

  // Proceed to final result
  const handleProceedToResult = () => {
    const validPhotos = capturedPhotos.filter((p): p is string => p !== null && p !== '');
    if (validPhotos.length === 0) {
      setIsEmptyPhotoModalOpen(true);
      return;
    }
    const finalPhotos = capturedPhotos.map((p) => p || validPhotos[0]);
    onPhotosCompleted(finalPhotos);
  };

  const filledCount = capturedPhotos.filter((p) => p !== null && p !== '').length;

  const resetAllAdjustments = () => {
    setEnhance(0);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setWarmth(0);
    setFade(0);
    setHighlights(0);
    setShadows(0);
    setVignette(0);
  };

  return (
    <div
      style={
        sessionState === 'shooting'
          ? {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100dvh',
              zIndex: 99999,
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
              maxWidth: '100vw',
              maxHeight: '100dvh',
              overflow: 'hidden',
            }
          : {
              maxWidth: sessionState === 'review' ? '1220px' : '1080px',
              margin: '0 auto',
              width: '100%',
              minHeight: '88vh',
              padding: '12px 16px 28px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              transition: 'all 0.3s ease',
            }
      }
    >
      {/* Hidden File Inputs for Single & Batch Image Uploads */}
      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleSingleFileChange}
      />
      <input
        type="file"
        ref={batchFileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleBatchFileChange}
      />

      {/* ================= TOP HEADER BAR DENGAN MODE SWITCH (KAMERA VS UPLOAD) ================= */}
      {sessionState !== 'shooting' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="neo-card"
          style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            background: 'var(--neo-white)',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onBackToTemplateSelect}
              className="neo-btn neo-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <ArrowLeft size={15} />
              <span>Ganti Template</span>
            </button>

            <span
              style={{
                background: 'var(--neo-primary)',
                color: 'var(--neo-black)',
                border: '1.5px solid var(--neo-black)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.74rem',
                whiteSpace: 'nowrap',
              }}
            >
              {currentTemplate.name}
            </span>
          </div>

          {/* Mode Switch Tabs: [ 📸 Kamera Live ] | [ 📁 Upload Galeri ] */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '2px solid var(--neo-black)',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setInputMode('camera');
                if (capturedPhotos.every((p) => p === null)) {
                  setSessionState('setup');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '7px',
                border: inputMode === 'camera' ? '1.5px solid var(--neo-black)' : 'none',
                background: inputMode === 'camera' ? 'var(--neo-green)' : 'transparent',
                fontWeight: 900,
                fontSize: '0.76rem',
                cursor: 'pointer',
                color: 'var(--neo-black)',
                boxShadow: inputMode === 'camera' ? '1.5px 1.5px 0px var(--neo-black)' : 'none',
              }}
            >
              <Camera size={13} />
              <span>Foto Langsung</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMode('upload');
                setSessionState('review');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '7px',
                border: inputMode === 'upload' ? '1.5px solid var(--neo-black)' : 'none',
                background: inputMode === 'upload' ? 'var(--neo-blue-light)' : 'transparent',
                fontWeight: 900,
                fontSize: '0.76rem',
                cursor: 'pointer',
                color: 'var(--neo-black)',
                boxShadow: inputMode === 'upload' ? '1.5px 1.5px 0px var(--neo-black)' : 'none',
              }}
            >
              <FolderUp size={13} />
              <span>Pilih Foto</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= PERSISTENT CAMERA VIEWFINDER (SEMPURNA SELALU AKTIF DI DOM, TERSEMBUNYI SAAT REVIEW) ================= */}
      <div
        style={
          sessionState === 'shooting'
            ? {
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100dvh',
                zIndex: 100,
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
              }
            : {
                width: '100%',
                display: sessionState === 'review' ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                margin: '0 auto',
              }
        }
        className={`camera-viewfinder-wrapper ${sessionState === 'shooting' ? 'is-shooting' : ''}`}
      >
        {/* Viewfinder Card (When shooting: zero padding, zero margin, borderless 100% full screen) */}
        <div
          className={sessionState === 'shooting' ? '' : 'neo-card'}
          style={
            sessionState === 'shooting'
              ? {
                  width: '100vw',
                  height: '100dvh',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000000',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  borderRadius: 0,
                  overflow: 'hidden',
                }
              : {
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--neo-white)',
                  position: 'relative',
                  width: '100%',
                }
          }
        >
          {/* Shutter Flash Animation */}
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#ffffff',
                zIndex: 140,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Video Container Responsive Large (Landscape & Portrait) */}
          <div
            style={
              sessionState === 'shooting'
                ? {
                    position: 'relative',
                    width: '100vw',
                    height: '100dvh',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }
                : undefined
            }
            className={sessionState === 'shooting' ? '' : 'camera-video-container'}
          >
            {/* Camera Error Message */}
            {cameraError && (
              <div
                style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  padding: '24px',
                  maxWidth: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 150,
                }}
              >
                <div style={{ fontSize: '2rem' }}>📷</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{cameraError}</div>
                <button
                  onClick={() => startCamera()}
                  className="neo-btn neo-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}

            {/* Persistent Video Element - NEVER unmounted to prevent black frames */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isMirror ? 'scaleX(-1)' : 'none',
                filter: FILTERS.find((f) => f.id === activeFilter)?.cssFilter || 'none',
                display: cameraError ? 'none' : 'block',
              }}
            />

            {/* Floating Camera Switch Button (Kamera Depan / Belakang) */}
            {sessionState === 'setup' && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleToggleFacingMode}
                disabled={isSwitchingCamera}
                className="neo-btn"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 125,
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid var(--neo-black)',
                  boxShadow: '2.5px 2.5px 0px var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  color: 'var(--neo-black)',
                }}
                title="Ganti Kamera Depan / Belakang"
              >
                <RefreshCw
                  size={14}
                  style={{
                    transition: 'transform 0.45s ease',
                    transform: isSwitchingCamera ? 'rotate(180deg)' : 'none',
                  }}
                />
                <span>{facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}</span>
              </motion.button>
            )}

            {/* Transparent Countdown Floating Elements with Framer Motion */}
            <AnimatePresence mode="wait">
              {sessionState === 'shooting' && countdownValue !== null && (
                <div
                  key="shooting-countdown-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 130,
                    pointerEvents: 'none',
                    background: 'rgba(0, 0, 0, 0.12)',
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      border: '2px solid #38bdf8',
                      padding: '8px 24px',
                      borderRadius: '999px',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      marginBottom: '10px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    }}
                  >
                    Foto #{currentShotIndex + 1} dari {totalShots}
                  </motion.div>

                  <motion.div
                    key={`digit-${countdownValue}`}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.25, opacity: 0 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      fontSize: 'clamp(7rem, 24vw, 14rem)',
                      fontWeight: 900,
                      color: '#38bdf8',
                      textShadow: '0px 0px 30px rgba(56, 189, 248, 0.9), 4px 4px 0px #0f172a, -4px -4px 0px #0f172a',
                      lineHeight: 1,
                      fontFamily: '"Outfit", sans-serif',
                    }}
                  >
                    {countdownValue}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      color: '#ffffff',
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      textShadow: '2px 2px 6px #000000',
                      letterSpacing: '3px',
                      marginTop: '6px',
                    }}
                  >
                    POSE!
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Setup Mode: Centered Mulai Foto Button */}
          {sessionState === 'setup' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px 4px 4px 4px',
                textAlign: 'center',
                width: '100%',
              }}
            >


              <button
                onClick={startFullSequence}
                className="neo-btn neo-btn-primary"
                style={{
                  padding: '14px 52px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  borderRadius: '14px',
                  boxShadow: '4px 4px 0px var(--neo-black)',
                }}
              >
                <span>Mulai Foto</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons: [ Durasi | Filter ] dan [ Kamera Depan / Belakang ] */}
        {sessionState === 'setup' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
            }}
          >
            {/* Baris 1: Button Durasi | Button Filter */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                width: '100%',
              }}
            >
              <button
                onClick={() => setIsDurationModalOpen(true)}
                className="neo-btn neo-btn-secondary"
                style={{
                  padding: '10px 12px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  borderRadius: '12px',
                }}
              >
                <Clock size={16} />
                <span>Durasi ({timerDuration}s)</span>
              </button>

              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="neo-btn neo-btn-secondary"
                style={{
                  padding: '10px 12px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  borderRadius: '12px',
                }}
              >
                <Sparkles size={16} />
                <span>Filter</span>
              </button>
            </div>

            {/* Baris 2: Button Kamera Untuk Depan / Belakang */}
            <button
              type="button"
              onClick={handleToggleFacingMode}
              disabled={isSwitchingCamera}
              className="neo-btn neo-btn-secondary"
              style={{
                padding: '10px 14px',
                fontSize: '0.86rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                width: '100%',
                borderRadius: '12px',
                background: facingMode === 'environment' ? 'var(--neo-primary)' : undefined,
              }}
              title="Ganti ke Kamera Depan / Belakang"
            >
              <RefreshCw
                size={16}
                style={{
                  transition: 'transform 0.45s ease',
                  transform: isSwitchingCamera ? 'rotate(180deg)' : 'none',
                }}
              />
              <span>{facingMode === 'user' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= REVIEW & EDIT PHOTOSTRIP (OTOMATIS TAMPIL DI TENGAH DENGAN FILTER & SLIDER DI KANAN) ================= */}
      {sessionState === 'review' && (
        <div className="review-preview-grid">
          {/* KOLOM TENGAH/KIRI: PREVIEW PHOTOSTRIP ZOOM & SLOT RETAKE (LEBIH BESAR & PROMINEN) */}
          <div
            className="neo-card"
            style={{
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--neo-white)',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                Photostrip Preview
              </span>
              <button
                onClick={() => setIsPhotostripZoomOpen(true)}
                className="neo-btn neo-btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <ZoomIn size={14} />
                <span>Zoom</span>
              </button>
            </div>

            {/* Clickable Photostrip Zoom Preview with Interactive Per-Slot Zoom Selection */}
            <div
              className="review-photostrip-box"
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '480px',
                minHeight: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '14px',
                border: '2.5px solid var(--neo-black)',
                background: '#f8fafc',
                padding: '6px',
                boxSizing: 'border-box',
              }}
            >
              {photostripPreviewUrl ? (
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    maxHeight: '465px',
                    maxWidth: '100%',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photostripPreviewUrl}
                    alt="Preview Photostrip"
                    className="review-photostrip-img"
                    style={{
                      maxHeight: '465px',
                      width: 'auto',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      display: 'block',
                    }}
                  />

                  {/* Interactive Clickable & Draggable Hotspots over each photo slot in the photostrip */}
                  {currentTemplate.slots.map((slot, sIdx) => {
                    const isActive = activeSlotIndex === sIdx;
                    return (
                      <div
                        key={sIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasMovedRef.current) {
                            setSelectedPoseIndex(sIdx);
                            setPoseZoomLevel(photoScales[sIdx] || 1);
                          }
                        }}
                        onPointerDown={(e) => handleSlotPointerDown(e, sIdx)}
                        onPointerMove={(e) => handleSlotPointerMove(e, sIdx)}
                        onPointerUp={(e) => handleSlotPointerUp(e, sIdx)}
                        onPointerCancel={(e) => handleSlotPointerUp(e, sIdx)}
                        className="interactive-slot-overlay"
                        style={{
                          position: 'absolute',
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                          cursor: isDraggingSlotRef.current && activeSlotIndex === sIdx ? 'grabbing' : 'grab',
                          borderRadius: slot.borderRadius ? `${slot.borderRadius / 12}px` : '4px',
                          border: isActive ? '2.5px solid #0284c7' : '2px dashed rgba(2, 132, 199, 0.45)',
                          background: isActive ? 'rgba(2, 132, 199, 0.14)' : 'transparent',
                          boxShadow: isActive ? '0 0 10px rgba(2, 132, 199, 0.4)' : 'none',
                          zIndex: 15,
                          touchAction: 'none',
                          transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                        title={`Klik / Geser Foto #${sIdx + 1} (${slot.label || `Pose ${sIdx + 1}`}) untuk Atur Posisi (Drag/Pan)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 16px', color: 'var(--neo-black)', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={34} color="#0284c7" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>Sedang Menyiapkan Preview Photostrip...</span>
                </div>
              )}

              {photostripPreviewUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotostripZoomOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.2)',
                    zIndex: 20,
                  }}
                  title="Klik untuk Zoom Seluruh Strip"
                >
                  <Maximize2 size={12} />
                  <span>Zoom Strip</span>
                </button>
              )}
            </div>

            {/* Slot Photo Thumbnails: Strict film-strip grid fitting all photos */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  Slot Foto ({filledCount}/{totalShots}) • Klik untuk atur posisi & zoom
                </span>

                {/* Batch Upload Button */}
                <button
                  type="button"
                  onClick={triggerBatchUpload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    background: '#eff6ff',
                    border: '1.5px solid var(--neo-black)',
                    color: '#1d4ed8',
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '1.5px 1.5px 0px var(--neo-black)',
                  }}
                  title="Pilih beberapa foto sekaligus dari galeri untuk mengisi semua slot"
                >
                  <FolderUp size={13} />
                  <span>Upload Sekaligus (Batch)</span>
                </button>
              </div>

              <div
                style={{
                  display: totalShots === 1 ? 'flex' : 'grid',
                  justifyContent: totalShots === 1 ? 'center' : undefined,
                  gridTemplateColumns:
                    totalShots >= 5
                      ? `repeat(${Math.ceil(totalShots / 2)}, minmax(0, 1fr))`
                      : totalShots > 1
                      ? `repeat(${totalShots}, minmax(0, 1fr))`
                      : undefined,
                  gap: totalShots === 1 ? '0px' : '6px',
                  width: '100%',
                }}
              >
                {capturedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid var(--neo-black)',
                      background: '#ffffff',
                      boxShadow: '2px 2px 0px var(--neo-black)',
                      minWidth: 0,
                      width: totalShots === 1 ? '120px' : '100%',
                      maxWidth: totalShots === 1 ? '120px' : 'none',
                    }}
                  >
                    {/* Klik Foto -> Muncul Pop-up Detail Foto / Upload */}
                    <div
                      onClick={() => {
                        if (photo) {
                          setSelectedPoseIndex(idx);
                        } else {
                          triggerUploadForSlot(idx);
                        }
                      }}
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        overflow: 'hidden',
                        background: photo ? '#000000' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                      title={photo ? `Klik untuk atur posisi & zoom Foto #${idx + 1}` : `Klik untuk upload foto slot #${idx + 1}`}
                    >
                      {photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={photo}
                          alt={`Slot ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', padding: '4px', textAlign: 'center' }}>
                          <Upload size={15} />
                          <span style={{ fontSize: '0.66rem', fontWeight: 900 }}>Slot #{idx + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Dual Action Mini Buttons on Bottom of Card: [ 📸 Kamera ] [ 📁 Upload ] */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', borderTop: '1.5px solid var(--neo-black)' }}>
                      <button
                        type="button"
                        onClick={() => retakeSingleSlot(idx)}
                        style={{
                          padding: '5px 0',
                          background: '#ffffff',
                          color: 'var(--neo-black)',
                          border: 'none',
                          borderRight: '1px solid var(--neo-black)',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                        }}
                        title={`Ambil foto kamera untuk Slot #${idx + 1}`}
                      >
                        <Camera size={11} />
                        <span style={{ fontSize: '0.62rem', lineHeight: 1 }}>#{idx + 1}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerUploadForSlot(idx)}
                        style={{
                          padding: '5px 0',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                        }}
                        title={`Pilih/Ganti foto dari folder untuk Slot #${idx + 1}`}
                      >
                        <Upload size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons in Review (Always 2 columns side by side) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '4px' }}>
              <button
                onClick={startFullSequence}
                className="neo-btn neo-btn-secondary"
                style={{
                  width: '100%',
                  padding: '11px 6px',
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)',
                  whiteSpace: 'nowrap',
                }}
              >
                <RotateCcw size={14} />
                <span>Ulang Semua</span>
              </button>

              <button
                onClick={handleProceedToResult}
                className="neo-btn neo-btn-primary"
                style={{
                  width: '100%',
                  padding: '11px 6px',
                  fontSize: 'clamp(0.82rem, 2.6vw, 0.94rem)',
                  background: 'var(--neo-green)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Lihat Hasil</span>
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: ATAS = FILTER HORIZONTAL SLIDER, BAWAH = SLIDERS ADJUSTMENT (TANPA IKON) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', minWidth: 0, maxWidth: '100%' }}>
            {/* BAGIAN ATAS: FILTER HORIZONTAL CAROUSEL (SWIPE / SCROLL HALUS KE KIRI & KANAN) */}
            <div
              className="neo-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--neo-white)',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Filter Efek
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--neo-primary-dark)', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                  {FILTERS.find((f) => f.id === activeFilter)?.name}
                </span>
              </div>

              {/* Horizontal Scrollable Filter Chips (Bisa di-swipe / digeser ke kiri & kanan dengan sentuhan atau mouse drag) */}
              <div
                ref={filterScrollRef}
                className="filter-scroll-container"
                onMouseDown={onFilterMouseDown}
                onMouseMove={onFilterMouseMove}
                onMouseUp={onFilterMouseUp}
                onMouseLeave={onFilterMouseUp}
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '4px 4px 10px 4px',
                  margin: '-2px -2px -4px -2px',
                  scrollSnapType: 'x mandatory',
                  cursor: 'grab',
                  userSelect: 'none',
                  WebkitOverflowScrolling: 'touch',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {FILTERS.map((f) => {
                  const isSel = activeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onChangeFilter(f.id)}
                      style={{
                        padding: '7px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        borderRadius: '10px',
                        border: '2px solid var(--neo-black)',
                        background: isSel ? 'var(--neo-primary)' : '#ffffff',
                        color: 'var(--neo-black)',
                        boxShadow: isSel ? '3px 3px 0px var(--neo-black)' : '2px 2px 0px var(--neo-black)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        transform: isSel ? 'translate(-1px, -1px)' : 'none',
                      }}
                    >
                      <span>{f.name}</span>
                      {isSel && <Check size={13} strokeWidth={3.5} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BAGIAN BAWAH: SLIDERS EDIT & PENYESUAIAN SESUAI TEMA WEBSITE (NEO-BRUTALISM) */}
            <div
              className="neo-card"
              style={{
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '13px',
                background: 'var(--neo-white)',
                color: 'var(--neo-black)',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Edit & Penyesuaian
                </span>
                <button
                  onClick={resetAllAdjustments}
                  style={{
                    background: '#f1f5f9',
                    border: '1.5px solid var(--neo-black)',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    color: 'var(--neo-black)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '1.5px 1.5px 0px var(--neo-black)',
                  }}
                >
                  Reset
                </button>
              </div>

              {/* 1. Enhance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Enhance</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{enhance}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={enhance}
                  onChange={(e) => setEnhance(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${enhance}%, #e2e8f0 ${enhance}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 2. Brightness */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Brightness</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${brightness + 50}%, #e2e8f0 ${brightness + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 3. Contrast */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Contrast</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{contrast > 0 ? `+${contrast}` : contrast}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${contrast + 50}%, #e2e8f0 ${contrast + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 4. Saturation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Saturation</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{saturation > 0 ? `+${saturation}` : saturation}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${saturation + 50}%, #e2e8f0 ${saturation + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 5. Warmth */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Warmth</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{warmth > 0 ? `+${warmth}` : warmth}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={warmth}
                  onChange={(e) => setWarmth(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${warmth + 50}%, #e2e8f0 ${warmth + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 6. Fade */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Fade</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{fade}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fade}
                  onChange={(e) => setFade(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${fade}%, #e2e8f0 ${fade}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 7. Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Highlights</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{highlights > 0 ? `+${highlights}` : highlights}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={highlights}
                  onChange={(e) => setHighlights(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${highlights + 50}%, #e2e8f0 ${highlights + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 8. Shadows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Shadows</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{shadows > 0 ? `+${shadows}` : shadows}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={shadows}
                  onChange={(e) => setShadows(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${shadows + 50}%, #e2e8f0 ${shadows + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>

              {/* 9. Vignette */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  <span>Vignette</span>
                  <span style={{ color: 'var(--neo-primary-dark)', fontWeight: 900 }}>{vignette}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={vignette}
                  onChange={(e) => setVignette(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${vignette}%, #e2e8f0 ${vignette}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* ================= MODAL 1: SINGLE POSE DETAIL & ZOOM POPUP (KLIK FOTO POSE) ================= */}
      {
        selectedPoseIndex !== null && capturedPhotos[selectedPoseIndex] && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(6px)',
              zIndex: 110,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setSelectedPoseIndex(null)}
          >
            <div
              className="neo-card"
              style={{
                maxWidth: '520px',
                width: '100%',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                background: '#ffffff',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Title Centered (Tanpa Tombol X) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Detail Pose #{selectedPoseIndex + 1}
                </h3>

                {/* Zoom Controls Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdatePoseZoom(poseZoomLevel - 0.2)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, minWidth: '40px', textAlign: 'center' }}>
                    {Math.round(poseZoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => handleUpdatePoseZoom(poseZoomLevel + 0.2)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    onClick={() => handleUpdatePoseZoom(1)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                  >
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Large Image Preview with Interactive Pan & Zoom */}
              <div
                onPointerDown={(e) => {
                  if (selectedPoseIndex === null) return;
                  handleSlotPointerDown(e, selectedPoseIndex);
                }}
                onPointerMove={(e) => {
                  if (selectedPoseIndex === null) return;
                  handleSlotPointerMove(e, selectedPoseIndex);
                }}
                onPointerUp={(e) => {
                  if (selectedPoseIndex === null) return;
                  isDraggingSlotRef.current = false;
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch { }
                }}
                onPointerCancel={(e) => {
                  if (selectedPoseIndex === null) return;
                  isDraggingSlotRef.current = false;
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch { }
                }}
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  maxHeight: '44vh',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid var(--neo-black)',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDraggingSlotRef.current ? 'grabbing' : 'grab',
                  position: 'relative',
                  touchAction: 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedPhotos[selectedPoseIndex]!}
                  alt={`Pose ${selectedPoseIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${(photoOffsets[selectedPoseIndex]?.x || 0) * 120}px, ${(photoOffsets[selectedPoseIndex]?.y || 0) * 120}px) scale(${poseZoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isDraggingSlotRef.current ? 'none' : 'transform 0.12s ease',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                  }}
                >
                  <Move size={11} /> Geser Foto (Pan / Drag)
                </div>
              </div>

              {/* Pan 4-Way Controls & Reset */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--neo-black)', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--neo-black)' }}>
                  Atur Posisi (Pan):
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleUpdatePoseOffset(selectedPoseIndex, -0.05, 0)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Geser Kiri"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => handleUpdatePoseOffset(selectedPoseIndex, 0, -0.05)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Geser Atas"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => handleUpdatePoseOffset(selectedPoseIndex, 0, 0.05)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Geser Bawah"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => handleUpdatePoseOffset(selectedPoseIndex, 0.05, 0)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Geser Kanan"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={() => handleResetPoseOffset(selectedPoseIndex)}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Reset Posisi ke Tengah"
                  >
                    <span>Pusat</span>
                  </button>
                </div>
              </div>

              {/* Slider for Smooth Framing & Zoom Adjustment */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--neo-black)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: 'var(--neo-black)' }}>
                  <span>Sesuaikan Zoom Foto di Frame Template</span>
                  <span style={{ color: '#0284c7', fontWeight: 900 }}>{Math.round(poseZoomLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="3.0"
                  step="0.05"
                  value={poseZoomLevel}
                  onChange={(e) => handleUpdatePoseZoom(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${Math.round(((poseZoomLevel - 0.8) / (3.0 - 0.8)) * 100)}%, #e2e8f0 ${Math.round(((poseZoomLevel - 0.8) / (3.0 - 0.8)) * 100)}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
                <button
                  onClick={() => triggerUploadForSlot(selectedPoseIndex)}
                  className="neo-btn neo-btn-secondary"
                  style={{
                    padding: '9px',
                    fontSize: '0.82rem',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Upload / Ganti Foto dari Galeri"
                >
                  <FolderUp size={14} />
                  <span>Ganti File</span>
                </button>

                <button
                  onClick={() => retakeSingleSlot(selectedPoseIndex)}
                  className="neo-btn neo-btn-secondary"
                  style={{
                    padding: '9px',
                    fontSize: '0.82rem',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Foto Ulang dengan Kamera"
                >
                  <RotateCcw size={14} />
                  <span>Kamera</span>
                </button>

                <button
                  onClick={() => setSelectedPoseIndex(null)}
                  className="neo-btn neo-btn-primary"
                  style={{
                    padding: '9px',
                    fontSize: '0.82rem',
                    background: 'var(--neo-green)',
                    justifyContent: 'center',
                  }}
                >
                  <span>Selesai</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ================= MODAL 2: PHOTOSTRIP ZOOM LIGHTBOX ================= */}
      {
        isPhotostripZoomOpen && photostripPreviewUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(6px)',
              zIndex: 120,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsPhotostripZoomOpen(false)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '92vw',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: '2px solid var(--neo-black)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(0.75, prev - 0.25))}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>

                <span style={{ fontSize: '0.82rem', fontWeight: 900, minWidth: '50px', textAlign: 'center' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={() => setZoomLevel((prev) => Math.min(3.5, prev + 0.25))}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>

                <button
                  onClick={() => setZoomLevel(1)}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                >
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => setIsPhotostripZoomOpen(false)}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '0.8rem', marginLeft: '4px' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Zoomable Image Container */}
              <div
                style={{
                  maxHeight: '80vh',
                  maxWidth: '85vw',
                  overflow: 'auto',
                  padding: '8px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photostripPreviewUrl}
                  alt="Photostrip Zoom"
                  style={{
                    maxHeight: '75vh',
                    width: 'auto',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease',
                    borderRadius: '10px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
                  }}
                  onClick={() => setZoomLevel((prev) => (prev >= 2 ? 1 : prev + 0.5))}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* ================= MODAL 3: POP-UP PILIH DURASI WAKTU FOTO (STYLED LIKE GAMBAR 5) ================= */}
      <AnimatePresence>
        {isDurationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(5px)',
              zIndex: 115,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsDurationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="neo-card"
              style={{
                maxWidth: '460px',
                width: '100%',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#ffffff',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Centered (Tanpa Tombol X) */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Pilih Durasi
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  Atur jeda hitungan mundur sebelum kamera mengambil setiap pose
                </p>
              </div>

              {/* Option List Styled like Gambar 5 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { val: 3, title: '3 Detik / Pose', desc: 'Jeda cepat & praktis untuk pose spontan' },
                  { val: 5, title: '5 Detik / Pose', desc: 'Jeda pas untuk bersiap-siap dan berganti pose' },
                  { val: 7, title: '7 Detik / Pose', desc: 'Jeda lebih santai untuk foto bersama teman/grup' },
                  { val: 10, title: '10 Detik / Pose', desc: 'Jeda ekstra panjang untuk properti & gaya bebas' },
                ].map((item) => {
                  const isSel = timerDuration === item.val;
                  return (
                    <motion.div
                      key={item.val}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        setTimerDuration(item.val);
                        setIsDurationModalOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSel ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: isSel ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: isSel ? '#e0f2fe' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSel ? '#0284c7' : '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          <Clock size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {/* Selection Radio Circle Indicator */}
                      <div style={{ marginLeft: '10px', flexShrink: 0 }}>
                        {isSel ? (
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                            }}
                          >
                            <Check size={13} strokeWidth={3.5} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: '2px solid #cbd5e1',
                              background: '#ffffff',
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="neo-btn neo-btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                <span>Tutup</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: POP-UP FILTER KAMERA (STYLED LIKE GAMBAR 5) ================= */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(5px)',
              zIndex: 115,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsFilterModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="neo-card"
              style={{
                maxWidth: '480px',
                width: '100%',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#ffffff',
                maxHeight: '88vh',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Centered (Tanpa Tombol X) */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Filter
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  Pilih efek visual filter sebelum mulai mengambil foto
                </p>
              </div>

              {/* Search Filter Input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type="text"
                  placeholder="Cari filter..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              {/* Filter List Styled like Gambar 5 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  overflowY: 'auto',
                  maxHeight: '44vh',
                  paddingRight: '4px',
                }}
              >
                {FILTERS.filter((f) =>
                  f.name.toLowerCase().includes(filterSearch.toLowerCase())
                ).map((f) => {
                  const isSel = activeFilter === f.id;
                  const filterDescriptions: Record<string, string> = {
                    normal: 'Warna asli jernih dan natural',
                    'white-glow': 'Wajah tampak putih, cerah & glowing bersinar',
                    'snow-white': 'Efek memutihkan kulit wajah secara maksimal & mulus',
                    porcelain: 'Kulit putih halus seperti porselen & merona',
                    'korean-glow': 'Efek glowing halus & cerah ala idol Korea',
                    'korean-clean': 'Tampilan kulit mulus, bersih, dan terang',
                    'korean-film': 'Nuansa sinematik lembut & estetik',
                    vintage: 'Tone hangat retro klasik tahun 90-an',
                    mono: 'Hitam putih dramatis dengan kontras tinggi',
                    pastel: 'Warna pastel lembut dan manis',
                    sunset: 'Semburat hangat matahari senja keemasan',
                    cyberpunk: 'Nuansa neon futuristik ungu dan biru',
                    sepia: 'Sentuhan cokelat antik bergaya vintage klasik',
                    dramatic: 'Warna tajam, kontras tinggi & ekspresif',
                  };

                  return (
                    <motion.div
                      key={f.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        onChangeFilter(f.id);
                        setIsFilterModalOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isSel ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: isSel ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isSel ? '#e0f2fe' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSel ? '#0284c7' : '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          <Sparkles size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                            {filterDescriptions[f.id] || 'Filter efek foto'}
                          </span>
                        </div>
                      </div>

                      {/* Selection Radio Circle Indicator */}
                      <div style={{ marginLeft: '10px', flexShrink: 0 }}>
                        {isSel ? (
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                            }}
                          >
                            <Check size={13} strokeWidth={3.5} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: '2px solid #cbd5e1',
                              background: '#ffffff',
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="neo-btn neo-btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                <span>Tutup</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: PERINGATAN FOTO MASIH KOSONG (NEO-BRUTALIST CUSTOM POPUP) ================= */}
      <AnimatePresence>
        {isEmptyPhotoModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsEmptyPhotoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="neo-card"
              style={{
                maxWidth: '430px',
                width: '100%',
                padding: '26px 22px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                borderRadius: '18px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Warning Icon with Neo-Brutalist Border */}
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2.5px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  boxShadow: '3px 3px 0px var(--neo-black)',
                }}
              >
                <Camera size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '6px' }}>
                  Foto Masih Kosong
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.45, margin: 0 }}>
                  Silakan ambil foto dengan kamera live atau upload foto dari galeri terlebih dahulu sebelum melanjutkan ke hasil.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmptyPhotoModalOpen(false);
                    setInputMode('camera');
                    setSessionState('setup');
                  }}
                  className="neo-btn neo-btn-primary"
                  style={{
                    padding: '11px',
                    fontSize: '0.88rem',
                    background: 'var(--neo-green)',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Camera size={16} />
                  <span>Ambil Foto dengan Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEmptyPhotoModalOpen(false);
                    triggerBatchUpload();
                  }}
                  className="neo-btn neo-btn-secondary"
                  style={{
                    padding: '11px',
                    fontSize: '0.88rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <FolderUp size={16} />
                  <span>Upload Foto dari Galeri</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmptyPhotoModalOpen(false)}
                  className="neo-btn neo-btn-secondary"
                  style={{
                    padding: '8px',
                    fontSize: '0.82rem',
                    justifyContent: 'center',
                    border: '1.5px solid var(--neo-black)',
                    marginTop: '2px',
                  }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
