import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
	Auth,
	getAuth,
	connectAuthEmulator,
	signInAnonymously,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User,
} from "firebase/auth";

let initialized = false;
import firebaseConfig from "../../../firebase.web.config.json";

let auth: Auth;

export function initAuth(): void {
	if (initialized) {
		console.log("[Firebase Auth Web] Already initialized, skipping");
		return;
	}

	try {
		console.log("[Firebase Auth Web] Initializing Firebase Auth...");
		const app = initializeApp(firebaseConfig);
		auth = getAuth(app);
		console.log("[Firebase Auth Web] Firebase Auth initialized successfully");

		if (__DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR === "true") {
			const host = Platform["OS"] == "web" ? "localhost" : "10.0.2.2";
			console.log(`[Firebase Auth Web] Development mode detected, connecting to auth emulator at ${host}:9099`);
			try {
				connectAuthEmulator(auth, `http://${host}:9099`);
				console.log("[Firebase Auth Web] Successfully connected to Auth emulator");
			} catch (emulatorError) {
				console.error("[Firebase Auth Web] Failed to connect to emulator:", emulatorError);
				console.warn("[Firebase Auth Web] Continuing with production Auth");
			}
		} else {
			console.log("[Firebase Auth Web] Production mode, using production Auth");
		}

		initialized = true;
		console.log("[Firebase Auth Web] Auth initialization complete");
	} catch (error) {
		console.error("[Firebase Auth Web] Failed to initialize Firebase Auth:", error);
		throw error;
	}
}

// Auth instance getter
export function getAuthInstance(): Auth {
	if (!initialized || !auth) {
		console.error("[Firebase Auth Web] getAuthInstance() called but Auth not initialized");
		throw new Error("Firebase Auth not initialized. Call initAuth() first.");
	}
	return auth;
}

// Auth methods
export async function signInAnonymouslyWeb(): Promise<User> {
	const authInstance = getAuthInstance();
	const result = await signInAnonymously(authInstance);
	return result.user;
}

export async function createAccountWeb(email: string, password: string): Promise<User> {
	const authInstance = getAuthInstance();
	const result = await createUserWithEmailAndPassword(authInstance, email, password);
	return result.user;
}

export async function signInWeb(email: string, password: string): Promise<User> {
	const authInstance = getAuthInstance();
	const result = await signInWithEmailAndPassword(authInstance, email, password);
	return result.user;
}

export async function signOutWeb(): Promise<void> {
	const authInstance = getAuthInstance();
	await signOut(authInstance);
}

export function onAuthStateChangedWeb(callback: (user: User | null) => void): () => void {
	const authInstance = getAuthInstance();
	return onAuthStateChanged(authInstance, callback);
}

export * from "firebase/auth";