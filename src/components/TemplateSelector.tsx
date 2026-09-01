'use client';

import React, { useRef, useState } from 'react';
import { PhotoboothTemplate } from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onStartSession: () => void;
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

  const handleCardClick = (templateId: string) => {
    if (hasDragged) return; // Ignore click if user was dragging
    onSelectTemplate(templateId);
    onStartSession();
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
                onClick={() => handleCardClick(tmpl.id)}
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
    </div>
  );
};
