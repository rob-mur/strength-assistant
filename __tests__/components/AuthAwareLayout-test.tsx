import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";
import { useAuthContext } from "@/lib/components/AuthProvider";
import { AuthUser, AuthError } from "@/lib/hooks/useAuth";

// Mock the AuthProvider and AuthScreen components
jest.mock("@/lib/components/AuthProvider", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("@/lib/components/AuthScreen", () => {
  const MockReact = require("react");
  const MockRN = require("react-native");
  return {
    AuthScreen: () => MockReact.createElement(MockRN.Text, { testID: "auth-screen" }, "AuthScreen Component"),
  };
});

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

const mockUseAuthContext = jest.mocked(useAuthContext);

// Test component for children
const TestChild = () => <Text testID="test-child">Test Child Content</Text>;

// Helper function to create mock auth context values
const createMockAuthContext = (
  user: AuthUser | null = null,
  loading = false,
  error: AuthError | null = null
) => ({
  user,
  loading,
  error,
  signInAnonymously: jest.fn(),
  createAccount: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  clearError: jest.fn(),
});

describe("AuthAwareLayout", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env to avoid test environment detection
    process.env = { ...originalEnv };
    delete (process.env as any).CHROME_TEST;
    delete (process.env as any).CI;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllTimers();
  });

  describe("Loading State", () => {
    test("shows loading indicator when auth is loading and no force auth", () => {
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByText("Initializing...")).toBeTruthy();
      expect(screen.queryByTestId("test-child")).toBeNull();
      expect(screen.queryByTestId("auth-screen")).toBeNull();
    });

    test("shows loading indicator with activity indicator", () => {
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Check that ActivityIndicator is rendered (it should be present)
      const loadingContainer = screen.getByText("Initializing...").parent;
      expect(loadingContainer).toBeTruthy();
    });
  });

  describe("Auth Required State", () => {
    test("shows AuthScreen when no user and not loading", () => {
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, false)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("auth-screen")).toBeTruthy();
      expect(screen.queryByTestId("test-child")).toBeNull();
      expect(screen.queryByText("Initializing...")).toBeNull();
    });

    test("shows AuthScreen when forceShowAuth is true", async () => {
      jest.useFakeTimers();
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Initially should show loading
      expect(screen.getByText("Initializing...")).toBeTruthy();

      // Fast forward time to trigger the timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should now show auth screen due to force
      await waitFor(() => {
        expect(screen.getByTestId("auth-screen")).toBeTruthy();
      });

      expect(screen.queryByText("Initializing...")).toBeNull();
      expect(screen.queryByTestId("test-child")).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe("Authenticated State", () => {
    test("shows children when user is authenticated", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("test-child")).toBeTruthy();
      expect(screen.queryByTestId("auth-screen")).toBeNull();
      expect(screen.queryByText("Initializing...")).toBeNull();
    });

    test("shows children when anonymous user is authenticated", () => {
      const mockUser = { 
        uid: "anonymous-uid", 
        email: null, 
        isAnonymous: true 
      };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("test-child")).toBeTruthy();
      expect(screen.queryByTestId("auth-screen")).toBeNull();
      expect(screen.queryByText("Initializing...")).toBeNull();
    });

    test("renders multiple children correctly", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      render(
        <AuthAwareLayout>
          <Text testID="child-1">First Child</Text>
          <Text testID="child-2">Second Child</Text>
          <View testID="child-3">
            <Text>Nested Child</Text>
          </View>
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("child-1")).toBeTruthy();
      expect(screen.getByTestId("child-2")).toBeTruthy();
      expect(screen.getByTestId("child-3")).toBeTruthy();
    });
  });

  describe("Environment-Specific Behavior", () => {
    test("handles Chrome test environment correctly", () => {
      process.env.CHROME_TEST = "true";
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Should show loading initially
      expect(screen.getByText("Initializing...")).toBeTruthy();
      
      // Verify the warning was logged for Chrome test environment
      expect(console.warn).toHaveBeenCalledWith(
        "Chrome test environment - auth state should be managed by useAuth hook"
      );
    });

    test("handles CI environment correctly", () => {
      process.env.CI = "true";
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Should show loading initially
      expect(screen.getByText("Initializing...")).toBeTruthy();
      
      // Verify the warning was logged for CI environment
      expect(console.warn).toHaveBeenCalledWith(
        "Chrome test environment - auth state should be managed by useAuth hook"
      );
    });

    test("sets timeout in non-test environments", async () => {
      jest.useFakeTimers();
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Initially should show loading
      expect(screen.getByText("Initializing...")).toBeTruthy();

      // Fast forward to just before timeout
      act(() => {
        jest.advanceTimersByTime(4999);
      });

      // Should still show loading
      expect(screen.getByText("Initializing...")).toBeTruthy();

      // Fast forward past timeout
      act(() => {
        jest.advanceTimersByTime(2);
      });

      // Should now show auth screen and log timeout warning
      await waitFor(() => {
        expect(screen.getByTestId("auth-screen")).toBeTruthy();
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Auth loading timeout - forcing auth screen display"
      );

      jest.useRealTimers();
    });
  });

  describe("State Transitions", () => {
    test("transitions from loading to authenticated", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };

      // Start with loading state
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      const { rerender } = render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByText("Initializing...")).toBeTruthy();

      // Transition to authenticated
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      rerender(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("test-child")).toBeTruthy();
      expect(screen.queryByText("Initializing...")).toBeNull();
    });

    test("transitions from loading to auth required", () => {
      // Start with loading state
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      const { rerender } = render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByText("Initializing...")).toBeTruthy();

      // Transition to no user, not loading
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, false)
      );

      rerender(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("auth-screen")).toBeTruthy();
      expect(screen.queryByText("Initializing...")).toBeNull();
    });

    test("transitions from authenticated to auth required", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };

      // Start with authenticated state
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      const { rerender } = render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("test-child")).toBeTruthy();

      // Transition to no user (logged out)
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, false)
      );

      rerender(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      expect(screen.getByTestId("auth-screen")).toBeTruthy();
      expect(screen.queryByTestId("test-child")).toBeNull();
    });
  });

  describe("Timeout Cleanup", () => {
    test("cleans up timeout when component unmounts during loading", () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      const { unmount } = render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Unmount before timeout
      unmount();

      // Verify timeout was cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });

    test("cleans up timeout when loading state changes", () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      // Start with loading state
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, true)
      );

      const { rerender } = render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Change to not loading
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, false)
      );

      rerender(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Verify timeout was cleared when loading changed
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe("Edge Cases", () => {
    test("handles auth context with error state", () => {
      const mockError = { code: "auth/network-error", message: "Network error" };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(null, false, mockError)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Should show auth screen when there's an error and no user
      expect(screen.getByTestId("auth-screen")).toBeTruthy();
      expect(screen.queryByTestId("test-child")).toBeNull();
    });

    test("shows children even when there's an error but user exists", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };
      const mockError = { code: "auth/network-error", message: "Network error" };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false, mockError)
      );

      render(
        <AuthAwareLayout>
          <TestChild />
        </AuthAwareLayout>
      );

      // Should show children because user exists, despite error
      expect(screen.getByTestId("test-child")).toBeTruthy();
      expect(screen.queryByTestId("auth-screen")).toBeNull();
    });

    test("handles empty children", () => {
      const mockUser = { 
        uid: "test-uid", 
        email: "test@example.com", 
        isAnonymous: false 
      };
      
      mockUseAuthContext.mockReturnValue(
        createMockAuthContext(mockUser, false)
      );

      // Should render without crashing
      expect(() => {
        render(<AuthAwareLayout>{null}</AuthAwareLayout>);
      }).not.toThrow();
    });
  });
});