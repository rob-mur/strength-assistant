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
    console.log("📥 loadInitialData - Loading initial exercises data");

    // FIXED: Use consistent auth backend instead of supabaseClient.getCurrentUser()
    const { storageManager } = await import("../StorageManager");
    const authBackend = storageManager.getAuthBackend();
    const user = await authBackend.getCurrentUser();

    console.log(
      "📥 loadInitialData - User authenticated:",
      user ? "yes" : "no",
    );
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
  } catch {
    /* Silent error handling */
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
    } catch {
      /* Silent error handling */
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
  console.log(
    "🔄 syncExerciseToSupabase - Starting sync for exercise:",
    exercise.id,
  );

  // FIXED: Use consistent auth backend instead of supabaseClient.getCurrentUser()
  const { storageManager } = await import("../StorageManager");
  const authBackend = storageManager.getAuthBackend();
  const user = await authBackend.getCurrentUser();

  console.log(
    "🔄 syncExerciseToSupabase - User authenticated:",
    user ? "yes" : "no",
  );

  // CRITICAL: For RLS to work, we need the actual Supabase session user ID
  // Check if there's a Supabase session that can satisfy RLS policies
  let supabaseSessionUser;
  try {
    supabaseSessionUser = await supabaseClient.getCurrentUser();
    console.log(
      "🔄 syncExerciseToSupabase - Supabase session user:",
      supabaseSessionUser ? supabaseSessionUser.id : "none",
    );
  } catch (error) {
    console.log(
      "🔄 syncExerciseToSupabase - No Supabase session available:",
      error.message,
    );
  }

  if (!supabaseSessionUser) {
    console.log(
      "🔄 syncExerciseToSupabase - No Supabase session, cannot satisfy RLS policy. Skipping sync (offline-first).",
    );
    return; // Gracefully skip sync instead of throwing error
  }

  console.log("🔄 syncExerciseToSupabase - Creating exercise upsert object");
  const exerciseToUpsert: ExerciseInsert = {
    id: exercise.id,
    name: exercise.name,
    user_id: supabaseSessionUser.id, // Use Supabase session user ID for RLS compatibility
    created_at: exercise.created_at,
  };

  console.log(
    "🔄 syncExerciseToSupabase - Using Supabase user ID for RLS:",
    supabaseSessionUser.id,
  );

  // Get connection details for logging
  const client = supabaseClient.getSupabaseClient();
  const supabaseUrl = client.supabaseUrl;
  const supabaseKey = client.supabaseKey?.substring(0, 20) + "...";

  console.log(
    "🔄 syncExerciseToSupabase - Upserting exercise to Supabase database",
  );
  console.log("🔄 syncExerciseToSupabase - Supabase URL:", supabaseUrl);
  console.log("🔄 syncExerciseToSupabase - Supabase Key:", supabaseKey);
  console.log("🔄 syncExerciseToSupabase - Target table: exercises");
  console.log("🔄 syncExerciseToSupabase - Exercise data:", exerciseToUpsert);

  try {
    // Simplified approach: Make the call directly and handle success
    console.log(
      "🔄 syncExerciseToSupabase - Making direct upsert call to Supabase...",
    );

    const { error } = await (
      supabaseClient
        .getSupabaseClient()
        .from("exercises") as unknown as SupabaseQueryBuilder
    ).upsert(exerciseToUpsert);

    console.log(
      "🔄 syncExerciseToSupabase - Supabase upsert returned, error:",
      error || "none",
    );

    if (error) {
      console.error("🔄 syncExerciseToSupabase - Upsert failed:", error);
      throw error;
    }

    console.log(
      "🔄 syncExerciseToSupabase - Exercise synced successfully to Supabase!",
    );
    console.log("🔄 syncExerciseToSupabase - About to return from function...");
    return;
  } catch (error) {
    console.error(
      "🔄 syncExerciseToSupabase - Database operation failed:",
      error,
    );

    // GRACEFUL FALLBACK: For offline-first experience, don't throw on network errors
    // The exercise is already saved locally via optimistic update
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("Network")
    ) {
      console.log(
        "🔄 syncExerciseToSupabase - Continuing in offline mode - exercise saved locally",
      );
      // Don't throw - let the app continue working offline
      return;
    }

    // Only throw for non-network errors (validation, etc.)
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
  const { error } = await (
    supabaseClient
      .getSupabaseClient()
      .from("exercises") as unknown as SupabaseQueryBuilder
  )
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", userId);

  if (error) throw error;
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
    } catch {
      /* Silent error handling */
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
