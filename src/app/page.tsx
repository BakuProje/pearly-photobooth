'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CameraView } from '@/components/CameraView';
import { ResultView } from '@/components/ResultView';
import { GalleryDrawer } from '@/components/GalleryDrawer';
import { CameraPermissionModal } from '@/components/CameraPermissionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
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

const RESET_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 Jam (14.400.000 ms)

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'select-template' | 'camera' | 'result'>('select-template');
  const [photos, setPhotos] = useState<string[]>([]);
  const [config, setConfig] = useState<PhotoBoothConfig>(INITIAL_CONFIG);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isScanView, setIsScanView] = useState(false);
  const [isViewingSavedSession, setIsViewingSavedSession] = useState(false);
  const [sessionQuota, setSessionQuota] = useState<number>(5);
  const [quotaDepletedAt, setQuotaDepletedAt] = useState<number | null>(null);
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);


  useEffect(() => {
    const updateQuotaAndTimer = () => {
      try {
        const savedQuota = localStorage.getItem('snapbooth_photo_quota');
        const savedDepletedAt = localStorage.getItem('snapbooth_quota_depleted_at');

        let currentQuota = savedQuota !== null ? parseInt(savedQuota, 10) : 5;
        if (currentQuota > 5) currentQuota = 5;
        let depletedTime = savedDepletedAt !== null ? parseInt(savedDepletedAt, 10) : null;

        if (currentQuota <= 0) {
          if (depletedTime) {
            const elapsed = Date.now() - depletedTime;
            if (elapsed >= RESET_COOLDOWN_MS) {
              currentQuota = 5;
              depletedTime = null;
              localStorage.setItem('snapbooth_photo_quota', '5');
              localStorage.removeItem('snapbooth_quota_depleted_at');
              setSessionQuota(5);
              setQuotaDepletedAt(null);
              setTimeRemainingStr('');
              return;
            } else {
              const remainingMs = RESET_COOLDOWN_MS - elapsed;
              const hours = Math.floor(remainingMs / (1000 * 60 * 60));
              const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
              const pad = (n: number) => n.toString().padStart(2, '0');
              setTimeRemainingStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
            }
          } else {
            const now = Date.now();
            localStorage.setItem('snapbooth_quota_depleted_at', now.toString());
            depletedTime = now;
            setTimeRemainingStr('04:00:00');
          }
        } else {
          setTimeRemainingStr('');
        }

        setSessionQuota(currentQuota);
        setQuotaDepletedAt(depletedTime);
      } catch (err) {
        console.warn('Error syncing quota', err);
      }
    };

    updateQuotaAndTimer();
    const interval = setInterval(updateQuotaAndTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetQuota = () => {
    setSessionQuota(5);
    setQuotaDepletedAt(null);
    setTimeRemainingStr('');
    try {
      localStorage.setItem('snapbooth_photo_quota', '5');
      localStorage.removeItem('snapbooth_quota_depleted_at');
    } catch { }
    setIsQuotaModalOpen(false);
  };

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

  const [sessionStartMode, setSessionStartMode] = useState<'camera' | 'upload'>('camera');

  const handleStartSession = (mode: 'camera' | 'upload' = 'camera') => {
    setSessionStartMode(mode);

    if (sessionQuota <= 0) {
      if (quotaDepletedAt && Date.now() - quotaDepletedAt >= RESET_COOLDOWN_MS) {
        setSessionQuota(4);
        setQuotaDepletedAt(null);
        setTimeRemainingStr('');
        try {
          localStorage.setItem('snapbooth_photo_quota', '4');
          localStorage.removeItem('snapbooth_quota_depleted_at');
        } catch { }
        setIsScanView(false);
        setIsViewingSavedSession(false);
        setCurrentStep('camera');
        return;
      }
      setIsQuotaModalOpen(true);
      return;
    }

    const newQuota = Math.max(0, sessionQuota - 1);
    setSessionQuota(newQuota);
    try {
      localStorage.setItem('snapbooth_photo_quota', newQuota.toString());
      if (newQuota === 0) {
        const now = Date.now();
        setQuotaDepletedAt(now);
        localStorage.setItem('snapbooth_quota_depleted_at', now.toString());
      }
    } catch { }

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

  const handleSaveToGallery = React.useCallback((item: GalleryItem) => {
    setGallery((prev) => {
      if (prev.some((g) => g.id === item.id)) return prev;

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
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {currentStep === 'select-template' && (
        <Navbar
          galleryCount={gallery.length}
          onOpenGallery={() => setIsGalleryOpen(true)}
          sessionQuota={sessionQuota}
          timeRemainingStr={timeRemainingStr}
          onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: currentStep === 'select-template' ? 'visible' : 'hidden' }}>
        <AnimatePresence mode="wait">
          {currentStep === 'select-template' && (
            <motion.div
              key="step-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
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
                initialMode={sessionStartMode}
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

      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={gallery}
        onDeleteItem={handleDeleteGalleryItem}
        onClearAll={handleClearGallery}
        onSelectSession={handleLoadSessionFromGallery}
      />

      {/* ================= MODAL KUOTA FOTO HABIS (DENGAN COUNTDOWN 8 JAM) ================= */}
      <AnimatePresence>
        {isQuotaModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setIsQuotaModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
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
                borderRadius: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  border: '2.5px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  boxShadow: '3px 3px 0px var(--neo-black)',
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '6px' }}>
                  Batas 5x Sesi Foto Telah Habis
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.45 }}>
                  Credit sesi foto Anda telah habis (5/5 kali). Kuota foto akan direset otomatis menjadi 5x sesi setelah waktu tunggu 4 jam selesai.
                </p>
              </div>


              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid var(--neo-black)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '2.5px 2.5px 0px var(--neo-black)',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  Waktu Reset Otomatis 4 Jam
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.45rem', fontWeight: 900, color: '#dc2626' }}>
                  <Clock size={22} />
                  <span>{timeRemainingStr || '04:00:00'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px', width: '100%', marginTop: '4px' }}>
                <button
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '10px', fontSize: '0.86rem', justifyContent: 'center' }}
                >
                  Tutup
                </button>
                <a
                  href="https://wa.me/6281527641306?text=Halo%20Admin%20Snapbooth,%20saya%20ingin%20reset%20credits%20foto%20saya."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn neo-btn-primary"
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.88rem',
                    background: '#22c55e',
                    color: '#ffffff',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 175.216 175.552"
                    width="20"
                    height="20"
                    style={{ flexShrink: 0 }}
                  >
                    <defs>
                      <linearGradient id="wa-b" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#57d163" />
                        <stop offset="1" stopColor="#23b33a" />
                      </linearGradient>
                      <filter id="wa-a" width="1.115" height="1.114" x="-.057" y="-.057" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="3.531" />
                      </filter>
                    </defs>
                    <path fill="#b3b3b3" d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0" filter="url(#wa-a)" />
                    <path fill="#fff" d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z" />
                    <path fill="url(#wa-b)" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z" />
                    <path fill="url(#wa-b)" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z" />
                    <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647" />
                  </svg>
                  <span>Reset Credits</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CameraPermissionModal />
    </main>
  );
}
