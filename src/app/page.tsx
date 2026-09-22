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
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.has('session') || sp.get('mode') === 'scan' || sp.get('view') === 'result';
    }
    return false;
  });
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
      setPhotos(item.photos);
      if (item.config) setConfig(item.config);
      setIsScanView(false);
      setIsViewingSavedSession(true);
      setIsGalleryOpen(false);
      setCurrentStep('result');
    }
  };

  // 1. If currently checking scanned QR session: Render sleek loader (NEVER show Welcome "MULAI" screen)
  if (isCheckingSession) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#0f172a',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '2.5px solid #0f172a',
            borderRadius: '24px',
            padding: '36px 28px',
            maxWidth: '380px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#38bdf8',
              border: '2.5px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 0 #0f172a',
            }}
          >
            <Loader2 size={32} className="animate-spin text-slate-900" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              Memuat Soft File Anda...
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, fontWeight: 600 }}>
              Menyiapkan photostrip HD, animasi GIF & foto satuan per pose 📸
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
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#0f172a',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '2.5px solid #0f172a',
            borderRadius: '24px',
            padding: '36px 24px',
            maxWidth: '400px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div style={{ fontSize: '2.4rem' }}>📷</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Soft File Belum Tersedia
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Pastikan proses foto telah selesai pada layar photobooth, atau coba scan ulang barcode Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSessionNotFound(false);
              window.location.reload();
            }}
            style={{
              marginTop: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 900,
              fontSize: '0.95rem',
              border: '2px solid #0f172a',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #0f172a',
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
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)' }}>
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
        background: '#ffffff',
      }}
    >
      {/* Navbar only shown when in template selector */}
      {currentStep === 'select-template' && (
        <Navbar
          galleryCount={gallery.length}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {/* =========================================================================
              SCREEN 1: Gambar 1 - Welcome Screen with Script Title & Curved MULAI
              ========================================================================= */}
          {currentStep === 'welcome' && (
            <motion.div
              key="step-welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: '#ffffff',
                padding: '24px 16px',
              }}
            >
              {/* Script Title as in Gambar 1 */}
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <h1
                  className="font-script"
                  style={{
                    fontSize: 'clamp(3.8rem, 11vw, 6.8rem)',
                    color: '#1a1a1a',
                    lineHeight: 1.05,
                    margin: 0,
                    letterSpacing: '0.5px',
                  }}
                >
                  Pearly Booth
                </h1>
              </div>

              {/* Curved Semi-Circle Button "MULAI" as in Gambar 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep('select-template')}
                className="btn-mulai-curved"
              >
                MULAI
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
