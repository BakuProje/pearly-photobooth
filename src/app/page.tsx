'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CameraView } from '@/components/CameraView';
import { ResultView } from '@/components/ResultView';
import { GalleryDrawer } from '@/components/GalleryDrawer';
import { CameraPermissionModal } from '@/components/CameraPermissionModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoBoothConfig,
  FilterType,
  GalleryItem,
} from '@/lib/types';

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

  // Check URL scan parameters
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const isScanMode =
          searchParams.get('mode') === 'scan' || searchParams.get('view') === 'result';

        if (isScanMode) {
          const savedScan = localStorage.getItem('snapbooth_scan_session');
          if (savedScan) {
            const parsed = JSON.parse(savedScan);
            if (parsed.photos && parsed.photos.length > 0) {
              setPhotos(parsed.photos);
              if (parsed.config) setConfig(parsed.config);
              setIsScanView(true);
              setIsViewingSavedSession(true);
              setCurrentStep('result');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading scan params', e);
    }
  }, []);

  // Load gallery from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snapbooth_gallery');
      if (saved) {
        const parsed: GalleryItem[] = JSON.parse(saved);
        const unique: GalleryItem[] = [];
        for (const item of parsed) {
          const exists = unique.some(
            (u) =>
              u.id === item.id ||
              (u.config?.selectedTemplateId === item.config?.selectedTemplateId &&
                u.photos?.length === item.photos?.length &&
                u.photos?.[0] === item.photos?.[0])
          );
          if (!exists) unique.push(item);
        }
        setGallery(unique);
      }
    } catch (e) {
      console.warn('Failed to load gallery', e);
    }
  }, []);

  const saveGalleryToStorage = (items: GalleryItem[]) => {
    setGallery(items);
    try {
      localStorage.setItem('snapbooth_gallery', JSON.stringify(items));
    } catch (e) {
      try {
        const pruned = items.slice(0, 10);
        setGallery(pruned);
        localStorage.setItem('snapbooth_gallery', JSON.stringify(pruned));
      } catch {}
    }
  };

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
    setGallery((prev) => {
      if (prev.some((g) => g.id === item.id)) return prev;
      const updated = [item, ...prev];
      saveGalleryToStorage(updated);
      return updated;
    });
  }, []);

  const handleDeleteGalleryItem = (id: string) => {
    const updated = gallery.filter((g) => g.id !== id);
    saveGalleryToStorage(updated);
  };

  const handleClearGallery = () => {
    saveGalleryToStorage([]);
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
