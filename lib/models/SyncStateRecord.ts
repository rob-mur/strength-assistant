/**
 * SyncStateRecord Model for Sync Tracking
 *
 * Tracks synchronization status and pending changes for local-first architecture.
 * Manages retry logic and error handling for failed sync operations.
 */

export type SyncOperationType = "create" | "update" | "delete";

export interface SyncStateRecord {
  recordId: string;
  recordType: string;
  operation: SyncOperationType;
  pendingSince: Date;
  attempts: number;
  lastError?: string;
  nextRetryAt?: Date;
  payload?: Record<string, unknown>; // Operation-specific data
}

export interface SyncStateInput {
  recordId: string;
  recordType: string;
  operation: SyncOperationType;
  payload?: Record<string, unknown>;
}

/**
 * Validation errors for SyncState operations
 */
export class SyncValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "SyncValidationError";
  }
}

/**
 * Sync configuration constants
 */
export const SYNC_CONFIG = {
  MAX_ATTEMPTS: 5,
  RETRY_DELAYS: [1000, 5000, 30000, 120000, 600000], // 1s, 5s, 30s, 2m, 10m
  BACKOFF_TYPE: "exponential" as const,
} as const;

/**
 * Creates a new SyncStateRecord
 */
export function createSyncState(input: SyncStateInput): SyncStateRecord {
  validateSyncStateInput(input);

  return {
    recordId: input.recordId,
    recordType: input.recordType,
    operation: input.operation,
    pendingSince: new Date(),
    attempts: 0,
    payload: input.payload,
  };
}

/**
 * Updates sync state after a failed attempt
 */
export function recordSyncFailure(
  syncState: SyncStateRecord,
  error: string,
): SyncStateRecord {
  const nextAttempt = syncState.attempts + 1;

  if (nextAttempt > SYNC_CONFIG.MAX_ATTEMPTS) {
    throw new SyncValidationError("Maximum sync attempts exceeded");
  }

  const nextRetryDelay =
    SYNC_CONFIG.RETRY_DELAYS[syncState.attempts] ||
    SYNC_CONFIG.RETRY_DELAYS[SYNC_CONFIG.RETRY_DELAYS.length - 1];

  const nextRetryAt = new Date(Date.now() + nextRetryDelay);

  return {
    ...syncState,
    attempts: nextAttempt,
    lastError: error,
    nextRetryAt,
  };
}

/**
 * Checks if sync state is ready for retry
 */
export function isReadyForRetry(syncState: SyncStateRecord): boolean {
  if (syncState.attempts === 0) {
    return true; // First attempt
  }

  if (syncState.attempts >= SYNC_CONFIG.MAX_ATTEMPTS) {
    return false; // Exceeded max attempts
  }

  if (!syncState.nextRetryAt) {
    return true; // No retry time set, ready to retry
  }

  return new Date() >= syncState.nextRetryAt;
}

/**
 * Checks if sync state has failed permanently
 */
export function hasFailedPermanently(syncState: SyncStateRecord): boolean {
  return syncState.attempts >= SYNC_CONFIG.MAX_ATTEMPTS;
}

/**
 * Resets sync state for retry (useful for manual retry)
 */
export function resetForRetry(syncState: SyncStateRecord): SyncStateRecord {
  return {
    ...syncState,
    attempts: 0,
    lastError: undefined,
    nextRetryAt: undefined,
    pendingSince: new Date(),
  };
}

/**
 * Validates sync state input
 */
export function validateSyncStateInput(input: SyncStateInput): void {
  if (!input.recordId || typeof input.recordId !== "string") {
    throw new SyncValidationError("Record ID is required", "recordId");
  }

  if (!input.recordType || typeof input.recordType !== "string") {
    throw new SyncValidationError("Record type is required", "recordType");
  }

  if (!["create", "update", "delete"].includes(input.operation)) {
    throw new SyncValidationError("Invalid operation", "operation");
  }
}

/**
 * Validates complete SyncStateRecord
 */
export function validateSyncStateRecord(syncState: SyncStateRecord): void {
  validateSyncStateInput({
    recordId: syncState.recordId,
    recordType: syncState.recordType,
    operation: syncState.operation,
  });

  if (
    !(syncState.pendingSince instanceof Date) ||
    isNaN(syncState.pendingSince.getTime())
  ) {
    throw new SyncValidationError(
      "Invalid pendingSince timestamp",
      "pendingSince",
    );
  }

  if (typeof syncState.attempts !== "number" || syncState.attempts < 0) {
    throw new SyncValidationError("Invalid attempts count", "attempts");
  }

  if (syncState.attempts > SYNC_CONFIG.MAX_ATTEMPTS) {
    throw new SyncValidationError("Attempts count exceeds maximum", "attempts");
  }

  if (
    syncState.nextRetryAt &&
    (!(syncState.nextRetryAt instanceof Date) ||
      isNaN(syncState.nextRetryAt.getTime()))
  ) {
    throw new SyncValidationError(
      "Invalid nextRetryAt timestamp",
      "nextRetryAt",
    );
  }

  if (
    syncState.lastError !== undefined &&
    typeof syncState.lastError !== "string"
  ) {
    throw new SyncValidationError("lastError must be a string", "lastError");
  }
}

/**
 * Gets priority for sync operation (higher number = higher priority)
 */
export function getSyncPriority(syncState: SyncStateRecord): number {
  // Higher priority for operations that haven't been attempted yet
  if (syncState.attempts === 0) {
    return 100;
  }

  // Lower priority for operations with many failures
  if (syncState.attempts >= 3) {
    return 10;
  }

  // Medium priority for operations with few attempts
  return 50;
}

/**
 * Gets time until next retry in milliseconds
 */
export function getTimeUntilRetry(syncState: SyncStateRecord): number {
  if (!syncState.nextRetryAt) {
    return 0; // Ready to retry now
  }

  const now = new Date();
  const timeUntilRetry = syncState.nextRetryAt.getTime() - now.getTime();

  return Math.max(0, timeUntilRetry);
}

/**
 * Converts SyncStateRecord to database-safe format
 */
export function toDbFormat(
  syncState: SyncStateRecord,
): Record<string, unknown> {
  return {
    record_id: syncState.recordId,
    record_type: syncState.recordType,
    operation: syncState.operation,
    pending_since: syncState.pendingSince.toISOString(),
    attempts: syncState.attempts,
    last_error: syncState.lastError || null,
    next_retry_at: syncState.nextRetryAt?.toISOString() || null,
    payload: syncState.payload ? JSON.stringify(syncState.payload) : null,
  };
}

/**
 * Converts database format to SyncStateRecord
 */
export function fromDbFormat(
  dbRecord: Record<string, unknown>,
): SyncStateRecord {
  const syncState: SyncStateRecord = {
    recordId: dbRecord.record_id as string,
    recordType: dbRecord.record_type as string,
    operation: dbRecord.operation as SyncOperationType,
    pendingSince: new Date(dbRecord.pending_since as string),
    attempts: dbRecord.attempts as number,
  };

  if (dbRecord.last_error) {
    syncState.lastError = dbRecord.last_error as string;
  }

  if (dbRecord.next_retry_at) {
    syncState.nextRetryAt = new Date(dbRecord.next_retry_at as string);
  }

  if (dbRecord.payload) {
    try {
      syncState.payload = JSON.parse(dbRecord.payload as string);
    } catch {
      /* Silent error handling */
    }
  }

  // Validate the converted record
  validateSyncStateRecord(syncState);

  return syncState;
}

/**
 * Sync state utilities
 */
export const SyncStateUtils = {
  /**
   * Gets all sync states ready for processing
   */
  getReadyForSync: (syncStates: SyncStateRecord[]): SyncStateRecord[] => {
    return syncStates
      .filter(isReadyForRetry)
      .filter((state) => !hasFailedPermanently(state))
      .sort((a, b) => getSyncPriority(b) - getSyncPriority(a)); // Higher priority first
  },

  /**
   * Gets all permanently failed sync states
   */
  getPermanentlyFailed: (syncStates: SyncStateRecord[]): SyncStateRecord[] => {
    return syncStates.filter(hasFailedPermanently);
  },

  /**
   * Gets statistics about sync states
   */
  getStatistics: (syncStates: SyncStateRecord[]) => {
    const stats = {
      total: syncStates.length,
      pending: 0,
      retrying: 0,
      failed: 0,
      readyToSync: 0,
    };

    for (const state of syncStates) {
      if (hasFailedPermanently(state)) {
        stats.failed++;
      } else if (state.attempts === 0) {
        stats.pending++;
        if (isReadyForRetry(state)) {
          stats.readyToSync++;
        }
      } else {
        stats.retrying++;
        if (isReadyForRetry(state)) {
          stats.readyToSync++;
        }
      }
    }

    return stats;
  },

  /**
   * Groups sync states by record type
   */
  groupByRecordType: (
    syncStates: SyncStateRecord[],
  ): Record<string, SyncStateRecord[]> => {
    return syncStates.reduce(
      (groups, state) => {
        if (!groups[state.recordType]) {
          groups[state.recordType] = [];
        }
        groups[state.recordType].push(state);
        return groups;
      },
      {} as Record<string, SyncStateRecord[]>,
    );
  },

  /**
   * Groups sync states by operation
   */
  groupByOperation: (
    syncStates: SyncStateRecord[],
  ): Record<string, SyncStateRecord[]> => {
    return syncStates.reduce(
      (groups, state) => {
        if (!groups[state.operation]) {
          groups[state.operation] = [];
        }
        groups[state.operation].push(state);
        return groups;
      },
      {} as Record<string, SyncStateRecord[]>,
    );
  },

  /**
   * Gets next retry time for the earliest pending sync
   */
  getNextRetryTime: (syncStates: SyncStateRecord[]): Date | null => {
    const waitingStates = syncStates
      .filter(
        (state) => !hasFailedPermanently(state) && !isReadyForRetry(state),
      )
      .filter((state) => state.nextRetryAt)
      .sort((a, b) => a.nextRetryAt!.getTime() - b.nextRetryAt!.getTime());

    return waitingStates.length > 0 ? waitingStates[0].nextRetryAt! : null;
  },

  /**
   * Estimates sync completion time based on current state
   */
  estimateCompletionTime: (syncStates: SyncStateRecord[]): Date | null => {
    const readyStates = SyncStateUtils.getReadyForSync(syncStates);
    const nextRetryTime = SyncStateUtils.getNextRetryTime(syncStates);

    if (readyStates.length === 0 && !nextRetryTime) {
      return null; // Nothing to sync
    }

    // Simple estimation: assume 1 second per ready item + next retry time
    const estimatedTime = new Date();
    estimatedTime.setSeconds(estimatedTime.getSeconds() + readyStates.length);

    if (nextRetryTime && nextRetryTime > estimatedTime) {
      return nextRetryTime;
    }

    return estimatedTime;
  },
};
