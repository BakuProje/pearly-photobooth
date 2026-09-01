'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { STICKER_LIBRARY } from '@/lib/constants';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (stickerTextOrEmoji: string) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Cute & Anime');
  const [customTextBadge, setCustomTextBadge] = useState<string>('');

  if (!isOpen) return null;

  const currentPack = STICKER_LIBRARY.find((c) => c.category === activeCategory) || STICKER_LIBRARY[0];

  const handleAddCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTextBadge.trim()) {
      onSelectSticker(customTextBadge.trim().toUpperCase());
      setCustomTextBadge('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <div
        className="soft-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: 'var(--shadow-soft-lg)',
          border: '1px solid var(--border-blue)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--brand-blue-600)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Pilih Stiker & Badge</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {STICKER_LIBRARY.map((cat) => {
            const isSel = activeCategory === cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`btn ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem', flexShrink: 0 }}
              >
                {cat.category}
              </button>
            );
          })}
        </div>

        {/* Sticker Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeCategory === 'Cute Badges' ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: '12px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {currentPack.items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectSticker(item);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: activeCategory === 'Cute Badges' ? '12px 14px' : '14px',
                borderRadius: '14px',
                background: 'var(--brand-blue-50)',
                border: '1px solid var(--border-soft)',
                cursor: 'pointer',
                fontSize: activeCategory === 'Cute Badges' ? '0.85rem' : '1.8rem',
                fontWeight: activeCategory === 'Cute Badges' ? 800 : 400,
                color: 'var(--brand-blue-700)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--brand-blue-400)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'var(--brand-blue-50)';
                e.currentTarget.style.borderColor = 'var(--border-soft)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Custom Text Badge Creator */}
        <form onSubmit={handleAddCustomBadge} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <input
            type="text"
            placeholder="Tulis teks badge (contoh: SNAPBOOTH BESTIES)..."
            value={customTextBadge}
            onChange={(e) => setCustomTextBadge(e.target.value)}
            className="input-soft"
            style={{ fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            disabled={!customTextBadge.trim()}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', flexShrink: 0 }}
          >
            + Tambah
          </button>
        </form>
      </div>
    </div>
  );
};
