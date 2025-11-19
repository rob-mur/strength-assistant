/**
 * Exercise Set Logging: TypeScript Type Definitions
 * 
 * Purpose: Type-safe interfaces for workout set data matching database schema
 * Features: Complete CRUD request/response types, computed session data
 */

/**
 * Core WorkoutSet entity matching database table structure
 */
export interface WorkoutSet {
  /** UUID primary key */
  id: string;
  
  /** Foreign key reference to exercises table */
  exercise_id: string;
  
  /** Foreign key reference to auth.users table */
  user_id: string;
  
  /** Date of workout session in YYYY-MM-DD format */
  session_date: string;
  
  /** Weight used in kg or lbs (0.1-2000 range) */
  weight: number;
  
  /** Number of repetitions performed (1-100 range) */
  repetitions: number;
  
  /** Rate of Perceived Exertion (1.0-10.0 in 0.5 increments) */
  rpe: number;
  
  /** Order of set within the workout session */
  set_order: number;
  
  /** Timestamp when record was created (ISO 8601) */
  created_at: string;
  
  /** Timestamp when record was last updated (ISO 8601) */
  updated_at: string;
}

/**
 * Request type for creating new workout sets
 * Excludes auto-generated fields (id, user_id, timestamps, set_order)
 */
export interface CreateWorkoutSetRequest {
  /** Foreign key reference to exercises table */
  exercise_id: string;
  
  /** Weight used in kg or lbs (0.1-2000 range) */
  weight: number;
  
  /** Number of repetitions performed (1-100 range) */
  repetitions: number;
  
  /** Rate of Perceived Exertion (1.0-10.0 in 0.5 increments) */
  rpe: number;
  
  /** Date of workout session in YYYY-MM-DD format */
  session_date: string;
}

/**
 * Request type for updating existing workout sets
 * All fields optional for partial updates
 */
export interface UpdateWorkoutSetRequest {
  /** Weight used in kg or lbs (0.1-2000 range) */
  weight?: number;
  
  /** Number of repetitions performed (1-100 range) */
  repetitions?: number;
  
  /** Rate of Perceived Exertion (1.0-10.0 in 0.5 increments) */
  rpe?: number;
}

/**
 * Computed interface representing a complete workout session
 * Groups all sets by date with additional metadata
 */
export interface WorkoutSession {
  /** User who performed the workout session */
  user_id: string;
  
  /** Date of workout session in YYYY-MM-DD format */
  session_date: string;
  
  /** All sets performed in this session, ordered by set_order */
  sets: WorkoutSet[];
  
  /** Sets grouped by exercise_id for easy access */
  exercise_groups: Record<string, WorkoutSet[]>;
  
  /** Total number of sets in this session */
  total_sets: number;
  
  /** Array of unique exercise IDs performed in this session */
  exercises_performed: string[];
}

/**
 * Form state interface for React Hook Form integration
 * Used for real-time validation and user input
 */
export interface WorkoutSetFormData {
  /** Weight input value (number or string during editing) */
  weight: number;
  
  /** Repetitions input value */
  repetitions: number;
  
  /** RPE slider value (1.0-10.0 in 0.5 increments) */
  rpe: number;
}

/**
 * Default values interface for form initialization
 * Used by Legend State to provide smart defaults from previous sets
 */
export interface WorkoutSetDefaults {
  /** Default weight from last set in current session */
  weight: number;
  
  /** Default repetitions from last set in current session */
  repetitions: number;
  
  /** RPE always starts neutral (no default) */
  rpe?: never;
}

/**
 * API response wrapper for workout set operations
 * Matches Supabase client response format
 */
export interface WorkoutSetResponse {
  data: WorkoutSet | WorkoutSet[] | null;
  error: Error | null;
}

/**
 * Query parameters for fetching workout sets
 * Supports filtering by session date and exercise
 */
export interface GetWorkoutSetsParams {
  /** Filter by specific session date (YYYY-MM-DD) */
  session_date?: string;
  
  /** Filter by specific exercise ID */
  exercise_id?: string;
  
  /** Limit number of results returned */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Validation constraints matching database schema
 * Used by Zod schemas and form validation
 */
export const WORKOUT_SET_CONSTRAINTS = {
  weight: {
    min: 0.1,
    max: 2000,
    step: 0.01
  },
  repetitions: {
    min: 1,
    max: 100,
    step: 1
  },
  rpe: {
    min: 1.0,
    max: 10.0,
    step: 0.5
  }
} as const;

/**
 * Type guard to check if a value is a valid WorkoutSet
 */
export function isWorkoutSet(value: unknown): value is WorkoutSet {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.exercise_id === 'string' &&
    typeof value.user_id === 'string' &&
    typeof value.session_date === 'string' &&
    typeof value.weight === 'number' &&
    typeof value.repetitions === 'number' &&
    typeof value.rpe === 'number' &&
    typeof value.set_order === 'number' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  );
}

/**
 * Type guard to check if a value is a valid CreateWorkoutSetRequest
 */
export function isCreateWorkoutSetRequest(value: unknown): value is CreateWorkoutSetRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.exercise_id === 'string' &&
    typeof value.weight === 'number' &&
    typeof value.repetitions === 'number' &&
    typeof value.rpe === 'number' &&
    typeof value.session_date === 'string'
  );
}