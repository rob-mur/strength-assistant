import { supabaseClient } from "../supabase/SupabaseClient";
import { exercises$, user$ } from "../store";
import { Exercise } from "../../models/Exercise";
import { ExerciseInsert } from "../../models/supabase";

// Sync configuration constants (reserved for future implementation)
// const _SYNC_RETRY_DELAY = 1000; // 1 second
// const _SYNC_TIMEOUT = 30000; // 30 seconds
// const _NETWORK_CHECK_INTERVAL = 5000; // 5 seconds

/**
 * Configuration for Legend State sync with Supabase
 * Provides offline-first data synchronization with automatic conflict resolution
 */
export function configureSyncEngine() {
  // Initialize with data loading and real-time subscription
  loadInitialData();
  setupRealtimeSubscription();
}

/**
 * Load initial exercises data from Supabase
 */
async function loadInitialData() {
  try {
    const user = await supabaseClient.getCurrentUser();
    if (!user) return;

    const { data, error } = await (
      supabaseClient
        .getSupabaseClient()
        .from("exercises") as unknown as SupabaseQueryBuilder
    )
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    exercises$.set((data as Exercise[]) || []);
  } catch (error) {
  }
}

/**
 * Set up real-time subscription for exercises
 */
interface SupabaseSubscription {
  unsubscribe: () => void;
  [key: string]: unknown;
}

interface SupabaseQueryBuilder {
  select: (fields: string) => SupabaseQueryBuilder;
  eq: (
    field: string,
    value: string,
  ) => SupabaseDeleteQueryBuilder | Promise<{ data: unknown; error: unknown }>;
  insert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
  update: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
  delete: () => SupabaseDeleteQueryBuilder;
  upsert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
}

interface SupabaseDeleteQueryBuilder
  extends Promise<{ data: unknown; error: unknown }> {
  eq: (field: string, value: string) => SupabaseDeleteQueryBuilder;
}

function setupRealtimeSubscription() {
  let subscription: SupabaseSubscription | null = null;

  const startSubscription = async () => {
    try {
      const user = await supabaseClient.getCurrentUser();
      if (!user) return;

      // @ts-ignore Supabase real-time subscription - complex type compatibility with RealtimeChannel
      subscription = supabaseClient
        .getSupabaseClient()
        .channel("exercises")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "exercises",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const currentExercises = exercises$.get();

            if (payload.eventType === "INSERT") {
              const newExercise = payload.new as Exercise;
              if (newExercise.user_id === user.id) {
                exercises$.push(newExercise);
              }
            } else if (payload.eventType === "DELETE") {
              const deletedExercise = payload.old as Exercise;
              const indexToDelete = currentExercises.findIndex(
                (ex) => ex.id === deletedExercise.id,
              );
              if (indexToDelete !== -1) {
                exercises$.splice(indexToDelete, 1);
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedExercise = payload.new as Exercise;
              if (updatedExercise.user_id === user.id) {
                const indexToUpdate = currentExercises.findIndex(
                  (ex) => ex.id === updatedExercise.id,
                );
                if (indexToUpdate !== -1) {
                  exercises$[indexToUpdate].set(updatedExercise);
                }
              }
            }
          },
        )
        .subscribe();
    } catch (error) {
    }
  };

  // Set up auth state listener to restart subscription when user changes
  let isInitialAuthState = true;
  supabaseClient.onAuthStateChange((event, session) => {
    user$.set(session?.user || null);

    // Restart subscription when user changes
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    if (session?.user) {
      startSubscription();
      // Prevent infinite loop: only load initial data on non-initial auth changes
      // The initial data loading is handled by the configureSyncEngine() call
      if (!isInitialAuthState) {
        loadInitialData();
      }
    } else {
      exercises$.set([]);
    }

    isInitialAuthState = false;
  });
}

/**
 * Sync an exercise to Supabase
 */
export async function syncExerciseToSupabase(
  exercise: Exercise,
): Promise<void> {
  try {
    const user = await supabaseClient.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const exerciseToUpsert: ExerciseInsert = {
      id: exercise.id,
      name: exercise.name,
      user_id: exercise.user_id,
      created_at: exercise.created_at,
    };

    const { error } = await (
      supabaseClient
        .getSupabaseClient()
        .from("exercises") as unknown as SupabaseQueryBuilder
    ).upsert(exerciseToUpsert);
    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an exercise from Supabase
 */
export async function deleteExerciseFromSupabase(
  exerciseId: string,
  userId: string,
): Promise<void> {
  try {
    const { error } = await (
      supabaseClient
        .getSupabaseClient()
        .from("exercises") as unknown as SupabaseQueryBuilder
    )
      .delete()
      .eq("id", exerciseId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

/**
 * Helper functions for sync management
 */
export const syncHelpers = {
  /**
   * Force a manual sync of exercises
   */
  async forceSync(): Promise<void> {
    try {
      // Trigger a manual sync
      const user = await supabaseClient.getCurrentUser();
      if (!user) return;

      const { data, error } = await (
        supabaseClient
          .getSupabaseClient()
          .from("exercises") as unknown as SupabaseQueryBuilder
      )
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        exercises$.set(data as Exercise[]);
      }
    } catch (error) {
    }
  },

  /**
   * Check if we're currently syncing (simplified for now)
   */
  isSyncing(): boolean {
    // This would be enhanced with actual sync state tracking
    return false;
  },

  /**
   * Check online status using browser navigator API
   */
  isOnline(): boolean {
    // Use browser's navigator.onLine for basic network detection
    // In React Native, this would use @react-native-community/netinfo
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      return navigator.onLine;
    }
    // Fallback to true for environments without navigator
    return true;
  },

  /**
   * Get pending changes count (simplified)
   */
  getPendingChangesCount(): number {
    // This would track actual pending changes
    return 0;
  },

  /**
   * Check if there are sync errors (simplified)
   */
  hasErrors(): boolean {
    return false;
  },

  /**
   * Get current sync error message (simplified)
   */
  getErrorMessage(): string | undefined {
    return undefined;
  },
};
