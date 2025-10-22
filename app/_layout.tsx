import "react-native-get-random-values";
import { SplashScreen, Stack } from "expo-router";
import React, { useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";

import { useAppInit } from "@/lib/hooks/useAppInit";
import { AuthProvider } from "@/lib/components/AuthProvider";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";
import { ErrorBlocker } from "@/lib/components/ErrorBlocker";
import { initializeErrorBlocking } from "@/lib/utils/logging/ErrorBlockingFactory";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from "expo-router";

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = { initialRouteName: "(tabs)" };

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Debug: Basic console log to verify app is running
console.log("🚀 App starting - RootLayout loading");

const RootLayout = () => {
  const { loaded, fontsLoaded, error } = useAppInit();
  const colorScheme = useColorScheme();

  // Initialize simple error blocking system
  useEffect(() => {
    try {
      const errorSystem = initializeErrorBlocking({
        enabled: true,
        showErrorDetails: false, // Keep false for production
        enableConsoleLogging: true,
      });

      console.log("✅ Simple error blocking system initialized");

      return () => {
        // Cleanup on unmount (for testing)
        try {
          if (errorSystem?.reactNativeHandler?.cleanup) {
            errorSystem.reactNativeHandler.cleanup();
          }
        } catch (cleanupError) {
          console.warn("Error during error system cleanup:", cleanupError);
        }
      };
    } catch (initError) {
      console.warn("Failed to initialize error blocking system:", initError);
      return () => {}; // Return empty cleanup function on error
    }
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontsLoaded]);

  if (!loaded || !fontsLoaded) {
    return null;
  }

  return (
    <ErrorBlocker>
      <PaperProvider
        theme={colorScheme === "light" ? MD3LightTheme : MD3DarkTheme}
      >
        <AuthProvider>
          <AuthAwareLayout>
            <RootLayoutNav />
          </AuthAwareLayout>
        </AuthProvider>
      </PaperProvider>
    </ErrorBlocker>
  );
};

const RootLayoutNav = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default RootLayout;
