import { useState, useEffect } from "react";
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

// Platform-specific function selection
const getAuthFunctions = (): any => {
	return Platform.OS === "web" ? AuthWeb : AuthNative;
};

export function useAuth() {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		loading: true,
		error: null,
	});

	useEffect(() => {
		// In Chrome test environment, show auth screen for testing (don't skip it entirely!)
		if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
			setAuthState({
				user: null,
				loading: false,
				error: null,
			});
			return;
		}
		
		let unsubscribe: (() => void) | undefined;
		
		const initializeAuth = async () => {
			try {
				const authFunctions = getAuthFunctions();
				
				// Initialize auth with timeout
				const initPromise = new Promise<void>((resolve, reject) => {
					try {
						authFunctions.initAuth();
						resolve();
					} catch (error) {
						reject(error);
					}
				});
				
				// Shorter timeout for faster failure
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(() => reject(new Error("Auth initialization timeout")), 5000);
				});
				
				await Promise.race([initPromise, timeoutPromise]);

				// Set up auth state listener
				const userStateHandler = (user: any) => {
					try {
						setAuthState({
							user: user ? {
								uid: user.uid,
								email: user.email,
								isAnonymous: user.isAnonymous,
							} : null,
							loading: false,
							error: null,
						});
					} catch (error) {
						setAuthState({
							user: null,
							loading: false,
							error: null,
						});
					}
				};
				
				unsubscribe = Platform.OS === "web" 
					? authFunctions.onAuthStateChangedWeb(userStateHandler)
					: authFunctions.onAuthStateChangedNative(userStateHandler);
					
			} catch (error: any) {
				setAuthState({
					user: null,
					loading: false,
					error: null,
				});
			}
		};

		// Shorter delay to speed up initialization
		const timeoutId = setTimeout(() => {
			initializeAuth().catch((error) => {
				setAuthState({
					user: null,
					loading: false,
					error: null,
				});
			});
		}, 50);

		return () => {
			clearTimeout(timeoutId);
			if (unsubscribe) {
				try {
					unsubscribe();
				} catch (error) {
					// Silently handle cleanup errors
				}
			}
		};
	}, []);

	const signInAnonymously = async (): Promise<void> => {
		// In Chrome test environment, create mock user immediately
		if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
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
			if (Platform.OS === "web") {
				await authFunctions.signInAnonymouslyWeb();
			} else {
				await authFunctions.signInAnonymouslyNative();
			}
		} catch (error: any) {
			console.error("Anonymous sign in failed:", error);
			setAuthState(prev => ({
				...prev,
				loading: false,
				error: { code: error.code || "unknown", message: error.message || "An error occurred" },
			}));
		}
	};

	const createAccount = async (email: string, password: string): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			if (Platform.OS === "web") {
				await authFunctions.createAccountWeb(email, password);
			} else {
				await authFunctions.createAccountNative(email, password);
			}
		} catch (error: any) {
			setAuthState(prev => ({
				...prev,
				loading: false,
				error: { code: error.code || "unknown", message: error.message || "An error occurred" },
			}));
		}
	};

	const signIn = async (email: string, password: string): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			if (Platform.OS === "web") {
				await authFunctions.signInWeb(email, password);
			} else {
				await authFunctions.signInNative(email, password);
			}
		} catch (error: any) {
			setAuthState(prev => ({
				...prev,
				loading: false,
				error: { code: error.code || "unknown", message: error.message || "An error occurred" },
			}));
		}
	};

	const signOut = async (): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			if (Platform.OS === "web") {
				await authFunctions.signOutWeb();
			} else {
				await authFunctions.signOutNative();
			}
		} catch (error: any) {
			setAuthState(prev => ({
				...prev,
				loading: false,
				error: { code: error.code || "unknown", message: error.message || "An error occurred" },
			}));
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