'use client';

import { useState, useEffect, useCallback } from 'react';

// Global reference for beforeinstallprompt event
let globalDeferredPrompt: any = null;
const promptListeners = new Set<(prompt: any) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent standard browser banner
    e.preventDefault();
    globalDeferredPrompt = e;
    promptListeners.forEach((listener) => listener(e));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export interface PwaInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installPwa: () => Promise<{ outcome: 'accepted' | 'dismissed' | 'ios' | 'already_installed' | 'unavailable' }>;
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = (window.navigator as any).standalone === true;
      const isDocumentStandalone = document.referrer.includes('android-app://');
      const standalone = isDisplayStandalone || isNavStandalone || isDocumentStandalone;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Subscribe to prompt events
    const handlePromptUpdate = (prompt: any) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(handlePromptUpdate);

    // Initial check
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptListeners.delete(handlePromptUpdate);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPwa = useCallback(async () => {
    // 1. If already standalone / installed
    if (isStandalone || isInstalled) {
      return { outcome: 'already_installed' as const };
    }

    // 2. If prompt is available (Chrome, Edge, Android, supported browsers)
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
          return { outcome: 'accepted' as const };
        } else {
          return { outcome: 'dismissed' as const };
        }
      } catch (err) {
        console.error('PWA Install Error:', err);
      }
    }

    // 3. If on iOS (Safari doesn't support beforeinstallprompt)
    if (isIOS) {
      return { outcome: 'ios' as const };
    }

    // 4. Fallback if prompt is not ready
    return { outcome: 'unavailable' as const };
  }, [deferredPrompt, isInstalled, isStandalone, isIOS]);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt || isIOS) && !isStandalone,
    isInstalled: isInstalled || isStandalone,
    isIOS,
    isStandalone,
    installPwa,
  };
}
