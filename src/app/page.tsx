'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CameraView } from '@/components/CameraView';
import { ResultView } from '@/components/ResultView';
import { SoftFileView } from '@/components/SoftFileView';
import { GalleryDrawer } from '@/components/GalleryDrawer';
import { CameraPermissionModal } from '@/components/CameraPermissionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  PhotoBoothConfig,
  FilterType,
  GalleryItem,
  SoftFileSession,
} from '@/lib/types';
import {
  getAllGalleryItems,
  saveGalleryItem,
  deleteGalleryItem,
  clearAllGalleryItems,
  getSoftFileSession,
} from '@/lib/storageManager';
import { getTemplateById } from '@/lib/templateManager';

const INITIAL_CONFIG: PhotoBoothConfig = {
  selectedTemplateId: 'template-1',
  filter: 'normal',
  headerText: 'PEARLY PHOTOBOOTH',
  footerText: 'MEMORIES • 2026',
  showDate: true,
  showWatermark: false,
  stickers: [],
  doodles: [],
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export default function Home() {
  // Step flow: 'welcome' (Gambar 1) -> 'select-template' (Gambar 2) -> 'camera' (Gambar 3/4) -> 'result' (Gambar 5/6/7/8)
  const [currentStep, setCurrentStep] = useState<
    'welcome' | 'select-template' | 'camera' | 'result'
  >('welcome');

  const [photos, setPhotos] = useState<string[]>([]);
  const [config, setConfig] = useState<PhotoBoothConfig>(INITIAL_CONFIG);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isScanView, setIsScanView] = useState(false);
  const [isViewingSavedSession, setIsViewingSavedSession] = useState(false);
  const [retakeSlotIndex, setRetakeSlotIndex] = useState<number | null>(null);
  const [activeSoftFileSession, setActiveSoftFileSession] = useState<SoftFileSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(false);
  const [sessionNotFound, setSessionNotFound] = useState<boolean>(false);

  // Check URL scan parameters (?session=<id> or legacy ?mode=scan)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const sessionId = searchParams.get('session');
        const isScanMode =
          searchParams.get('mode') === 'scan' || searchParams.get('view') === 'result';

        if (sessionId) {
          setIsCheckingSession(true);
          getSoftFileSession(sessionId)
            .then((sessionData) => {
              if (sessionData) {
                setActiveSoftFileSession(sessionData);
                setIsCheckingSession(false);
              } else {
                // Retry once after 600ms in case server is writing to disk
                setTimeout(() => {
                  getSoftFileSession(sessionId).then((retryData) => {
                    if (retryData) {
                      setActiveSoftFileSession(retryData);
                    } else {
                      setSessionNotFound(true);
                    }
                    setIsCheckingSession(false);
                  });
                }, 600);
              }
            })
            .catch(() => {
              setSessionNotFound(true);
              setIsCheckingSession(false);
            });
        } else if (isScanMode) {
          setIsCheckingSession(true);
          getSoftFileSession('last').then((sessionData) => {
            if (sessionData) {
              setActiveSoftFileSession(sessionData);
            } else {
              const savedScan = localStorage.getItem('snapbooth_scan_session');
              if (savedScan) {
                const parsed = JSON.parse(savedScan);
                if (parsed.photos && parsed.photos.length > 0) {
                  setActiveSoftFileSession({
                    id: 'scan_session',
                    templateId: parsed.config?.selectedTemplateId || 'template-1',
                    templateName: 'Pearly Photobooth',
                    photostripUrl: parsed.previewUrl || parsed.photos[0],
                    gifUrl: parsed.gifUrl || null,
                    photos: parsed.photos,
                    config: parsed.config || INITIAL_CONFIG,
                    createdAt: Date.now(),
                  });
                } else {
                  setSessionNotFound(true);
                }
              } else {
                setSessionNotFound(true);
              }
            }
            setIsCheckingSession(false);
          });
        }
      }
    } catch (e) {
      console.warn('Error reading scan params', e);
      setIsCheckingSession(false);
    }
  }, []);

  // Load gallery from IndexedDB (Persistent across refresh)
  useEffect(() => {
    getAllGalleryItems()
      .then((items) => {
        setGallery(items);
      })
      .catch((e) => {
        console.warn('Failed to load gallery from IndexedDB', e);
      });
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setConfig((prev) => ({ ...prev, selectedTemplateId: templateId }));
  };

  const handleStartSession = (mode: 'camera' | 'upload' = 'camera') => {
    setRetakeSlotIndex(null);
    setConfig((prev) => ({
      ...prev,
      filter: 'normal',
      brightness: 0,
      contrast: 0,
      saturation: 0,
      enhance: 0,
      highlights: 0,
      shadows: 0,
      fade: 0,
      warmth: 0,
    }));
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('camera');
  };

  const handlePhotosCompleted = (capturedPhotos: string[]) => {
    if (retakeSlotIndex !== null) {
      // Merged retaken photo into existing array
      const updated = [...photos];
      if (capturedPhotos[retakeSlotIndex]) {
        updated[retakeSlotIndex] = capturedPhotos[retakeSlotIndex];
      }
      setPhotos(updated);
      setRetakeSlotIndex(null);
    } else {
      setPhotos(capturedPhotos);
    }
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('result');
  };

  const handleRetakeSinglePhoto = (slotIdx: number) => {
    setRetakeSlotIndex(slotIdx);
    setCurrentStep('camera');
  };

  const handleRetakeNewSession = () => {
    setPhotos([]);
    setConfig((prev) => ({
      ...INITIAL_CONFIG,
      selectedTemplateId: prev.selectedTemplateId || 'template-1',
    }));
    setRetakeSlotIndex(null);
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('select-template');
  };

  const handleSaveToGallery = React.useCallback((item: GalleryItem) => {
    saveGalleryItem(item);
    setGallery((prev) => {
      if (prev.some((g) => g.id === item.id)) return prev;
      return [item, ...prev];
    });
  }, []);

  const handleDeleteGalleryItem = async (id: string) => {
    await deleteGalleryItem(id);
    setGallery((prev) => prev.filter((g) => g.id !== id));
  };

  const handleClearGallery = async () => {
    await clearAllGalleryItems();
    setGallery([]);
  };

  const handleLoadSessionFromGallery = (item: GalleryItem) => {
    if (item.photos && item.photos.length > 0) {
      const template = getTemplateById(item.config?.selectedTemplateId);
      const softSession: SoftFileSession = {
        id: item.id,
        createdAt: item.createdAt || Date.now(),
        templateId: item.config?.selectedTemplateId || 'template-1',
        templateName: template.name,
        photos: item.photos,
        photostripUrl: item.previewUrl,
        gifUrl: null,
        config: item.config,
      };
      setActiveSoftFileSession(softSession);
      setIsGalleryOpen(false);
    }
  };

  // 1. If currently checking scanned QR session: Render vintage parchment loader
  if (isCheckingSession) {
    return (
      <main
        className="vintage-parchment-bg"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#1a0f07',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(245, 238, 225, 0.94)',
            border: '3px solid #3d2616',
            borderRadius: '16px',
            padding: '36px 28px',
            maxWidth: '400px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(45, 25, 12, 0.35)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ebd7bc',
              border: '2px solid #3d2616',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2 size={32} className="animate-spin text-amber-950" />
          </div>
          <div>
            <h2
              className="font-gothic"
              style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1a0f07', margin: '0 0 6px 0' }}
            >
              Memuat Soft File Anda...
            </h2>
            <p
              className="font-vintage-serif"
              style={{ fontSize: '0.88rem', color: '#4a331f', margin: 0, fontWeight: 600 }}
            >
              Menyiapkan photostrip HD, animasi GIF & foto satuan per pose
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 2. If session failed to load:
  if (sessionNotFound) {
    return (
      <main
        className="vintage-parchment-bg"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#1a0f07',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(245, 238, 225, 0.94)',
            border: '3px solid #3d2616',
            borderRadius: '16px',
            padding: '36px 24px',
            maxWidth: '420px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(45, 25, 12, 0.35)',
          }}
        >
          <div style={{ fontSize: '2.6rem' }}>📷</div>
          <h2
            className="font-gothic"
            style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1a0f07', margin: 0 }}
          >
            Soft File Belum Tersedia
          </h2>
          <p
            className="font-vintage-serif"
            style={{ fontSize: '0.88rem', color: '#4a331f', margin: 0 }}
          >
            Pastikan proses foto telah selesai pada layar photobooth, atau coba scan ulang barcode Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSessionNotFound(false);
              window.location.reload();
            }}
            className="btn-vintage-tag"
            style={{
              marginTop: '8px',
              padding: '10px 48px 10px 32px',
              fontSize: '1.35rem',
            }}
          >
            Coba Muat Ulang ↺
          </button>
        </div>
      </main>
    );
  }

  // 3. If visiting via scanned QR Barcode with dedicated SoftFile session ID:
  if (activeSoftFileSession) {
    return (
      <main style={{ minHeight: '100vh', background: '#ebd7bc' }}>
        <SoftFileView
          session={activeSoftFileSession}
          onStartNewSession={() => {
            setActiveSoftFileSession(null);
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
            handleRetakeNewSession();
            setCurrentStep('welcome');
          }}
        />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#ebd7bc',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {/* =========================================================================
              SCREEN 1: Gambar 1 - Welcome Screen with bgstart.png & Gothic Start Tag Button
              ========================================================================= */}
          {currentStep === 'welcome' && (
            <motion.div
              key="step-welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: '100vw',
                height: '100vh',
                minHeight: '100vh',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
                backgroundImage: "url('/images/bgstart.png')",
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#f5eee1',
                padding: '24px 16px',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {/* Vintage Parchment Arrow Banner "start" Button (Large) */}
              <button
                type="button"
                onClick={() => setCurrentStep('select-template')}
                className="btn-vintage-tag"
                style={{
                  position: 'absolute',
                  bottom: '12vh',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  minWidth: '260px',
                  fontSize: 'clamp(2.4rem, 5.5vw, 3.4rem)',
                  padding: '16px 74px 16px 54px',
                  boxShadow: '0 10px 28px rgba(45, 25, 12, 0.45)',
                  letterSpacing: '2px',
                }}
              >
                start
              </button>
            </motion.div>
          )}

          {/* =========================================================================
              SCREEN 2: Gambar 2 - Template / Frame Selector & LANJUT Button
              ========================================================================= */}
          {currentStep === 'select-template' && (
            <motion.div
              key="step-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <TemplateSelector
                selectedTemplateId={config.selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
                onStartSession={handleStartSession}
                galleryCount={gallery.length}
                onOpenGallery={() => setIsGalleryOpen(true)}
              />
            </motion.div>
          )}

          {/* =========================================================================
              SCREEN 3 & 4: Gambar 3 & 4 - Camera Standby & Live Shooting with Paw Button
              ========================================================================= */}
          {currentStep === 'camera' && (
            <motion.div
              key="step-camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <CameraView
                selectedTemplateId={config.selectedTemplateId}
                config={config}
                onChangeConfig={setConfig}
                onBackToTemplateSelect={() => setCurrentStep('select-template')}
                onPhotosCompleted={handlePhotosCompleted}
                activeFilter={config.filter}
                onChangeFilter={(filter: FilterType) =>
                  setConfig((prev) => ({ ...prev, filter }))
                }
                retakeSlotIndex={retakeSlotIndex}
                existingPhotos={photos}
              />
            </motion.div>
          )}

          {/* =========================================================================
              SCREEN 5, 6, 7, 8: Gambar 5 to 8 - Results, Retake, Editor, & Barcode
              ========================================================================= */}
          {currentStep === 'result' && (
            <motion.div
              key="step-result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <ResultView
                photos={photos}
                config={config}
                onChangeConfig={setConfig}
                isScanView={isScanView}
                disableAutoSave={isViewingSavedSession}
                onRetakeNewSession={handleRetakeNewSession}
                onRetakeSinglePhoto={handleRetakeSinglePhoto}
                onSaveToGallery={handleSaveToGallery}
                onOpenGallery={() => setIsGalleryOpen(true)}
                galleryCount={gallery.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={gallery}
        onDeleteItem={handleDeleteGalleryItem}
        onClearAll={handleClearGallery}
        onSelectSession={handleLoadSessionFromGallery}
      />

      <CameraPermissionModal />
    </main>
  );
}
