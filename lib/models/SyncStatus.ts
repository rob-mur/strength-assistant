/**
 * SyncStatus Model
 * Purpose: Track synchronization state of local data with enhanced conflict detection
 */

export type SyncStatusValue =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict";

export interface SyncStatus {
  /** Current sync status */
  status: SyncStatusValue;

  /** When sync was last attempted */
  lastSyncAttempt: Date | null;

  /** When sync last succeeded */
  lastSyncSuccess: Date | null;

  /** Number of failed retry attempts (0-5) */
  retryCount: number;

  /** Last sync error details */
  errorMessage: string | null;

  /** Server version causing conflict (when status is "conflict") */
  conflictVersion: any | null;
}

/**
 * Validation rules for SyncStatus
 */
export const validateSyncStatus = (syncStatus: SyncStatus): string[] => {
  const errors: string[] = [];

  // Retry count validation
  if (syncStatus.retryCount < 0 || syncStatus.retryCount > 5) {
    errors.push("retryCount must be >= 0 and <= 5");
  }

  // Last sync success validation
  if (syncStatus.lastSyncSuccess && syncStatus.lastSyncSuccess > new Date()) {
    errors.push("lastSyncSuccess must be <= current time when set");
  }

  // Conflict version validation
  if (syncStatus.status === "conflict" && !syncStatus.conflictVersion) {
    errors.push('conflictVersion must be present when status is "conflict"');
  }

  if (syncStatus.status !== "conflict" && syncStatus.conflictVersion) {
    errors.push(
      'conflictVersion must only be present when status is "conflict"',
    );
  }

  return errors;
};

/**
 * State transition validation
 */
export const canTransitionSyncStatus = (
  from: SyncStatusValue,
  to: SyncStatusValue,
): boolean => {
  const validTransitions: Record<SyncStatusValue, SyncStatusValue[]> = {
    pending: ["syncing"],
    syncing: ["synced", "failed", "conflict"],
    synced: ["pending"], // For updates
    failed: ["pending"], // For retries
    conflict: ["pending"], // After resolution
  };

  return validTransitions[from]?.includes(to) ?? false;
};

/**
 * Create a new SyncStatus with default values
 */
export const createSyncStatus = (
  overrides: Partial<SyncStatus> = {},
): SyncStatus => {
  return {
    status: "pending",
    lastSyncAttempt: null,
    lastSyncSuccess: null,
    retryCount: 0,
    errorMessage: null,
    conflictVersion: null,
    ...overrides,
  };
};

/**
 * Update sync status with validation
 */
export const updateSyncStatus = (
  current: SyncStatus,
  updates: Partial<SyncStatus>,
): SyncStatus => {
  const newStatus = { ...current, ...updates };

  // Validate transition if status is changing
  if (updates.status && updates.status !== current.status) {
    if (!canTransitionSyncStatus(current.status, updates.status)) {
      throw new Error(
        `Invalid sync status transition from ${current.status} to ${updates.status}`,
      );
    }
  }

  // Validate the new status
  const validationErrors = validateSyncStatus(newStatus);
  if (validationErrors.length > 0) {
    throw new Error(
      `SyncStatus validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return newStatus;
};

/**
 * Check if sync status indicates data is safe to use
 */
export const isSyncStatusSafe = (status: SyncStatus): boolean => {
  return status.status === "synced" || status.status === "pending";
};

/**
 * Check if sync status indicates retry is needed
 */
export const shouldRetrySync = (status: SyncStatus): boolean => {
  return status.status === "failed" && status.retryCount < 5;
};
