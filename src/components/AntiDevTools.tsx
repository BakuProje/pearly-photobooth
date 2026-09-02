'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

export const AntiDevTools: React.FC = () => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    // 1. Block Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Block DevTools & Source Inspection Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K (DevTools & Console)
      if (
        isCtrlOrCmd &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U / Cmd+U (View Source)
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. DevTools Open Detection via Dimension Delta & Console Clear
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if (widthDiff || heightDiff) {
        setIsDevToolsOpen(true);
        try {
          console.clear();
        } catch {}
      } else {
        setIsDevToolsOpen(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    const interval = setInterval(checkDevTools, 600);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  if (!isDevToolsOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        textAlign: 'center',
      }}
    >
      <div
        className="neo-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '28px 24px',
          background: '#ffffff',
          color: 'var(--neo-black)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          borderRadius: '16px',
          boxShadow: '6px 6px 0px var(--neo-black)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#fee2e2',
            border: '2.5px solid var(--neo-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            boxShadow: '3px 3px 0px var(--neo-black)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '6px', color: '#0f172a' }}>
            Akses DevTools Dinonaktifkan
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>
            Demi keamanan sesi dan hak cipta photobooth, Developer Tools telah diblokir.
            Silakan tutup DevTools untuk melanjutkan pemotretan.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1.5px solid var(--neo-black)',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          <Lock size={14} color="#0284c7" />
          <span>Snapbooth Security Guard Aktif</span>
        </div>
      </div>
    </div>
  );
};
