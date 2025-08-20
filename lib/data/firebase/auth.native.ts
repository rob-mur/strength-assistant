import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

let initialized = false;

export function initAuth(): void {
	if (initialized) {
		console.log("[Firebase Auth Native] Already initialized, skipping");
		return;
	}

	try {
		console.log("[Firebase Auth Native] Initializing Firebase Auth...");
		
		if (__DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR === "true") {
			console.log("[Firebase Auth Native] Development mode detected, connecting to auth emulator at 10.0.2.2:9099");
			try {
				auth().useEmulator("http://10.0.2.2:9099");
				console.log("[Firebase Auth Native] Successfully connected to Auth emulator");
			} catch (emulatorError) {
				console.error("[Firebase Auth Native] Failed to connect to emulator:", emulatorError);
				console.warn("[Firebase Auth Native] Continuing with production Auth");
			}
		} else {
			console.log("[Firebase Auth Native] Production mode, using production Auth");
		}

		initialized = true;
		console.log("[Firebase Auth Native] Auth initialization complete");
	} catch (error) {
		console.error("[Firebase Auth Native] Failed to initialize Firebase Auth:", error);
		throw error;
	}
}

// Auth instance getter
export function getAuthInstance(): FirebaseAuthTypes.Module {
	if (!initialized) {
		console.error("[Firebase Auth Native] getAuthInstance() called but Auth not initialized");
		throw new Error("Firebase Auth not initialized. Call initAuth() first.");
	}
	return auth();
}

// Auth methods
export async function signInAnonymouslyNative(): Promise<FirebaseAuthTypes.User> {
	const authInstance = getAuthInstance();
	const result = await authInstance.signInAnonymously();
	return result.user;
}

export async function createAccountNative(email: string, password: string): Promise<FirebaseAuthTypes.User> {
	const authInstance = getAuthInstance();
	const result = await authInstance.createUserWithEmailAndPassword(email, password);
	return result.user;
}

export async function signInNative(email: string, password: string): Promise<FirebaseAuthTypes.User> {
	const authInstance = getAuthInstance();
	const result = await authInstance.signInWithEmailAndPassword(email, password);
	return result.user;
}

export async function signOutNative(): Promise<void> {
	const authInstance = getAuthInstance();
	await authInstance.signOut();
}

export function onAuthStateChangedNative(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
	const authInstance = getAuthInstance();
	return authInstance.onAuthStateChanged(callback);
}

export * from "@react-native-firebase/auth";