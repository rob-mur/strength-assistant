import { observable } from "@legendapp/state";
import { Exercise } from "../models/Exercise";
import { User } from "../models/supabase";

/**
 * Legend State store structure for the application
 * Provides reactive state management with observables and sync capabilities
 */
export interface AppStore {
  /** Observable array of exercises for the current user - synced with Supabase */
  exercises: Exercise[];
  
  /** Observable user state - null when not authenticated */
  user: User | null;
  
  /** Connection status for offline-first capabilities */
  isOnline: boolean;
}

/**
 * Global application store instance
 * Initialize with default state - will be populated by sync engine
 */
export const store$ = observable<AppStore>({
  exercises: [],
  user: null,
  isOnline: true,
});

// Export individual observables for convenience and sync configuration
export const exercises$ = store$.exercises;
export const user$ = store$.user;
export const isOnline$ = store$.isOnline;