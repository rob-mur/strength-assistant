import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native-paper";
import { AuthProvider, useAuthContext } from "@/lib/components/AuthProvider";
import { useAuth } from "@/lib/hooks/useAuth";

// Mock the useAuth hook
jest.mock("@/lib/hooks/useAuth");
const mockUseAuth = jest.mocked(useAuth);

// Test component that uses the auth context
const TestConsumerComponent = () => {
  const { user, loading, error, signIn, signOut, signInAnonymously, createAccount, clearError } = useAuthContext();
  
  return (
    <>
      <Text testID="user-uid">{user?.uid || "no-user"}</Text>
      <Text testID="user-email">{user?.email || "no-email"}</Text>
      <Text testID="user-anonymous">{user?.isAnonymous ? "anonymous" : "not-anonymous"}</Text>
      <Text testID="loading">{loading ? "loading" : "not-loading"}</Text>
      <Text testID="error">{error?.message || "no-error"}</Text>
      <Text testID="functions-available">
        {signIn && signOut && signInAnonymously && createAccount && clearError ? "all-functions" : "missing-functions"}
      </Text>
    </>
  );
};

// Component to test error case - tries to use auth context outside provider
const TestErrorComponent = () => {
  const context = useAuthContext();
  return <Text>{context.user?.uid}</Text>;
};

describe("AuthProvider", () => {
  const mockAuthState = {
    user: null,
    loading: false,
    error: null,
    signInAnonymously: jest.fn(),
    createAccount: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthState);
  });

  it("should provide auth state to child components", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("user-uid")).toHaveTextContent("no-user");
    expect(getByTestId("user-email")).toHaveTextContent("no-email");
    expect(getByTestId("user-anonymous")).toHaveTextContent("not-anonymous");
    expect(getByTestId("loading")).toHaveTextContent("not-loading");
    expect(getByTestId("error")).toHaveTextContent("no-error");
    expect(getByTestId("functions-available")).toHaveTextContent("all-functions");
  });

  it("should provide authenticated user data when user is signed in", () => {
    const mockUser = {
      uid: "test-uid-123",
      email: "test@example.com",
      isAnonymous: false,
    };

    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      user: mockUser,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("user-uid")).toHaveTextContent("test-uid-123");
    expect(getByTestId("user-email")).toHaveTextContent("test@example.com");
    expect(getByTestId("user-anonymous")).toHaveTextContent("not-anonymous");
  });

  it("should provide anonymous user data when user is signed in anonymously", () => {
    const mockAnonymousUser = {
      uid: "anonymous-uid-456",
      email: null,
      isAnonymous: true,
    };

    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      user: mockAnonymousUser,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("user-uid")).toHaveTextContent("anonymous-uid-456");
    expect(getByTestId("user-email")).toHaveTextContent("no-email");
    expect(getByTestId("user-anonymous")).toHaveTextContent("anonymous");
  });

  it("should provide loading state", () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      loading: true,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("loading")).toHaveTextContent("loading");
  });

  it("should provide error state", () => {
    const mockError = {
      code: "invalid-credential",
      message: "The supplied auth credential is invalid",
    };

    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      error: mockError,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("error")).toHaveTextContent("The supplied auth credential is invalid");
  });

  it("should provide all auth functions from useAuth hook", () => {
    const mockFunctions = {
      signInAnonymously: jest.fn(),
      createAccount: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
    };

    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      ...mockFunctions,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("functions-available")).toHaveTextContent("all-functions");
  });

  it("should update when auth state changes", () => {
    // Initial state - signed out
    const { getByTestId, rerender } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("user-uid")).toHaveTextContent("no-user");
    expect(getByTestId("loading")).toHaveTextContent("not-loading");

    // Update to loading state
    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      loading: true,
    });

    rerender(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("loading")).toHaveTextContent("loading");

    // Update to signed in state
    mockUseAuth.mockReturnValue({
      ...mockAuthState,
      user: {
        uid: "signed-in-uid",
        email: "user@example.com",
        isAnonymous: false,
      },
      loading: false,
    });

    rerender(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId("user-uid")).toHaveTextContent("signed-in-uid");
    expect(getByTestId("user-email")).toHaveTextContent("user@example.com");
    expect(getByTestId("loading")).toHaveTextContent("not-loading");
  });

  describe("useAuthContext error handling", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Mock console.error to prevent noise in test output
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // This should throw an error
      expect(() => {
        render(<TestErrorComponent />);
      }).toThrow("useAuthContext must be used within an AuthProvider");

      // Restore console.error
      console.error = originalConsoleError;
    });

    it("should not throw error when used inside AuthProvider", () => {
      expect(() => {
        render(
          <AuthProvider>
            <TestConsumerComponent />
          </AuthProvider>
        );
      }).not.toThrow();
    });
  });

  describe("context provider functionality", () => {
    it("should pass the exact useAuth return value through context", () => {
      const specificAuthState = {
        user: {
          uid: "specific-uid",
          email: "specific@example.com",
          isAnonymous: false,
        },
        loading: false,
        error: {
          code: "specific-error",
          message: "Specific error message",
        },
        signInAnonymously: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        clearError: jest.fn(),
      };

      mockUseAuth.mockReturnValue(specificAuthState);

      const TestSpecificComponent = () => {
        const context = useAuthContext();
        return <Text testID="context">{JSON.stringify(context.user)}</Text>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestSpecificComponent />
        </AuthProvider>
      );

      const expectedUserString = JSON.stringify(specificAuthState.user);
      expect(getByTestId("context")).toHaveTextContent(expectedUserString);
    });

    it("should handle multiple nested consumers", () => {
      const mockUser = {
        uid: "nested-test-uid",
        email: "nested@test.com",
        isAnonymous: false,
      };

      mockUseAuth.mockReturnValue({
        ...mockAuthState,
        user: mockUser,
      });

      const NestedComponent1 = () => {
        const { user } = useAuthContext();
        return <Text testID="nested-1">{user?.uid || "no-user-1"}</Text>;
      };

      const NestedComponent2 = () => {
        const { user } = useAuthContext();
        return <Text testID="nested-2">{user?.email || "no-email-2"}</Text>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <NestedComponent1 />
          <NestedComponent2 />
        </AuthProvider>
      );

      expect(getByTestId("nested-1")).toHaveTextContent("nested-test-uid");
      expect(getByTestId("nested-2")).toHaveTextContent("nested@test.com");
    });
  });
});