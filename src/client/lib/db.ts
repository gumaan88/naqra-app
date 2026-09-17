// IndexedDB Local-first Storage Manager for Naqra Platform
// Preserves downloaded game packs and pending sync batches offline

import { ClientSyncBatch, Word } from '@shared/types';

const DB_NAME = 'naqra_local_v1';
const DB_VERSION = 1;

export class LocalDb {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        // Game packs cache
        if (!db.objectStoreNames.contains('game_packs')) {
          db.createObjectStore('game_packs', { keyPath: 'key' });
        }
        // Pending sync batches queue
        if (!db.objectStoreNames.contains('pending_sync')) {
          db.createObjectStore('pending_sync', { keyPath: 'clientBatchId' });
        }
        // Cached word assets
        if (!db.objectStoreNames.contains('cached_words')) {
          db.createObjectStore('cached_words', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = (e: any) => reject(e.target.error);
    });
  }

  // Save game pack for offline play
  async saveGamePack(key: string, data: any): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('game_packs', 'readwrite');
      tx.objectStore('game_packs').put({ key, data, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get cached game pack
  async getGamePack(key: string): Promise<any | null> {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction('game_packs', 'readonly');
      const req = tx.objectStore('game_packs').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  }

  // Enqueue pending sync batch
  async enqueueSyncBatch(batch: ClientSyncBatch): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_sync', 'readwrite');
      tx.objectStore('pending_sync').put(batch);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get all pending sync batches
  async getPendingSyncBatches(): Promise<ClientSyncBatch[]> {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction('pending_sync', 'readonly');
      const req = tx.objectStore('pending_sync').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  // Remove batch after successful synchronization
  async removeSyncBatch(clientBatchId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_sync', 'readwrite');
      tx.objectStore('pending_sync').delete(clientBatchId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDb = new LocalDb();
