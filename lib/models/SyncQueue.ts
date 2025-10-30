/**
 * SyncQueue Model
 * Purpose: Manage pending operations with priority and batch optimization
 */

export type SyncOperation = "create" | "update" | "delete";
export type SyncPriority = "critical" | "high" | "medium" | "low";

export interface SyncQueue {
  /** Unique queue entry identifier */
  id: string;

  /** Type of operation */
  operation: SyncOperation;

  /** Target database table */
  tableName: string;

  /** Target record identifier */
  recordId: string;

  /** Operation payload */
  data: any;

  /** Sync priority level */
  priority: SyncPriority;

  /** When operation was queued */
  createdAt: Date;

  /** Number of sync attempts */
  attempts: number;

  /** Last attempt timestamp */
  lastAttemptAt: Date | null;

  /** Batch grouping identifier */
  batchId: string | null;
}

/**
 * Priority ordering values for sorting
 */
export const PRIORITY_ORDER: Record<SyncPriority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

/**
 * Validation rules for SyncQueue
 */
export const validateSyncQueue = (syncQueue: SyncQueue): string[] => {
  const errors: string[] = [];

  // Attempts validation
  if (syncQueue.attempts < 0 || syncQueue.attempts > 5) {
    errors.push("attempts must be >= 0 and <= 5");
  }

  // Last attempt validation
  if (
    syncQueue.lastAttemptAt &&
    syncQueue.lastAttemptAt < syncQueue.createdAt
  ) {
    errors.push("lastAttemptAt must be >= createdAt when set");
  }

  // Required fields validation
  if (!syncQueue.id.trim()) {
    errors.push("id is required");
  }

  if (!syncQueue.tableName.trim()) {
    errors.push("tableName is required");
  }

  if (!syncQueue.recordId.trim()) {
    errors.push("recordId is required");
  }

  return errors;
};

/**
 * Create a new SyncQueue entry
 */
export const createSyncQueueEntry = (params: {
  id: string;
  operation: SyncOperation;
  tableName: string;
  recordId: string;
  data?: any;
  priority?: SyncPriority;
  batchId?: string;
}): SyncQueue => {
  const entry: SyncQueue = {
    id: params.id,
    operation: params.operation,
    tableName: params.tableName,
    recordId: params.recordId,
    data: params.data || null,
    priority: params.priority || "medium",
    createdAt: new Date(),
    attempts: 0,
    lastAttemptAt: null,
    batchId: params.batchId || null,
  };

  const validationErrors = validateSyncQueue(entry);
  if (validationErrors.length > 0) {
    throw new Error(
      `SyncQueue validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return entry;
};

/**
 * Update sync queue entry with validation
 */
export const updateSyncQueueEntry = (
  current: SyncQueue,
  updates: Partial<SyncQueue>,
): SyncQueue => {
  const updatedEntry = { ...current, ...updates };

  const validationErrors = validateSyncQueue(updatedEntry);
  if (validationErrors.length > 0) {
    throw new Error(
      `SyncQueue validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return updatedEntry;
};

/**
 * Increment attempt count and update timestamp
 */
export const incrementAttempt = (entry: SyncQueue): SyncQueue => {
  return updateSyncQueueEntry(entry, {
    attempts: entry.attempts + 1,
    lastAttemptAt: new Date(),
  });
};

/**
 * Sort queue entries by priority and creation time
 */
export const sortQueueByPriority = (entries: SyncQueue[]): SyncQueue[] => {
  return entries.sort((a, b) => {
    // Primary sort: priority (critical first)
    const priorityDiff =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Secondary sort: creation time (oldest first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
};

/**
 * Group queue entries into batches
 */
export const groupIntoBatches = (
  entries: SyncQueue[],
  batchSize: number,
): SyncQueue[][] => {
  const sortedEntries = sortQueueByPriority(entries);
  const batches: SyncQueue[][] = [];

  for (let i = 0; i < sortedEntries.length; i += batchSize) {
    batches.push(sortedEntries.slice(i, i + batchSize));
  }

  return batches;
};

/**
 * Check if entry should be retried
 */
export const shouldRetry = (entry: SyncQueue): boolean => {
  return entry.attempts < 5;
};

/**
 * Get retry delay using exponential backoff
 */
export const getRetryDelay = (attempts: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds

  const delay = baseDelay * Math.pow(2, attempts);
  return Math.min(delay, maxDelay);
};

/**
 * Check if entry is stale (older than threshold)
 */
export const isStale = (
  entry: SyncQueue,
  thresholdHours: number = 24,
): boolean => {
  const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
  return entry.createdAt < threshold;
};

/**
 * Filter entries by priority
 */
export const filterByPriority = (
  entries: SyncQueue[],
  priority: SyncPriority,
): SyncQueue[] => {
  return entries.filter((entry) => entry.priority === priority);
};

/**
 * Filter entries by table
 */
export const filterByTable = (
  entries: SyncQueue[],
  tableName: string,
): SyncQueue[] => {
  return entries.filter((entry) => entry.tableName === tableName);
};

/**
 * Get queue statistics
 */
export const getQueueStats = (entries: SyncQueue[]) => {
  const stats = {
    total: entries.length,
    byPriority: {} as Record<SyncPriority, number>,
    byOperation: {} as Record<SyncOperation, number>,
    failedEntries: entries.filter((e) => e.attempts >= 5).length,
    staleEntries: entries.filter((e) => isStale(e)).length,
    oldestEntry:
      entries.length > 0
        ? Math.min(...entries.map((e) => e.createdAt.getTime()))
        : null,
  };

  // Count by priority
  (["critical", "high", "medium", "low"] as SyncPriority[]).forEach(
    (priority) => {
      stats.byPriority[priority] = entries.filter(
        (e) => e.priority === priority,
      ).length;
    },
  );

  // Count by operation
  (["create", "update", "delete"] as SyncOperation[]).forEach((operation) => {
    stats.byOperation[operation] = entries.filter(
      (e) => e.operation === operation,
    ).length;
  });

  return stats;
};
