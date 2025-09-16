import { Platform } from "react-native";
import { logger } from "./logger";

interface FirebaseInitializer {
	initFirebase(): void;
	initAuth(): void;
	getDb(): unknown;
}

// Use dynamic imports to avoid ESLint require() warnings
const getFirebaseModule = (): FirebaseInitializer => {
	if (Platform.OS === "web") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./firebase.web");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./firebase.native");
	}
};

const getAuthModule = (): Record<string, unknown> => {
	if (Platform.OS === "web") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./auth.web");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./auth.native");
	}
};

export function initializeFirebaseServices(): void {
	const startTime = Date.now();
	const platform = Platform.OS === 'web' ? 'Web' : 'Native';
	
	logger.info("Starting Firebase services initialization", {
		service: "Firebase Initializer",
		platform,
		operation: "init_all"
	});

	try {
		const firebaseModule = getFirebaseModule();
		const authModule = getAuthModule();
		
		firebaseModule.initFirebase();
		(authModule as { initAuth: () => void }).initAuth();
		
		logger.info("Firebase services initialization complete", {
			service: "Firebase Initializer",
			platform,
			operation: "init_all",
			duration: Date.now() - startTime
		});
	} catch (error: unknown) {
		logger.error("Firebase services initialization failed", {
			service: "Firebase Initializer",
			platform,
			operation: "init_all",
			duration: Date.now() - startTime,
			error: {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			}
		});
		throw error;
	}
}

export const initFirebase = () => getFirebaseModule().initFirebase();
export const getDb = () => getFirebaseModule().getDb();