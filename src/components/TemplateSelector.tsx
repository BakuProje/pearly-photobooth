'use client';

import React, { useRef, useState } from 'react';
import { PhotoboothTemplate } from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';
import { Camera, ImagePlus, X, Sparkles, FolderUp } from 'lucide-react';
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
  const [modalTemplate, setModalTemplate] = useState<PhotoboothTemplate | null>(null);

  // Wheel horizontal scrolling on PC
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  // Mouse Drag to Scroll for Desktop
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
    if (hasDragged) return; // Ignore click if user was dragging
    onSelectTemplate(tmpl.id);
    setModalTemplate(tmpl);
  };

  const handleChooseMode = (mode: 'camera' | 'upload') => {
    if (!modalTemplate) return;
    onSelectTemplate(modalTemplate.id);
    onStartSession(mode);
    setModalTemplate(null);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '12px 16px 36px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    }}>
      {/* Responsive & Aesthetic Title & Subtitle for Mobile and Desktop */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '0 8px',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--neo-primary)',
          color: 'var(--neo-black)',
          border: '2px solid var(--neo-black)',
          padding: '3px 12px',
          borderRadius: '999px',
          boxShadow: '2.5px 2.5px 0px var(--neo-black)',
          fontSize: '0.72rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          SNAPBOOTH STUDIO
        </div>

        <h1 style={{
          fontSize: 'clamp(1.2rem, 5.5vw, 2.1rem)',
          fontWeight: 900,
          color: 'var(--neo-black)',
          letterSpacing: '-0.4px',
          lineHeight: '1.2',
          margin: '3px 0',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          Pilih Template Photo Booth
        </h1>

        <p style={{
          fontSize: 'clamp(0.78rem, 2.2vw, 0.92rem)',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          fontWeight: 600,
          lineHeight: '1.35',
        }}>
          Geser atau scroll ke kanan. Klik template favorit untuk langsung mulai sesi foto!
        </p>
      </div>

      {/* Full-width Responsive Horizontal Carousel */}
      <div style={{ width: '100%', position: 'relative' }}>
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{
            display: 'flex',
            gap: '18px',
            overflowX: 'auto',
            scrollSnapType: isMouseDown ? 'none' : 'x mandatory',
            padding: '12px 10px 24px 10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            cursor: isMouseDown ? 'grabbing' : 'grab',
            width: '100%',
          }}
        >
          {TEMPLATES.map((tmpl, idx) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleCardClick(tmpl)}
                className="neo-card-interactive"
                style={{
                  width: '240px',
                  minWidth: '220px',
                  maxWidth: '260px',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: isMouseDown ? 'grabbing' : 'pointer',
                  borderRadius: '20px',
                  border: '2.5px solid var(--neo-black)',
                  background: isSelected ? 'var(--neo-blue-light)' : '#ffffff',
                  boxShadow: isSelected ? '6px 6px 0px var(--neo-black)' : '4px 4px 0px var(--neo-black)',
                  transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                  userSelect: 'none',
                }}
              >
                {/* Template Image Preview */}
                <div style={{
                  width: '100%',
                  height: '310px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '2px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tmpl.imageSrc}
                    alt={tmpl.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                    draggable={false}
                  />
                </div>

                {/* Template Info: Title & Required Photos */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px',
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: 'var(--neo-black)',
                  }}>
                    {tmpl.name}
                  </span>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'var(--neo-primary)',
                    color: 'var(--neo-black)',
                    border: '1.8px solid var(--neo-black)',
                    boxShadow: '1.8px 1.8px 0px var(--neo-black)',
                  }}>
                    {tmpl.requiredPhotos} Foto
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL PILIH METODE FOTO (FOTO LANGSUNG VS PILIH FOTO DARI FOLDER) ================= */}
      <AnimatePresence>
        {modalTemplate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setModalTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="neo-card"
              style={{
                maxWidth: '440px',
                width: '100%',
                padding: '24px 20px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderRadius: '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                    {modalTemplate.name}
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--neo-primary)',
                    color: 'var(--neo-black)',
                    border: '1.5px solid var(--neo-black)',
                  }}>
                    {modalTemplate.requiredPhotos} Slot Foto
                  </span>
                </div>

                <button
                  onClick={() => setModalTemplate(null)}
                  style={{
                    background: '#ffffff',
                    border: '2px solid var(--neo-black)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, marginTop: '-6px' }}>
                Pilih cara Anda ingin mengisi foto pada template ini:
              </p>

              {/* 2 Big Choice Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {/* Option 1: Foto Langsung (Live Camera) */}
                <div
                  onClick={() => handleChooseMode('camera')}
                  className="neo-card-interactive"
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2.5px solid var(--neo-black)',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px var(--neo-black)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--neo-green)',
                      border: '2px solid var(--neo-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--neo-black)',
                      flexShrink: 0,
                      boxShadow: '2px 2px 0px var(--neo-black)',
                    }}
                  >
                    <Camera size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '2px' }}>
                      Foto Langsung
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      Gunakan kamera live dengan countdown hitungan mundur otomatis.
                    </p>
                  </div>
                </div>

                {/* Option 2: Pilih Foto (Upload dari Galeri / Folder) */}
                <div
                  onClick={() => handleChooseMode('upload')}
                  className="neo-card-interactive"
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2.5px solid var(--neo-black)',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px var(--neo-black)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--neo-blue-light)',
                      border: '2px solid var(--neo-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--neo-black)',
                      flexShrink: 0,
                      boxShadow: '2px 2px 0px var(--neo-black)',
                    }}
                  >
                    <ImagePlus size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '2px' }}>
                      Pilih Foto (Upload Galeri)
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      Pilih foto dari memori perangkat untuk tiap slot bingkai secara bebas.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
