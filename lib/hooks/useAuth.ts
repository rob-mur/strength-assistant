import { useState, useEffect, useCallback } from "react";
import { storageManager } from "../data/StorageManager";

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

  const handleUserStateChange = useCallback((user: any) => {
    setState((prevState) => ({
      ...prevState,
      user: user
        ? {
            uid: user.id,
            email: user.email,
            isAnonymous: user.isAnonymous || false,
          }
        : null,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
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
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      await authBackend.signInAnonymously();
    } catch (error) {
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
  }, [authBackend]);

  const createAccount = useCallback(
    async (email: string, password: string) => {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      try {
        await authBackend.signUpWithEmail(email, password);
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
