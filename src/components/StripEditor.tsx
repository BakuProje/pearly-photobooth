'use client';

import React, { useState, useRef } from 'react';
import {
  PhotoBoothConfig,
  PhotoboothTemplate,
  FilterType,
  StickerItem,
} from '@/lib/types';
import { TEMPLATES, FILTERS } from '@/lib/constants';
import { StickerPicker } from './StickerPicker';
import { DoodleCanvas } from './DoodleCanvas';
import {
  LayoutTemplate,
  Sparkles,
  Smile,
  PenTool,
  Sliders,
  ArrowLeft,
  Download,
  Trash2,
  Check,
} from 'lucide-react';

interface StripEditorProps {
  photos: string[];
  config: PhotoBoothConfig;
  onChangeConfig: (newConfig: PhotoBoothConfig) => void;
  onBackToCamera: () => void;
  onOpenExport: () => void;
}

export const StripEditor: React.FC<StripEditorProps> = ({
  photos,
  config,
  onChangeConfig,
  onBackToCamera,
  onOpenExport,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'filter' | 'stickers' | 'adjust'>('template');
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isDoodleMode, setIsDoodleMode] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTemplate: PhotoboothTemplate =
    TEMPLATES.find((t) => t.id === config.selectedTemplateId) || TEMPLATES[0];

  const selectedFilter =
    FILTERS.find((f) => f.id === config.filter) || FILTERS[0];

  const updateConfig = (partial: Partial<PhotoBoothConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  // Sticker Handlers
  const handleAddSticker = (stickerText: string) => {
    const newSticker: StickerItem = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      src: stickerText,
      isEmoji: true,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    };
    updateConfig({
      stickers: [...config.stickers, newSticker],
    });
    setSelectedStickerId(newSticker.id);
  };

  const handleUpdateSticker = (id: string, updates: Partial<StickerItem>) => {
    updateConfig({
      stickers: config.stickers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleDeleteSticker = (id: string) => {
    updateConfig({
      stickers: config.stickers.filter((s) => s.id !== id),
    });
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Dragging Sticker Logic
  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    stickerId: string
  ) => {
    if (isDoodleMode) return;
    e.stopPropagation();
    setSelectedStickerId(stickerId);

    const container = previewContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const targetSticker = config.stickers.find((s) => s.id === stickerId);
    if (!targetSticker) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialStickerX = targetSticker.x;
    const initialStickerY = targetSticker.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaXPercent = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startY) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, initialStickerX + deltaXPercent));
      const newY = Math.max(0, Math.min(100, initialStickerY + deltaYPercent));

      handleUpdateSticker(stickerId, { x: newX, y: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const filterStyleString = `${selectedFilter.cssFilter} brightness(${1 + config.brightness / 100}) contrast(${1 + config.contrast / 100}) saturate(${1 + config.saturation / 100})`;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div className="soft-card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBackToCamera} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Kamera</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>
            {currentTemplate.name}
          </span>
          <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'var(--brand-blue-100)',
            color: 'var(--brand-blue-700)',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            {currentTemplate.category}
          </span>
        </div>

        <button onClick={onOpenExport} className="btn btn-primary" style={{ padding: '11px 26px', fontSize: '1rem' }}>
          <Download size={18} />
          <span>Ekspor & Unduh</span>
        </button>
      </div>

      {/* Main Studio Grid: Toolbar (Left) + Interactive Template Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Customization Tools */}
        <div className="soft-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--brand-blue-50)', padding: '5px', borderRadius: '16px', gap: '4px', border: '1px solid var(--border-blue)' }}>
            <button
              onClick={() => setActiveTab('template')}
              className={`btn ${activeTab === 'template' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 6px', fontSize: '0.8rem' }}
            >
              <LayoutTemplate size={14} /> Template
            </button>
            <button
              onClick={() => setActiveTab('filter')}
              className={`btn ${activeTab === 'filter' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 6px', fontSize: '0.8rem' }}
            >
              <Sparkles size={14} /> Filter
            </button>
            <button
              onClick={() => setActiveTab('stickers')}
              className={`btn ${activeTab === 'stickers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 6px', fontSize: '0.8rem' }}
            >
              <Smile size={14} /> Stiker
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`btn ${activeTab === 'adjust' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 6px', fontSize: '0.8rem' }}
            >
              <Sliders size={14} /> Cahaya
            </button>
          </div>

          {/* Tab 1: Template Switcher */}
          {activeTab === 'template' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>Ganti Template Frame</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10 Pilihan Desain</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '420px', overflowY: 'auto', padding: '4px' }}>
                {TEMPLATES.map((tmpl, idx) => {
                  const isSel = config.selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => updateConfig({ selectedTemplateId: tmpl.id })}
                      style={{
                        padding: '8px',
                        borderRadius: '14px',
                        background: isSel ? 'var(--brand-blue-50)' : '#ffffff',
                        border: isSel ? '2px solid var(--brand-blue-600)' : '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSel ? '0 4px 14px rgba(2, 132, 199, 0.2)' : 'var(--shadow-soft-sm)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tmpl.imageSrc}
                          alt={tmpl.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isSel ? 'var(--brand-blue-700)' : 'var(--text-main)' }}>
                        Template {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Filters */}
          {activeTab === 'filter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>Pilihan Filter Warna</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {FILTERS.map((f) => {
                  const isSel = config.filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateConfig({ filter: f.id })}
                      style={{
                        padding: '10px',
                        borderRadius: '14px',
                        background: isSel ? 'var(--brand-blue-50)' : '#ffffff',
                        border: isSel ? '2px solid var(--brand-blue-600)' : '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'left',
                        boxShadow: isSel ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'var(--shadow-soft-sm)',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                          filter: f.cssFilter,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{f.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Stickers & Doodles */}
          {activeTab === 'stickers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>Stiker & Coretan</h4>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsStickerPickerOpen(true)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <Smile size={16} /> + Tambah Stiker
                </button>

                <button
                  onClick={() => setIsDoodleMode(!isDoodleMode)}
                  className={`btn ${isDoodleMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '10px' }}
                >
                  <PenTool size={16} /> {isDoodleMode ? 'Tutup Gambar' : 'Coretan Doodle'}
                </button>
              </div>

              {selectedStickerId && (
                <div className="soft-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--brand-blue-50)', border: '1px solid var(--border-blue)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>Edit Stiker Aktif</span>
                    <button
                      onClick={() => handleDeleteSticker(selectedStickerId)}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Hapus Stiker"
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>

                  {(() => {
                    const sel = config.stickers.find((s) => s.id === selectedStickerId);
                    if (!sel) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Ukuran:</span>
                            <span>{Math.round(sel.scale * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.5"
                            step="0.1"
                            value={sel.scale}
                            onChange={(e) => handleUpdateSticker(selectedStickerId, { scale: parseFloat(e.target.value) })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Rotasi:</span>
                            <span>{sel.rotation}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={sel.rotation}
                            onChange={(e) => handleUpdateSticker(selectedStickerId, { rotation: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 <em>Tips: Klik stiker lalu geser (drag) di atas foto untuk memindahkan posisinya!</em>
              </p>
            </div>
          )}

          {/* Tab 4: Adjustments */}
          {activeTab === 'adjust' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-blue-700)' }}>Pengaturan Cahaya & Warna</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Kecerahan:</span>
                  <span>{config.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.brightness}
                  onChange={(e) => updateConfig({ brightness: parseInt(e.target.value) })}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${config.brightness + 50}%, #e2e8f0 ${config.brightness + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Kontras:</span>
                  <span>{config.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.contrast}
                  onChange={(e) => updateConfig({ contrast: parseInt(e.target.value) })}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${config.contrast + 50}%, #e2e8f0 ${config.contrast + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Saturasi:</span>
                  <span>{config.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.saturation}
                  onChange={(e) => updateConfig({ saturation: parseInt(e.target.value) })}
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${config.saturation + 50}%, #e2e8f0 ${config.saturation + 50}%, #e2e8f0 100%)`,
                    accentColor: '#0284c7',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <button
                onClick={() => updateConfig({ brightness: 0, contrast: 0, saturation: 0 })}
                className="btn btn-secondary"
                style={{ padding: '8px', fontSize: '0.8rem', marginTop: '6px' }}
              >
                Reset Nilai Cahaya
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Template Render Container */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '620px',
            background: 'var(--brand-blue-50)',
            borderRadius: 'var(--radius-xl)',
            padding: '30px 20px',
            border: '1.5px solid var(--border-blue)',
            boxShadow: 'var(--shadow-soft-md)',
            overflow: 'auto',
          }}
        >
          {/* Template Frame Wrapper */}
          <div
            ref={previewContainerRef}
            id="photobooth-strip-preview"
            style={{
              position: 'relative',
              width: '420px',
              maxWidth: '100%',
              aspectRatio: currentTemplate.aspectRatio,
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px -10px rgba(2, 132, 199, 0.25), 0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid var(--border-soft)',
              userSelect: 'none',
            }}
          >
            {/* 1. Underlying Photos positioned in exact slots */}
            {currentTemplate.slots.map((slot, sIdx) => {
              let photoIndex = sIdx;
              if (currentTemplate.isTwin && photos.length <= currentTemplate.requiredPhotos) {
                photoIndex = sIdx % currentTemplate.requiredPhotos;
              }
              const photoSrc = photos[photoIndex] || photos[photos.length - 1];

              return (
                <div
                  key={sIdx}
                  style={{
                    position: 'absolute',
                    top: `${slot.y}%`,
                    left: `${slot.x}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                    borderRadius: slot.borderRadius ? `${slot.borderRadius / 4}px` : '0px',
                    overflow: 'hidden',
                    background: '#e2e8f0',
                    zIndex: 10,
                  }}
                >
                  {photoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoSrc}
                      alt={`Slot ${sIdx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: filterStyleString,
                        transform: `translate(${(config.photoOffsets?.[sIdx]?.x || 0) * 100}%, ${(config.photoOffsets?.[sIdx]?.y || 0) * 100}%) scale(${config.photoScales?.[sIdx] || 1})`,
                        transformOrigin: 'center center',
                      }}
                    />
                  ) : null}
                </div>
              );
            })}

            {/* 2. Template Frame PNG overlay on TOP of photos */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTemplate.imageSrc}
              alt={currentTemplate.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            />

            {/* 3. Interactive Doodle Canvas */}
            <DoodleCanvas
              width={420}
              height={630}
              doodles={config.doodles}
              onUpdateDoodles={(doodles) => updateConfig({ doodles })}
              isEnabled={isDoodleMode}
              onToggleEnabled={() => setIsDoodleMode(false)}
            />

            {/* 4. Interactive User Stickers */}
            {config.stickers.map((sticker) => {
              const isSelected = selectedStickerId === sticker.id;
              return (
                <div
                  key={sticker.id}
                  onPointerDown={(e) => handleStickerPointerDown(e, sticker.id)}
                  style={{
                    position: 'absolute',
                    top: `${sticker.y}%`,
                    left: `${sticker.x}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale || 1}) rotate(${sticker.rotation || 0}deg)`,
                    cursor: isDoodleMode ? 'default' : 'grab',
                    zIndex: isSelected ? 35 : 32,
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                >
                  <div
                    style={{
                      border: isSelected && !isDoodleMode ? '2px dashed var(--brand-blue-600)' : '2px solid transparent',
                      borderRadius: '10px',
                      padding: '4px',
                      background: sticker.src.length > 3 ? '#ffffff' : 'transparent',
                      color: sticker.src.length > 3 ? 'var(--brand-blue-700)' : '#ffffff',
                      boxShadow: sticker.src.length > 3 ? '0 4px 14px rgba(2, 132, 199, 0.2)' : 'none',
                      fontSize: sticker.src.length > 3 ? '0.78rem' : '2.2rem',
                      fontWeight: sticker.src.length > 3 ? 900 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sticker.src}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticker Picker Modal */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onSelectSticker={handleAddSticker}
      />
    </div>
  );
};
