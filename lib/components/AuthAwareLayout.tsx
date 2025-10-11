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

  console.log(
    "🔒 AuthAwareLayout - user:",
    user ? "authenticated" : "not authenticated",
    "loading:",
    loading,
    "forceShowAuth:",
    forceShowAuth,
  );

  // Show auth screen appropriately for different environments
  useEffect(() => {
    if (!loading) {
      return;
    }

    // Debug: Log environment variables to understand what's available at runtime
    console.log("🔍 AuthAwareLayout environment debug:", {
      "process.env.CI": process.env.CI,
      "process.env.CHROME_TEST": process.env.CHROME_TEST,
      "process.env.EXPO_PUBLIC_CHROME_TEST": process.env.EXPO_PUBLIC_CHROME_TEST,
      "process.env.NODE_ENV": process.env.NODE_ENV,
    });

    // In test environments, let auth hook handle state - don't force auth screen
    const isTestEnvironment =
      process.env.CHROME_TEST === "true" ||
      process.env.EXPO_PUBLIC_CHROME_TEST === "true" ||
      process.env.CI === "true" ||
      process.env.NODE_ENV === "test";

    console.log("🔍 AuthAwareLayout - isTestEnvironment:", isTestEnvironment);

    if (isTestEnvironment) {
      // Let the useAuth hook handle the state completely in test environments
      // This prevents premature auth screen forcing before fallback auth completes
      console.log("🔍 AuthAwareLayout - Test environment detected, skipping timeout");
      return;
    }

    // Only set timeout for production/development environments
    const timeout = setTimeout(() => {
      setForceShowAuth(true);
    }, 5000); // 5 seconds timeout for normal environments

    return () => clearTimeout(timeout);
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
