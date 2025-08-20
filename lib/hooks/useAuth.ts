import { useState, useEffect } from "react";
import { Platform } from "react-native";

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

// Platform-specific imports
const getAuthFunctions = (): any => {
	if (Platform.OS === "web") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("../data/firebase/auth.web");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("../data/firebase/auth.native");
	}
};

export function useAuth() {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		loading: true,
		error: null,
	});

	useEffect(() => {
		const authFunctions = getAuthFunctions();
		
		// Initialize auth
		authFunctions.initAuth();

		// Set up auth state listener
		const unsubscribe = Platform.OS === "web" 
			? authFunctions.onAuthStateChangedWeb((user: any) => {
				setAuthState({
					user: user ? {
						uid: user.uid,
						email: user.email,
						isAnonymous: user.isAnonymous,
					} : null,
					loading: false,
					error: null,
				});
			})
			: authFunctions.onAuthStateChangedNative((user: any) => {
				setAuthState({
					user: user ? {
						uid: user.uid,
						email: user.email,
						isAnonymous: user.isAnonymous,
					} : null,
					loading: false,
					error: null,
				});
			});

		return unsubscribe;
	}, []);

	const signInAnonymously = async (): Promise<void> => {
		try {
			const authFunctions = getAuthFunctions();
			setAuthState(prev => ({ ...prev, loading: true, error: null }));
			if (Platform.OS === "web") {
				await authFunctions.signInAnonymouslyWeb();
			} else {
				await authFunctions.signInAnonymouslyNative();
			}
		} catch (error: any) {
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