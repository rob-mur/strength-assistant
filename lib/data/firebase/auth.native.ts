import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { FirebaseService } from "./firebase-core";

class AuthNativeService extends FirebaseService {
	private authInstance: FirebaseAuthTypes.Module | undefined;

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
			this.authInstance = auth();
			this.setupEmulator();
			this.initialized = true;
			
			this.logInfo("Auth initialization complete", { 
				operation: "init",
				duration: Date.now() - startTime 
			});
		} catch (error: any) {
			this.logError("Failed to initialize Firebase Auth", {
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
				this.authInstance.useEmulator(emulatorUrl);
				this.logInfo("Successfully connected to Auth emulator", {
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
				this.logWarn("Continuing with production Auth");
			}
		} else {
			this.logInfo("Production mode, using production Auth", {
				operation: "emulator_setup"
			});
		}
	}

	getAuthInstance(): FirebaseAuthTypes.Module {
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

const authService = new AuthNativeService();

export function initAuth(): void {
	authService.init();
}

export function getAuthInstance(): FirebaseAuthTypes.Module {
	return authService.getAuthInstance();
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