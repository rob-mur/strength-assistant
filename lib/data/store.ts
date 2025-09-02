import { observable } from "@legendapp/state";
import { Exercise } from "../models/Exercise";
import { User } from "../models/supabase";

/**
 * Legend State store structure for the application
 * Provides reactive state management with observables
 */
export interface AppStore {
  /** Observable array of exercises for the current user */
  exercises: Exercise[];
  
  /** Observable user state - null when not authenticated */
  user: User | null;
}

/**
 * Global application store instance
 * Initialize with empty state - will be populated by data layer
 */
export const store$ = observable<AppStore>({
  exercises: [],
  user: null,
});

// Export individual observables for convenience
export const exercises$ = store$.exercises;
export const user$ = store$.user;