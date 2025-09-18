import React, { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";
import RootLayout from "@/app/_layout";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";

// Create a mock Stack component with Screen property
const MockScreen = jest.fn(() => null);
const MockStack = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
MockStack.Screen = MockScreen;

jest.mock("expo-router", () => ({
  Stack: MockStack,
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    canDismiss: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("react-native-paper", () => {
  const RNP = jest.requireActual("react-native-paper");
  return {
    ...RNP,
    PaperProvider: jest.fn(({ children }: { children: ReactNode }) => (
      <>{children}</>
    )),
  };
});

jest.mock("@/lib/hooks/useAppInit", () => ({
  useAppInit: jest.fn(),
}));

jest.mock("@/lib/components/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/lib/components/AuthAwareLayout", () => ({
  AuthAwareLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.useColorScheme = jest.fn();
  return RN;
});

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when app is not ready", () => {
    (useAppInit as jest.Mock).mockReturnValue(false);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });
});
