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
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      console.log("🔐 useAuth - Initializing authentication");
      try {
        console.log("🔐 useAuth - Subscribing to auth state changes");
        unsubscribe = authBackend.subscribeToAuthState(handleUserStateChange);

        // Get current user - CRITICAL: Check if auth backend already has a user
        console.log("🔐 useAuth - Getting current user from backend");
        const currentUser = await authBackend.getCurrentUser();
        console.log(
          "🔐 useAuth - Current user from backend:",
          currentUser
            ? `authenticated (${currentUser.id})`
            : "not authenticated",
        );

        // CRITICAL FIX: If we have a user, immediately update state to prevent delays
        if (currentUser) {
          console.log(
            "🔐 useAuth - Found existing authenticated user, updating state immediately",
          );
          setState((prevState) => ({
            ...prevState,
            user: {
              uid: currentUser.id,
              email: currentUser.email || null,
              isAnonymous: currentUser.isAnonymous,
            },
            loading: false,
            error: null,
          }));
        }

        handleUserStateChange(currentUser);
      } catch (error) {
        console.error("🔐 useAuth - Error during initialization:", error);
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
    console.log("🔐 useAuth - Starting anonymous sign in");
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      console.log("🔐 useAuth - Calling authBackend.signInAnonymously()");
      const result = await authBackend.signInAnonymously();
      console.log(
        "🔐 useAuth - Anonymous sign in result:",
        result ? "success" : "failed",
      );

      // CRITICAL FIX: Update user state immediately, don't rely only on callbacks
      handleUserStateChange(result);
    } catch (error) {
      console.error("🔐 useAuth - Anonymous sign in error:", error);
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
