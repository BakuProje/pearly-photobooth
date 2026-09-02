'use client';

import React from 'react';
import { Image as ImageIcon, Clock } from 'lucide-react';

interface NavbarProps {
  galleryCount: number;
  onOpenGallery: () => void;
  sessionQuota?: number;
  timeRemainingStr?: string;
  onResetQuota?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  galleryCount,
  onOpenGallery,
  sessionQuota = 3,
  timeRemainingStr,
  onResetQuota,
}) => {
  return (
    <>
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
        {/* Clean Brand Logo & Name */}
        <div
          onClick={onResetQuota}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: onResetQuota ? 'pointer' : 'default' }}
          title={onResetQuota ? 'Klik untuk reset kuota foto (Admin)' : undefined}
        >
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

        {/* Right Controls: Desktop Quota Indicator & Gallery Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Desktop Quota Badge (Hidden on Mobile) */}
          <div
            className="credits-badge-desktop"
            onClick={onResetQuota}
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: sessionQuota > 0 ? '#ffffff' : '#fef2f2',
              border: `2px solid ${sessionQuota > 0 ? 'var(--neo-black)' : '#dc2626'}`,
              fontSize: '0.82rem',
              fontWeight: 800,
              color: sessionQuota > 0 ? 'var(--neo-black)' : '#dc2626',
              boxShadow: '2px 2px 0px var(--neo-black)',
              cursor: onResetQuota ? 'pointer' : 'default',
            }}
            title={sessionQuota > 0 ? `Sisa kuota: ${sessionQuota} sesi` : `Kuota habis. Reset otomatis dalam ${timeRemainingStr || '8 jam'}`}
          >
            {sessionQuota > 0 ? (
              <>
                <span>Credits:</span>
                <span style={{
                  background: 'var(--neo-primary)',
                  color: 'var(--neo-black)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 900,
                  fontSize: '0.76rem',
                }}>
                  {sessionQuota}/3
                </span>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                <Clock size={13} />
                <span>Reset: <strong>{timeRemainingStr || '08:00:00'}</strong></span>
              </div>
            )}
          </div>

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

      {/* Mobile Floating Credits Badge (Pojok Kanan Bawah pada Mobile / Android) */}
      <div
        className="credits-badge-mobile-floating"
        onClick={onResetQuota}
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '16px',
          zIndex: 95,
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '999px',
          background: sessionQuota > 0 ? '#ffffff' : '#fef2f2',
          border: `2.5px solid ${sessionQuota > 0 ? 'var(--neo-black)' : '#dc2626'}`,
          fontSize: '0.82rem',
          fontWeight: 900,
          color: sessionQuota > 0 ? 'var(--neo-black)' : '#dc2626',
          boxShadow: '3px 3px 0px var(--neo-black)',
          cursor: onResetQuota ? 'pointer' : 'default',
        }}
        title={sessionQuota > 0 ? `Sisa kuota: ${sessionQuota} sesi` : `Kuota habis. Reset otomatis dalam ${timeRemainingStr || '8 jam'}`}
      >
        {sessionQuota > 0 ? (
          <>
            <span>Credits:</span>
            <span style={{
              background: 'var(--neo-primary)',
              color: 'var(--neo-black)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '0.78rem',
              border: '1.5px solid var(--neo-black)',
            }}>
              {sessionQuota}/3
            </span>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626' }}>
            <Clock size={14} />
            <span>Reset: <strong>{timeRemainingStr || '08:00:00'}</strong></span>
          </div>
        )}
      </div>
    </>
  );
};
