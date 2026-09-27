'use client';

import React, { useState, useEffect } from 'react';
import { PhotoboothTemplate } from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';
import { getAllTemplates, deleteCustomTemplate } from '@/lib/templateManager';
import { UploadTemplateModal } from './UploadTemplateModal';
import { Navbar } from './Navbar';
import { Trash2, Check, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onStartSession: (mode: 'camera' | 'upload') => void;
  galleryCount?: number;
  onOpenGallery?: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  onStartSession,
  galleryCount = 0,
  onOpenGallery = () => {},
}) => {
  const [templatesList, setTemplatesList] = useState<PhotoboothTemplate[]>(TEMPLATES);
  const [templateToDelete, setTemplateToDelete] = useState<PhotoboothTemplate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    await deleteCustomTemplate(templateToDelete.id);
    refreshTemplates();
    if (selectedTemplateId === templateToDelete.id) {
      onSelectTemplate('template-1');
    }
    setTemplateToDelete(null);
  };

  const selectedTemplate =
    templatesList.find((t) => t.id === selectedTemplateId) || templatesList[0] || null;

  return (
    <div
      className="vintage-parchment-bg"
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 20px 14px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Embedded Navbar */}
      <div style={{ width: '100%', maxWidth: '1240px', flexShrink: 0 }}>
        <Navbar galleryCount={galleryCount} onOpenGallery={onOpenGallery} />
      </div>

      {/* Header Title: "Select Your Template" */}
      <div style={{ textAlign: 'center', margin: '2px 0 8px 0', flexShrink: 0 }}>
        <h1
          className="font-gothic"
          style={{
            fontSize: 'clamp(2rem, 5.2vw, 3.2rem)',
            fontWeight: 700,
            color: '#1a0f07',
            letterSpacing: '1px',
            lineHeight: 1.05,
            margin: 0,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
          }}
        >
          Select Your Template
        </h1>
      </div>

      {/* Main Split Content: Left (Preview) & Right (All Frame Box) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 340px) minmax(320px, 1fr)',
          gap: '18px',
          alignItems: 'stretch',
          marginBottom: '8px',
          overflow: 'hidden',
        }}
        className="template-split-container"
      >
        {/* ================= LEFT PANEL: FULL FRAME PREVIEW ================= */}
        <div
          className="vintage-left-preview"
          style={{
            borderRadius: '6px',
            border: '3px solid #3d2616',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {selectedTemplate ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedTemplate.imageSrc}
                  alt={selectedTemplate.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 14px rgba(45, 25, 12, 0.35))',
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: '#4a331f',
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              *No Frame Selected Yet
            </div>
          )}
        </div>

        {/* ================= RIGHT PANEL: ALL FRAME 3-COLUMN SCROLLABLE GRID ================= */}
        <div
          className="vintage-box-border"
          style={{
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Header "All Frame" */}
          <div
            className="font-vintage-serif"
            style={{
              textAlign: 'center',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#2a170a',
              padding: '8px 16px 6px 16px',
              borderBottom: '2px solid rgba(61, 38, 22, 0.25)',
              letterSpacing: '0.8px',
              flexShrink: 0,
            }}
          >
            All Frame
          </div>

          {/* 3-Column Scrollable Grid */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              alignContent: 'start',
            }}
          >
            {templatesList.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl.id)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1.35',
                    background: isSelected ? '#a2b4c2' : '#c5d1dc',
                    border: isSelected ? '3px solid #1a0f07' : '2px solid rgba(45, 27, 14, 0.3)',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.18s ease-out',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected
                      ? '0 6px 16px rgba(26, 15, 7, 0.35)'
                      : '0 2px 6px rgba(0, 0, 0, 0.08)',
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
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
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
                      <Trash2 size={12} />
                    </button>
                  )}

                  {/* Selected check indicator */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#1a0f07',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}

                  {/* Frame Thumbnail */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmpl.imageSrc}
                      alt={tmpl.name}
                      loading="lazy"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Area: Upload Link (Left) & "Select" Tag Button (Right - Always Visible!) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          paddingTop: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          style={{
            background: 'rgba(235, 218, 195, 0.75)',
            border: '1.5px dashed #6b4423',
            color: '#3d2616',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.84rem',
            fontFamily: 'serif',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Upload size={14} />
          <span>Upload Frame Kustom</span>
        </button>

        {/* Vintage Banner "Select" Button */}
        <button
          type="button"
          onClick={() => onStartSession('camera')}
          className="btn-vintage-tag"
          style={{
            minWidth: '150px',
            fontSize: '1.65rem',
            padding: '9px 46px 9px 30px',
          }}
        >
          Select
        </button>
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
              background: 'rgba(26, 15, 7, 0.7)',
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
              className="vintage-parchment-bg"
              style={{
                maxWidth: '380px',
                width: '100%',
                padding: '24px',
                textAlign: 'center',
                border: '3px solid #3d2616',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className="font-vintage-serif"
                style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2a170a', margin: 0 }}
              >
                Hapus Template Kustom?
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#4a331f', margin: 0 }}>
                Apakah Anda yakin ingin menghapus template <strong>{templateToDelete.name}</strong>?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setTemplateToDelete(null)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#e6d4bc',
                    border: '1.5px solid #8b6038',
                    color: '#2a170a',
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
                    borderRadius: '6px',
                    background: '#991b1b',
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
