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
    <header className="no-print" style={{
      width: '100%',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
    }}>
      {/* Clean Brand Logo & Name (No 'Studio' badge, no subtitle description) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Snapbooth Logo"
          style={{
            height: '42px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(2.5px 2.5px 0px #0f172a)',
          }}
        />
        <span style={{
          fontSize: '1.45rem',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: 'var(--neo-black)',
        }}>
          Snapbooth
        </span>
      </div>

      {/* Right Controls: Gallery Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenGallery}
          className="neo-btn neo-btn-secondary"
          style={{
            padding: '8px 18px',
            fontSize: '0.88rem',
            position: 'relative',
          }}
        >
          <ImageIcon size={16} />
          <span>Galeri</span>
          {galleryCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--neo-primary)',
              color: 'var(--neo-black)',
              border: '2px solid var(--neo-black)',
              fontSize: '0.72rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px var(--neo-black)',
            }}>
              {galleryCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
