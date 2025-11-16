import { observable, Observable } from "@legendapp/state";
import { syncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import { ObservablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { Exercise } from "../models/Exercise";
import { User } from "../models/supabase";
import { supabaseClient } from "./supabase/SupabaseClient";

// Create a configured AsyncStorage plugin instance
const configuredAsyncStoragePlugin = new ObservablePersistAsyncStorage({
  AsyncStorage: AsyncStorage,
});

/**
 * Legend State store structure for the application
 * Provides reactive state management with observables and sync capabilities
 */
export interface AppStore {
  /** Observable user state - null when not authenticated */
  user: User | null;

  /** Connection status for offline-first capabilities */
  isOnline: boolean;
}

/**
 * Main application store for non-synced state
 */
export const store$ = observable<AppStore>({
  user: null,
  isOnline: true,
});

// Export individual observables for convenience
export const user$ = store$.user;
export const isOnline$ = store$.isOnline;

/**
 * Exercises observable - will be initialized with syncedSupabase after Supabase client is ready
 * Uses object structure (keyed by ID) for efficient sync operations
 */
let exercisesObject$: Observable<Record<string, Exercise>> | undefined;

/**
 * Initialize the exercises store with syncedSupabase configuration
 * This must be called after Supabase client is initialized
 */
export function initializeExercisesStore() {
  console.log(
    "🗄️ initializeExercisesStore - Setting up syncedSupabase configuration",
  );

  try {
    // Create the synced observable with proper type annotation
    const syncedObservable = observable(
      syncedSupabase({
        supabase: supabaseClient.getSupabaseClient(),
        collection: "exercises",

        // Enable all CRUD operations
        actions: ["read", "create", "update", "delete"],

        // Real-time updates (RLS handles user filtering)
        realtime: true,

        // Offline persistence with automatic retry
        persist: {
          name: "exercises",
          plugin: configuredAsyncStoragePlugin,
          retrySync: true,
        },

        // Automatic retry until success
        retry: {
          infinite: true,
        },

        // Efficient differential sync
        changesSince: "last-sync",
        fieldCreatedAt: "created_at",
        fieldUpdatedAt: "updated_at",

        // Soft delete support
        fieldDeleted: "deleted",

        // Transform data for sync - safely set user_id from current user
        transform: {
          save: (exercise: Exercise) => {
            // Get current user synchronously - safe because this is only called
            // when the exercise is being saved, at which point user$ should be initialized
            const currentUser = user$.peek(); // Use peek() for synchronous access without subscription
            return {
              ...exercise,
              user_id: currentUser?.id || exercise.user_id || "", // Fallback to empty string instead of null to match Exercise type
            };
          },
        },
      }),
    );

    // Cast to the expected type after creation
    exercisesObject$ = syncedObservable as Observable<Record<string, Exercise>>;

    console.log(
      "✅ initializeExercisesStore - syncedSupabase store initialized",
    );
  } catch (error) {
    console.error(
      "❌ initializeExercisesStore - Failed to initialize store:",
      error,
    );

    // Create a fallback local-only observable if sync fails
    console.log(
      "🔄 initializeExercisesStore - Creating fallback local-only store",
    );
    exercisesObject$ = observable({} as Record<string, Exercise>);

    throw error; // Re-throw to let calling code handle the error appropriately
  }
}

/**
 * Get the exercises object observable
 * @returns The exercises object observable if initialized, undefined otherwise
 */
export function getExercisesObject$():
  | Observable<Record<string, Exercise>>
  | undefined {
  return exercisesObject$;
}

/**
 * Array view of exercises for backwards compatibility with existing components
 * Automatically updates when the synced object changes
 * Initialized as empty array until exercises store is ready
 */
export const exercises$ = observable(() => {
  // Handle case where exercisesObject$ hasn't been initialized yet
  if (!exercisesObject$) {
    return [];
  }

  const exercisesObj = exercisesObject$.get();
  // Handle initial state when exercisesObj might be undefined
  if (!exercisesObj || typeof exercisesObj !== "object") {
    return [];
  }
  return Object.values(exercisesObj).filter(
    (exercise): exercise is Exercise =>
      exercise && typeof exercise === "object" && !exercise.deleted,
  );
});

/**
 * Utility functions for working with exercises
 * These functions safely handle the case where exercisesObject$ hasn't been initialized yet
 */
export const exerciseUtils = {
  /**
   * Add a new exercise (uses syncedSupabase automatic sync)
   */
  addExercise: (
    exercise: Omit<Exercise, "id" | "created_at" | "updated_at" | "deleted">,
  ) => {
    if (!exercisesObject$) {
      console.warn("⚠️ exerciseUtils.addExercise - Store not initialized yet");
      return "pending-init";
    }

    const id = uuidv4();
    // This will automatically sync via syncedSupabase
    exercisesObject$[id].set({
      id,
      name: exercise.name,
      user_id: exercise.user_id, // Now properly set from parameter
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
    });
    return id;
  },

  /**
   * Update an exercise (uses syncedSupabase automatic sync)
   */
  updateExercise: (id: string, updates: Partial<Exercise>) => {
    if (!exercisesObject$) {
      console.warn(
        "⚠️ exerciseUtils.updateExercise - Store not initialized yet",
      );
      return;
    }

    exercisesObject$[id].assign({
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Delete an exercise (soft delete via syncedSupabase)
   */
  deleteExercise: (id: string) => {
    if (!exercisesObject$) {
      console.warn(
        "⚠️ exerciseUtils.deleteExercise - Store not initialized yet",
      );
      return;
    }

    exercisesObject$[id].deleted.set(true);
  },

  /**
   * Get exercise by ID
   */
  getExercise: (id: string): Exercise | undefined => {
    if (!exercisesObject$) {
      console.warn("⚠️ exerciseUtils.getExercise - Store not initialized yet");
      return undefined;
    }

    return exercisesObject$[id].get();
  },
};
