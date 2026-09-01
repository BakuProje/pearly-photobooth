'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CameraView } from '@/components/CameraView';
import { ResultView } from '@/components/ResultView';
import { GalleryDrawer } from '@/components/GalleryDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoBoothConfig,
  FilterType,
  GalleryItem,
} from '@/lib/types';

const INITIAL_CONFIG: PhotoBoothConfig = {
  selectedTemplateId: 'template-1',
  filter: 'normal',
  headerText: 'SNAPBOOTH',
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
  const [currentStep, setCurrentStep] = useState<'select-template' | 'camera' | 'result'>('select-template');
  const [photos, setPhotos] = useState<string[]>([]);
  const [config, setConfig] = useState<PhotoBoothConfig>(INITIAL_CONFIG);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isScanView, setIsScanView] = useState(false);
  const [isViewingSavedSession, setIsViewingSavedSession] = useState(false);

  // Check if opened via QR Scan mode or normal session
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const isScanMode = searchParams.get('mode') === 'scan' || searchParams.get('view') === 'result';

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

  // Load gallery from localStorage on mount (with auto-deduplication)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snapbooth_gallery');
      if (saved) {
        const parsed: GalleryItem[] = JSON.parse(saved);
        // Filter out accidental duplicates
        const unique: GalleryItem[] = [];
        for (const item of parsed) {
          const exists = unique.some((u) =>
            u.id === item.id ||
            (u.config?.selectedTemplateId === item.config?.selectedTemplateId &&
              u.photos?.length === item.photos?.length &&
              u.photos?.[0] === item.photos?.[0])
          );
          if (!exists) unique.push(item);
        }
        setGallery(unique);
        if (unique.length !== parsed.length) {
          localStorage.setItem('snapbooth_gallery', JSON.stringify(unique));
        }
      }
    } catch (e) {
      console.warn('Failed to load gallery from storage', e);
    }
  }, []);

  const saveGalleryToStorage = (items: GalleryItem[]) => {
    setGallery(items);
    try {
      localStorage.setItem('snapbooth_gallery', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist gallery to storage, trimming oldest items', e);
      try {
        const pruned = items.slice(0, 10);
        setGallery(pruned);
        localStorage.setItem('snapbooth_gallery', JSON.stringify(pruned));
      } catch (err2) {
        console.warn('LocalStorage quota still exceeded', err2);
      }
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setConfig((prev) => ({ ...prev, selectedTemplateId: templateId }));
  };

  const handleStartSession = () => {
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('camera');
  };

  const handlePhotosCompleted = (capturedPhotos: string[]) => {
    setPhotos(capturedPhotos);
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('result');
  };

  const handleRetakeNewSession = () => {
    setPhotos([]);
    setIsScanView(false);
    setIsViewingSavedSession(false);
    setCurrentStep('select-template');
  };

  const handleSaveToGallery = (item: GalleryItem) => {
    setGallery((prev) => {
      // 1. Avoid duplicate by ID
      if (prev.some((g) => g.id === item.id)) return prev;

      // 2. Avoid duplicate by exact photos and template
      const isDuplicate = prev.some((g) =>
        g.config.selectedTemplateId === item.config.selectedTemplateId &&
        g.photos.length === item.photos.length &&
        g.photos.every((p, idx) => p === item.photos[idx])
      );
      if (isDuplicate) return prev;

      const updated = [item, ...prev];
      saveGalleryToStorage(updated);
      return updated;
    });
  };

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
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {/* Top Navbar: only shown on Step 1 (Pilih Template) */}
      {currentStep === 'select-template' && (
        <Navbar
          galleryCount={gallery.length}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      )}

      {/* 3-Step Dynamic Viewport with Framer Motion */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {currentStep === 'select-template' && (
            <motion.div
              key="step-select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <TemplateSelector
                selectedTemplateId={config.selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
                onStartSession={handleStartSession}
              />
            </motion.div>
          )}

          {currentStep === 'camera' && (
            <motion.div
              key="step-camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <CameraView
                selectedTemplateId={config.selectedTemplateId}
                config={config}
                onChangeConfig={setConfig}
                onBackToTemplateSelect={() => setCurrentStep('select-template')}
                onPhotosCompleted={handlePhotosCompleted}
                activeFilter={config.filter}
                onChangeFilter={(filter: FilterType) => setConfig((prev) => ({ ...prev, filter }))}
              />
            </motion.div>
          )}

          {currentStep === 'result' && (
            <motion.div
              key="step-result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <ResultView
                photos={photos}
                config={config}
                isScanView={isScanView}
                disableAutoSave={isViewingSavedSession}
                onRetakeNewSession={handleRetakeNewSession}
                onSaveToGallery={handleSaveToGallery}
                onOpenGallery={() => setIsGalleryOpen(true)}
                galleryCount={gallery.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Session Gallery Drawer */}
      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={gallery}
        onDeleteItem={handleDeleteGalleryItem}
        onClearAll={handleClearGallery}
        onSelectSession={handleLoadSessionFromGallery}
      />
    </main>
  );
}
