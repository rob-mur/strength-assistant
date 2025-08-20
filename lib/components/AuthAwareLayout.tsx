import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useAuthContext } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";

interface AuthAwareLayoutProps {
	children: ReactNode;
}

export function AuthAwareLayout({ children }: AuthAwareLayoutProps) {
	const { user, loading } = useAuthContext();

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!user) {
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
});