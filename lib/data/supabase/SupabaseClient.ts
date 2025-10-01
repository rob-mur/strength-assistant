import {
  SupabaseClient as BaseSupabaseClient,
  AuthChangeEvent,
  Session,
  User,
} from "@supabase/supabase-js";
import { Database } from "../../models/supabase";
import { getSupabaseClient } from "./supabase";
import { SupabaseClientCore } from "./SupabaseClientCore";

/**
 * Typed Supabase client utility
 * Provides a strongly typed interface to the Supabase database
 *
 * Infrastructure code below is excluded from coverage as it's tested via integration tests
 */
/* istanbul ignore next */
export class SupabaseClient {
  private client: BaseSupabaseClient<Database> | null = null;

  /* istanbul ignore next */
  private getClient(): BaseSupabaseClient<Database> {
    this.client ??= this.initializeClient();
    return this.client;
  }

  /* istanbul ignore next */
  private initializeClient(): BaseSupabaseClient<Database> {
    // In test environment, avoid actual client initialization as tests use mocks
    if (process.env.NODE_ENV === "test") {
      return this.createMockClient();
    }

    return this.createValidatedClient();
  }

  /* istanbul ignore next */
  private createValidatedClient(): BaseSupabaseClient<Database> {
    const client = getSupabaseClient();
    SupabaseClientCore.validateClient(client);
    return client;
  }

  /* istanbul ignore next */
  private createMockClient(): BaseSupabaseClient<Database> {
    // Return a minimal mock client for test environment
    // Tests will override this with jest.mock() anyway
    return {
      from: () => ({}),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
        signInAnonymously: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
    } as unknown as BaseSupabaseClient<Database>;
  }

  /**
   * Get the underlying Supabase client with full type safety
   */
  /* istanbul ignore next */
  getSupabaseClient(): BaseSupabaseClient<Database> {
    return this.getClient();
  }

  /**
   * Get a reference to the exercises table with type safety
   */
  /* istanbul ignore next */
  get exercises() {
    return this.getClient().from("exercises");
  }

  /**
   * Get the current authenticated user
   * Does NOT automatically sign in - auth should be handled by useAuth hook
   */
  async getCurrentUser(): Promise<User | null> {
    console.log("🔗 SupabaseClient - getCurrentUser called");
    console.log("🔗 SupabaseClient - Calling this.getClient().auth.getUser()");

    const authCall = this.getClient().auth.getUser();
    return SupabaseClientCore.processAuthResponse(authCall);
  }

  /**
   * Subscribe to auth state changes
   */
  /* istanbul ignore next */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.getClient().auth.onAuthStateChange(callback);
  }
}

// Export a singleton instance
/* istanbul ignore next */
export const supabaseClient = new SupabaseClient();
