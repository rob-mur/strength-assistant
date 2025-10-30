/**
 * SyncConflict Model
 * Purpose: Represent conflicts between local and server data requiring resolution
 */

export type ConflictType =
  | "concurrent_update"
  | "delete_conflict"
  | "schema_mismatch";
export type ConflictResolution =
  | "local_wins"
  | "server_wins"
  | "merged"
  | "manual";
export type ConflictResolvedBy = "system" | "user";

export interface SyncConflict {
  /** Unique conflict identifier */
  id: string;

  /** Table where conflict occurred */
  tableName: string;

  /** Conflicting record identifier */
  recordId: string;

  /** Local data version */
  localVersion: any;

  /** Server data version */
  serverVersion: any;

  /** Type of conflict detected */
  conflictType: ConflictType;

  /** When conflict was detected */
  detectedAt: Date;

  /** When conflict was resolved */
  resolvedAt: Date | null;

  /** Resolution strategy used */
  resolution: ConflictResolution | null;

  /** Who/what resolved the conflict */
  resolvedBy: ConflictResolvedBy | null;
}

/**
 * Validation rules for SyncConflict
 */
export const validateSyncConflict = (conflict: SyncConflict): string[] => {
  const errors: string[] = [];

  // Resolved timestamp validation
  if (conflict.resolvedAt && conflict.resolvedAt < conflict.detectedAt) {
    errors.push("resolvedAt must be >= detectedAt when set");
  }

  // Resolution consistency validation
  const hasResolution = conflict.resolution !== null;
  const hasResolvedBy = conflict.resolvedBy !== null;
  const hasResolvedAt = conflict.resolvedAt !== null;

  if (hasResolution !== hasResolvedBy) {
    errors.push("resolution and resolvedBy must both be set or both null");
  }

  if (hasResolution && !hasResolvedAt) {
    errors.push("resolvedAt must be set when resolution is provided");
  }

  // Required fields validation
  if (!conflict.id.trim()) {
    errors.push("id is required");
  }

  if (!conflict.tableName.trim()) {
    errors.push("tableName is required");
  }

  if (!conflict.recordId.trim()) {
    errors.push("recordId is required");
  }

  return errors;
};

/**
 * Create a new SyncConflict
 */
export const createSyncConflict = (params: {
  id: string;
  tableName: string;
  recordId: string;
  localVersion: any;
  serverVersion: any;
  conflictType: ConflictType;
}): SyncConflict => {
  const conflict: SyncConflict = {
    id: params.id,
    tableName: params.tableName,
    recordId: params.recordId,
    localVersion: params.localVersion,
    serverVersion: params.serverVersion,
    conflictType: params.conflictType,
    detectedAt: new Date(),
    resolvedAt: null,
    resolution: null,
    resolvedBy: null,
  };

  const validationErrors = validateSyncConflict(conflict);
  if (validationErrors.length > 0) {
    throw new Error(
      `SyncConflict validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return conflict;
};

/**
 * Resolve a conflict
 */
export const resolveConflict = (
  conflict: SyncConflict,
  resolution: ConflictResolution,
  resolvedBy: ConflictResolvedBy,
): SyncConflict => {
  const resolvedConflict: SyncConflict = {
    ...conflict,
    resolution,
    resolvedBy,
    resolvedAt: new Date(),
  };

  const validationErrors = validateSyncConflict(resolvedConflict);
  if (validationErrors.length > 0) {
    throw new Error(
      `SyncConflict validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return resolvedConflict;
};

/**
 * Check if conflict is resolved
 */
export const isResolved = (conflict: SyncConflict): boolean => {
  return conflict.resolution !== null && conflict.resolvedBy !== null;
};

/**
 * Get available resolution strategies for conflict type
 */
export const getAvailableResolutions = (
  conflictType: ConflictType,
): ConflictResolution[] => {
  switch (conflictType) {
    case "concurrent_update":
      return ["local_wins", "server_wins", "merged", "manual"];
    case "delete_conflict":
      return ["local_wins", "server_wins", "manual"];
    case "schema_mismatch":
      return ["manual"]; // Schema conflicts require manual intervention
    default:
      return ["manual"];
  }
};

/**
 * Check if resolution can be automated
 */
export const canAutoResolve = (conflictType: ConflictType): boolean => {
  return conflictType === "concurrent_update";
};

/**
 * Auto-resolve conflict using last-write-wins strategy
 */
export const autoResolveLastWriteWins = (
  conflict: SyncConflict,
): SyncConflict | null => {
  if (conflict.conflictType !== "concurrent_update") {
    return null;
  }

  const localTimestamp = getTimestamp(conflict.localVersion);
  const serverTimestamp = getTimestamp(conflict.serverVersion);

  if (!localTimestamp || !serverTimestamp) {
    return null; // Cannot auto-resolve without timestamps
  }

  const resolution: ConflictResolution =
    localTimestamp > serverTimestamp ? "local_wins" : "server_wins";

  return resolveConflict(conflict, resolution, "system");
};

/**
 * Extract timestamp from data version
 */
const getTimestamp = (data: any): Date | null => {
  if (!data) return null;

  // Try common timestamp field names
  const timestampFields = [
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "lastModified",
  ];

  for (const field of timestampFields) {
    if (data[field]) {
      const timestamp = new Date(data[field]);
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    }
  }

  return null;
};

/**
 * Merge data versions for exercise records
 */
export const mergeExerciseData = (local: any, server: any): any => {
  if (!local || !server) {
    return local || server;
  }

  // Basic merge strategy for exercise data
  const merged = {
    ...server, // Start with server data
    ...local, // Override with local changes
    updatedAt: new Date().toISOString(), // Mark as newly merged
  };

  // Special handling for arrays (like exercise sets)
  if (local.sets && server.sets) {
    // Merge sets by combining unique entries
    const allSets = [...(server.sets || []), ...(local.sets || [])];
    const uniqueSets = allSets.filter(
      (set, index, arr) => arr.findIndex((s) => s.id === set.id) === index,
    );
    merged.sets = uniqueSets;
  }

  return merged;
};

/**
 * Filter conflicts by resolution status
 */
export const filterUnresolvedConflicts = (
  conflicts: SyncConflict[],
): SyncConflict[] => {
  return conflicts.filter((conflict) => !isResolved(conflict));
};

/**
 * Filter conflicts by table
 */
export const filterConflictsByTable = (
  conflicts: SyncConflict[],
  tableName: string,
): SyncConflict[] => {
  return conflicts.filter((conflict) => conflict.tableName === tableName);
};

/**
 * Get conflict statistics
 */
export const getConflictStats = (conflicts: SyncConflict[]) => {
  const unresolved = filterUnresolvedConflicts(conflicts);

  return {
    total: conflicts.length,
    unresolved: unresolved.length,
    resolved: conflicts.length - unresolved.length,
    byType: {
      concurrent_update: conflicts.filter(
        (c) => c.conflictType === "concurrent_update",
      ).length,
      delete_conflict: conflicts.filter(
        (c) => c.conflictType === "delete_conflict",
      ).length,
      schema_mismatch: conflicts.filter(
        (c) => c.conflictType === "schema_mismatch",
      ).length,
    },
    byResolution: {
      local_wins: conflicts.filter((c) => c.resolution === "local_wins").length,
      server_wins: conflicts.filter((c) => c.resolution === "server_wins")
        .length,
      merged: conflicts.filter((c) => c.resolution === "merged").length,
      manual: conflicts.filter((c) => c.resolution === "manual").length,
    },
  };
};
