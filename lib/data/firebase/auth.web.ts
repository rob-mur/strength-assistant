import {
  getAuth,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import { devLog, devError } from "@/lib/utils/devLog";

export type User = FirebaseUser;

const auth = getAuth();

// Sign in with email and password
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    devLog("[Auth Web] User signed in successfully:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Web] Sign in error:", error);
    throw error;
  }
};

// Create user with email and password
export const createUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    devLog("[Auth Web] User created successfully:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Web] Create user error:", error);
    throw error;
  }
};

// Sign in anonymously
export const signInAnonymously = async (): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInAnonymously(auth);
    devLog("[Auth Web] Anonymous sign in successful:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Web] Anonymous sign in error:", error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    devLog("[Auth Web] User signed out successfully");
  } catch (error) {
    devError("[Auth Web] Sign out error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Auth state listener
export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};