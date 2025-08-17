import {
	FirebaseFirestoreTypes,
	getFirestore,
	connectFirestoreEmulator,
} from "@react-native-firebase/firestore";

let initialized = false;


let db: FirebaseFirestoreTypes.Module | undefined;

export function initFirebase(): void {
	if (initialized) {
		console.log("[Firebase Native] Already initialized, skipping");
		return;
	}

	try {
		console.log("[Firebase Native] Initializing Firestore...");
		db = getFirestore();
		console.log("[Firebase Native] Firestore initialized successfully");

		if (__DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR) {
			console.log("[Firebase Native] Development mode detected, connecting to emulator at 10.0.2.2:8080");
			try {
				connectFirestoreEmulator(db, "10.0.2.2", 8080);
				console.log("[Firebase Native] Successfully connected to Firestore emulator");
			} catch (emulatorError) {
				console.error("[Firebase Native] Failed to connect to emulator:", emulatorError);
				console.warn("[Firebase Native] Continuing with production Firestore");
			}
		} else {
			console.log("[Firebase Native] Production mode, using production Firestore");
		}

		initialized = true;
		console.log("[Firebase Native] Initialization complete");
	} catch (error) {
		console.error("[Firebase Native] Failed to initialize Firebase:", error);
		throw error;
	}
}

// ===== Getters with overloads =====
export function getDb(): FirebaseFirestoreTypes.Module {
	if (!initialized || !db) {
		console.error("[Firebase Native] getDb() called but Firebase not initialized");
		throw new Error("Firebase not initialized. Call initFirebase() first.");
	}
	return db!;
}

export * from "@react-native-firebase/firestore";
