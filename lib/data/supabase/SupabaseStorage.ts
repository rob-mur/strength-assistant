/**
 * Supabase Storage Backend Implementation
 *
 * Implements the StorageBackend interface for Supabase,
 * providing exercise CRUD operations, user management, and sync tracking.
 */

// Import interfaces from local models instead of contracts
import type { ExerciseRecord } from "../../models/ExerciseRecord";
import type { UserAccount } from "../../models/UserAccount";
import type { SyncStateRecord } from "../../models/SyncStateRecord";
import { SupabaseClient, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabaseClient } from "./supabase";
import {
  createExerciseRecord,
  updateExerciseRecord,
  validateExerciseRecord,
  ExerciseRecordInput,
  ExerciseRecordUpdate,
  toDbFormat as exerciseToDb,
  fromDbFormat as exerciseFromDb,
} from "../../models/ExerciseRecord";
import {
  createAnonymousUser,
  createAuthenticatedUser,
  validateCredentials,
} from "../../models/UserAccount";
import {
  createSyncState,
  recordSyncFailure,
  isReadyForRetry,
  toDbFormat as syncToDb,
  fromDbFormat as syncFromDb,
} from "../../models/SyncStateRecord";

const deepLink = "strengthassistant://auth-callback";
// StorageBackend interface definition (matches contract)
export interface StorageBackend {
  // Exercise CRUD operations
  createExercise(
    exercise: Omit<
      ExerciseRecord,
      "id" | "createdAt" | "updatedAt" | "syncStatus"
    >,
  ): Promise<ExerciseRecord>;
  getExercises(userId?: string): Promise<ExerciseRecord[]>;
  updateExercise(
    id: string,
    updates: Partial<Pick<ExerciseRecord, "name">>,
  ): Promise<ExerciseRecord>;
  deleteExercise(id: string): Promise<void>;

  // User management
  getCurrentUser(): Promise<UserAccount | null>;
  signInWithEmail(email: string, password: string): Promise<UserAccount>;
  signUpWithEmail(email: string, password: string): Promise<UserAccount>;
  signInAnonymously(): Promise<UserAccount>;
  signOut(): Promise<void>;

  // Sync management
  getPendingSyncRecords(): Promise<SyncStateRecord[]>;
  markSyncComplete(recordId: string): Promise<void>;
  markSyncError(recordId: string, error: string): Promise<void>;

  // Real-time subscriptions
  subscribeToExercises(
    userId: string,
    callback: (exercises: ExerciseRecord[]) => void,
  ): () => void;
  subscribeToAuthState(
    callback: (user: UserAccount | null) => void,
  ): () => void;
}

export class SupabaseStorage implements StorageBackend {
  private client: SupabaseClient | null = null;
  private currentUser: UserAccount | null = null;
  private readonly authStateCallbacks: ((user: UserAccount | null) => void)[] =
    [];
  private signInAttemptCount = 0;
  private readonly maxSignInAttempts = 1;
  private signInInProgress = false;
  private readonly USER_STORAGE_KEY = "@supabase_storage_current_user";

  private getClient(): SupabaseClient {
    this.client ??= getSupabaseClient();
    return this.client;
  }

  private notifyAuthStateChange(user: UserAccount | null): void {
    for (const callback of this.authStateCallbacks) {
      try {
        callback(user);
      } catch {
        // Silent error handling
      }
    }
  }

  /**
   * Persist user state to AsyncStorage for offline-first functionality
   */
  private async persistUserState(user: UserAccount | null): Promise<void> {
    try {
      if (user) {
        const userJson = JSON.stringify({
          id: user.id,
          email: user.email,
          isAnonymous: user.isAnonymous,
          createdAt: user.createdAt.toISOString(),
        });
        await AsyncStorage.setItem(this.USER_STORAGE_KEY, userJson);
        console.log(
          "🔐 SupabaseStorage - User state persisted to AsyncStorage",
        );
      } else {
        await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
        console.log(
          "🔐 SupabaseStorage - User state cleared from AsyncStorage",
        );
      }
    } catch (error) {
      console.warn("🔐 SupabaseStorage - Failed to persist user state:", error);
    }
  }

  /**
   * Restore user state from AsyncStorage for offline-first functionality
   */
  private async restoreUserState(): Promise<UserAccount | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      if (!userJson) {
        return null;
      }

      const userData = JSON.parse(userJson);
      const user: UserAccount = {
        id: userData.id,
        email: userData.email,
        isAnonymous: userData.isAnonymous,
        createdAt: new Date(userData.createdAt),
      };

      console.log(
        "🔐 SupabaseStorage - User state restored from AsyncStorage:",
        user.isAnonymous ? "anonymous" : "authenticated",
      );
      return user;
    } catch (error) {
      console.warn("🔐 SupabaseStorage - Failed to restore user state:", error);
      // Clear corrupted data
      try {
        await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
      } catch {
        // Silent cleanup
      }
      return null;
    }
  }
  /**
   * Call this after construction to initialize the session asynchronously.
   */
  async init(): Promise<void> {
    // CRITICAL FIX: Restore user state from local storage first (offline-first)
    const restoredUser = await this.restoreUserState();
    if (restoredUser) {
      this.currentUser = restoredUser;
      console.log(
        "🔐 SupabaseStorage - Restored user from AsyncStorage on init",
      );
    }

    await this.initializeSession();
  }

  // Exercise CRUD operations
  async createExercise(
    exercise: Omit<
      ExerciseRecord,
      "id" | "createdAt" | "updatedAt" | "syncStatus"
    >,
  ): Promise<ExerciseRecord> {
    const input: ExerciseRecordInput = {
      name: exercise.name,
      userId: exercise.userId,
    };

    const newExercise = createExerciseRecord(input);
    validateExerciseRecord(newExercise);

    const { data, error } = await this.getClient()
      .from("exercises")
      .insert(exerciseToDb(newExercise))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exercise: ${error.message}`);
    }

    return exerciseFromDb(data);
  }

  async getExercises(userId?: string): Promise<ExerciseRecord[]> {
    let query = this.getClient().from("exercises").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      // Get exercises for anonymous user (no user_id)
      query = query.is("user_id", null);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      throw new Error(`Failed to retrieve exercises: ${error.message}`);
    }

    return (data || []).map(exerciseFromDb);
  }

  async updateExercise(
    id: string,
    updates: Partial<Pick<ExerciseRecord, "name">>,
  ): Promise<ExerciseRecord> {
    // First get the existing exercise
    const { data: existingData, error: fetchError } = await this.getClient()
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingData) {
      throw new Error("Exercise not found");
    }

    const existing = exerciseFromDb(existingData);
    const updated = updateExerciseRecord(
      existing,
      updates as ExerciseRecordUpdate,
    );

    const { data, error } = await this.getClient()
      .from("exercises")
      .update(exerciseToDb(updated))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exercise: ${error.message}`);
    }

    return exerciseFromDb(data);
  }

  async deleteExercise(id: string): Promise<void> {
    // Check if exercise exists
    const { data: existingData, error: fetchError } = await this.getClient()
      .from("exercises")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingData) {
      throw new Error("Exercise not found");
    }

    const { error } = await this.getClient()
      .from("exercises")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete exercise: ${error.message}`);
    }
  }

  // User management
  async getCurrentUser(): Promise<UserAccount | null> {
    // Check if we have a local user
    if (this.currentUser) {
      // In production, validate that local users have valid Supabase sessions
      // BUT handle offline mode gracefully
      if (process.env.NODE_ENV === "production") {
        console.log(
          "🔐 SupabaseStorage - Production mode: validating local user session",
        );
        try {
          // Add timeout to prevent hanging in airplane mode
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Session validation timeout (offline mode)"));
            }, 3000); // 3 second timeout for airplane mode
          });

          const sessionPromise = this.getClient().auth.getSession();
          const result = await Promise.race([sessionPromise, timeoutPromise]);

          const {
            data: { session },
          } = result;

          if (!session?.user) {
            console.log(
              "🔐 SupabaseStorage - Local user has no valid Supabase session, clearing",
            );
            this.currentUser = null;
            await this.persistUserState(null);
            this.notifyAuthStateChange(null);
            return null;
          }
        } catch (error) {
          // CRITICAL FIX: Handle network errors gracefully in airplane mode
          if (
            error instanceof Error &&
            (error.message.includes("Network request failed") ||
              error.message.includes("timeout") ||
              error.message.includes("offline mode") ||
              error.name === "TypeError")
          ) {
            console.log(
              "🔐 SupabaseStorage - Network error during session validation (airplane mode), keeping local user:",
              error.message,
            );
            // Keep the local user during network failures (airplane mode)
            return this.currentUser;
          }

          console.error(
            "🔐 SupabaseStorage - Error validating session, clearing local user:",
            error,
          );
          this.currentUser = null;
          await this.persistUserState(null);
          this.notifyAuthStateChange(null);
          return null;
        }
      }
      return this.currentUser;
    }

    // CRITICAL FIX: Handle offline mode when getting initial session
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Initial session fetch timeout (offline mode)"));
        }, 3000);
      });

      const sessionPromise = this.getClient().auth.getSession();
      const result = await Promise.race([sessionPromise, timeoutPromise]);

      const {
        data: { session },
      } = result;

      if (!session?.user) {
        return null;
      }

      return this.mapSupabaseUserToAccount(session.user);
    } catch (error) {
      // Handle network errors gracefully when fetching initial session
      if (
        error instanceof Error &&
        (error.message.includes("Network request failed") ||
          error.message.includes("timeout") ||
          error.message.includes("offline mode") ||
          error.name === "TypeError")
      ) {
        console.log(
          "🔐 SupabaseStorage - Network error during initial session fetch (airplane mode), returning null:",
          error.message,
        );
        return null;
      }

      console.error(
        "🔐 SupabaseStorage - Error fetching initial session:",
        error,
      );
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<UserAccount> {
    validateCredentials({ email, password });

    const { data, error } = await this.getClient().auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Sign in failed: No user returned");
    }

    const userAccount = this.mapSupabaseUserToAccount(data.user);
    this.currentUser = userAccount;
    await this.persistUserState(userAccount);

    return userAccount;
  }

  async signUpWithEmail(email: string, password: string): Promise<UserAccount> {
    validateCredentials({ email, password });

    const { data, error } = await this.getClient().auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: deepLink,
      },
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Sign up failed: No user returned");
    }

    const userAccount = this.mapSupabaseUserToAccount(data.user);
    this.currentUser = userAccount;
    await this.persistUserState(userAccount);

    return userAccount;
  }

  async signInAnonymously(): Promise<UserAccount> {
    // Circuit breaker: prevent concurrent/recursive calls
    if (this.signInInProgress) {
      console.log(
        "🔐 SupabaseStorage - Sign in already in progress, skipping duplicate call",
      );
      // Wait briefly and return current user or create fallback
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.currentUser || (await this.createFallbackUser());
    }

    // Circuit breaker: limit total attempts to prevent infinite recursion
    if (this.signInAttemptCount >= this.maxSignInAttempts) {
      console.log(
        `🔐 SupabaseStorage - Max sign in attempts (${this.maxSignInAttempts}) reached, using fallback`,
      );
      return await this.createFallbackUser();
    }

    this.signInInProgress = true;
    this.signInAttemptCount++;

    try {
      console.log(
        `🔐 SupabaseStorage - Attempting Supabase anonymous sign in (attempt ${this.signInAttemptCount})...`,
      );

      // Try Supabase with defensive error handling
      try {
        console.log(
          "🔐 SupabaseStorage - Quick Supabase attempt (2s timeout)...",
        );

        // Create a very aggressive timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.log(
              "🔐 SupabaseStorage - TIMEOUT: Supabase took too long, rejecting...",
            );
            reject(new Error("Supabase timeout after 2 seconds"));
          }, 2000);
        });

        console.log("🔐 SupabaseStorage - Starting signInAnonymously call...");

        // Wrap Supabase call in additional error boundary
        const signInPromise = this.performSupabaseSignIn();

        console.log("🔐 SupabaseStorage - Racing promises...");
        const result = await Promise.race([signInPromise, timeoutPromise]);

        // If we get here, Supabase succeeded within timeout
        console.log("🔐 SupabaseStorage - Supabase succeeded:", {
          user: result.data?.user ? "found" : "null",
          error: result.error ? result.error.message : "none",
        });

        if (result.error) {
          console.log(
            "🔐 SupabaseStorage - Supabase returned error:",
            result.error.message,
          );
          throw result.error;
        }

        if (result.data?.user) {
          console.log(
            "🔐 SupabaseStorage - Successfully created Supabase anonymous user:",
            result.data.user.id,
          );
          const realUser = this.mapSupabaseUserToAccount(result.data.user);
          this.currentUser = realUser;
          await this.persistUserState(realUser);
          this.notifyAuthStateChange(realUser);
          return realUser;
        }

        console.log(
          "🔐 SupabaseStorage - Supabase returned success but no user, falling back",
        );
      } catch (error) {
        console.log(
          "🔐 SupabaseStorage - Supabase failed/timeout, using fallback:",
          error,
        );
      }

      return await this.createFallbackUser();
    } finally {
      this.signInInProgress = false;
    }
  }

  private async performSupabaseSignIn() {
    try {
      // CRITICAL FIX: Disable auth state change callbacks during sign-in to prevent recursion
      const originalCallbacks = [...this.authStateCallbacks];
      this.authStateCallbacks.length = 0;

      console.log(
        "🔐 SupabaseStorage - Auth callbacks disabled during sign-in to prevent recursion",
      );

      try {
        const result = await this.getClient().auth.signInAnonymously();
        return result;
      } finally {
        // Restore callbacks after sign-in completes
        this.authStateCallbacks.push(...originalCallbacks);
        console.log(
          "🔐 SupabaseStorage - Auth callbacks restored after sign-in",
        );
      }
    } catch (error) {
      console.log(
        "🔐 SupabaseStorage - Error in performSupabaseSignIn:",
        error,
      );
      throw error;
    }
  }

  private async createFallbackUser(): Promise<UserAccount> {
    console.log("🔐 SupabaseStorage - Creating local anonymous user fallback");
    const anonymousUser = createAnonymousUser();
    this.currentUser = anonymousUser;
    await this.persistUserState(anonymousUser);
    this.notifyAuthStateChange(anonymousUser);
    return anonymousUser;
  }

  async signOut(): Promise<void> {
    const { error } = await this.getClient().auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }

    this.currentUser = null;
    await this.persistUserState(null);

    // CRITICAL FIX: Notify auth state callbacks when signing out
    this.notifyAuthStateChange(null);
  }

  // Sync management
  async getPendingSyncRecords(): Promise<SyncStateRecord[]> {
    const { data, error } = await this.getClient()
      .from("sync_states")
      .select("*")
      .order("pending_since", { ascending: true });

    if (error) {
      throw new Error(`Failed to retrieve sync records: ${error.message}`);
    }

    return (data || []).map(syncFromDb).filter(isReadyForRetry);
  }

  async markSyncComplete(recordId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("sync_states")
      .delete()
      .eq("record_id", recordId);

    if (error) {
      throw new Error(`Failed to mark sync complete: ${error.message}`);
    }
  }

  async markSyncError(recordId: string, errorMessage: string): Promise<void> {
    // First get the existing sync record
    const { data: existing, error: fetchError } = await this.getClient()
      .from("sync_states")
      .select("*")
      .eq("record_id", recordId)
      .single();

    if (
      fetchError ||
      !existing ||
      (Array.isArray(existing) && existing.length === 0)
    ) {
      // Create new sync error record if it doesn't exist
      const syncState = createSyncState({
        recordId,
        recordType: "exercise", // Default type
        operation: "create", // Default operation
      });

      const failedState = recordSyncFailure(syncState, errorMessage);

      const { error: insertError } = await this.getClient()
        .from("sync_states")
        .insert(syncToDb(failedState));

      if (insertError) {
        throw new Error(
          `Failed to create sync error record: ${insertError.message}`,
        );
      }

      return;
    }

    const syncState = syncFromDb(existing);
    const failedState = recordSyncFailure(syncState, errorMessage);

    const { error } = await this.getClient()
      .from("sync_states")
      .update(syncToDb(failedState))
      .eq("record_id", recordId);

    if (error) {
      throw new Error(`Failed to mark sync error: ${error.message}`);
    }
  }

  // Real-time subscriptions
  subscribeToExercises(
    userId: string,
    callback: (exercises: ExerciseRecord[]) => void,
  ): () => void {
    const subscription = this.getClient()
      .channel("exercises_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercises",
          filter: userId ? `user_id=eq.${userId}` : "user_id=is.null",
        },
        async () => {
          // Fetch updated exercises and call callback
          const exercises = await this.getExercises(userId);
          callback(exercises);
        },
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  subscribeToAuthState(
    callback: (user: UserAccount | null) => void,
  ): () => void {
    // CRITICAL FIX: Register callback for both Supabase events AND local anonymous auth
    this.authStateCallbacks.push(callback);

    // Set up Supabase auth state listener for real auth events
    const {
      data: { subscription },
    } = this.getClient().auth.onAuthStateChange(async (event, session) => {
      console.log(
        `🔐 SupabaseStorage - Auth state change: ${event}, session:`,
        session?.user ? "exists" : "null",
        "currentUser:",
        this.currentUser ? "exists" : "null",
      );

      if (session?.user) {
        console.log("🔐 SupabaseStorage - Setting user from Supabase session");
        const userAccount = this.mapSupabaseUserToAccount(session.user);
        this.currentUser = userAccount;
        // Persist user state change (but don't await to avoid blocking)
        this.persistUserState(userAccount).catch((error) =>
          console.warn(
            "Failed to persist user state during auth change:",
            error,
          ),
        );
        callback(userAccount);
      } else {
        // CRITICAL FIX: Never override local anonymous users when Supabase has no session
        // This prevents the race condition where local anonymous auth gets wiped out
        if (this.currentUser?.isAnonymous) {
          console.log(
            "🔐 SupabaseStorage - Preserving existing anonymous user, ignoring Supabase null session",
          );
          return;
        }

        // Only reset if we don't have a local anonymous user
        console.log(
          "🔐 SupabaseStorage - No Supabase session and no local user, setting to null",
        );
        this.currentUser = null;
        // Persist user state change (but don't await to avoid blocking)
        this.persistUserState(null).catch((error) =>
          console.warn(
            "Failed to persist user state during auth change:",
            error,
          ),
        );
        callback(null);
      }
    });

    // Immediately call callback with current user if exists (for anonymous users)
    if (this.currentUser) {
      console.log(
        "🔐 SupabaseStorage - Immediately calling callback with existing user",
      );
      callback(this.currentUser);
    }

    return () => {
      // Remove from local callbacks
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
      // Unsubscribe from Supabase
      subscription.unsubscribe();
    };
  }

  // Additional methods for anonymous user migration
  async linkEmailPassword(
    email: string,
    password: string,
  ): Promise<UserAccount> {
    if (!this.currentUser?.isAnonymous) {
      throw new Error("Can only link email/password to anonymous users");
    }

    // This would typically involve Supabase's user linking functionality
    // For now, we'll simulate by creating a new authenticated account
    return this.signUpWithEmail(email, password);
  }

  async forceSessionExpiry(): Promise<void> {
    // For testing purposes - force session to expire
    await this.getClient().auth.signOut();
    this.currentUser = null;
    await this.persistUserState(null);
  }

  // Private helper methods
  private async initializeSession(): Promise<void> {
    try {
      // Add timeout to prevent hanging during airplane mode
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Session initialization timeout (offline mode)"));
        }, 3000);
      });

      const sessionPromise = this.getClient().auth.getSession();
      const result = await Promise.race([sessionPromise, timeoutPromise]);

      const {
        data: { session },
      } = result;

      if (session?.user) {
        const supabaseUser = this.mapSupabaseUserToAccount(session.user);
        // Only update if we don't already have a restored user, or if the Supabase user is different
        if (!this.currentUser || this.currentUser.id !== supabaseUser.id) {
          this.currentUser = supabaseUser;
          await this.persistUserState(supabaseUser);
          console.log("🔐 SupabaseStorage - Session initialized from Supabase");
        }
      }
    } catch (error) {
      // Handle network errors gracefully during session initialization
      if (
        error instanceof Error &&
        (error.message.includes("Network request failed") ||
          error.message.includes("timeout") ||
          error.message.includes("offline mode") ||
          error.name === "TypeError")
      ) {
        console.log(
          "🔐 SupabaseStorage - Network error during session initialization (airplane mode), using restored user:",
          error.message,
        );
        // Keep any restored user we already have
        return;
      }

      console.warn("🔐 SupabaseStorage - Session initialization error:", error);
    }
  }

  private mapSupabaseUserToAccount(user: User): UserAccount {
    const isAnonymous = !user.email; // No email means anonymous

    if (isAnonymous) {
      return {
        id: user.id,
        isAnonymous: true,
        createdAt: new Date(user.created_at),
      };
    }

    return createAuthenticatedUser(user.email!);
  }

  // Development/testing utilities
  async clearAllData(): Promise<void> {
    // Only available in development/testing
    if (process.env.NODE_ENV === "production") {
      throw new Error("clearAllData is not available in production");
    }

    await this.getClient().from("exercises").delete().neq("id", "");
    await this.getClient().from("sync_states").delete().neq("record_id", "");
  }
}
