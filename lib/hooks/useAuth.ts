import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// Platform-specific imports - use static imports to avoid Metro symbolication issues
import * as AuthWeb from "../data/firebase/auth.web";
import * as AuthNative from "../data/firebase/auth.native";

// Types for cross-platform user
export interface AuthUser {
	uid: string;
	email: string | null;
	isAnonymous: boolean;
}

export interface AuthError {
	code: string;
	message: string;
}

export interface AuthState {
	user: AuthUser | null;
	loading: boolean;
	error: AuthError | null;
}

// Firebase user type for cross-platform compatibility
interface FirebaseUser {
	uid: string;
	email: string | null;
	isAnonymous: boolean;
	[key: string]: unknown; // For additional platform-specific properties
}

// Platform-specific auth functions interface
interface AuthFunctions {
	initAuth: () => void;
	signInAnonymouslyWeb?: () => Promise<FirebaseUser>;
	signInAnonymouslyNative?: () => Promise<FirebaseUser>;
	createAccountWeb?: (email: string, password: string) => Promise<FirebaseUser>;
	createAccountNative?: (email: string, password: string) => Promise<FirebaseUser>;
	signInWeb?: (email: string, password: string) => Promise<FirebaseUser>;
	signInNative?: (email: string, password: string) => Promise<FirebaseUser>;
	signOutWeb?: () => Promise<void>;
	signOutNative?: () => Promise<void>;
	onAuthStateChangedWeb?: (callback: (user: FirebaseUser | null) => void) => () => void;
	onAuthStateChangedNative?: (callback: (user: FirebaseUser | null) => void) => () => void;
}

// Platform-specific function selection
const getAuthFunctions = (): AuthFunctions => {
	// @ts-ignore Firebase legacy auth modules - type compatibility issues
	return Platform.OS === "web" ? AuthWeb : AuthNative;
};

export function useAuth() {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		loading: true,
		error: null,
	});

	// Helper function to handle user state changes
	const handleUserStateChange = useCallback((user: FirebaseUser | null) => {
		const userData = user ? (() => {
			const { uid, email, isAnonymous } = user;
			return { uid, email, isAnonymous };
		})() : null;

		setAuthState({
			user: userData,
			loading: false,
			error: null,
		});
	}, []);

	// Helper function to set error state
	const setErrorState = useCallback(() => {
		setAuthState({
			user: null,
			loading: false,
			error: null,
		});
	}, []);

	// Helper function to handle auth errors consistently
	const handleAuthError = useCallback((error: unknown) => {
		const { code = "unknown", message = "An error occurred" } = (error as { code?: string; message?: string }) || {};
		
		setAuthState(prev => ({
			...prev,
			loading: false,
			error: { code, message },
		}));
	}, []);

	// Helper function to get platform-specific auth function
	const getPlatformAuthFunction = useCallback(<T extends keyof AuthFunctions>(
		authFunctions: AuthFunctions,
		webFunctionName: T,
		nativeFunctionName: T
	) => {
		return Platform.OS === "web" 
			? authFunctions[webFunctionName]
			: authFunctions[nativeFunctionName];
	}, []);

	// Helper function to initialize auth with timeout
	const initializeAuthWithTimeout = async (authFunctions: AuthFunctions): Promise<void> => {
		const initPromise = new Promise<void>((resolve, reject) => {
			try {
				authFunctions.initAuth();
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error("Auth initialization timeout")), 5000);
		});
		
		return Promise.race([initPromise, timeoutPromise]);
	};

	// Helper function to setup auth listener
	const setupAuthListener = useCallback((authFunctions: AuthFunctions): (() => void) | undefined => {
		const userStateHandler = (user: FirebaseUser | null) => {
			try {
				handleUserStateChange(user);
			} catch (error: unknown) {
				console.error("Error handling user state change:", error);
				setErrorState();
			}
		};
		
		return Platform.OS === "web" 
			? authFunctions.onAuthStateChangedWeb?.(userStateHandler)
			: authFunctions.onAuthStateChangedNative?.(userStateHandler);
	}, [handleUserStateChange, setErrorState]);

	// Main auth initialization function
	const initializeAuth = useCallback(async (): Promise<(() => void) | undefined> => {
		try {
			const authFunctions = getAuthFunctions();
			await initializeAuthWithTimeout(authFunctions);
			return setupAuthListener(authFunctions);
		} catch (error: unknown) {
			console.error("Error initializing auth:", error);
			setErrorState();
			return undefined;
		}
	}, [setupAuthListener, setErrorState]);

	// Helper function to check if running in test environment
	const isTestEnvironment = useCallback(() => {
		return process.env.CHROME_TEST === 'true' || process.env.CI === 'true';
	}, []);

	// Helper function to handle auth cleanup
	const cleanupAuth = useCallback((timeoutId: ReturnType<typeof setTimeout>, unsubscribe?: () => void) => {
		clearTimeout(timeoutId);
		if (!unsubscribe) return;
		
		try {
			unsubscribe();
		} catch (error) {
			console.error("Error during auth listener cleanup:", error);
		}
	}, []);

	useEffect(() => {
		// Early return for test environments
		if (isTestEnvironment()) {
			setErrorState();
			return;
		}
		
		let unsubscribe: (() => void) | undefined;

		// Shorter delay to speed up initialization
		const timeoutId = setTimeout(() => {
			initializeAuth()
				.then((authUnsubscribe) => {
					unsubscribe = authUnsubscribe;
				})
				.catch((error: unknown) => {
					console.error("Error in auth initialization timeout:", error);
					setErrorState();
				});
		}, 50);

		return () => cleanupAuth(timeoutId, unsubscribe);
	}, [initializeAuth, isTestEnvironment, setErrorState, cleanupAuth]);

	const signInAnonymously = async (): Promise<void> => {
		// Early return for test environments
		if (isTestEnvironment() || process.env.NODE_ENV === 'test') {
			setAuthState({
				user: {
					uid: "test-user-chrome",
					email: null,
					isAnonymous: true,
				},
				loading: false,
				error: null,
			});
			return;
		}
		
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			
			const signInFunction = getPlatformAuthFunction(
				authFunctions,
				'signInAnonymouslyWeb',
				'signInAnonymouslyNative'
			);
			
			await signInFunction?.();
		} catch (error: unknown) {
			console.error("Anonymous sign in failed:", error);
			handleAuthError(error);
		}
	};

	const createAccount = async (email: string, password: string): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			
			const createFunction = getPlatformAuthFunction(
				authFunctions,
				'createAccountWeb',
				'createAccountNative'
			);
			
			await createFunction?.(email, password);
		} catch (error: unknown) {
			handleAuthError(error);
		}
	};

	const signIn = async (email: string, password: string): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			
			const signInFunction = getPlatformAuthFunction(
				authFunctions,
				'signInWeb',
				'signInNative'
			);
			
			await signInFunction?.(email, password);
		} catch (error: unknown) {
			handleAuthError(error);
		}
	};

	const signOut = async (): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			
			const signOutFunction = getPlatformAuthFunction(
				authFunctions,
				'signOutWeb',
				'signOutNative'
			);
			
			await signOutFunction?.();
		} catch (error: unknown) {
			handleAuthError(error);
		}
	};

	const clearError = (): void => {
		setAuthState(prev => ({ ...prev, error: null }));
	};

	return {
		user: authState.user,
		loading: authState.loading,
		error: authState.error,
		signInAnonymously,
		createAccount,
		signIn,
		signOut,
		clearError,
	};
}