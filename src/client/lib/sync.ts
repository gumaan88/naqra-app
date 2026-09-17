// Background Batch Synchronization Manager for Naqra Platform
// Resilient to offline periods, idempotent, and batches requests at session end

import { ClientSyncBatch } from '@shared/types';
import { localDb } from './db';
import { api } from './api';

class SyncManager {
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushQueue();
      });
    }
  }

  // Queue a batch and attempt sync
  async recordAndSyncBatch(batch: ClientSyncBatch): Promise<boolean> {
    // 1. Store in IndexedDB first (Durability)
    await localDb.enqueueSyncBatch(batch);

    // 2. Attempt sync if online
    if (navigator.onLine) {
      return await this.flushQueue();
    }
    return false;
  }

  // Flush all pending batches from IndexedDB to Cloudflare Worker
  async flushQueue(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      const pendingBatches = await localDb.getPendingSyncBatches();
      if (pendingBatches.length === 0) {
        this.isSyncing = false;
        return true;
      }

      const res = await api.sync.postBatches(pendingBatches);
      if (res.success) {
        // Remove successfully processed batches
        for (const batch of pendingBatches) {
          await localDb.removeSyncBatch(batch.clientBatchId);
        }
        this.isSyncing = false;
        return true;
      }
    } catch (err) {
      console.warn('Sync attempt failed, will retry later:', err);
    } finally {
      this.isSyncing = false;
    }

    return false;
  }
}

export const syncManager = new SyncManager();
