import "react-native-get-random-values";
import { SplashScreen, Stack } from "expo-router";
import React, { useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import * as Linking from "expo-linking";

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

  // Handle deep links for auth verification
  useEffect(() => {
    const handleURL = async (url: string) => {
      console.log("🔗 Received deep link:", url);

      // Check if this is an auth callback URL
      if (
        url.includes("strengthassistant://auth-callback") ||
        (url.includes("strengthassistant://") &&
          (url.includes("access_token") || url.includes("refresh_token")))
      ) {
        console.log("🔗 Processing auth callback from email verification");

        try {
          // Import supabase client dynamically to avoid circular dependencies
          const { getSupabaseClient } = await import(
            "@/lib/data/supabase/supabase"
          );
          const supabase = getSupabaseClient();

          // Supabase uses URL fragments (#) instead of query parameters (?)
          // Extract tokens from either the hash fragment or query parameters
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // Check for tokens in URL fragment (after #)
          if (url.includes("#")) {
            const fragmentPart = url.split("#")[1];
            const fragmentParams = new URLSearchParams(fragmentPart);
            accessToken = fragmentParams.get("access_token");
            refreshToken = fragmentParams.get("refresh_token");
          }

          // Fallback: check for tokens in query parameters (after ?)
          if (!accessToken && url.includes("?")) {
            const urlObj = new URL(url);
            accessToken = urlObj.searchParams.get("access_token");
            refreshToken = urlObj.searchParams.get("refresh_token");
          }

          if (accessToken && refreshToken) {
            console.log("🔗 Found auth tokens in URL, setting session");

            // Set the session using the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error(
                "🔗 Error setting session from auth callback:",
                error,
              );
            } else {
              console.log(
                "🔗 Auth callback processed successfully - user should be signed in",
              );
            }
          } else {
            console.log(
              "🔗 No auth tokens found in callback URL, checking current session",
            );
            // Fallback: refresh current session to see if auth state changed
            await supabase.auth.getSession();
          }
        } catch (error) {
          console.error("🔗 Failed to process auth callback:", error);
        }
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleURL(url),
    );

    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleURL(url);
      }
    });

    return () => subscription?.remove();
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
