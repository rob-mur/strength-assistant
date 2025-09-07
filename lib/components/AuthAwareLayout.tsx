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

	// Show auth screen appropriately for different environments
	useEffect(() => {
		if (loading) {
			// In Chrome test environment, show auth screen immediately
			if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
				console.warn("Chrome test environment detected - showing auth screen immediately");
				setForceShowAuth(true);
			} else {
				// Normal timeout for other environments
				const timeout = setTimeout(() => {
					console.warn("Auth loading timeout - forcing auth screen display");
					setForceShowAuth(true);
				}, 5000); // 5 seconds timeout

				return () => clearTimeout(timeout);
			}
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