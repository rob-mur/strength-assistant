/**
 * SyncManager
 * Handles offline sync queue processing and automatic synchronization
 */

import NetInfo from '@react-native-community/netinfo';
import { syncQueuePersistence } from './SyncQueuePersistence';
import { SyncQueue, incrementAttempt, shouldRetry, getRetryDelay } from '../../models/SyncQueue';
import { syncExerciseToSupabase, deleteExerciseFromSupabase } from './syncConfig';
import { supabaseClient } from '../supabase/SupabaseClient';
import { Exercise } from '../../models/Exercise';

export interface SyncManagerConfig {
  /** Enable automatic sync when connectivity is restored */
  autoSyncEnabled: boolean;
  
  /** Maximum batch size for sync operations */
  maxBatchSize: number;
  
  /** Retry delay multiplier for failed operations */
  retryDelayMultiplier: number;
  
  /** Enable debug logging */
  enableLogging: boolean;
}

const DEFAULT_CONFIG: SyncManagerConfig = {
  autoSyncEnabled: true,
  maxBatchSize: 10,
  retryDelayMultiplier: 1.0,
  enableLogging: true,
};

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

/**
 * Manages offline sync queue and automatic synchronization
 */
export class SyncManager {
  private config: SyncManagerConfig;
  private isProcessing = false;
  private networkUnsubscribe: (() => void) | null = null;
  
  constructor(config: Partial<SyncManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.autoSyncEnabled) {
      this.startNetworkMonitoring();
    }
  }
  
  /**
   * Start monitoring network state and auto-sync when online
   */
  private startNetworkMonitoring(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (this.config.enableLogging) {
        console.log('🌐 Network state changed:', {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
        });
      }
      
      // Auto-sync when connectivity is restored
      if (state.isConnected && state.isInternetReachable) {
        this.processSyncQueue().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
    });
  }
  
  /**
   * Stop network monitoring
   */
  stopNetworkMonitoring(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }
  
  /**
   * Process all pending sync operations
   */
  async processSyncQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      if (this.config.enableLogging) {
        console.log('🔄 Sync already in progress, skipping...');
      }
      return { success: true, processed: 0, failed: 0, errors: [] };
    }
    
    this.isProcessing = true;
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      // Check if we have network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        if (this.config.enableLogging) {
          console.log('🌐 No network connectivity, skipping sync');
        }
        return result;
      }
      
      // Load pending operations from storage
      const pendingOperations = await syncQueuePersistence.loadQueue();
      
      if (pendingOperations.length === 0) {
        if (this.config.enableLogging) {
          console.log('📭 No pending sync operations');
        }
        return result;
      }
      
      if (this.config.enableLogging) {
        console.log(`🔄 Processing ${pendingOperations.length} pending sync operations`);
      }
      
      // Process operations in batches
      const batches = this.createBatches(pendingOperations);
      
      for (const batch of batches) {
        await this.processBatch(batch, result);
      }
      
      if (this.config.enableLogging) {
        console.log('✅ Sync completed:', {
          processed: result.processed,
          failed: result.failed,
          errors: result.errors.length,
        });
      }
      
      result.success = result.failed === 0;
      return result;
      
    } catch (error) {
      console.error('❌ Sync processing failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      return result;
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Create batches from pending operations
   */
  private createBatches(operations: SyncQueue[]): SyncQueue[][] {
    const batches: SyncQueue[][] = [];
    const sortedOps = operations.sort((a, b) => {
      // Sort by priority first, then by creation time
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    for (let i = 0; i < sortedOps.length; i += this.config.maxBatchSize) {
      batches.push(sortedOps.slice(i, i + this.config.maxBatchSize));
    }
    
    return batches;
  }
  
  /**
   * Process a batch of sync operations
   */
  private async processBatch(batch: SyncQueue[], result: SyncResult): Promise<void> {
    for (const operation of batch) {
      try {
        await this.processOperation(operation);
        result.processed++;
        
        // Remove successful operation from queue
        await syncQueuePersistence.removeFromQueue(operation.id);
        
        if (this.config.enableLogging) {
          console.log(`✅ Synced operation ${operation.id}: ${operation.operation} ${operation.tableName}/${operation.recordId}`);
        }
        
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${operation.id}: ${errorMessage}`);
        
        if (this.config.enableLogging) {
          console.error(`❌ Failed to sync operation ${operation.id}:`, error);
        }
        
        // Handle retry logic
        await this.handleOperationFailure(operation, error);
      }
    }
  }
  
  /**
   * Process a single sync operation
   */
  private async processOperation(operation: SyncQueue): Promise<void> {
    switch (operation.tableName) {
      case 'exercises':
        await this.processExerciseOperation(operation);
        break;
      
      default:
        throw new Error(`Unsupported table: ${operation.tableName}`);
    }
  }
  
  /**
   * Process exercise-specific sync operations
   */
  private async processExerciseOperation(operation: SyncQueue): Promise<void> {
    switch (operation.operation) {
      case 'create':
      case 'update':
        if (!operation.data) {
          throw new Error('Exercise data is required for create/update operations');
        }
        await syncExerciseToSupabase(operation.data as Exercise);
        break;
      
      case 'delete':
        // For delete operations, we need the user ID
        const user = await supabaseClient.getCurrentUser();
        if (!user) {
          throw new Error('User authentication required for delete operations');
        }
        await deleteExerciseFromSupabase(operation.recordId, user.id);
        break;
      
      default:
        throw new Error(`Unsupported operation: ${operation.operation}`);
    }
  }
  
  /**
   * Handle operation failure with retry logic
   */
  private async handleOperationFailure(operation: SyncQueue, error: unknown): Promise<void> {
    const updatedOperation = incrementAttempt(operation);
    
    if (shouldRetry(updatedOperation)) {
      // Calculate retry delay
      const delay = getRetryDelay(updatedOperation.attempts) * this.config.retryDelayMultiplier;
      
      if (this.config.enableLogging) {
        console.log(`🔄 Retrying operation ${operation.id} in ${delay}ms (attempt ${updatedOperation.attempts}/5)`);
      }
      
      // Update operation in queue with new attempt count
      await syncQueuePersistence.addToQueue(updatedOperation);
      
      // Schedule retry
      setTimeout(() => {
        this.processSyncQueue().catch(retryError => {
          console.error('Retry sync failed:', retryError);
        });
      }, delay);
      
    } else {
      // Operation has exceeded max retries, remove from queue
      console.error(`❌ Operation ${operation.id} failed after 5 attempts, removing from queue:`, error);
      await syncQueuePersistence.removeFromQueue(operation.id);
    }
  }
  
  /**
   * Get current sync queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: boolean;
    oldestEntry: Date | null;
  }> {
    const stats = await syncQueuePersistence.getQueueStats();
    return {
      pending: stats.count,
      processing: this.isProcessing,
      oldestEntry: stats.oldestEntry,
    };
  }
  
  /**
   * Force immediate sync (ignores network state)
   */
  async forceSyncNow(): Promise<SyncResult> {
    if (this.config.enableLogging) {
      console.log('🚀 Force sync requested');
    }
    return this.processSyncQueue();
  }
  
  /**
   * Clear all pending operations
   */
  async clearAllPendingOperations(): Promise<void> {
    await syncQueuePersistence.clearQueue();
    if (this.config.enableLogging) {
      console.log('🧹 All pending sync operations cleared');
    }
  }
}

/**
 * Singleton sync manager instance
 */
export const syncManager = new SyncManager();