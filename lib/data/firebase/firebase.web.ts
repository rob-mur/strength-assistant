import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
	connectFirestoreEmulator,
	Firestore,
	getFirestore,
} from "firebase/firestore";
import { Auth, connectAuthEmulator } from "firebase/auth";
export * from "firebase/firestore";
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
import firebaseConfig from "../../../firebase.web.config.json";


export let auth: Auth;
let initialized = false;
let db: Firestore;

export type User = FirebaseUser;

export function initFirebase(): void {
	if (initialized) {
		console.log("[Firebase Web] Already initialized, skipping");
		return;
	}

	try {
		console.log("[Firebase Web] Initializing Firebase app, Auth, and Firestore...");
		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
		auth = getAuth(app);
		console.log("[Firebase Web] Firebase app, Auth, and Firestore initialized successfully");

		if (__DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR === "true") {
			const host = Platform["OS"] == "web" ? "localhost" : "10.0.2.2";
			console.log(`[Firebase Web] Development mode detected, connecting to emulators at ${host}`);
			try {
				connectFirestoreEmulator(db, host, 8080);
				connectAuthEmulator(auth, `http://${host}:9099`);
				console.log("[Firebase Web] Successfully connected to Firebase emulators");
			} catch (emulatorError) {
				console.error("[Firebase Web] Failed to connect to emulators:", emulatorError);
				console.warn("[Firebase Web] Continuing with production Firebase");
			}
		} else {
			console.log("[Firebase Web] Production mode, using production Firebase");
		}

		initialized = true;
		console.log("[Firebase Web] Initialization complete");
	} catch (error) {
		console.error("[Firebase Web] Failed to initialize Firebase:", error);
		throw error;
	}
}

// ===== Getters with overloads =====
export function getDb(): Firestore {
	if (!initialized || !db) {
		console.error("[Firebase Web] getDb() called but Firebase not initialized");
		throw new Error("Firebase not initialized. Call initFirebase() first.");
	}
	return db!;
}


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
