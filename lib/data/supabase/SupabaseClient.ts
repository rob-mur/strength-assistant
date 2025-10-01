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
   * Does NOT automatically sign in - auth should be handled by useAuth hook
   */
  async getCurrentUser() {
    console.log("🔗 SupabaseClient - getCurrentUser called");
    console.log("🔗 SupabaseClient - Calling this.getClient().auth.getUser()");

    try {
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("getCurrentUser timeout after 10 seconds")),
          10000,
        ),
      );

      const authCall = this.getClient().auth.getUser();
      console.log("🔗 SupabaseClient - Waiting for auth.getUser() response...");

      const {
        data: { user },
        error,
      } = await Promise.race([authCall, timeout]);

      console.log(
        "🔗 SupabaseClient - auth.getUser() completed, user:",
        user ? "found" : "null",
        "error:",
        error,
      );

      if (error) {
        console.error("🔗 SupabaseClient - auth.getUser() error:", error);
        // Don't throw on auth session missing - this is expected in offline-first apps
        if (
          error.message?.includes("Auth session missing") ||
          error.name === "AuthSessionMissingError"
        ) {
          console.log(
            "🔗 SupabaseClient - Auth session missing, returning null (offline-first)",
          );
          return null;
        }
        console.log("🔗 SupabaseClient - Non-auth error, throwing:", error);
        throw error;
      }
      return user;
    } catch (error) {
      console.error("🔗 SupabaseClient - getCurrentUser failed:", error);
      // Handle auth session missing errors gracefully in offline-first apps
      if (
        error.message?.includes("Auth session missing") ||
        error.name === "AuthSessionMissingError"
      ) {
        console.log(
          "🔗 SupabaseClient - Auth session missing in catch block, returning null (offline-first)",
        );
        return null;
      }
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
