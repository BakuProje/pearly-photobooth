'use client';

import { useState, useEffect, useCallback } from 'react';

// Global reference for beforeinstallprompt event (Chromium-based browsers)
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
  isSafari: boolean;
  isInAppBrowser: boolean;
  isStandalone: boolean;
  installPwa: () => Promise<{
    outcome: 'accepted' | 'dismissed' | 'ios' | 'already_installed' | 'unavailable';
  }>;
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check standalone mode (PWA active on iOS or Desktop/Android)
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

    // 2. Comprehensive iOS / Apple Device Detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 3. Detect Safari vs In-App WebViews (Instagram, TikTok, WhatsApp, Line, Facebook, etc.)
    const isWebKit = /webkit/.test(ua);
    const isChrome = /crios|chrome|crmo/.test(ua);
    const isFirefox = /fxios|firefox/.test(ua);
    const isEdge = /edgios|edg/.test(ua);
    const isSocialApp = /instagram|fbav|fban|line|whatsapp|tiktok|micromessenger|snapchat/.test(ua);

    setIsInAppBrowser(isSocialApp);
    setIsSafari(isIosDevice && isWebKit && !isChrome && !isFirefox && !isEdge && !isSocialApp);

    // 4. Subscribe to prompt events (Chromium)
    const handlePromptUpdate = (prompt: any) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(handlePromptUpdate);

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

    // 2. If native prompt is available (Chrome, Edge, Android, supported browsers)
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

    // 3. If on iOS (Safari doesn't support beforeinstallprompt, requires Share -> Add to Home Screen)
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
    isSafari,
    isInAppBrowser,
    isStandalone,
    installPwa,
  };
}
