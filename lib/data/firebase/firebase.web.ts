import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
	connectFirestoreEmulator,
	Firestore,
	getFirestore,
} from "firebase/firestore";

let initialized = false;

// Import config with fallback to demo config for development
let firebaseConfig;
try {
  firebaseConfig = require("../../../firebase.web.config.json");
} catch {
  // Fallback to demo config if main config doesn't exist
  firebaseConfig = require("../../../firebase.web.config.demo.json");
}

let db: Firestore;

export function initFirebase(): void {
	if (initialized) return;
	const app = initializeApp(firebaseConfig);
	db = getFirestore(app);
	if (__DEV__ || process.env.EAS_BUILD_PROFILE === "preview") {
		const host = Platform.OS === "web" ? "localhost" : "10.0.2.2";
		connectFirestoreEmulator(db, host, 8080);
	}
	initialized = true;
}

// ===== Getters with overloads =====
export function getDb(): Firestore {
	if (!initialized || !db) {
		throw new Error("Firebase not initialized. Call initFirebase() first.");
	}
	return db!;
}

export * from "firebase/firestore";
