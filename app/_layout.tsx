import { SplashScreen, Stack } from "expo-router";
import React from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import handleErrors from "./error";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { AuthProvider } from "@/lib/components/AuthProvider";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";

// Web-specific icon loading - CSS-based Material Design Icons
if (typeof window !== 'undefined') {
  // Load Material Design Icons CSS for web platform
  // This replaces problematic TTF font loading with CSS-based icons
  const iconCSS = [
    'https://fonts.googleapis.com/css2?family=Material+Icons&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined&display=swap',
    'https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css'
  ];
  
  iconCSS.forEach(cssUrl => {
    // Check if already loaded to prevent duplicates
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement('link');
      link.href = cssUrl;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      // Add display=swap for better performance
      if (cssUrl.includes('fonts.googleapis.com') && !cssUrl.includes('display=swap')) {
        link.href += cssUrl.includes('?') ? '&display=swap' : '?display=swap';
      }
      document.head.appendChild(link);
    }
  });
}

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from "expo-router";

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = { initialRouteName: "(tabs)" };

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Catch any errors in test mode so maestro properly crashes
handleErrors();

const RootLayout = () => {
  const isReady = useAppInit();
  const colorScheme = useColorScheme();

  if (!isReady) {
    return null;
  }

  return (
    <PaperProvider
      theme={colorScheme === "light" ? MD3LightTheme : MD3DarkTheme}
    >
      <AuthProvider>
        <AuthAwareLayout>
          <RootLayoutNav />
        </AuthAwareLayout>
      </AuthProvider>
    </PaperProvider>
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
