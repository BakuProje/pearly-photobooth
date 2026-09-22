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
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.put(session);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save soft file session to IndexedDB, fallback to localStorage', err);
    try {
      localStorage.setItem(`snapbooth_session_${session.id}`, JSON.stringify(session));
    } catch {}
  }
}

export async function getSoftFileSession(sessionId: string): Promise<SoftFileSession | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.get(sessionId);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const saved = localStorage.getItem(`snapbooth_session_${sessionId}`);
      if (saved) return JSON.parse(saved);
      const fallback = localStorage.getItem('snapbooth_scan_session');
      return fallback ? JSON.parse(fallback) : null;
    } catch {
      return null;
    }
  }
}
