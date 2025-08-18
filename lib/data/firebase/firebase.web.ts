import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
	connectFirestoreEmulator,
	Firestore,
	getFirestore,
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

let initialized = false;

import firebaseConfig from "../../../firebase.web.config.json";

let db: Firestore;
let auth: any;

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

export * from "firebase/firestore";
