import { PhotoboothTemplate } from './types';
import { TEMPLATES } from './constants';

const DB_NAME = 'snapbooth_templates_db';
const STORE_NAME = 'custom_templates';
const DB_VERSION = 1;
const CUSTOM_TEMPLATES_STORAGE_KEY = 'snapbooth_custom_templates';

// In-memory cache for fast synchronous lookups across all components
let memoryCustomTemplates: PhotoboothTemplate[] = [];
let isInitialized = false;

/**
 * Initializes IndexedDB for custom templates storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Reads all custom templates from IndexedDB
 */
async function getAllFromIndexedDB(): Promise<PhotoboothTemplate[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get from IndexedDB, falling back to memory/localStorage:', err);
    return [];
  }
}

/**
 * Saves or updates a template in IndexedDB
 */
async function putToIndexedDB(template: PhotoboothTemplate): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(template);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Deletes a template from IndexedDB
 */
async function deleteFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete from IndexedDB:', err);
  }
}

/**
 * Loads custom templates synchronously from memory or localStorage fallback
 */
export function loadCustomTemplates(): PhotoboothTemplate[] {
  if (typeof window === 'undefined') return [];

  // If memory cache is already loaded, use it
  if (isInitialized && memoryCustomTemplates.length > 0) {
    return memoryCustomTemplates;
  }

  // Fallback to localStorage if memory is not yet loaded
  try {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (memoryCustomTemplates.length === 0) {
          memoryCustomTemplates = parsed;
        }
        return memoryCustomTemplates;
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  return memoryCustomTemplates;
}

/**
 * Initializes and syncs IndexedDB on browser client
 */
export async function initTemplateStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const idbTemplates = await getAllFromIndexedDB();

    if (idbTemplates && idbTemplates.length > 0) {
      memoryCustomTemplates = idbTemplates;
      isInitialized = true;
      // Clean up bulky localStorage key to prevent quota errors
      try {
        localStorage.removeItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      } catch {
        // Ignore
      }
      window.dispatchEvent(new Event('snapbooth_templates_updated'));
    } else {
      // Migrate from localStorage if exists
      const ls = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      if (ls) {
        try {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCustomTemplates = parsed;
            isInitialized = true;
            for (const t of parsed) {
              await putToIndexedDB(t);
            }
            // Clear bulky localStorage after successful migration
            localStorage.removeItem(CUSTOM_TEMPLATES_STORAGE_KEY);
          }
        } catch {
          // Ignore
        }
      }
      isInitialized = true;
    }
  } catch (e) {
    console.warn('Init template storage warning:', e);
    isInitialized = true;
  }
}

// Auto-run initialization on client load
if (typeof window !== 'undefined') {
  initTemplateStorage();
}

/**
 * Compresses an image to optimal dimensions and size
 */
export function compressImage(
  imageSrc: string,
  maxDimension = 1400,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(imageSrc);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      let targetW = w;
      let targetH = h;

      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          targetW = maxDimension;
          targetH = Math.round((h / w) * maxDimension);
        } else {
          targetH = maxDimension;
          targetW = Math.round((w / h) * maxDimension);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageSrc);

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const compressedDataUrl = canvas.toDataURL('image/webp', quality);
      resolve(compressedDataUrl.length < imageSrc.length ? compressedDataUrl : imageSrc);
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Returns all available templates: Built-in (1-32) + Custom uploaded
 */
export function getAllTemplates(): PhotoboothTemplate[] {
  const custom = loadCustomTemplates().filter((c) => !TEMPLATES.some((t) => t.id === c.id));
  return [...TEMPLATES, ...custom];
}

/**
 * Finds a template by its ID from built-in or custom templates
 */
export function getTemplateById(id: string): PhotoboothTemplate {
  const all = getAllTemplates();
  const found = all.find((t) => t.id === id);
  if (found) return found;
  return TEMPLATES[0];
}

/**
 * Calculates the next template sequence number (e.g., 28 if 27 exist)
 */
export function getNextCustomTemplateNumber(): number {
  const all = getAllTemplates();
  return all.length + 1;
}

/**
 * Saves a new custom template or updates an existing one without QuotaExceededError
 */
export async function saveCustomTemplate(template: PhotoboothTemplate): Promise<void> {
  // Compress template image if needed before saving
  let optimizedTemplate = template;
  if (template.imageSrc && template.imageSrc.startsWith('data:image')) {
    const optimizedSrc = await compressImage(template.imageSrc, 1400, 0.88);
    optimizedTemplate = { ...template, imageSrc: optimizedSrc };
  }

  const existingIdx = memoryCustomTemplates.findIndex((t) => t.id === optimizedTemplate.id);
  if (existingIdx >= 0) {
    memoryCustomTemplates[existingIdx] = optimizedTemplate;
  } else {
    memoryCustomTemplates.push(optimizedTemplate);
  }

  // Save to IndexedDB asynchronously
  await putToIndexedDB(optimizedTemplate);

  // Dispatch global custom event for instant UI re-render
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snapbooth_templates_updated'));
  }
}

/**
 * Deletes a custom template by ID
 */
export async function deleteCustomTemplate(id: string): Promise<boolean> {
  const initialLength = memoryCustomTemplates.length;
  memoryCustomTemplates = memoryCustomTemplates.filter((t) => t.id !== id);

  if (memoryCustomTemplates.length !== initialLength) {
    await deleteFromIndexedDB(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snapbooth_templates_updated'));
    }
    return true;
  }
  return false;
}
