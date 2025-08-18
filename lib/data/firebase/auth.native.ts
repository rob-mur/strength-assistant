import auth, {
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { devLog, devError } from "@/lib/utils/devLog";

export type User = FirebaseAuthTypes.User;

// Sign in with email and password
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    devLog("[Auth Native] User signed in successfully:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Native] Sign in error:", error);
    throw error;
  }
};

// Create user with email and password
export const createUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    devLog("[Auth Native] User created successfully:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Native] Create user error:", error);
    throw error;
  }
};

// Sign in anonymously
export const signInAnonymously = async (): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().signInAnonymously();
    devLog("[Auth Native] Anonymous sign in successful:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    devError("[Auth Native] Anonymous sign in error:", error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
    devLog("[Auth Native] User signed out successfully");
  } catch (error) {
    devError("[Auth Native] Sign out error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

// Auth state listener
export const onAuthStateChanged = (callback: (user: FirebaseAuthTypes.User | null) => void) => {
  return auth().onAuthStateChanged(callback);
};