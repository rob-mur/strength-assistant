import { SplashScreen, Stack } from "expo-router";
import React from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import handleErrors from "./error";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { AuthProvider } from "@/lib/components/AuthProvider";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";

// Web-specific font loading for vector icons
if (typeof window !== 'undefined') {
  // Load Material Community Icons and other icon fonts for web
  const iconFonts = [
    'https://fonts.googleapis.com/css2?family=Material+Icons',
    'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined', 
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    'https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css'
  ];
  
  iconFonts.forEach(fontUrl => {
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
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
