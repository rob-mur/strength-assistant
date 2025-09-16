/**
 * ExerciseRecord Model with Validation
 * 
 * Represents user's workout and exercise data with comprehensive validation
 * and sync status tracking for local-first architecture.
 */

export interface ExerciseRecord {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface ExerciseRecordInput {
  name: string;
  userId?: string;
}

export interface ExerciseRecordUpdate {
  name?: string;
}

/**
 * Validation errors for ExerciseRecord operations
 */
export class ExerciseValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ExerciseValidationError';
  }
}

/**
 * Creates a new ExerciseRecord with validation
 */
export function createExerciseRecord(input: ExerciseRecordInput): ExerciseRecord {
  // Validate input
  validateExerciseName(input.name);

  const now = new Date();
  
  return {
    id: generateExerciseId(),
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
    userId: input.userId,
    syncStatus: 'pending'
  };
}

/**
 * Updates an existing ExerciseRecord with validation
 */
export function updateExerciseRecord(
  existing: ExerciseRecord, 
  updates: ExerciseRecordUpdate
): ExerciseRecord {
  if (Object.keys(updates).length === 0) {
    throw new ExerciseValidationError('No updates provided');
  }

  let hasChanges = false;
  const updated = { ...existing };

  if (updates.name !== undefined) {
    validateExerciseName(updates.name);
    const trimmedName = updates.name.trim();
    
    if (trimmedName !== existing.name) {
      updated.name = trimmedName;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    updated.updatedAt = new Date();
    updated.syncStatus = 'pending'; // Mark as pending when modified
  }

  return updated;
}

/**
 * Validates exercise name according to business rules
 */
export function validateExerciseName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ExerciseValidationError('Exercise name is required', 'name');
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new ExerciseValidationError('Exercise name cannot be empty', 'name');
  }

  if (trimmedName.length > 255) {
    throw new ExerciseValidationError('Exercise name too long (max 255 characters)', 'name');
  }

  // Check for invalid characters (optional business rule)
  const invalidChars = /[<>\"'&]/;
  if (invalidChars.test(trimmedName)) {
    throw new ExerciseValidationError('Exercise name contains invalid characters', 'name');
  }
}

/**
 * Validates ExerciseRecord timestamps
 */
export function validateExerciseRecord(exercise: ExerciseRecord): void {
  if (!exercise.id) {
    throw new ExerciseValidationError('Exercise ID is required', 'id');
  }

  if (!isValidUUID(exercise.id)) {
    throw new ExerciseValidationError('Exercise ID must be a valid UUID', 'id');
  }

  validateExerciseName(exercise.name);

  if (!(exercise.createdAt instanceof Date) || isNaN(exercise.createdAt.getTime())) {
    throw new ExerciseValidationError('Invalid createdAt timestamp', 'createdAt');
  }

  if (!(exercise.updatedAt instanceof Date) || isNaN(exercise.updatedAt.getTime())) {
    throw new ExerciseValidationError('Invalid updatedAt timestamp', 'updatedAt');
  }

  if (exercise.updatedAt.getTime() < exercise.createdAt.getTime()) {
    throw new ExerciseValidationError('updatedAt cannot be before createdAt', 'updatedAt');
  }

  if (!['pending', 'synced', 'error'].includes(exercise.syncStatus)) {
    throw new ExerciseValidationError('Invalid sync status', 'syncStatus');
  }

  // Validate userId if provided
  if (exercise.userId !== undefined) {
    if (typeof exercise.userId !== 'string' || exercise.userId.trim().length === 0) {
      throw new ExerciseValidationError('Invalid userId', 'userId');
    }
  }
}

/**
 * Updates sync status of an ExerciseRecord
 */
export function updateSyncStatus(
  exercise: ExerciseRecord, 
  status: ExerciseRecord['syncStatus']
): ExerciseRecord {
  return {
    ...exercise,
    syncStatus: status,
    // Update timestamp when marking as synced
    ...(status === 'synced' ? { updatedAt: new Date() } : {})
  };
}

/**
 * Checks if an exercise needs synchronization
 */
export function needsSync(exercise: ExerciseRecord): boolean {
  return exercise.syncStatus === 'pending' || exercise.syncStatus === 'error';
}

// Database format interfaces
interface ExerciseDbFormat {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  sync_status: string;
}

/**
 * Converts ExerciseRecord to database-safe format
 */
export function toDbFormat(exercise: ExerciseRecord): ExerciseDbFormat {
  return {
    id: exercise.id,
    name: exercise.name,
    created_at: exercise.createdAt.toISOString(),
    updated_at: exercise.updatedAt.toISOString(),
    user_id: exercise.userId || null,
    sync_status: exercise.syncStatus
  };
}

/**
 * Converts database format to ExerciseRecord
 */
export function fromDbFormat(dbRecord: Record<string, unknown>): ExerciseRecord {
  const exercise: ExerciseRecord = {
    id: dbRecord.id as string,
    name: dbRecord.name as string,
    createdAt: new Date(dbRecord.created_at as string),
    updatedAt: new Date(dbRecord.updated_at as string),
    syncStatus: (dbRecord.sync_status as 'pending' | 'synced' | 'error') || 'pending'
  };

  if (dbRecord.user_id) {
    exercise.userId = dbRecord.user_id as string;
  }

  // Validate the converted record
  validateExerciseRecord(exercise);

  return exercise;
}

/**
 * Generates a new UUID for exercise ID
 */
function generateExerciseId(): string {
  // Simple UUID v4 generation (in production, use a proper UUID library)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Helper functions for sorting exercises
 */
export const ExerciseSort = {
  byCreatedAt: (a: ExerciseRecord, b: ExerciseRecord) => 
    a.createdAt.getTime() - b.createdAt.getTime(),
  
  byUpdatedAt: (a: ExerciseRecord, b: ExerciseRecord) => 
    a.updatedAt.getTime() - b.updatedAt.getTime(),
  
  byName: (a: ExerciseRecord, b: ExerciseRecord) => 
    a.name.localeCompare(b.name),
  
  bySyncStatus: (a: ExerciseRecord, b: ExerciseRecord) => {
    const statusOrder = { 'error': 0, 'pending': 1, 'synced': 2 };
    return statusOrder[a.syncStatus] - statusOrder[b.syncStatus];
  }
};