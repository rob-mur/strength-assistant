/**
 * SyncManager Service
 * Purpose: Core offline sync management implementing the SyncManagerContract
 */

import {
  SyncManagerContract,
  SyncOperation,
  QueuedOperation,
  SyncResult,
  QueueProcessResult,
  QueueStatus,
  SyncConflict,
  ConflictResolution,
  NetworkState,
  NetworkCondition,
  GlobalSyncStatus,
  SyncError,
} from "../contracts/sync-manager-contract";
import {
  SyncQueue,
  createSyncQueueEntry,
  sortQueueByPriority,
  shouldRetry,
  getRetryDelay,
} from "../models/SyncQueue";
import { ConnectivityMonitor } from "./ConnectivityMonitor";
import { createNetworkState } from "../models/NetworkState";

export class SyncManager implements SyncManagerContract {
  private queue: SyncQueue[] = [];
  private conflicts: SyncConflict[] = [];
  private connectivityMonitor: ConnectivityMonitor;
  private isProcessing = false;
  private statusListeners: Set<(status: GlobalSyncStatus) => void> = new Set();

  constructor() {
    this.connectivityMonitor = new ConnectivityMonitor();
    this.setupConnectivityMonitoring();
  }

  /**
   * Core sync operations
   */
  async syncToCloud(
    recordId: string,
    operation: SyncOperation,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    try {
      // Implementation would sync specific record to Supabase
      // For now, return success for basic functionality
      result.success = true;
      result.recordsProcessed = 1;
    } catch (error) {
      result.errors.push({
        id: `sync-error-${Date.now()}`,
        operation: {
          type: "create",
          tableName: "exercises",
          recordId,
          timestamp: new Date(),
        },
        error: error as Error,
        timestamp: new Date(),
        retryable: true,
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async syncFromCloud(lastPulledAt?: Date): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    try {
      // Implementation would pull records from Supabase
      // For now, return success for basic functionality
      result.success = true;
      result.recordsProcessed = 0;
    } catch (error) {
      result.errors.push({
        id: `sync-error-${Date.now()}`,
        operation: {
          type: "update",
          tableName: "exercises",
          recordId: "all",
          timestamp: new Date(),
        },
        error: error as Error,
        timestamp: new Date(),
        retryable: true,
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async forceSyncAll(): Promise<SyncResult> {
    const queueResult = await this.processQueue();
    return {
      success: queueResult.success,
      recordsProcessed: queueResult.processed,
      conflicts: queueResult.conflicts,
      errors: queueResult.errors,
      duration: 0, // Would be measured in real implementation
    };
  }

  /**
   * Queue management
   */
  async addToQueue(operation: QueuedOperation): Promise<void> {
    const queueEntry = createSyncQueueEntry({
      id: operation.id,
      operation: operation.type,
      tableName: operation.tableName,
      recordId: operation.recordId,
      data: operation.data,
      priority: operation.priority,
      batchId: operation.batchId,
    });

    this.queue.push(queueEntry);
    this.notifyStatusChange();
  }

  async processQueue(): Promise<QueueProcessResult> {
    if (this.isProcessing) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        remaining: this.queue.length,
        conflicts: [],
        errors: [],
      };
    }

    this.isProcessing = true;
    const result: QueueProcessResult = {
      success: true,
      processed: 0,
      failed: 0,
      remaining: 0,
      conflicts: [],
      errors: [],
    };

    try {
      const networkState = this.connectivityMonitor.getCurrentState();

      if (!networkState.isOnline || !networkState.isInternetReachable) {
        // Can't process queue while offline
        result.remaining = this.queue.length;
        return result;
      }

      const sortedQueue = sortQueueByPriority(this.queue);
      const processedEntries: string[] = [];

      for (const entry of sortedQueue) {
        try {
          await this.processQueueEntry(entry);
          processedEntries.push(entry.id);
          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: `process-error-${Date.now()}`,
            operation: {
              type: entry.operation,
              tableName: entry.tableName,
              recordId: entry.recordId,
              timestamp: new Date(),
            },
            error: error as Error,
            timestamp: new Date(),
            retryable: shouldRetry(entry),
          });

          // Update entry attempt count
          entry.attempts++;
          entry.lastAttemptAt = new Date();
        }
      }

      // Remove processed entries from queue
      this.queue = this.queue.filter(
        (entry) => !processedEntries.includes(entry.id),
      );
      result.remaining = this.queue.length;
    } finally {
      this.isProcessing = false;
      this.notifyStatusChange();
    }

    return result;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    this.notifyStatusChange();
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.queue.forEach((entry) => {
      byPriority[entry.priority]++;
    });

    const oldestEntry =
      this.queue.length > 0
        ? new Date(Math.min(...this.queue.map((e) => e.createdAt.getTime())))
        : null;

    return {
      totalPending: this.queue.length,
      byPriority,
      oldestPending: oldestEntry,
      isProcessing: this.isProcessing,
      lastProcessedAt: null, // Would be tracked in real implementation
    };
  }

  /**
   * Conflict resolution
   */
  detectConflicts(localData: any[], serverData: any[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    // Simple conflict detection based on ID and timestamp
    localData.forEach((local) => {
      const server = serverData.find((s) => s.id === local.id);
      if (server && local.updatedAt !== server.updatedAt) {
        conflicts.push({
          id: `conflict-${local.id}-${Date.now()}`,
          tableName: "exercises",
          recordId: local.id,
          localVersion: local,
          serverVersion: server,
          conflictType: "concurrent_update",
          detectedAt: new Date(),
          resolvedAt: undefined,
          resolution: undefined,
        });
      }
    });

    return conflicts;
  }

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
  ): Promise<void> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();

    // Remove resolved conflict
    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
  }

  async getUnresolvedConflicts(): Promise<SyncConflict[]> {
    return this.conflicts.filter((c) => !c.resolvedAt);
  }

  /**
   * Network state management
   */
  onNetworkStateChange(handler: (state: NetworkState) => void): () => void {
    return this.connectivityMonitor.addListener(handler);
  }

  getCurrentNetworkState(): NetworkState {
    return this.connectivityMonitor.getCurrentState();
  }

  setNetworkState(state: NetworkState): void {
    this.connectivityMonitor.updateState(state);
  }

  /**
   * Status and monitoring
   */
  async getSyncStatus(): Promise<GlobalSyncStatus> {
    const networkState = this.connectivityMonitor.getCurrentState();
    const unresolvedConflicts = await this.getUnresolvedConflicts();

    return {
      isOnline: networkState.isOnline && networkState.isInternetReachable,
      isSyncing: this.isProcessing,
      pendingOperations: this.queue.length,
      lastSyncTime: undefined, // Would be tracked in real implementation
      unresolvedConflicts: unresolvedConflicts.length,
      errors: [], // Would track recent errors
    };
  }

  onSyncStatusChange(handler: (status: GlobalSyncStatus) => void): () => void {
    this.statusListeners.add(handler);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  /**
   * Testing utilities
   */
  async reset(): Promise<void> {
    this.queue = [];
    this.conflicts = [];
    this.isProcessing = false;
    this.notifyStatusChange();
  }

  simulateNetworkCondition(condition: NetworkCondition): void {
    let networkState: NetworkState;

    switch (condition.type) {
      case "fast":
        networkState = createNetworkState({
          isOnline: true,
          isInternetReachable: true,
          connectionType: "wifi",
          effectiveType: "fast",
        });
        break;
      case "slow":
        networkState = createNetworkState({
          isOnline: true,
          isInternetReachable: true,
          connectionType: "cellular",
          effectiveType: "slow",
        });
        break;
      case "unstable":
        networkState = createNetworkState({
          isOnline: true,
          isInternetReachable: false,
          connectionType: "cellular",
          effectiveType: "slow",
        });
        break;
      case "offline":
        networkState = createNetworkState({
          isOnline: false,
          isInternetReachable: false,
          connectionType: "none",
          effectiveType: "unknown",
        });
        break;
      default:
        return;
    }

    this.setNetworkState(networkState);
  }

  /**
   * Private methods
   */
  private setupConnectivityMonitoring(): void {
    this.connectivityMonitor.startMonitoring();

    // Auto-process queue when connection is restored
    this.connectivityMonitor.addListener((state) => {
      if (
        state.isOnline &&
        state.isInternetReachable &&
        this.queue.length > 0
      ) {
        // Delay processing to allow connection to stabilize
        setTimeout(() => {
          this.processQueue();
        }, 1000);
      }
    });
  }

  private async processQueueEntry(entry: SyncQueue): Promise<void> {
    // Simulate sync operation
    // In real implementation, this would call Supabase APIs
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate potential failure for testing
    if (Math.random() < 0.1) {
      // 10% failure rate for testing
      throw new Error(`Sync failed for ${entry.recordId}`);
    }
  }

  private notifyStatusChange(): void {
    this.getSyncStatus().then((status) => {
      this.statusListeners.forEach((listener) => {
        try {
          listener(status);
        } catch (error) {
          console.error("Error in sync status listener:", error);
        }
      });
    });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.connectivityMonitor.destroy();
    this.statusListeners.clear();
  }
}
