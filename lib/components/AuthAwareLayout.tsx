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

  // Debug logging for auth state
  console.log("🔐 [AuthAwareLayout] Current auth state:", {
    userId: user?.uid || "null",
    loading,
    forceShowAuth,
  });

  // Show auth screen appropriately for different environments
  useEffect(() => {
    if (!loading) {
      return;
    }

    // In Chrome test environment, no need to force - auth hook already handles this
    // Priority: Chrome test environment overrides CI environment
    const isChromeTest =
      process.env.CHROME_TEST === "true" ||
      process.env.EXPO_PUBLIC_CHROME_TEST === "true";
    const isCITest =
      process.env.CI === "true" &&
      process.env.CHROME_TEST !== "true" &&
      process.env.EXPO_PUBLIC_CHROME_TEST !== "true";

    if (isChromeTest || isCITest) {
      console.warn(
        "Chrome test environment - auth state should be managed by useAuth hook",
      );
      // Let the useAuth hook handle the state, don't force anything here
      return;
    }

    // Normal timeout for other environments
    const timeout = setTimeout(() => {
      console.warn("Auth loading timeout - forcing auth screen display");
      setForceShowAuth(true);
    }, 5000); // 5 seconds timeout

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
