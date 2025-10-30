/**
 * ExerciseRecord Model (Enhanced)
 * Purpose: Extended exercise entity with sync metadata for offline-first operation
 */

import { SyncStatus, createSyncStatus } from "./SyncStatus";

export type ExerciseRecordInput = Omit<
  ExerciseRecord,
  "id" | "createdAt" | "updatedAt" | "syncStatus"
>;
export type ExerciseRecordUpdate = Partial<ExerciseRecordInput>;
export type ExerciseSort = "name" | "createdAt" | "updatedAt" | "category";

export interface ExerciseRecord {
  /** Unique exercise identifier */
  id: string;

  /** Exercise name */
  name: string;

  /** Owner user identifier */
  userId: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;

  /** Soft delete flag */
  deleted: boolean;

  /** Sync state tracking */
  syncStatus: SyncStatus;

  /** Temporary local-only flag */
  localOnlyUntil: Date | null;

  /** Domain-specific conflict data */
  conflictResolutionData: any | null;
}

/**
 * Validation rules for ExerciseRecord
 */
export const validateExerciseRecord = (record: ExerciseRecord): string[] => {
  const errors: string[] = [];

  // Name validation
  if (!record.name || !record.name.trim()) {
    errors.push("name must be non-empty string");
  }

  // Timestamp validation
  if (record.updatedAt < record.createdAt) {
    errors.push("updatedAt must be >= createdAt");
  }

  // Required fields validation
  if (!record.id.trim()) {
    errors.push("id is required");
  }

  if (!record.userId.trim()) {
    errors.push("userId is required");
  }

  return errors;
};

/**
 * Create a new ExerciseRecord
 */
export const createExerciseRecord = (params: {
  id: string;
  name: string;
  userId: string;
  deleted?: boolean;
  localOnlyUntil?: Date | null;
}): ExerciseRecord => {
  const now = new Date();

  const record: ExerciseRecord = {
    id: params.id,
    name: params.name,
    userId: params.userId,
    createdAt: now,
    updatedAt: now,
    deleted: params.deleted || false,
    syncStatus: createSyncStatus(), // Starts as 'pending'
    localOnlyUntil: params.localOnlyUntil || null,
    conflictResolutionData: null,
  };

  const validationErrors = validateExerciseRecord(record);
  if (validationErrors.length > 0) {
    throw new Error(
      `ExerciseRecord validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return record;
};

/**
 * Update exercise record with validation
 */
export const updateExerciseRecord = (
  current: ExerciseRecord,
  updates: Partial<ExerciseRecord>,
): ExerciseRecord => {
  const updatedRecord: ExerciseRecord = {
    ...current,
    ...updates,
    updatedAt: new Date(), // Always update timestamp on modification
  };

  const validationErrors = validateExerciseRecord(updatedRecord);
  if (validationErrors.length > 0) {
    throw new Error(
      `ExerciseRecord validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return updatedRecord;
};

/**
 * Mark record as synced
 */
export const markAsSynced = (record: ExerciseRecord): ExerciseRecord => {
  return updateExerciseRecord(record, {
    syncStatus: {
      ...record.syncStatus,
      status: "synced",
      lastSyncSuccess: new Date(),
      errorMessage: null,
      conflictVersion: null,
    },
  });
};

/**
 * Mark record as sync failed
 */
export const markAsSyncFailed = (
  record: ExerciseRecord,
  errorMessage: string,
): ExerciseRecord => {
  return updateExerciseRecord(record, {
    syncStatus: {
      ...record.syncStatus,
      status: "failed",
      retryCount: record.syncStatus.retryCount + 1,
      lastSyncAttempt: new Date(),
      errorMessage,
    },
  });
};

/**
 * Mark record as having sync conflict
 */
export const markAsConflicted = (
  record: ExerciseRecord,
  serverVersion: any,
): ExerciseRecord => {
  return updateExerciseRecord(record, {
    syncStatus: {
      ...record.syncStatus,
      status: "conflict",
      conflictVersion: serverVersion,
      lastSyncAttempt: new Date(),
    },
  });
};

/**
 * Check if record needs sync
 */
export const needsSync = (record: ExerciseRecord): boolean => {
  return (
    record.syncStatus.status === "pending" ||
    record.syncStatus.status === "failed"
  );
};

/**
 * Check if record is local-only temporarily
 */
export const isTemporaryLocalOnly = (record: ExerciseRecord): boolean => {
  if (!record.localOnlyUntil) {
    return false;
  }

  return new Date() < record.localOnlyUntil;
};

/**
 * Soft delete record
 */
export const softDeleteRecord = (record: ExerciseRecord): ExerciseRecord => {
  return updateExerciseRecord(record, {
    deleted: true,
    syncStatus: createSyncStatus(), // Mark for sync
  });
};

/**
 * Convert to Supabase format
 */
export const toSupabaseFormat = (record: ExerciseRecord) => {
  return {
    id: record.id,
    name: record.name,
    user_id: record.userId,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
    deleted: record.deleted,
  };
};

/**
 * Convert from Supabase format
 */
export const fromSupabaseFormat = (data: any): ExerciseRecord => {
  return {
    id: data.id,
    name: data.name,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deleted: data.deleted || false,
    syncStatus: createSyncStatus({ status: "synced" }), // Assume synced from server
    localOnlyUntil: null,
    conflictResolutionData: null,
  };
};

/**
 * Check if record conflicts with server version
 */
export const hasConflictWith = (
  local: ExerciseRecord,
  server: ExerciseRecord,
): boolean => {
  // Simple timestamp-based conflict detection
  return (
    local.updatedAt.getTime() !== server.updatedAt.getTime() &&
    local.syncStatus.status === "pending"
  );
};

/**
 * Merge local and server versions
 */
export const mergeWithServerVersion = (
  local: ExerciseRecord,
  server: ExerciseRecord,
): ExerciseRecord => {
  // Last-write-wins merge strategy
  const winner = local.updatedAt > server.updatedAt ? local : server;

  return updateExerciseRecord(winner, {
    syncStatus: createSyncStatus({ status: "synced" }),
    conflictResolutionData: {
      mergedAt: new Date(),
      localVersion: local,
      serverVersion: server,
      strategy: "last_write_wins",
    },
  });
};

/**
 * Filter records by sync status
 */
export const filterBySyncStatus = (
  records: ExerciseRecord[],
  status: string,
): ExerciseRecord[] => {
  return records.filter((record) => record.syncStatus.status === status);
};

/**
 * Get records that need sync
 */
export const getRecordsNeedingSync = (
  records: ExerciseRecord[],
): ExerciseRecord[] => {
  return records.filter(needsSync);
};

/**
 * Get sync statistics for records
 */
export const getSyncStats = (records: ExerciseRecord[]) => {
  return {
    total: records.length,
    pending: filterBySyncStatus(records, "pending").length,
    syncing: filterBySyncStatus(records, "syncing").length,
    synced: filterBySyncStatus(records, "synced").length,
    failed: filterBySyncStatus(records, "failed").length,
    conflicts: filterBySyncStatus(records, "conflict").length,
    needingSync: getRecordsNeedingSync(records).length,
  };
};

// Aliases for backward compatibility
export const toDbFormat = toSupabaseFormat;
export const fromDbFormat = fromSupabaseFormat;
