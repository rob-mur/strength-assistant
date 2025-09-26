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
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import {
  getSupabaseUrl,
  getSupabaseEnvConfig,
} from "../../config/supabase-env";
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
  private authStateCallbacks: ((user: UserAccount | null) => void)[] = [];

  private getClient(): SupabaseClient {
    if (!this.client) {
      const config = getSupabaseEnvConfig();
      const supabaseUrl = getSupabaseUrl();

      this.client = createClient(supabaseUrl, config.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    return this.client;
  }

  private notifyAuthStateChange(user: UserAccount | null): void {
    this.authStateCallbacks.forEach((callback) => {
      try {
        callback(user);
      } catch {
        // Silent error handling
      }
    });
  }
  /**
   * Call this after construction to initialize the session asynchronously.
   */
  async init(): Promise<void> {
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
    if (this.currentUser) {
      return this.currentUser;
    }

    const {
      data: { session },
    } = await this.getClient().auth.getSession();

    if (!session?.user) {
      return null;
    }

    return this.mapSupabaseUserToAccount(session.user);
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

    return userAccount;
  }

  async signUpWithEmail(email: string, password: string): Promise<UserAccount> {
    validateCredentials({ email, password });

    const { data, error } = await this.getClient().auth.signUp({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Sign up failed: No user returned");
    }

    const userAccount = this.mapSupabaseUserToAccount(data.user);
    this.currentUser = userAccount;

    return userAccount;
  }

  async signInAnonymously(): Promise<UserAccount> {
    // Try to create a real Supabase anonymous session first
    try {
      const {
        data: { user },
        error,
      } = await this.getClient().auth.signInAnonymously();
      if (error) {
        throw error;
      }
      if (user) {
        const realUser = this.mapSupabaseUserToAccount(user);
        this.currentUser = realUser;
        this.notifyAuthStateChange(realUser);
        return realUser;
      }
    } catch {
      // Silent error handling
    }

    // Fallback: create a local anonymous user if Supabase auth fails
    const anonymousUser = createAnonymousUser();
    this.currentUser = anonymousUser;
    this.notifyAuthStateChange(anonymousUser);

    return anonymousUser;
  }

  async signOut(): Promise<void> {
    const { error } = await this.getClient().auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }

    this.currentUser = null;

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
      if (session?.user) {
        const userAccount = this.mapSupabaseUserToAccount(session.user);
        this.currentUser = userAccount;
        callback(userAccount);
      } else {
        // CRITICAL FIX: Don't override local anonymous users when Supabase has no session
        // This prevents the race condition where local anonymous auth gets wiped out
        if (this.currentUser?.isAnonymous && event === "INITIAL_SESSION") {
          // Keep the existing local anonymous user, don't call callback(null)
          return;
        }
        this.currentUser = null;
        callback(null);
      }
    });

    // Immediately call callback with current user if exists (for anonymous users)
    if (this.currentUser) {
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
  }

  // Private helper methods
  private async initializeSession(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.getClient().auth.getSession();

      if (session?.user) {
        this.currentUser = this.mapSupabaseUserToAccount(session.user);
      }
    } catch {
      // Silent error handling
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
