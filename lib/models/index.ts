/**
 * Models Index: Export all data model types
 */

// Existing models (preserve existing exports)
export * from './ErrorBlockerState';
export * from './ErrorContext';
export * from './ErrorEvent';
export * from './Exercise';
export * from './MaestroErrorIndicator';
export * from './RecoveryAction';
export * from './SimpleErrorLog';
export * from './supabase';

// Export models with naming conflicts explicitly
export type { ExerciseRecord, ExerciseRecordInput } from './ExerciseRecord';
export type { LogEntry as ILogEntry } from './LogEntry';
export type { SyncStateRecord } from './SyncStateRecord';
export type { UserAccount, UserAccountInput } from './UserAccount';

// New workout set models
export * from './WorkoutSet';