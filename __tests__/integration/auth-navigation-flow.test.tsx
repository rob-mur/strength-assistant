/**
 * Integration test for authentication state and navigation flow
 *
 * This test reproduces the issue found in Android tests where:
 * 1. Authentication succeeds (user is signed in anonymously)
 * 2. But the UI doesn't transition from AuthScreen to main app
 *
 * Based on Android logs showing successful auth but UI stuck on auth screen.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuthContext } from "@/lib/components/AuthProvider";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";
import { Text, View } from "react-native";
import * as useAuthModule from "@/lib/hooks/useAuth";

// Mock the useAuth hook to simulate different auth states
const mockUseAuth = jest.fn();
jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock AuthScreen component
jest.mock("@/lib/components/AuthScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    AuthScreen: () =>
      React.createElement(Text, { testID: "auth-screen" }, "Sign In Screen"),
  };
});

// Mock environment variables
const originalEnv = process.env;

// Test component that represents the main app content
const MainAppContent = () => (
  <View testID="main-app">
    <Text testID="get-started">Get Started</Text>
  </View>
);

// Helper component to test auth context
const AuthContextTester = ({
  onAuthStateChange,
}: {
  onAuthStateChange: (state: any) => void;
}) => {
  const authContext = useAuthContext();
  React.useEffect(() => {
    onAuthStateChange(authContext);
  }, [authContext, onAuthStateChange]);
  return null;
};

describe("Authentication and Navigation Flow Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Initial Authentication State", () => {
    it("should show loading state when auth is loading", async () => {
      // Simulate initial loading state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText } = render(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      expect(getByText("Initializing...")).toBeTruthy();
    });

    it("should show auth screen when no user and not loading", async () => {
      // Simulate no user, not loading
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      expect(getByTestId("auth-screen")).toBeTruthy();
    });
  });

  describe("Authentication Success Flow", () => {
    it("should transition from auth screen to main app when user is authenticated", async () => {
      const mockSignInAnonymously = jest.fn();
      let authStateCallback: any;

      // Start with no user (auth screen should be shown)
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signInAnonymously: mockSignInAnonymously,
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByTestId, rerender, queryByTestId } = render(
        <AuthProvider>
          <AuthContextTester
            onAuthStateChange={(state) => {
              authStateCallback = state;
            }}
          />
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      // Initially should show auth screen
      expect(getByTestId("auth-screen")).toBeTruthy();
      expect(queryByTestId("main-app")).toBeNull();

      // Simulate successful authentication (like we saw in Android logs)
      await act(async () => {
        // Mock the auth state change to authenticated user
        mockUseAuth.mockReturnValue({
          user: {
            id: "2254cfbf-95ae-405e-8e86-6953abbd2038",
            email: undefined,
            isAnonymous: true,
            createdAt: new Date("2025-09-21T21:23:17.000Z"),
          },
          loading: false,
          error: null,
          signInAnonymously: mockSignInAnonymously,
          createAccount: jest.fn(),
          signIn: jest.fn(),
          signOut: jest.fn(),
          clearError: jest.fn(),
        });

        // Force re-render to simulate state change
        rerender(
          <AuthProvider>
            <AuthContextTester
              onAuthStateChange={(state) => {
                authStateCallback = state;
              }}
            />
            <AuthAwareLayout>
              <MainAppContent />
            </AuthAwareLayout>
          </AuthProvider>,
        );
      });

      // After authentication, should show main app with get-started button
      await waitFor(() => {
        expect(queryByTestId("auth-screen")).toBeNull();
        expect(getByTestId("main-app")).toBeTruthy();
        expect(getByTestId("get-started")).toBeTruthy();
      });
    });

    it("should handle Chrome test environment correctly", async () => {
      // Set Chrome test environment
      process.env.EXPO_PUBLIC_CHROME_TEST = "true";

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText } = render(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      // In Chrome environment, should still show loading initially
      expect(getByText("Initializing...")).toBeTruthy();
    });
  });

  describe("Authentication State Transitions", () => {

    it("should maintain auth state consistency throughout app lifecycle", async () => {
      const authStates: any[] = [];

      // Simulate the exact flow we saw in Android logs
      const authFlowStates = [
        // Initial state
        { user: null, loading: true, error: null },
        // App initialization complete
        { user: null, loading: false, error: null },
        // Anonymous sign-in successful (like Android logs showed)
        {
          user: {
            id: "3e012a91-abc7-4d9c-81c6-bcb08420ce28",
            email: undefined,
            isAnonymous: true,
            createdAt: new Date("2025-09-21T21:23:15.896Z"),
          },
          loading: false,
          error: null,
        },
      ];

      let currentStateIndex = 0;
      mockUseAuth.mockImplementation(() => ({
        ...authFlowStates[currentStateIndex],
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      }));

      const { rerender, getByText, getByTestId, queryByTestId } = render(
        <AuthProvider>
          <AuthContextTester
            onAuthStateChange={(state) => authStates.push(state)}
          />
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      // State 1: Loading
      expect(getByText("Initializing...")).toBeTruthy();

      // Transition to State 2: No user, not loading (should show auth screen)
      await act(async () => {
        currentStateIndex = 1;
        rerender(
          <AuthProvider>
            <AuthContextTester
              onAuthStateChange={(state) => authStates.push(state)}
            />
            <AuthAwareLayout>
              <MainAppContent />
            </AuthAwareLayout>
          </AuthProvider>,
        );
      });

      expect(getByTestId("auth-screen")).toBeTruthy();

      // State 3: User authenticated (should show main app)
      await act(async () => {
        currentStateIndex = 2;
        rerender(
          <AuthProvider>
            <AuthContextTester
              onAuthStateChange={(state) => authStates.push(state)}
            />
            <AuthAwareLayout>
              <MainAppContent />
            </AuthAwareLayout>
          </AuthProvider>,
        );
      });

      // This is the critical test: after successful auth, should show main app
      await waitFor(() => {
        expect(queryByTestId("auth-screen")).toBeNull();
        expect(getByTestId("main-app")).toBeTruthy();
        expect(getByTestId("get-started")).toBeTruthy();
      });

      // Verify we captured all auth state transitions
      expect(authStates.length).toBeGreaterThan(0);
      const finalState = authStates[authStates.length - 1];
      expect(finalState.user).toBeTruthy();
      expect(finalState.user.isAnonymous).toBe(true);
      expect(finalState.loading).toBe(false);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle authentication errors gracefully", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: {
          code: "auth_error",
          message: "Authentication failed",
          details: "Network connection failed",
        },
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );

      // Should still show auth screen when there's an error
      expect(getByTestId("auth-screen")).toBeTruthy();
    });
  });
});
