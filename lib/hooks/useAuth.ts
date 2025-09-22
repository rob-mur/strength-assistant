import { useState, useEffect, useCallback } from "react";
import { storageManager } from "../data/StorageManager";
import type { UserAccount } from "../models/UserAccount";

// Types for cross-platform user
export interface AuthUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
}

/**
 * Custom hook for authentication using Supabase
 */
export function useAuth(): AuthState & {
  signInAnonymously: () => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Get the Supabase backend
  const authBackend = storageManager.getAuthBackend();

  const handleUserStateChange = useCallback((user: UserAccount | null) => {
    console.log(
      "🔐 [useAuth] handleUserStateChange called with user:",
      user?.id || "null",
    );
    setState((prevState) => ({
      ...prevState,
      user: user
        ? {
            uid: user.id,
            email: user.email || null,
            isAnonymous: user.isAnonymous,
          }
        : null,
      loading: false,
    }));
    console.log(
      "🔐 [useAuth] State updated - user is now:",
      user?.id || "null",
    );
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Handle Chrome test environment with automatic anonymous sign-in
        if (
          process.env.CHROME_TEST === "true" ||
          process.env.CI === "true" ||
          process.env.EXPO_PUBLIC_CHROME_TEST === "true"
        ) {
          console.log(
            "🔐 [useAuth] Chrome test environment detected - creating anonymous test user",
          );

          // Subscribe to auth state changes first
          unsubscribe = await authBackend.subscribeToAuthState(
            handleUserStateChange,
          );

          // Check if user is already authenticated
          const currentUser = await authBackend.getCurrentUser();
          if (currentUser) {
            console.log(
              "🔐 [useAuth] Test user already authenticated:",
              currentUser.id,
            );
            handleUserStateChange(currentUser);
          } else {
            console.log(
              "🔐 [useAuth] No authenticated user found, signing in anonymously",
            );
            // Sign in anonymously to get a real Supabase user
            await authBackend.signInAnonymously();
            // handleUserStateChange will be called automatically via subscription
          }
          return;
        }

        // Subscribe to auth state changes
        unsubscribe = await authBackend.subscribeToAuthState(
          handleUserStateChange,
        );

        // Get current user
        const currentUser = await authBackend.getCurrentUser();
        handleUserStateChange(currentUser);
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          error: {
            code: "init-error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          loading: false,
        }));
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authBackend, handleUserStateChange]);

  const signInAnonymously = useCallback(async () => {
    console.log("🔐 [useAuth] Starting anonymous sign-in process");
    console.log(
      "🔐 [useAuth] AuthBackend instance:",
      authBackend.constructor.name,
    );
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      console.log("🔐 [useAuth] Calling authBackend.signInAnonymously()");
      const result = await authBackend.signInAnonymously();
      console.log("🔐 [useAuth] Anonymous sign-in successful:", result);

      // CRITICAL FIX: Update user state immediately, don't rely only on callbacks
      console.log("🔐 [useAuth] Updating user state with result");
      handleUserStateChange(result);

      console.log("🔐 [useAuth] Loading state reset to false");
    } catch (error) {
      console.error("🔐 [useAuth] Anonymous sign-in failed:", error);
      setState((prevState) => ({
        ...prevState,
        error: {
          code: "sign-in-anonymous-error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to sign in anonymously",
        },
        loading: false,
      }));
    }
  }, [authBackend, handleUserStateChange]);

  const createAccount = useCallback(
    async (email: string, password: string) => {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      try {
        await authBackend.signUpWithEmail(email, password);
        setState((prevState) => ({ ...prevState, loading: false }));
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          error: {
            code: "create-account-error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to create account",
          },
          loading: false,
        }));
      }
    },
    [authBackend],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      try {
        await authBackend.signInWithEmail(email, password);
        setState((prevState) => ({ ...prevState, loading: false }));
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          error: {
            code: "sign-in-error",
            message:
              error instanceof Error ? error.message : "Failed to sign in",
          },
          loading: false,
        }));
      }
    },
    [authBackend],
  );

  const signOut = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      await authBackend.signOut();
      setState((prevState) => ({ ...prevState, loading: false }));
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: {
          code: "sign-out-error",
          message:
            error instanceof Error ? error.message : "Failed to sign out",
        },
        loading: false,
      }));
    }
  }, [authBackend]);

  const clearError = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      error: null,
    }));
  }, []);

  return {
    ...state,
    signInAnonymously,
    createAccount,
    signIn,
    signOut,
    clearError,
  };
}
