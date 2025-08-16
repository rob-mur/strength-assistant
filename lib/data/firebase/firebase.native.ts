import {
	FirebaseFirestoreTypes,
	getFirestore,
	connectFirestoreEmulator,
} from "@react-native-firebase/firestore";

let initialized = false;


let db: FirebaseFirestoreTypes.Module | undefined;

export function initFirebase(): void {
	if (initialized) return;

	db = getFirestore();
	if (__DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR) {
		connectFirestoreEmulator(db, "10.0.2.2", 8080);
	}
	initialized = true;
}

// ===== Getters with overloads =====
export function getDb(): FirebaseFirestoreTypes.Module {
	if (!initialized || !db) {
		throw new Error("Firebase not initialized. Call initFirebase() first.");
	}
	return db!;
}

export * from "@react-native-firebase/firestore";
