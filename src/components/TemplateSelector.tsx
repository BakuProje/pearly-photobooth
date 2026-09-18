'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PhotoboothTemplate } from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';
import { getAllTemplates, deleteCustomTemplate } from '@/lib/templateManager';
import { UploadTemplateModal } from './UploadTemplateModal';
import { Camera, ImagePlus, Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onStartSession: (mode: 'camera' | 'upload') => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  onStartSession,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PhotoboothTemplate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [templatesList, setTemplatesList] = useState<PhotoboothTemplate[]>(TEMPLATES);

  const refreshTemplates = () => {
    const all = getAllTemplates();
    setTemplatesList(all);
  };

  useEffect(() => {
    refreshTemplates();
    const handleUpdate = () => refreshTemplates();
    window.addEventListener('snapbooth_templates_updated', handleUpdate);
    return () => {
      window.removeEventListener('snapbooth_templates_updated', handleUpdate);
    };
  }, []);

  const handleCustomTemplateCreated = (newTmpl: PhotoboothTemplate) => {
    refreshTemplates();
    onSelectTemplate(newTmpl.id);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsMouseDown(true);
    setHasDragged(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  const handleCardClick = (tmpl: PhotoboothTemplate) => {
    if (hasDragged) return;
    onSelectTemplate(tmpl.id);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    await deleteCustomTemplate(templateToDelete.id);
    refreshTemplates();
    if (selectedTemplateId === templateToDelete.id) {
      onSelectTemplate('template-1');
    }
    setTemplateToDelete(null);
  };

  const selectedTemplate = templatesList.find((t) => t.id === selectedTemplateId) || templatesList[0];

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 75px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 16px 40px 16px',
        position: 'relative',
      }}
    >
      {/* Title as in Gambar 2 */}
      <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '16px' }}>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.2rem, 6.5vw, 3.4rem)',
            fontWeight: 900,
            color: '#262626',
            letterSpacing: '0.5px',
            lineHeight: 1.1,
          }}
        >
          Pilih Frame Foto
        </h1>
      </div>

      {/* Horizontal Carousel of Frame Cards as in Gambar 2 */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: isMouseDown ? 'none' : 'x mandatory',
            padding: '20px 24px 30px 24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            cursor: isMouseDown ? 'grabbing' : 'grab',
            width: '100%',
          }}
        >
          {templatesList.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleCardClick(tmpl)}
                style={{
                  width: '210px',
                  minWidth: '190px',
                  maxWidth: '230px',
                  flexShrink: 0,
                  scrollSnapAlign: 'center',
                  background: isSelected ? '#ffffff' : '#f8fafc',
                  borderRadius: '16px',
                  border: isSelected ? '4px solid #1e293b' : '2px solid #e2e8f0',
                  boxShadow: isSelected
                    ? '0 12px 32px rgba(0, 0, 0, 0.18)'
                    : '0 4px 12px rgba(0, 0, 0, 0.04)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: isMouseDown ? 'grabbing' : 'pointer',
                  transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  userSelect: 'none',
                  position: 'relative',
                }}
              >
                {/* Delete button if custom template */}
                {tmpl.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemplateToDelete(tmpl);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#fee2e2',
                      border: '1.5px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      color: '#dc2626',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#1e293b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                {/* Frame Image Preview */}
                <div
                  style={{
                    width: '100%',
                    height: '280px',
                    borderRadius: '10px',
                    background: '#e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tmpl.imageSrc}
                    alt={tmpl.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Frame Details: Pose Count Only */}
                <div style={{ textAlign: 'center', padding: '4px 4px 2px 4px' }}>
                  <p
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: '#1e293b',
                      margin: 0,
                    }}
                  >
                    {tmpl.requiredPhotos} Pose
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Button "LANJUT" as in Gambar 2 */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onStartSession('camera')}
          className="btn-pill-dark"
          style={{
            minWidth: '220px',
            fontSize: '1.25rem',
            padding: '14px 48px',
          }}
        >
          LANJUT
        </button>

        {/* Small Upload / Custom Template Trigger */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >

            <span>Upload Template Kustom</span>
          </button>
        </div>
      </div>

      {/* Upload Custom Template Modal */}
      <UploadTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTemplateSaved={handleCustomTemplateCreated}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {templateToDelete && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setTemplateToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clean-card"
              style={{
                maxWidth: '380px',
                width: '100%',
                padding: '24px',
                textAlign: 'center',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Hapus Template Kustom?</h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                Apakah Anda yakin ingin menghapus template <strong>{templateToDelete.name}</strong>?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setTemplateToDelete(null)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
