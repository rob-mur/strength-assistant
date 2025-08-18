import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  getCurrentUser,
  User,
} from "@/lib/data/firebase/auth";
import { devLog, devError } from "@/lib/utils/devLog";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: getCurrentUser(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    devLog("[useAuth] Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged((user) => {
      devLog("[useAuth] Auth state changed:", user?.uid || "signed out");
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    });

    return () => {
      devLog("[useAuth] Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const handleAuthAction = async (
    action: () => Promise<any>,
    actionName: string
  ): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      devLog(`[useAuth] Starting ${actionName}`);
      
      await action();
      
      devLog(`[useAuth] ${actionName} successful`);
    } catch (error: any) {
      devError(`[useAuth] ${actionName} error:`, error);
      
      let errorMessage = "An unexpected error occurred";
      
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password";
            break;
          case "auth/email-already-in-use":
            errorMessage = "Email is already registered";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setState((prev) => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      throw error; // Re-throw for component-level handling if needed
    }
  };

  const actions: AuthActions = {
    signInWithEmail: (email: string, password: string) =>
      handleAuthAction(
        () => signInWithEmailAndPassword(email, password),
        "email sign in"
      ),

    createAccount: (email: string, password: string) =>
      handleAuthAction(
        () => createUserWithEmailAndPassword(email, password),
        "account creation"
      ),

    signInAnonymously: () =>
      handleAuthAction(
        () => signInAnonymously(),
        "anonymous sign in"
      ),

    signOut: () =>
      handleAuthAction(
        () => signOut(),
        "sign out"
      ),

    clearError: () => {
      setState((prev) => ({ ...prev, error: null }));
    },
  };

  return {
    ...state,
    ...actions,
  };
};