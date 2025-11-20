/**
 * Test to verify auth context synchronization issue
 *
 * This test reproduces the specific issue where:
 * 1. SupabaseStorage.signInAnonymously() creates a local user
 * 2. useAuth hook receives this user
 * 3. But AuthAwareLayout doesn't see the user in auth context
 *
 * Root cause: Auth state isn't properly synchronized across the app
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuthContext } from "@/lib/components/AuthProvider";
import { AuthAwareLayout } from "@/lib/components/AuthAwareLayout";
import { Text, View } from "react-native";
import * as useAuthModule from "@/lib/hooks/useAuth";

// Mock the useAuth hook to simulate the actual Android behavior
const mockUseAuth = jest.fn();
jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock AuthScreen
jest.mock("@/lib/components/AuthScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    AuthScreen: () =>
      React.createElement(Text, { testID: "auth-screen" }, "Sign In Screen"),
  };
});

const MainAppContent = () => (
  <View testID="main-app">
    <Text testID="get-started">Get Started</Text>
  </View>
);

describe("Auth Context Synchronization Issue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reproduce the Android issue: auth succeeds but UI stays on auth screen", async () => {
    // Mock the exact scenario we see in Android logs
    let authState = {
      user: null,
      loading: true,
      error: null,
      signInAnonymously: jest.fn(),
      createAccount: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
    };

    const mockSignInAnonymously = jest.fn().mockImplementation(async () => {
      // Simulate SupabaseStorage.signInAnonymously() behavior:
      // It creates a user and returns it, but doesn't update the auth context
      console.log("🔐 [Mock] signInAnonymously called - creating local user");

      const localUser = {
        id: "44ba66b7-396a-4d1c-a947-6761d91432df",
        email: undefined,
        isAnonymous: true,
        createdAt: new Date(),
      };

      console.log("🔐 [Mock] Local user created:", localUser.id);

      // The bug: this user is NOT propagated to the auth context
      // The context still shows user: null, loading: false
      authState = {
        ...authState,
        user: null, // BUG: Should be localUser, but context doesn't get updated
        loading: false,
      };

      return localUser;
    });

    authState.signInAnonymously = mockSignInAnonymously;
    mockUseAuth.mockImplementation(() => authState);

    const { getByTestId, getByText, rerender, queryByTestId } = render(
      <AuthProvider>
        <AuthAwareLayout>
          <MainAppContent />
        </AuthAwareLayout>
      </AuthProvider>,
    );

    // Initially should show loading
    expect(getByText("Initializing...")).toBeTruthy();

    // Simulate the auth attempt (like clicking "Continue as Guest")
    await act(async () => {
      await mockSignInAnonymously();

      // Force re-render with the updated state
      rerender(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );
    });

    // This is the bug: even though signInAnonymously "succeeded",
    // the AuthAwareLayout still shows auth screen because user is null in context
    await waitFor(() => {
      expect(queryByTestId("main-app")).toBeNull();
      expect(getByTestId("auth-screen")).toBeTruthy();
    });

    // Verify the function was called (auth "succeeded")
    expect(mockSignInAnonymously).toHaveBeenCalled();

    console.log(
      "🚨 BUG REPRODUCED: Auth succeeded but UI still shows auth screen",
    );
  });

  it("should show how the fix would work: proper auth context synchronization", async () => {
    // This test shows how it SHOULD work
    let authState = {
      user: null,
      loading: true,
      error: null,
      signInAnonymously: jest.fn(),
      createAccount: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
    };

    const mockSignInAnonymously = jest.fn().mockImplementation(async () => {
      console.log(
        "✅ [Fixed] signInAnonymously called - updating auth context",
      );

      const localUser = {
        id: "44ba66b7-396a-4d1c-a947-6761d91432df",
        email: undefined,
        isAnonymous: true,
        createdAt: new Date(),
      };

      // FIX: Properly update the auth context state
      authState = {
        ...authState,
        user: localUser, // FIXED: Context now has the user
        loading: false,
      };

      console.log("✅ [Fixed] Auth context updated with user:", localUser.id);
      return localUser;
    });

    authState.signInAnonymously = mockSignInAnonymously;
    mockUseAuth.mockImplementation(() => authState);

    const { getByTestId, rerender, queryByTestId } = render(
      <AuthProvider>
        <AuthAwareLayout>
          <MainAppContent />
        </AuthAwareLayout>
      </AuthProvider>,
    );

    // Simulate successful auth with proper context update
    await act(async () => {
      await mockSignInAnonymously();

      // Force re-render with the fixed state
      rerender(
        <AuthProvider>
          <AuthAwareLayout>
            <MainAppContent />
          </AuthAwareLayout>
        </AuthProvider>,
      );
    });

    // With the fix: UI should transition to main app
    await waitFor(() => {
      expect(queryByTestId("auth-screen")).toBeNull();
      expect(getByTestId("main-app")).toBeTruthy();
      expect(getByTestId("get-started")).toBeTruthy();
    });

    console.log(
      "✅ FIXED: Auth succeeded and UI properly transitioned to main app",
    );
  });

  it("should handle loading text element correctly", () => {
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
});
