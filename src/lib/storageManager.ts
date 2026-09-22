import { GalleryItem, SoftFileSession } from './types';

const DB_NAME = 'pearly_photobooth_db';
const DB_VERSION = 1;
const STORE_GALLERY = 'gallery_items';
const STORE_SESSIONS = 'soft_file_sessions';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_GALLERY)) {
        const galleryStore = db.createObjectStore(STORE_GALLERY, { keyPath: 'id' });
        galleryStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// =========================================================================
// GALLERY STORAGE (Persistent across refresh, no 5MB quota limit)
// =========================================================================

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GALLERY, 'readwrite');
      const store = tx.objectStore(STORE_GALLERY);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save gallery item to IndexedDB, fallback to localStorage', err);
    try {
      const existing = JSON.parse(localStorage.getItem('snapbooth_gallery') || '[]');
      const filtered = existing.filter((g: GalleryItem) => g.id !== item.id);
      localStorage.setItem('snapbooth_gallery', JSON.stringify([item, ...filtered].slice(0, 5)));
    } catch {}
  }
}

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GALLERY, 'readonly');
      const store = tx.objectStore(STORE_GALLERY);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: GalleryItem[] = req.result || [];
        // Sort descending by createdAt
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, fallback to localStorage', err);
    try {
      const saved = localStorage.getItem('snapbooth_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GALLERY, 'readwrite');
      const store = tx.objectStore(STORE_GALLERY);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const existing = JSON.parse(localStorage.getItem('snapbooth_gallery') || '[]');
      const updated = existing.filter((g: GalleryItem) => g.id !== id);
      localStorage.setItem('snapbooth_gallery', JSON.stringify(updated));
    } catch {}
  }
}

export async function clearAllGalleryItems(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GALLERY, 'readwrite');
      const store = tx.objectStore(STORE_GALLERY);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      localStorage.removeItem('snapbooth_gallery');
    } catch {}
  }
}

// =========================================================================
// SOFT FILE SESSIONS (Isolated by unique SessionId, no collision)
// =========================================================================

export async function saveSoftFileSession(session: SoftFileSession): Promise<void> {
  // 1. Save to IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save soft file session to IndexedDB', err);
  }

  // 2. Save to localStorage backup
  try {
    localStorage.setItem(`snapbooth_session_${session.id}`, JSON.stringify(session));
    localStorage.setItem('snapbooth_last_session_id', session.id);
  } catch {}

  // 3. Sync to API route for cross-device QR scanning (e.g. smartphone scanning booth screen)
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      }).catch(() => {});
    }
  } catch {}
}

export async function getSoftFileSession(sessionId: string): Promise<SoftFileSession | null> {
  // 1. Check IndexedDB
  try {
    const db = await getDB();
    const localData = await new Promise<SoftFileSession | null>((resolve) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.get(sessionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (localData && localData.photos && localData.photos.length > 0) {
      return localData;
    }
  } catch {}

  // 2. Check localStorage
  try {
    const saved = localStorage.getItem(`snapbooth_session_${sessionId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.photos && parsed.photos.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // 3. Check Server API route (when scanning QR from another device / phone)
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/session?id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.session) {
          // Cache locally in IndexedDB
          saveSoftFileSession(json.session).catch(() => {});
          return json.session;
        }
      }
    }
  } catch {}

  // 4. Fallback to legacy scan session or last session
  try {
    const lastSessionId = localStorage.getItem('snapbooth_last_session_id');
    if (lastSessionId && lastSessionId !== sessionId) {
      const lastSession = localStorage.getItem(`snapbooth_session_${lastSessionId}`);
      if (lastSession) return JSON.parse(lastSession);
    }
    const fallback = localStorage.getItem('snapbooth_scan_session');
    if (fallback) {
      const parsed = JSON.parse(fallback);
      return {
        id: sessionId,
        templateId: parsed.config?.selectedTemplateId || 'template-1',
        templateName: 'Pearly Photobooth',
        photostripUrl: parsed.previewUrl || parsed.photos?.[0] || '',
        gifUrl: parsed.gifUrl || null,
        photos: parsed.photos || [],
        config: parsed.config,
        createdAt: Date.now(),
      };
    }
  } catch {}

  return null;
}
