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
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent',
        borderBottom: 'none',
        boxShadow: 'none',
      }}
    >
      {/* Brand Logo & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Pearly Photobooth Logo"
          style={{
            height: '36px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <span
          className="font-script"
          style={{
            fontSize: '1.9rem',
            color: '#1e293b',
            lineHeight: 1,
          }}
        >
          Pearly PhotoBooth
        </span>
      </div>

      {/* Right Controls: Gallery Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenGallery}
          className="clean-card-interactive"
          style={{
            padding: '7px 16px',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '999px',
            color: '#1e293b',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <ImageIcon size={15} />
          <span>Galeri</span>
          {galleryCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#1e293b',
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
