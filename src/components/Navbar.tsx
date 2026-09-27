'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface NavbarProps {
  galleryCount: number;
  onOpenGallery: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  galleryCount,
  onOpenGallery,
}) => {
  return (
    <header
      className="no-print"
      style={{
        width: '100%',
        padding: '10px 20px 0px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent',
        borderBottom: 'none',
        boxShadow: 'none',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Brand Logo & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Pearly Photobooth Logo"
          style={{
            height: '34px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <span
          className="font-script"
          style={{
            fontSize: '1.9rem',
            color: '#1a0f07',
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
          }}
        >
          Pearly Booth
        </span>
      </div>

      {/* Right Controls: Gallery Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onOpenGallery}
          style={{
            padding: '6px 16px',
            fontSize: '0.86rem',
            fontFamily: 'serif',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '6px',
            color: '#2a170a',
            background: 'rgba(235, 218, 195, 0.85)',
            border: '2px solid #543720',
            position: 'relative',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(45, 25, 12, 0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <ImageIcon size={15} />
          <span>Galeri</span>
          {galleryCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#1a0f07',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {galleryCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
