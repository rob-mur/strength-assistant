import React, { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";
import RootLayout from "@/app/_layout";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";

// Create a mock Stack component with Screen property
const MockScreen = jest.fn(() => null);
const MockStack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MockStack.Screen = MockScreen;

jest.mock("expo-router", () => ({
  Stack: MockStack,
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  it.skip("should render the layout with light theme when color scheme is light", () => {
    // TODO: Fix Stack.Screen mocking issue
    (useAppInit as jest.Mock).mockReturnValue(true);
    (useColorScheme as jest.Mock).mockReturnValue("light");
    render(<RootLayout />);
    expect(screen.getByTestId("root-layout-nav")).toBeTruthy();
    expect(PaperProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: MD3LightTheme,
      }),
      {}
    );
  });

  it.skip("should render the layout with dark theme when color scheme is dark", () => {
    // TODO: Fix Stack.Screen mocking issue
    (useAppInit as jest.Mock).mockReturnValue(true);
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    render(<RootLayout />);
    expect(screen.getByTestId("root-layout-nav")).toBeTruthy();
    expect(PaperProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: MD3DarkTheme,
      }),
      {}
    );
  });

  it.skip("should configure the stack navigator correctly", () => {
    // TODO: Fix Stack.Screen mocking issue
    (useAppInit as jest.Mock).mockReturnValue(true);
    (useColorScheme as jest.Mock).mockReturnValue("light");
    render(<RootLayout />);
    expect(MockScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "(tabs)",
        options: { headerShown: false },
      }),
      {}
    );
  });
});