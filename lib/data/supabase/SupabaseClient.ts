import {
  SupabaseClient as BaseSupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import { Database } from "../../models/supabase";
import { getSupabaseClient } from "./supabase";

/**
 * Typed Supabase client utility
 * Provides a strongly typed interface to the Supabase database
 */
export class SupabaseClient {
  private client: BaseSupabaseClient<Database> | null = null;

  private getClient(): BaseSupabaseClient<Database> {
    this.client ??= this.initializeClient();
    return this.client;
  }

  private initializeClient(): BaseSupabaseClient<Database> {
    // In test environment, avoid actual client initialization as tests use mocks
    if (process.env.NODE_ENV === "test") {
      return this.createMockClient();
    }

    return this.createValidatedClient();
  }

  private createValidatedClient(): BaseSupabaseClient<Database> {
    const client = getSupabaseClient();
    this.validateClient(client);
    return client;
  }

  private validateClient(client: BaseSupabaseClient<Database>): void {
    if (!client || typeof client.from !== "function") {
      throw new Error("Invalid Supabase client: missing required methods");
    }
  }

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
  getSupabaseClient(): BaseSupabaseClient<Database> {
    return this.getClient();
  }

  /**
   * Get a reference to the exercises table with type safety
   */
  get exercises() {
    return this.getClient().from("exercises");
  }

  /**
   * Get the current authenticated user
   * Automatically signs in anonymously if no user is authenticated (for testing)
   */
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.getClient().auth.getUser();
      if (error || !user) {
        // For tests and initial setup, automatically sign in anonymously
        console.log("No authenticated user found, signing in anonymously...");
        const {
          data: { user: anonUser },
          error: signInError,
        } = await this.getClient().auth.signInAnonymously();
        if (signInError) {
          console.error("Anonymous sign-in failed:", signInError);
          throw signInError;
        }
        console.log("Successfully signed in anonymously:", anonUser?.id);
        return anonUser;
      }
      return user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.getClient().auth.onAuthStateChange(callback);
  }
}

// Export a singleton instance
export const supabaseClient = new SupabaseClient();
