/**
 * SyncQueuePersistence
 * Handles persistent storage of sync queue operations through app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncQueue, createSyncQueueEntry, validateSyncQueue } from '../../models/SyncQueue';

const SYNC_QUEUE_KEY = 'strength_assistant_sync_queue';

export interface SyncQueuePersistence {
  /** Load sync queue from persistent storage */
  loadQueue(): Promise<SyncQueue[]>;
  
  /** Save sync queue to persistent storage */
  saveQueue(queue: SyncQueue[]): Promise<void>;
  
  /** Add new operation to queue and persist */
  addToQueue(operation: SyncQueue): Promise<void>;
  
  /** Remove operation from queue and persist */
  removeFromQueue(operationId: string): Promise<void>;
  
  /** Clear entire queue */
  clearQueue(): Promise<void>;
  
  /** Get queue statistics */
  getQueueStats(): Promise<{ count: number; oldestEntry: Date | null }>;
}

/**
 * Implementation of sync queue persistence using AsyncStorage
 */
export class AsyncStorageSyncQueuePersistence implements SyncQueuePersistence {
  
  async loadQueue(): Promise<SyncQueue[]> {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!queueData) {
        return [];
      }
      
      const parsedQueue = JSON.parse(queueData);
      
      // Validate and transform the loaded data
      return parsedQueue.map((item: any) => {
        // Convert date strings back to Date objects
        const syncEntry: SyncQueue = {
          ...item,
          createdAt: new Date(item.createdAt),
          lastAttemptAt: item.lastAttemptAt ? new Date(item.lastAttemptAt) : null,
        };
        
        // Validate the loaded entry
        const validationErrors = validateSyncQueue(syncEntry);
        if (validationErrors.length > 0) {
          console.warn(`Invalid sync queue entry loaded: ${validationErrors.join(', ')}`);
          return null;
        }
        
        return syncEntry;
      }).filter(Boolean); // Remove null entries
      
    } catch (error) {
      console.error('Failed to load sync queue from storage:', error);
      return [];
    }
  }
  
  async saveQueue(queue: SyncQueue[]): Promise<void> {
    try {
      const serializedQueue = JSON.stringify(queue);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, serializedQueue);
    } catch (error) {
      console.error('Failed to save sync queue to storage:', error);
      throw new Error(`Sync queue persistence failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async addToQueue(operation: SyncQueue): Promise<void> {
    try {
      const currentQueue = await this.loadQueue();
      
      // Check if operation already exists (prevent duplicates)
      const existingIndex = currentQueue.findIndex(item => item.id === operation.id);
      
      if (existingIndex >= 0) {
        // Update existing operation
        currentQueue[existingIndex] = operation;
      } else {
        // Add new operation
        currentQueue.push(operation);
      }
      
      await this.saveQueue(currentQueue);
    } catch (error) {
      console.error('Failed to add operation to sync queue:', error);
      throw error;
    }
  }
  
  async removeFromQueue(operationId: string): Promise<void> {
    try {
      const currentQueue = await this.loadQueue();
      const filteredQueue = currentQueue.filter(item => item.id !== operationId);
      await this.saveQueue(filteredQueue);
    } catch (error) {
      console.error('Failed to remove operation from sync queue:', error);
      throw error;
    }
  }
  
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      throw error;
    }
  }
  
  async getQueueStats(): Promise<{ count: number; oldestEntry: Date | null }> {
    try {
      const queue = await this.loadQueue();
      const count = queue.length;
      const oldestEntry = queue.length > 0 
        ? new Date(Math.min(...queue.map(item => item.createdAt.getTime())))
        : null;
      
      return { count, oldestEntry };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return { count: 0, oldestEntry: null };
    }
  }
}

/**
 * Singleton instance for sync queue persistence
 */
export const syncQueuePersistence = new AsyncStorageSyncQueuePersistence();

/**
 * Helper function to create and persist a sync operation
 */
export async function queueSyncOperation(params: {
  operation: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  data?: any;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}): Promise<void> {
  const syncEntry = createSyncQueueEntry({
    id: `${params.operation}-${params.tableName}-${params.recordId}-${Date.now()}`,
    operation: params.operation,
    tableName: params.tableName,
    recordId: params.recordId,
    data: params.data,
    priority: params.priority || 'medium',
  });
  
  await syncQueuePersistence.addToQueue(syncEntry);
}

/**
 * Helper function to remove multiple operations by recordId
 */
export async function removeQueuedOperationsForRecord(
  tableName: string, 
  recordId: string
): Promise<void> {
  try {
    const queue = await syncQueuePersistence.loadQueue();
    const filteredQueue = queue.filter(
      item => !(item.tableName === tableName && item.recordId === recordId)
    );
    await syncQueuePersistence.saveQueue(filteredQueue);
  } catch (error) {
    console.error('Failed to remove queued operations for record:', error);
    throw error;
  }
}