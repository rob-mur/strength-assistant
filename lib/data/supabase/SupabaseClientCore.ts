import {
  SupabaseClient as BaseSupabaseClient,
  User,
  AuthError,
} from "@supabase/supabase-js";

/**
 * Core business logic for Supabase client operations
 * This class contains testable business logic separated from infrastructure concerns
 */
export class SupabaseClientCore {
  /**
   * Process auth response and handle errors according to offline-first principles
   * Returns null for auth session missing errors, throws other errors
   */
  static async processAuthResponse(
    authCall: Promise<{ data: { user: User | null }; error: AuthError | null }>,
    timeoutMs: number = 10000,
  ): Promise<User | null> {
    console.log("🔗 SupabaseClientCore - Processing auth response");

    try {
      // Add timeout to prevent hanging
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `getCurrentUser timeout after ${timeoutMs / 1000} seconds`,
              ),
            ),
          timeoutMs,
        ),
      );

      console.log("🔗 SupabaseClientCore - Waiting for auth response...");
      const result = await Promise.race([authCall, timeout]);

      // Type guard to ensure we have the auth response
      if (!result || typeof result !== "object" || !("data" in result)) {
        throw new Error("Invalid auth response");
      }

      const {
        data: { user },
        error,
      } = result as { data: { user: User | null }; error: AuthError | null };

      console.log(
        "🔗 SupabaseClientCore - Auth response completed, user:",
        user ? "found" : "null",
        "error:",
        error || "none",
      );

      if (error) {
        return this.handleAuthError(error);
      }

      return user;
    } catch (error) {
      return this.handleAuthException(error);
    }
  }

  /**
   * Handle auth errors according to offline-first principles
   * Returns null for session missing errors, throws others
   */
  static handleAuthError(error: AuthError): User | null {
    console.error("🔗 SupabaseClientCore - Auth error:", error);

    // Don't throw on auth session missing - this is expected in offline-first apps
    if (this.isSessionMissingError(error)) {
      console.log(
        "🔗 SupabaseClientCore - Auth session missing, returning null (offline-first)",
      );
      return null;
    }

    console.log("🔗 SupabaseClientCore - Non-session error, throwing:", error);
    throw error;
  }

  /**
   * Handle auth exceptions according to offline-first principles
   * Returns null for session missing errors, throws others
   */
  static handleAuthException(error: unknown): User | null {
    console.error("🔗 SupabaseClientCore - Auth exception:", error);

    // Handle auth session missing errors gracefully in offline-first apps
    if (this.isSessionMissingException(error)) {
      console.log(
        "🔗 SupabaseClientCore - Auth session missing in exception, returning null (offline-first)",
      );
      return null;
    }

    throw error;
  }

  /**
   * Check if an auth error indicates a missing session
   */
  static isSessionMissingError(error: AuthError): boolean {
    return (
      error.message?.includes("Auth session missing") ||
      error.message?.includes("AuthSessionMissingError") ||
      error.name === "AuthSessionMissingError"
    );
  }

  /**
   * Check if an exception indicates a missing session
   */
  static isSessionMissingException(error: unknown): boolean {
    return (
      (error instanceof Error &&
        error.message?.includes("Auth session missing")) ||
      (error instanceof Error && error.name === "AuthSessionMissingError")
    );
  }

  /**
   * Validate that a Supabase client has required methods
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validateClient(client: BaseSupabaseClient<any>): void {
    if (!client || typeof client.from !== "function") {
      throw new Error("Invalid Supabase client: missing required methods");
    }
  }
}
