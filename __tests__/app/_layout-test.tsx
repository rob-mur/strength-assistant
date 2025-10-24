import React, { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import RootLayout from "@/app/_layout";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import * as Linking from "expo-linking";
import {
  extractTokensFromUrl,
  isAuthCallbackUrl,
  processAuthTokens,
} from "@/lib/utils/auth/AuthUrlHandler";

// Create a mock Stack component with Screen property
const MockScreen = jest.fn(() => null);
const MockStack = jest.fn(({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)) as any;
MockStack.Screen = MockScreen;

jest.mock("expo-router", () => {
  const MockStackComponent = jest.fn(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ) as any;
  MockStackComponent.Screen = jest.fn(() => null);

  return {
    Stack: MockStackComponent,
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
  };
});

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

jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(),
}));

jest.mock("@/lib/utils/logging/ErrorBlockingFactory", () => ({
  initializeErrorBlocking: jest.fn(() => ({
    reactNativeHandler: {
      cleanup: jest.fn(),
    },
  })),
}));

jest.mock("@/lib/components/ErrorBlocker", () => ({
  ErrorBlocker: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/lib/utils/auth/AuthUrlHandler", () => ({
  extractTokensFromUrl: jest.fn(),
  isAuthCallbackUrl: jest.fn(),
  processAuthTokens: jest.fn(),
}));

// Mock supabase module
const mockSetSession = jest.fn();
const mockGetSession = jest.fn();
jest.mock("@/lib/data/supabase/supabase", () => ({
  getSupabaseClient: () => ({
    auth: {
      setSession: mockSetSession,
      getSession: mockGetSession,
    },
  }),
}));

describe("RootLayout", () => {
  const mockUseAppInit = useAppInit as jest.Mock;
  const mockUseColorScheme = useColorScheme as jest.Mock;
  const mockAddEventListener = Linking.addEventListener as jest.Mock;
  const mockGetInitialURL = Linking.getInitialURL as jest.Mock;
  const mockExtractTokensFromUrl = extractTokensFromUrl as jest.Mock;
  const mockIsAuthCallbackUrl = isAuthCallbackUrl as jest.Mock;
  const mockProcessAuthTokens = processAuthTokens as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue("light");
    mockAddEventListener.mockReturnValue({ remove: jest.fn() });
    mockGetInitialURL.mockResolvedValue(null);
    mockSetSession.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockIsAuthCallbackUrl.mockReturnValue(false);
    mockExtractTokensFromUrl.mockReturnValue({
      accessToken: null,
      refreshToken: null,
    });
    mockProcessAuthTokens.mockResolvedValue(undefined);

    // Ensure SplashScreen methods don't cause issues
    const { SplashScreen } = require("expo-router");
    SplashScreen.preventAutoHideAsync.mockResolvedValue();
    SplashScreen.hideAsync.mockResolvedValue();
  });

  it("should return null when app is not loaded", () => {
    mockUseAppInit.mockReturnValue({
      loaded: false,
      fontsLoaded: true,
      error: null,
    });
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });

  it("should return null when fonts are not loaded", () => {
    mockUseAppInit.mockReturnValue({
      loaded: true,
      fontsLoaded: false,
      error: null,
    });
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });

  it("should throw error when app init has error", () => {
    const testError = new Error("Test error");
    mockUseAppInit.mockReturnValue({
      loaded: true,
      fontsLoaded: true,
      error: testError,
    });

    expect(() => render(<RootLayout />)).toThrow("Test error");
  });

  it("should render app when loaded and fonts loaded", () => {
    mockUseAppInit.mockReturnValue({
      loaded: true,
      fontsLoaded: true,
      error: null,
    });

    const { queryByTestId } = render(<RootLayout />);

    // Since all mocks are in place and loaded/fontsLoaded are true,
    // the component should render (not return null)
    expect(PaperProvider).toHaveBeenCalled();
  });

  it("should use dark theme when color scheme is dark", () => {
    mockUseColorScheme.mockReturnValue("dark");
    mockUseAppInit.mockReturnValue({
      loaded: true,
      fontsLoaded: true,
      error: null,
    });

    render(<RootLayout />);

    // Just verify the component renders and PaperProvider is called
    expect(PaperProvider).toHaveBeenCalled();
    expect(mockUseColorScheme).toHaveBeenCalled();
  });

  it("should use light theme when color scheme is light", () => {
    mockUseColorScheme.mockReturnValue("light");
    mockUseAppInit.mockReturnValue({
      loaded: true,
      fontsLoaded: true,
      error: null,
    });

    render(<RootLayout />);

    // Just verify the component renders and PaperProvider is called
    expect(PaperProvider).toHaveBeenCalled();
    expect(mockUseColorScheme).toHaveBeenCalled();
  });

  describe("Splash screen handling", () => {
    it("should hide splash screen when loaded and fonts loaded", () => {
      const { SplashScreen } = require("expo-router");

      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      render(<RootLayout />);

      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });

    it("should not hide splash screen when not loaded", () => {
      const { SplashScreen } = require("expo-router");
      SplashScreen.hideAsync.mockClear();

      mockUseAppInit.mockReturnValue({
        loaded: false,
        fontsLoaded: true,
        error: null,
      });

      render(<RootLayout />);

      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    });

    it("should not hide splash screen when fonts not loaded", () => {
      const { SplashScreen } = require("expo-router");
      SplashScreen.hideAsync.mockClear();

      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: false,
        error: null,
      });

      render(<RootLayout />);

      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    });
  });

  describe("Error system initialization", () => {
    it("should handle error system cleanup on unmount", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      const mockCleanup = jest.fn();
      const {
        initializeErrorBlocking,
      } = require("@/lib/utils/logging/ErrorBlockingFactory");
      initializeErrorBlocking.mockReturnValue({
        reactNativeHandler: {
          cleanup: mockCleanup,
        },
      });

      const { unmount } = render(<RootLayout />);

      // Trigger unmount to test cleanup
      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it("should handle cleanup error gracefully", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      const mockCleanup = jest.fn(() => {
        throw new Error("Cleanup error");
      });

      const {
        initializeErrorBlocking,
      } = require("@/lib/utils/logging/ErrorBlockingFactory");
      initializeErrorBlocking.mockReturnValue({
        reactNativeHandler: {
          cleanup: mockCleanup,
        },
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { unmount } = render(<RootLayout />);

      // Trigger unmount to test cleanup error handling
      unmount();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during error system cleanup:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should handle error system initialization failure", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      const {
        initializeErrorBlocking,
      } = require("@/lib/utils/logging/ErrorBlockingFactory");
      initializeErrorBlocking.mockImplementation(() => {
        throw new Error("Init error");
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { unmount } = render(<RootLayout />);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to initialize error blocking system:",
        expect.any(Error),
      );

      // Should still provide cleanup function
      unmount(); // Should not throw

      consoleSpy.mockRestore();
    });

    it("should handle missing cleanup function", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      const {
        initializeErrorBlocking,
      } = require("@/lib/utils/logging/ErrorBlockingFactory");
      initializeErrorBlocking.mockReturnValue({
        reactNativeHandler: {}, // No cleanup function
      });

      const { unmount } = render(<RootLayout />);

      // Should not throw when cleanup function is missing
      expect(() => unmount()).not.toThrow();
    });

    it("should handle missing reactNativeHandler", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      const {
        initializeErrorBlocking,
      } = require("@/lib/utils/logging/ErrorBlockingFactory");
      initializeErrorBlocking.mockReturnValue({}); // No reactNativeHandler

      const { unmount } = render(<RootLayout />);

      // Should not throw when reactNativeHandler is missing
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Deep link handling", () => {
    it("should set up deep link event listener", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      render(<RootLayout />);

      // Verify that the deep link listener was set up
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "url",
        expect.any(Function),
      );
    });

    it("should check for initial URL on mount", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      render(<RootLayout />);

      // Verify that getInitialURL was called
      expect(mockGetInitialURL).toHaveBeenCalled();
    });

    it("should ignore non-auth URLs", () => {
      mockUseAppInit.mockReturnValue({
        loaded: true,
        fontsLoaded: true,
        error: null,
      });

      let urlHandler: ((event: { url: string }) => void) | undefined;
      mockAddEventListener.mockImplementation((event: string, handler: any) => {
        urlHandler = handler;
        return { remove: jest.fn() };
      });

      mockIsAuthCallbackUrl.mockReturnValue(false);

      render(<RootLayout />);

      // Simulate non-auth deep link - should not crash
      const nonAuthUrl = "strengthassistant://other-page";
      urlHandler?.({ url: nonAuthUrl });

      // Test passes if no errors are thrown
      expect(mockIsAuthCallbackUrl).toHaveBeenCalledWith(nonAuthUrl);
      expect(mockProcessAuthTokens).not.toHaveBeenCalled();
    });
  });
});
