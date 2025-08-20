import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, AuthUser, AuthError } from "../hooks/useAuth";

interface AuthContextType {
	user: AuthUser | null;
	loading: boolean;
	error: AuthError | null;
	signInAnonymously: () => Promise<void>;
	createAccount: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const auth = useAuth();

	return (
		<AuthContext.Provider value={auth}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}