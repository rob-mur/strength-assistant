import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, computed } from "@legendapp/state";
import { exercises$, exerciseUtils, user$, isOnline$ } from "../data/store";
import { supabaseClient } from "../data/supabase/SupabaseClient";
import { v4 as uuidv4 } from "uuid";
import { RepositoryUtils } from "./utils/RepositoryUtils";
// Note: Now using Legend State's syncedSupabase for automatic offline-first sync
// All sync operations are handled automatically by the batteries-included sync engine

/**
 * Legend State + Supabase implementation of ExerciseRepo
 * Provides offline-first data access with automatic sync
 */
export class SupabaseExerciseRepo implements IExerciseRepo {
  private static instance: SupabaseExerciseRepo;
  private readonly syncInstance: object | null = null;
  private readonly _realtimeChannel: object | null = null;

  private constructor() {}

  public static getInstance(): SupabaseExerciseRepo {
    if (!SupabaseExerciseRepo.instance) {
      SupabaseExerciseRepo.instance = new SupabaseExerciseRepo();
    }
    return SupabaseExerciseRepo.instance;
  }

  async initialize(): Promise<void> {
    // No manual initialization needed!
    // syncedSupabase handles all data loading, realtime subscriptions, and store updates automatically
    console.log(
      "🗄️ SupabaseExerciseRepo - Repository initialized - syncedSupabase handles everything automatically!",
    );
  }

  /**
   * Add a new exercise using syncedSupabase automatic sync
   * No manual optimistic updates or error handling needed - all handled by syncedSupabase
   * Note: userId parameter is kept for backwards compatibility
   */
  async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
    console.log(
      "🗄️ SupabaseExerciseRepo - addExercise started with userId:",
      userId,
      "exercise:",
      exercise,
    );

    // Validate exercise data
    console.log("🗄️ SupabaseExerciseRepo - Validating and sanitizing exercise");
    const sanitizedName = this.validateAndSanitizeExercise(exercise);
    console.log("🗄️ SupabaseExerciseRepo - Sanitized name:", sanitizedName);

    // Use the new syncedSupabase approach - no manual sync needed!
    console.log("🗄️ SupabaseExerciseRepo - Adding exercise via syncedSupabase");
    const exerciseId = exerciseUtils.addExercise({
      name: sanitizedName,
      user_id: userId,
    });

    console.log(
      "🗄️ SupabaseExerciseRepo - Exercise added with ID:",
      exerciseId,
      "- syncedSupabase will handle sync automatically!",
    );
  }

  /**
   * Validate and sanitize exercise input
   */
  private validateAndSanitizeExercise(exercise: ExerciseInput): string {
    ExerciseValidator.validateExerciseInput(exercise);
    return ExerciseValidator.sanitizeExerciseName(exercise.name);
  }

  /**
   * Validate user authentication and consistency
   */
  private async validateUserAuthentication(
    userId: string,
  ): Promise<{ id: string }> {
    console.log(
      "🔐 SupabaseExerciseRepo - validateUserAuthentication called with userId:",
      userId,
    );

    // Check if this is a local anonymous user first
    if (this.isLocalAnonymousUser(userId)) {
      console.log(
        "🔐 SupabaseExerciseRepo - Detected local anonymous user, skipping Supabase validation",
      );
      return { id: userId };
    }

    // For empty userId or real Supabase users, validate against Supabase
    return await this.validateSupabaseUser(userId);
  }

  /**
   * Check if the provided userId is a local anonymous user (UUID format)
   */
  private isLocalAnonymousUser(userId: string): boolean {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return false;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId);
  }

  /**
   * Validate user against Supabase authentication
   */
  private async validateSupabaseUser(userId: string): Promise<{ id: string }> {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.log(
        "🔐 SupabaseExerciseRepo - Empty userId provided, falling back to getCurrentUser()",
      );
    }

    console.log(
      "🔐 SupabaseExerciseRepo - Real Supabase user detected, validating with getCurrentUser()...",
    );

    const currentUser = await this.getCurrentUserWithTimeout();

    if (!currentUser) {
      console.error("🔐 SupabaseExerciseRepo - No user authenticated");
      throw new Error("User not authenticated with Supabase");
    }

    this.validateUserIdConsistency(userId, currentUser.id);

    console.log(
      "🔐 SupabaseExerciseRepo - User authentication validation successful",
    );
    return currentUser;
  }

  /**
   * Get current user from Supabase with timeout handling
   */
  private async getCurrentUserWithTimeout(): Promise<{ id: string } | null> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Auth validation timeout - proceeding without strict validation",
              ),
            ),
          1000,
        ),
      );

      const authCall = supabaseClient.getCurrentUser();
      const result = await Promise.race([authCall, timeout]);

      console.log(
        "🔐 SupabaseExerciseRepo - supabaseClient.getCurrentUser() call completed",
      );

      return this.extractUserFromResult(result);
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Extract user information from Supabase result
   */
  private extractUserFromResult(result: unknown): { id: string } | null {
    if (
      result &&
      typeof result === "object" &&
      "id" in result &&
      typeof result.id === "string"
    ) {
      return { id: result.id };
    }
    return null;
  }

  /**
   * Handle authentication errors with offline-first approach
   */
  private handleAuthError(error: unknown): { id: string } | null {
    console.error(
      "🔐 SupabaseExerciseRepo - supabaseClient.getCurrentUser() failed with error:",
      error,
    );

    if (this.isRecoverableAuthError(error)) {
      console.log(
        "🔐 SupabaseExerciseRepo - Auth issue detected, proceeding with offline-first approach",
      );
      return null;
    }

    console.log(
      "🔐 SupabaseExerciseRepo - Unknown auth error, re-throwing original error",
    );
    throw error;
  }

  /**
   * Check if an authentication error is recoverable (offline-first approach)
   */
  private isRecoverableAuthError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message?.includes("Auth session missing") ||
      error.message?.includes("timeout") ||
      error.name === "AuthSessionMissingError"
    );
  }

  /**
   * Validate consistency between provided userId and authenticated user
   */
  private validateUserIdConsistency(
    userId: string,
    currentUserId: string,
  ): void {
    console.log("🔐 SupabaseExerciseRepo - Current user ID:", currentUserId);
    console.log(
      "🔐 SupabaseExerciseRepo - Comparing with provided userId:",
      userId,
    );

    if (userId && userId !== currentUserId) {
      console.error(
        "🔐 SupabaseExerciseRepo - User ID mismatch! Expected:",
        userId,
        "Got:",
        currentUserId,
      );
      throw new Error(
        `User ID mismatch: Expected ${userId}, but authenticated user is ${currentUserId}.`,
      );
    }
  }

  /**
   * Create new exercise object
   */
  private createNewExercise(sanitizedName: string, userId: string): Exercise {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      name: sanitizedName,
      user_id: userId,
      created_at: now,
      updated_at: now,
      deleted: false,
    };
  }

  /**
   * Get exercise by ID from local store (works offline)
   */
  async getExerciseById(
    id: string,
    uid: string,
  ): Promise<Exercise | undefined> {
    // With Legend State, we can get data immediately from local store
    const exercises = exercises$.get();
    return exercises.find(
      (exercise) => exercise.id === id && exercise.user_id === uid,
    );
  }

  /**
   * Get all exercises as a reactive observable
   * Filtered for the authenticated Supabase user
   * Note: userId parameter is kept for backwards compatibility but Supabase user ID is used internally
   */
  getExercises(_userId: string): Observable<Exercise[]> {
    // Create a computed observable that filters exercises for the current Supabase user
    return computed(() => {
      const currentUser = user$.get();
      if (!currentUser) return [];
      return exercises$
        .get()
        .filter((ex) => ex.user_id === currentUser.id && !ex.deleted);
    }) as unknown as Observable<Exercise[]>;
  }

  /**
   * Delete exercise using syncedSupabase automatic sync
   * No manual optimistic updates or error handling needed - all handled by syncedSupabase
   * Note: userId parameter is kept for backwards compatibility
   */
  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    // Validate inputs
    RepositoryUtils.validateExerciseId(exerciseId);

    // Use the new syncedSupabase approach - no manual sync needed!
    console.log(
      "🗄️ SupabaseExerciseRepo - Deleting exercise via syncedSupabase:",
      exerciseId,
    );
    exerciseUtils.deleteExercise(exerciseId);

    console.log(
      "🗄️ SupabaseExerciseRepo - Exercise deleted - syncedSupabase will handle sync automatically!",
    );
  }

  /**
   * Subscribe to exercises changes (for backwards compatibility)
   * With Legend State, the observable itself provides real-time updates
   * Note: uid parameter is kept for backwards compatibility but Supabase user ID is used internally
   */
  subscribeToExercises(
    uid: string,
    callback: (exercises: Exercise[]) => void,
  ): () => void {
    console.log(
      "🔔 SupabaseExerciseRepo - Setting up subscription for uid:",
      uid,
    );

    // Function to filter and send exercises
    const updateCallback = () => {
      console.log(
        "🔔 SupabaseExerciseRepo - updateCallback triggered, using uid:",
        uid,
      );

      if (!uid) {
        console.log(
          "🔔 SupabaseExerciseRepo - No uid provided, returning empty exercises",
        );
        callback([]);
        return;
      }

      const allExercises = exercises$.get();
      console.log(
        "🔔 SupabaseExerciseRepo - All exercises in store:",
        allExercises.length,
      );

      const filteredExercises = allExercises.filter((ex) => {
        const matches = ex.user_id === uid && !ex.deleted;
        console.log("🔔 SupabaseExerciseRepo - Exercise filter:", {
          exerciseId: ex.id,
          exerciseUserId: ex.user_id,
          filterUserId: uid,
          deleted: ex.deleted,
          matches,
        });
        return matches;
      });

      console.log(
        "🔔 SupabaseExerciseRepo - Filtered exercises count:",
        filteredExercises.length,
      );
      callback(filteredExercises);
    };

    // Listen to both exercises and user changes
    const unsubscribeExercises = exercises$.onChange(updateCallback);
    const unsubscribeUser = user$.onChange(updateCallback);

    // Call immediately to get initial state
    updateCallback();

    // Return cleanup function
    return () => {
      console.log(
        "🔔 SupabaseExerciseRepo - Unsubscribing from exercises subscription",
      );
      unsubscribeExercises();
      unsubscribeUser();
    };
  }

  /**
   * Legacy methods for backwards compatibility with tests
   */

  /**
   * New methods for offline-first capabilities
   */

  /**
   * Check if we're currently online and syncing
   * With syncedSupabase, this is handled automatically
   */
  isSyncing(): boolean {
    // syncedSupabase handles sync status internally
    return false; // For backwards compatibility
  }

  /**
   * Check online status from app store
   */
  isOnline(): boolean {
    return isOnline$.get();
  }

  /**
   * Get count of pending changes waiting to sync
   * With syncedSupabase, this is handled automatically
   */
  getPendingChangesCount(): number {
    // syncedSupabase handles pending changes internally
    return 0; // For backwards compatibility
  }

  /**
   * Force manual sync (useful for pull-to-refresh)
   * With syncedSupabase, sync happens automatically
   */
  async forceSync(): Promise<void> {
    // syncedSupabase handles sync automatically - no manual sync needed
    console.log(
      "🗄️ SupabaseExerciseRepo - forceSync called, but syncedSupabase handles sync automatically",
    );
  }

  /**
   * Check if there are sync errors
   * With syncedSupabase, errors are handled automatically
   */
  hasErrors(): boolean {
    // syncedSupabase handles errors internally
    return false; // For backwards compatibility
  }

  /**
   * Get current sync error message
   * With syncedSupabase, errors are handled automatically
   */
  getErrorMessage(): string | null {
    // syncedSupabase handles errors internally
    return null; // For backwards compatibility
  }
}
