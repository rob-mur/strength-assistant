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

  // Only show auth screen if user explicitly needs to authenticate
  // Remove complex timeout logic - let the auth hook handle state completely
  useEffect(() => {
    // Reset forceShowAuth when we have a user (auth completed successfully)
    if (user && forceShowAuth) {
      console.log("🔍 AuthAwareLayout - Auth completed, clearing forceShowAuth");
      setForceShowAuth(false);
    }
  }, [user, forceShowAuth]);

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
