import {
	FirebaseFirestoreTypes,
	getFirestore,
	connectFirestoreEmulator,
} from "@react-native-firebase/firestore";
import { FirebaseService } from "./firebase-core";

class FirestoreNativeService extends FirebaseService {
	private db: FirebaseFirestoreTypes.Module | undefined;

	constructor() {
		super("Firestore");
	}

	init(): void {
		if (this.initialized) {
			this.logInfo("Already initialized, skipping");
			return;
		}

		const startTime = Date.now();
		this.logInfo("Initializing Firestore...", { operation: "init" });

		try {
			this.db = getFirestore();
			this.logInfo("Firestore initialized successfully", {
				operation: "init",
				duration: Date.now() - startTime
			});

			this.setupEmulator();
			this.initialized = true;

			this.logInfo("Initialization complete", {
				operation: "init",
				duration: Date.now() - startTime
			});
		} catch (error: any) {
			this.logError("Failed to initialize Firebase", {
				operation: "init",
				duration: Date.now() - startTime,
				error: {
					message: error.message,
					stack: error.stack
				}
			});
			throw error;
		}
	}

	private setupEmulator(): void {
		if (!this.db) return;

		if (this.isEmulatorEnabled()) {
			const host = this.getEmulatorHost();
			const port = 8080;

			this.logInfo("Development mode detected, connecting to emulator", {
				operation: "emulator_setup",
				emulator: { host, port }
			});

			try {
				connectFirestoreEmulator(this.db, host, port);
				this.logInfo("Successfully connected to Firestore emulator", {
					operation: "emulator_setup",
					emulator: { host, port }
				});
			} catch (error: any) {
				this.logError("Failed to connect to emulator", {
					operation: "emulator_setup",
					emulator: { host, port },
					error: {
						message: error.message
					}
				});
				this.logWarn("Continuing with production Firestore");
			}
		} else {
			this.logInfo("Production mode, using production Firestore", {
				operation: "emulator_setup"
			});
		}
	}

	getDb(): FirebaseFirestoreTypes.Module {
		this.assertInitialized("getDb()");
		if (!this.db) {
			throw new Error("Firestore instance not available");
		}
		return this.db;
	}

	isReady(): boolean {
		return this.initialized && !!this.db;
	}
}

const firestoreService = new FirestoreNativeService();

export function initFirebase(): void {
	firestoreService.init();
}

export function getDb(): FirebaseFirestoreTypes.Module {
	return firestoreService.getDb();
}

export * from "@react-native-firebase/firestore";
