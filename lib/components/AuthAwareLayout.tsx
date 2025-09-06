import React, { ReactNode, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useAuthContext } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";

interface AuthAwareLayoutProps {
	children: ReactNode;
}

export function AuthAwareLayout({ children }: AuthAwareLayoutProps) {
	const { user, loading } = useAuthContext();
	const [forceShowAuth, setForceShowAuth] = useState(false);

	// Timeout mechanism for Chrome testing - if loading takes too long, show auth screen
	useEffect(() => {
		if (loading) {
			const timeout = setTimeout(() => {
				console.warn("Auth loading timeout - forcing auth screen display for Chrome testing");
				setForceShowAuth(true);
			}, 10000); // 10 second timeout

			return () => clearTimeout(timeout);
		}
	}, [loading]);

	if (loading && !forceShowAuth) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
				<Text style={styles.loadingText}>Initializing...</Text>
			</View>
		);
	}

	if (!user || forceShowAuth) {
		return <AuthScreen />;
	}

	return <>{children}</>;
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 16,
		textAlign: "center",
	},
});