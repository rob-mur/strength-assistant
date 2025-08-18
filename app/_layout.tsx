import { SplashScreen, Stack } from "expo-router";
import React from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import handleErrors from "./error";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { useAuth } from "@/lib/hooks/useAuth";
import AuthScreen from "./auth";

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
  const { user, loading } = useAuth();

  if (!isReady || loading) {
    return null;
  }

  return (
    <PaperProvider
      theme={colorScheme === "light" ? MD3LightTheme : MD3DarkTheme}
    >
      {user ? <RootLayoutNav /> : <AuthScreen />}
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
