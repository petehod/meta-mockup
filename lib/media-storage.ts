// IndexedDB storage for media files (images/videos)
// This allows storing large files that exceed localStorage limits

const DB_NAME = "adtool_media_db";
const DB_VERSION = 1;
const STORE_NAME = "media";

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Store a file (image/video) in IndexedDB and return a reference ID
 */
export async function storeMediaFile(file: File): Promise<string> {
  const db = await openDB();
  const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(id);
  });
}

/**
 * Retrieve a file from IndexedDB and create an object URL
 * Note: You should call revokeMediaURL when done with the URL
 */
export async function getMediaURL(mediaId: string): Promise<string | null> {
  if (!mediaId || !mediaId.startsWith("media_")) {
    // If it's not a media ID, assume it's a URL (data URL or http URL)
    return mediaId;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(mediaId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const file = request.result;
      if (file) {
        const url = URL.createObjectURL(file);
        resolve(url);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Get the media type (MIME type) for a media ID
 */
export async function getMediaType(mediaId: string): Promise<string | null> {
  if (!mediaId || !mediaId.startsWith("media_")) {
    // For non-media IDs, try to infer from the URL
    if (mediaId.startsWith("data:video/")) return "video";
    if (mediaId.startsWith("data:image/")) return "image";
    if (mediaId.match(/\.(mp4|webm|ogg|mov)/i)) return "video";
    if (mediaId.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) return "image";
    return null;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(mediaId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const file = request.result;
      if (file && file.type) {
        resolve(file.type);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Revoke an object URL to free memory
 */
export function revokeMediaURL(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Delete a media file from IndexedDB
 */
export async function deleteMediaFile(mediaId: string): Promise<void> {
  if (!mediaId || !mediaId.startsWith("media_")) {
    return;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(mediaId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Check if a string is a media ID (stored in IndexedDB) vs a URL
 */
export function isMediaId(value: string): boolean {
  return value.startsWith("media_");
}
