'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, RefreshCw } from 'lucide-react';

export const AntiDevTools: React.FC = () => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Allow dev mode or bypass testing
    if (
      process.env.NODE_ENV === 'development' ||
      window.location.search.includes('bypass=true') ||
      window.location.search.includes('dev=1')
    ) {
      return;
    }

    // 1. Block Context Menu (Right Click) & Drag
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

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K
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

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // 3. Initialize disable-devtool with calibrated detectors
    // Exclude Size detector to prevent false positives from Windows DPI scaling / browser toolbars / mobile address bars
    let disableDevtoolCleanup: any = null;

    import('disable-devtool')
      .then((module) => {
        const disableDevtool = module.default || module;
        if (typeof disableDevtool === 'function') {
          const detectorTypes = disableDevtool.DetectorType;
          const detectors = detectorTypes
            ? [
              detectorTypes.RegToString,
              detectorTypes.DefineId,
              detectorTypes.DateToString,
              detectorTypes.FuncToString,
              detectorTypes.Debugger,
              detectorTypes.Performance,
              detectorTypes.DebugLib,
            ]
            : 'all';

          disableDevtoolCleanup = disableDevtool({
            ondevtoolopen: () => {
              setIsDevToolsOpen(true);
            },
            ondevtoolclose: () => {
              setIsDevToolsOpen(false);
            },
            interval: 500,
            disableMenu: true,
            clearLog: true,
            stopIntervalTime: 0,
            detectors: detectors,
            clearIntervalWhenDevOpenTrigger: false,
          });
        }
      })
      .catch(() => { });

    // 4. Clean console output in production
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log = () => { };
        console.warn = () => { };
        console.info = () => { };
        console.debug = () => { };
      } catch { }
    }

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (disableDevtoolCleanup && typeof disableDevtoolCleanup.isSuspend !== 'undefined') {
        // cleanup if available
      }
    };
  }, []);

  if (!isDevToolsOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        className="neo-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '32px 24px',
          background: '#ffffff',
          color: 'var(--neo-black)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderRadius: '20px',
          boxShadow: '8px 8px 0px var(--neo-black)',
          border: '3px solid var(--neo-black)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: '#fee2e2',
            border: '3px solid var(--neo-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            boxShadow: '4px 4px 0px var(--neo-black)',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>
            Akses DevTools Dinonaktifkan
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600, lineHeight: 1.55 }}>
            Demi keamanan sesi, privasi, dan perlindungan hak cipta photobooth, Developer Tools telah dinonaktifkan.
          </p>
          <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>
            Silakan tutup tab inspect / DevTools untuk melanjutkan sesi foto.
          </p>
        </div>

        <button
          onClick={() => {
            setIsDevToolsOpen(false);
          }}
          className="neo-btn"
          style={{
            marginTop: '4px',
            padding: '10px 20px',
            background: 'var(--neo-yellow, #fef08a)',
            border: '2.5px solid var(--neo-black)',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '3px 3px 0px var(--neo-black)',
          }}
        >
          <RefreshCw size={16} />
          <span>Cek Ulang & Buka Kunci</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '2px solid var(--neo-black)',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          <Lock size={14} color="#0284c7" />
          <span>Snapboooth Security Guard Aktif</span>
        </div>
      </div>
    </div>
  );
};
