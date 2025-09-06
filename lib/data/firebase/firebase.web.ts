import { initializeApp, FirebaseApp } from "@firebase/app";
import {
	connectFirestoreEmulator,
	Firestore,
	getFirestore,
} from "@firebase/firestore";
import { FirebaseService } from "./firebase-core";
import firebaseConfig from "../../../firebase.web.config.json";

class FirebaseWebService extends FirebaseService {
	private app: FirebaseApp | undefined;
	private db: Firestore | undefined;

	constructor() {
		super("Firebase");
	}

	init(): void {
		if (this.initialized) {
			this.logInfo("Already initialized, skipping");
			return;
		}

		const startTime = Date.now();
		this.logInfo("Initializing Firebase app and Firestore...", {
			operation: "init",
			config: this.sanitizeConfig(firebaseConfig)
		});

		try {
			this.app = initializeApp(firebaseConfig);
			this.db = getFirestore(this.app);

			this.logInfo("Firebase app and Firestore initialized successfully", {
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

	private sanitizeConfig(config: any): Record<string, unknown> {
		const { apiKey, ...safeConfig } = config;
		return {
			...safeConfig,
			apiKey: apiKey ? `${apiKey.slice(0, 8)}...` : 'not-set'
		};
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
				// Check if emulator is already connected
				if (!(this.db as any)._delegate?._databaseId?.database?.includes('emulator')) {
					connectFirestoreEmulator(this.db, host, port);
					this.logInfo("Successfully connected to Firestore emulator", {
						operation: "emulator_setup",
						emulator: { host, port }
					});
				} else {
					this.logInfo("Firestore emulator already connected", {
						operation: "emulator_setup",
						emulator: { host, port }
					});
				}
			} catch (error: any) {
				this.logError("Failed to connect to emulator", {
					operation: "emulator_setup",
					emulator: { host, port },
					error: {
						message: error.message
					}
				});
				this.logWarn("Continuing without emulator for Chrome testing compatibility");
			}
		} else {
			this.logInfo("Production mode, using production Firestore", {
				operation: "emulator_setup"
			});
		}
	}

	getDb(): Firestore {
		this.assertInitialized("getDb()");
		if (!this.db) {
			const error = new Error("Firestore instance not available. This may indicate an initialization timing issue in web environment.");
			this.logError("getDb() called but Firestore instance is null", {
				operation: "getDb",
				initialized: this.initialized,
				dbInstance: !!this.db
			});
			throw error;
		}
		return this.db;
	}

	getFirebaseApp(): FirebaseApp {
		this.assertInitialized("getFirebaseApp()");
		if (!this.app) {
			throw new Error("Firebase app instance not available");
		}
		return this.app;
	}

	isReady(): boolean {
		return this.initialized && !!this.app && !!this.db;
	}
}

const firebaseService = new FirebaseWebService();

export function initFirebase(): void {
	firebaseService.init();
}

export function getDb(): Firestore {
	return firebaseService.getDb();
}

export function getFirebaseApp(): FirebaseApp {
	return firebaseService.getFirebaseApp();
}

export * from "firebase/firestore";
