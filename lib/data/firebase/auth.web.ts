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
import { getFirebaseApp } from "./firebase.web";
import { FirebaseService } from "./firebase-core";

class AuthWebService extends FirebaseService {
	private authInstance: Auth | undefined;

	constructor() {
		super("Firebase Auth");
	}

	init(): void {
		if (this.initialized) {
			this.logInfo("Already initialized, skipping");
			return;
		}

		const startTime = Date.now();
		this.logInfo("Initializing Firebase Auth...", { operation: "init" });

		try {
			const app = getFirebaseApp();
			this.logInfo("Got firebase app", {
				operation: "init",
				config: { appName: app.name }
			});

			this.authInstance = getAuth(app);
			this.logInfo("Firebase Auth initialized successfully", {
				operation: "init",
				duration: Date.now() - startTime
			});

			this.setupEmulator();
			this.initialized = true;

			this.logInfo("Auth initialization complete", {
				operation: "init",
				duration: Date.now() - startTime
			});
		} catch (error: unknown) {
			this.logError("Failed to initialize Firebase Auth", {
				operation: "init",
				duration: Date.now() - startTime,
				error: {
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined
				}
			});
			throw error;
		}
	}

	private setupEmulator(): void {
		if (!this.authInstance) return;

		if (this.isEmulatorEnabled()) {
			const host = this.getEmulatorHost();
			const port = 9099;
			const emulatorUrl = `http://${host}:${port}`;

			this.logInfo("Development mode detected, connecting to auth emulator", {
				operation: "emulator_setup",
				emulator: { host, port }
			});

			try {
				// Attempt to connect to emulator, ignoring errors if already connected
				connectAuthEmulator(this.authInstance, emulatorUrl, { disableWarnings: true });
				this.logInfo("Successfully connected to Auth emulator", {
					operation: "emulator_setup",
					emulator: { host, port }
				});
			} catch (error: unknown) {
				// In Chrome test environment, emulator connection failures should not block the app
				this.logError("Failed to connect to emulator", {
					operation: "emulator_setup",
					emulator: { host, port },
					error: {
						message: error instanceof Error ? error.message : String(error)
					}
				});
				this.logWarn("Continuing without emulator for Chrome testing compatibility");
			}
		} else {
			this.logInfo("Production mode, using production Auth", {
				operation: "emulator_setup"
			});
		}
	}

	getAuthInstance(): Auth {
		this.assertInitialized("getAuthInstance()");
		if (!this.authInstance) {
			throw new Error("Auth instance not available");
		}
		return this.authInstance;
	}

	isReady(): boolean {
		return this.initialized && !!this.authInstance;
	}
}

const authService = new AuthWebService();

export function initAuth(): void {
	authService.init();
}

export function getAuthInstance(): Auth {
	return authService.getAuthInstance();
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
