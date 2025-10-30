/**
 * Contract: SyncManager Service
 * Purpose: Define interface for offline sync management with test validation
 *
 * This contract ensures SyncManager implements comprehensive offline sync
 * functionality including queue management, conflict resolution, and network adaptation.
 */

export interface SyncManagerContract {
  // Core sync operations
  syncToCloud(recordId: string, operation: SyncOperation): Promise<SyncResult>;
  syncFromCloud(lastPulledAt?: Date): Promise<SyncResult>;
  forceSyncAll(): Promise<SyncResult>;

  // Queue management
  addToQueue(operation: QueuedOperation): Promise<void>;
  processQueue(): Promise<QueueProcessResult>;
  clearQueue(): Promise<void>;
  getQueueStatus(): Promise<QueueStatus>;

  // Conflict resolution
  detectConflicts(localData: any[], serverData: any[]): SyncConflict[];
  resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
  ): Promise<void>;
  getUnresolvedConflicts(): Promise<SyncConflict[]>;

  // Network state management
  onNetworkStateChange(handler: (state: NetworkState) => void): () => void;
  getCurrentNetworkState(): NetworkState;
  setNetworkState(state: NetworkState): void; // For testing only

  // Status and monitoring
  getSyncStatus(): Promise<GlobalSyncStatus>;
  onSyncStatusChange(handler: (status: GlobalSyncStatus) => void): () => void;

  // Testing utilities
  reset(): Promise<void>; // Reset all state for testing
  simulateNetworkCondition(condition: NetworkCondition): void;
}

export interface SyncOperation {
  type: "create" | "update" | "delete";
  tableName: string;
  recordId: string;
  data?: any;
  timestamp: Date;
}

export interface QueuedOperation extends SyncOperation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  attempts: number;
  lastAttemptAt?: Date;
  batchId?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
  duration: number;
}

export interface QueueProcessResult {
  success: boolean;
  processed: number;
  failed: number;
  remaining: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

export interface QueueStatus {
  totalPending: number;
  byPriority: Record<string, number>;
  oldestPending: Date | null;
  isProcessing: boolean;
  lastProcessedAt: Date | null;
}

export interface SyncConflict {
  id: string;
  tableName: string;
  recordId: string;
  localVersion: any;
  serverVersion: any;
  conflictType: "concurrent_update" | "delete_conflict" | "schema_mismatch";
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: "local_wins" | "server_wins" | "merged" | "manual";
  resolvedData?: any;
  resolvedBy: "system" | "user";
}

export interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean;
  connectionType: "wifi" | "cellular" | "ethernet" | "none" | "unknown";
  effectiveType: "slow" | "moderate" | "fast" | "unknown";
  lastOnlineTime?: Date;
  lastOfflineTime?: Date;
}

export interface NetworkCondition {
  type: "fast" | "moderate" | "slow" | "unstable" | "offline";
  latencyMs?: number;
  failureRate?: number;
  intermittentConnectivity?: boolean;
}

export interface GlobalSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime?: Date;
  unresolvedConflicts: number;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: SyncOperation;
  error: Error;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Test Validation Contract
 *
 * All implementations of SyncManagerContract must pass these test scenarios:
 */
export interface SyncManagerTestContract {
  // Offline operation tests
  testOfflineOperationsQueueProperly(): Promise<void>;
  testOfflineDataPersistsThroughRestart(): Promise<void>;
  testMultipleOfflineOperationsBatch(): Promise<void>;

  // Network transition tests
  testOnlineToOfflineTransition(): Promise<void>;
  testOfflineToOnlineRecovery(): Promise<void>;
  testIntermittentConnectivityHandling(): Promise<void>;

  // Conflict resolution tests
  testConcurrentUpdateConflictDetection(): Promise<void>;
  testAutomaticConflictResolution(): Promise<void>;
  testManualConflictResolution(): Promise<void>;

  // Performance tests
  testBatchSizeAdaptation(): Promise<void>;
  testLargeDatasetSync(): Promise<void>;
  testSyncPerformanceUnderLoad(): Promise<void>;

  // Error handling tests
  testSyncFailureRecovery(): Promise<void>;
  testRetryMechanism(): Promise<void>;
  testPermanentErrorHandling(): Promise<void>;

  // Real-world scenario tests
  testAirplaneModeWorkflow(): Promise<void>; // The specific bug from spec
  testExtendedOfflinePeriod(): Promise<void>;
  testSyncAfterAppRestart(): Promise<void>;
}

/**
 * Usage Examples for Implementation
 */
export const SyncManagerContractExamples = {
  // Basic offline operation
  async offlineCreate(syncManager: SyncManagerContract) {
    // Should queue operation when offline
    await syncManager.setNetworkState({
      isOnline: false,
      isInternetReachable: false,
      connectionType: "none",
      effectiveType: "unknown",
    });

    await syncManager.addToQueue({
      id: "offline-op-1",
      type: "create",
      tableName: "exercises",
      recordId: "exercise-1",
      data: { name: "Offline Exercise" },
      priority: "high",
      attempts: 0,
      timestamp: new Date(),
    });

    const status = await syncManager.getQueueStatus();
    expect(status.totalPending).toBe(1);
  },

  // Network recovery
  async networkRecovery(syncManager: SyncManagerContract) {
    // Set online and process queue
    await syncManager.setNetworkState({
      isOnline: true,
      isInternetReachable: true,
      connectionType: "wifi",
      effectiveType: "fast",
    });

    const result = await syncManager.processQueue();
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  },

  // Conflict handling
  async conflictResolution(syncManager: SyncManagerContract) {
    const conflicts = await syncManager.getUnresolvedConflicts();

    for (const conflict of conflicts) {
      await syncManager.resolveConflict(conflict.id, {
        strategy: "merged",
        resolvedData: mergeExerciseData(
          conflict.localVersion,
          conflict.serverVersion,
        ),
        resolvedBy: "system",
      });
    }
  },
};

/**
 * Helper function for exercise data merging
 */
function mergeExerciseData(local: any, server: any): any {
  return {
    ...server,
    ...local,
    updatedAt: new Date(), // Mark as newly resolved
    // Exercise-specific merge logic
    sets: [...(local.sets || []), ...(server.sets || [])].filter(
      (set, index, arr) => arr.findIndex((s) => s.id === set.id) === index,
    ),
  };
}
