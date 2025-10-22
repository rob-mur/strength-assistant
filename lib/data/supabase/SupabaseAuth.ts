/**
 * Supabase Authentication Implementation
 *
 * Provides authentication functionality using Supabase Auth with feature flag support.
 * Supports both email/password authentication and anonymous users.
 */

import { supabaseClient } from "./SupabaseClient";
import type { UserAccount } from "../../models/UserAccount";
import {
  createAnonymousUser,
  createAuthenticatedUser,
} from "../../models/UserAccount";

interface SupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } | null; error: unknown }>;
    signInAnonymously: () => Promise<{ data: unknown; error: unknown }>;
    signUp: (credentials: {
      email: string;
      password: string;
    }) => Promise<{ data: unknown; error: unknown }>;
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<{ data: unknown; error: unknown }>;
    signOut: () => Promise<{ error: unknown }>;
    onAuthStateChange: (
      callback: (event: string, session: unknown) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
    linkEmailPassword: (
      email: string,
      password: string,
    ) => Promise<{ data: { user: unknown }; error: unknown }>;
    forceSessionExpiry: () => Promise<void>;
  };
  [key: string]: unknown;
}

export class SupabaseAuth {
  // This array must remain mutable for push/splice in subscribeToAuthState
  private readonly authStateListeners: ((user: UserAccount | null) => void)[] =
    [];
  private readonly client: SupabaseClient;

  constructor() {
    // Get the client - handle both real and mocked cases
    const maybeClient =
      typeof supabaseClient?.getSupabaseClient === "function"
        ? supabaseClient.getSupabaseClient()
        : supabaseClient;
    this.client = maybeClient as unknown as SupabaseClient;

    if (this.client?.auth?.onAuthStateChange) {
      // Set up auth state listener with Supabase
      this.client.auth.onAuthStateChange((event: string, session: unknown) => {
        let user: unknown = undefined;
        if (session && typeof session === "object" && "user" in session) {
          user = (session as { user?: unknown }).user;
        }
        const mappedUser = user
          ? this.mapSupabaseUserToUserAccount(user)
          : null;
        // Notify all listeners
        for (const listener of this.authStateListeners) {
          try {
            listener(mappedUser);
          } catch {
            /* Silent error handling */
          }
        }
      });
    }
  }

  /**
   * Helper method to handle common auth response pattern
   */
  private handleAuthResponse(
    data: unknown,
    error: unknown,
    operation: string,
  ): UserAccount {
    if (error) {
      throw new Error(
        `${operation} failed: ${(error as { message: string }).message}`,
      );
    }

    if (!(data as { user: unknown }).user) {
      throw new Error(`${operation} failed: No user returned`);
    }

    return this.mapSupabaseUserToUserAccount((data as { user: unknown }).user);
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string): Promise<UserAccount> {
    // Basic validation
    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!this.isValidPassword(password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });

    return this.handleAuthResponse(data, error, "Sign up");
  }

  /**
   * Sign in existing user with email and password
   */
  async signIn(email: string, password: string): Promise<UserAccount> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    return this.handleAuthResponse(data, error, "Sign in");
  }

  /**
   * Create anonymous user session
   */
  async signInAnonymously(): Promise<UserAccount> {
    console.log("🔐 SupabaseAuth - Starting signInAnonymously");

    try {
      const { data, error } = await this.client.auth.signInAnonymously();

      console.log("🔐 SupabaseAuth - signInAnonymously response:", {
        hasData: !!data,
        hasUser: !!(data as { user: { id: string } | null })?.user,
        userId: (data as { user: { id: string } | null })?.user?.id,
        hasError: !!error,
        errorMessage: error ? (error as Error).message : null,
      });

      return this.handleAuthResponse(data, error, "Anonymous sign in");
    } catch (error) {
      console.error("🔐 SupabaseAuth - signInAnonymously failed:", error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const { data, error } = await this.client.auth.getUser();

      if (error) {
        console.log("🔐 SupabaseAuth - getCurrentUser error:", error);
        // Handle auth session missing errors gracefully (offline-first)
        if (
          (error as Error).message?.includes("Auth session missing") ||
          (error as Error & { name: string }).name === "AuthSessionMissingError"
        ) {
          console.log("🔐 SupabaseAuth - Auth session missing, returning null");
          return null;
        }
        throw error;
      }

      let user: unknown = undefined;
      if (data && typeof data === "object" && "user" in data) {
        user = (data as { user?: unknown }).user;
      }
      if (!user) {
        return null;
      }

      return this.mapSupabaseUserToUserAccount(user);
    } catch (error) {
      console.error("🔐 SupabaseAuth - getCurrentUser failed:", error);
      // Handle auth session missing errors gracefully
      if (
        (error as Error)?.message?.includes("Auth session missing") ||
        (error as Error & { name: string })?.name === "AuthSessionMissingError"
      ) {
        console.log(
          "🔐 SupabaseAuth - Auth session missing in catch, returning null",
        );
        return null;
      }
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw new Error(
        `Sign out failed: ${(error as { message: string }).message}`,
      );
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribeToAuthState(
    callback: (user: UserAccount | null) => void,
  ): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Map Supabase User to our UserAccount interface
   */
  private mapSupabaseUserToUserAccount(supabaseUser: unknown): UserAccount {
    const userData = supabaseUser as {
      id: string;
      email?: string;
      created_at: string;
    };
    const isAnonymous = !userData.email;

    if (isAnonymous) {
      const user = createAnonymousUser();
      return {
        ...user,
        id: userData.id,
        createdAt: new Date(userData.created_at),
      };
    } else {
      const user = createAuthenticatedUser(userData.email!);
      return {
        ...user,
        id: userData.id,
        createdAt: new Date(userData.created_at),
      };
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  /**
   * Link email and password to anonymous user (upgrade anonymous to authenticated)
   */
  async linkEmailPassword(
    email: string,
    password: string,
  ): Promise<UserAccount> {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!this.isValidPassword(password)) {
      throw new Error("Password should be at least 6 characters");
    }

    const currentUser = await this.getCurrentUser();
    if (!currentUser?.isAnonymous) {
      throw new Error("No anonymous user to upgrade");
    }

    // Simulate upgrading anonymous user to authenticated user
    const { data, error } = await this.client.auth.linkEmailPassword(
      email,
      password,
    );

    if (error) {
      throw new Error((error as { message: string }).message);
    }

    if (!(data as { user: unknown }).user) {
      throw new Error("Failed to upgrade anonymous user");
    }

    // Keep the same user ID but update authentication status
    const upgradedUser: UserAccount = {
      id: currentUser.id, // Keep the same ID
      email: email,
      isAnonymous: false,
      createdAt: currentUser.createdAt,
    };

    return upgradedUser;
  }

  /**
   * Force session expiry for testing
   */
  async forceSessionExpiry(): Promise<void> {
    // Simulate expired session by signing out
    await this.client.auth.forceSessionExpiry();
  }
}
