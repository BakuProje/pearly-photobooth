'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Lock, RefreshCw } from 'lucide-react';

export const AntiDevTools: React.FC = () => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const isDevToolsOpenRef = useRef(false);

  useEffect(() => {
    isDevToolsOpenRef.current = isDevToolsOpen;
  }, [isDevToolsOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initialize disable-devtool library
    let disableDevtoolInstance: any = null;
    import('disable-devtool')
      .then((module) => {
        const disableDevtool = module.default || module;
        if (typeof disableDevtool === 'function') {
          disableDevtoolInstance = disableDevtool({
            ondevtoolopen: () => {
              setIsDevToolsOpen(true);
            },
            ondevtoolclose: () => {
              setIsDevToolsOpen(false);
            },
            interval: 200,
            disableMenu: true,
            clearLog: true,
            stopIntervalTime: 0, // Never stop monitoring on mobile/remote devices
            detectors: 'all',
            clearIntervalWhenDevOpenTrigger: false,
          });
        }
      })
      .catch((err) => {
        console.warn('Security initializer notification:', err);
      });

    // 2. Custom Multi-Layer Detection Engine (Backup for Remote Debugging & devtools://)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

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

    // Console Getter & toString Detector for Remote DevTools
    const checkConsoleTriggers = () => {
      try {
        const obj = {};
        let triggered = false;
        Object.defineProperty(obj, 'id', {
          get: () => {
            triggered = true;
            setIsDevToolsOpen(true);
            return '';
          },
          configurable: true,
        });

        // Regex toString detector
        const reg = /./;
        reg.toString = () => {
          triggered = true;
          setIsDevToolsOpen(true);
          return '';
        };

        // Trigger console format evaluation
        console.log('%c', obj);
        console.log('%c', reg);
        console.clear();

        if (triggered) {
          setIsDevToolsOpen(true);
        }
      } catch {}
    };

    // Dimension Delta & Performance Timing Detector
    const checkPerformanceAndDimension = () => {
      try {
        // Dimension delta (for docked DevTools)
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
          setIsDevToolsOpen(true);
          return;
        }

        // Debugger execution timing (for remote & detached DevTools)
        const start = performance.now();
        // eslint-disable-next-line no-eval
        (Function('debugger'))();
        const end = performance.now();

        if (end - start > 100) {
          setIsDevToolsOpen(true);
        }
      } catch {}
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    const checkInterval = setInterval(() => {
      checkConsoleTriggers();
      checkPerformanceAndDimension();
    }, 400);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(checkInterval);
      if (disableDevtoolInstance && typeof disableDevtoolInstance.isSuspend !== 'undefined') {
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
            Demi keamanan sesi, privasi, dan perlindungan hak cipta photobooth, Developer Tools serta Remote Debugging telah diblokir.
          </p>
          <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>
            Silakan tutup tab inspect/DevTools untuk melanjutkan pemotretan.
          </p>
        </div>

        <button
          onClick={() => {
            // Re-check status
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth > threshold;
            const heightDiff = window.outerHeight - window.innerHeight > threshold;
            if (!widthDiff && !heightDiff) {
              setIsDevToolsOpen(false);
            }
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
          <span>Snapbooth Security Guard Aktif</span>
        </div>
      </div>
    </div>
  );
};
