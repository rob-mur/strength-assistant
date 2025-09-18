import { renderHook, act } from "@testing-library/react-native";

// Mock auth functions for comprehensive testing
const mockWebAuthFunctions = {
  initAuth: jest.fn(),
  onAuthStateChangedWeb: jest.fn(),
  signInAnonymouslyWeb: jest.fn(),
  createAccountWeb: jest.fn(),
  signInWeb: jest.fn(),
  signOutWeb: jest.fn(),
  getAuthInstance: jest.fn(),
};

const mockNativeAuthFunctions = {
  initAuth: jest.fn(),
  onAuthStateChangedNative: jest.fn(),
  signInAnonymouslyNative: jest.fn(),
  createAccountNative: jest.fn(),
  signInNative: jest.fn(),
  signOutNative: jest.fn(),
  getAuthInstance: jest.fn(),
};

jest.mock("@/lib/data/firebase/auth.web", () => ({
  initAuth: jest.fn(),
  onAuthStateChangedWeb: jest.fn(),
  signInAnonymouslyWeb: jest.fn(),
  createAccountWeb: jest.fn(),
  signInWeb: jest.fn(),
  signOutWeb: jest.fn(),
  getAuthInstance: jest.fn(),
  __esModule: true,
}));

jest.mock("@/lib/data/firebase/auth.native", () => ({
  initAuth: jest.fn(),
  onAuthStateChangedNative: jest.fn(),
  signInAnonymouslyNative: jest.fn(),
  createAccountNative: jest.fn(),
  signInNative: jest.fn(),
  signOutNative: jest.fn(),
  getAuthInstance: jest.fn(),
  __esModule: true,
}));

// Mock Platform will be handled by jest.setup.js

// Import after mocks are set up
import { useAuth } from "@/lib/hooks/useAuth";
import * as AuthWeb from "@/lib/data/firebase/auth.web";
import * as AuthNative from "@/lib/data/firebase/auth.native";

// Get references to mocked functions
const mockedAuthWeb = AuthWeb as jest.Mocked<typeof AuthWeb>;
const mockedAuthNative = AuthNative as jest.Mocked<typeof AuthNative>;

describe("useAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset process.env to avoid test environment detection
    process.env = { ...originalEnv };
    delete (process.env as any).CHROME_TEST;
    delete (process.env as any).CI;
    delete (process.env as any).NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("initializes with loading state", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test("clearError function is available", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.clearError).toBe("function");
  });

  test("signInAnonymously creates mock user in test environment", async () => {
    // Set test environment
    (process.env as any).NODE_ENV = "test";

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInAnonymously();
    });

    expect(result.current.user).toEqual({
      uid: "test-user-chrome",
      email: null,
      isAnonymous: true,
    });
    expect(result.current.loading).toBe(false);
    expect(mockedAuthWeb.signInAnonymouslyWeb).not.toHaveBeenCalled();
  });

  test("clearError clears the error state", async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate an error state by calling signIn with invalid credentials
    mockedAuthWeb.signInWeb.mockRejectedValue(new Error("Invalid credentials"));

    await act(async () => {
      await result.current.signIn("test@example.com", "wrongpassword");
    });

    // Verify error state is set
    expect(result.current.error).toEqual({
      code: "unknown",
      message: "Invalid credentials",
    });

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test("handles CHROME_TEST environment variable", () => {
    (process.env as any).CHROME_TEST = "true";

    const { result } = renderHook(() => useAuth());

    // Should set error state (no user) in test environment
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("handles CI environment variable", () => {
    (process.env as any).CI = "true";

    const { result } = renderHook(() => useAuth());

    // Should set error state (no user) in CI environment
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("createAccount calls correct platform function", async () => {
    const mockUser = {
      uid: "test-uid",
      email: "test@example.com",
      isAnonymous: false,
    } as any;
    mockedAuthWeb.createAccountWeb.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.createAccount("test@example.com", "password123");
    });

    expect(mockedAuthWeb.createAccountWeb).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
  });

  test("createAccount handles errors", async () => {
    const testError = {
      code: "auth/email-already-in-use",
      message: "Email already in use",
    };
    mockedAuthWeb.createAccountWeb.mockRejectedValue(testError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.createAccount("test@example.com", "password123");
    });

    expect(result.current.error).toEqual({
      code: "auth/email-already-in-use",
      message: "Email already in use",
    });
    expect(result.current.loading).toBe(false);
  });

  test("signIn calls correct platform function", async () => {
    const mockUser = {
      uid: "test-uid",
      email: "test@example.com",
      isAnonymous: false,
    } as any;
    mockedAuthWeb.signInWeb.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("test@example.com", "password123");
    });

    expect(mockedAuthWeb.signInWeb).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
  });

  test("signIn handles errors", async () => {
    const testError = {
      code: "auth/wrong-password",
      message: "Wrong password",
    };
    mockedAuthWeb.signInWeb.mockRejectedValue(testError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("test@example.com", "wrongpassword");
    });

    expect(result.current.error).toEqual({
      code: "auth/wrong-password",
      message: "Wrong password",
    });
    expect(result.current.loading).toBe(false);
  });

  test("signOut calls correct platform function", async () => {
    mockedAuthWeb.signOutWeb.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockedAuthWeb.signOutWeb).toHaveBeenCalledWith();
  });

  test("signOut handles errors", async () => {
    const testError = { code: "auth/network-error", message: "Network error" };
    mockedAuthWeb.signOutWeb.mockRejectedValue(testError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.error).toEqual({
      code: "auth/network-error",
      message: "Network error",
    });
    expect(result.current.loading).toBe(false);
  });

  test("signInAnonymously in CHROME_TEST environment", async () => {
    (process.env as any).CHROME_TEST = "true";

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInAnonymously();
    });

    expect(result.current.user).toEqual({
      uid: "test-user-chrome",
      email: null,
      isAnonymous: true,
    });
    expect(result.current.loading).toBe(false);
    expect(mockedAuthWeb.signInAnonymouslyWeb).not.toHaveBeenCalled();
  });

  test("signInAnonymously in CI environment", async () => {
    (process.env as any).CI = "true";

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInAnonymously();
    });

    expect(result.current.user).toEqual({
      uid: "test-user-chrome",
      email: null,
      isAnonymous: true,
    });
    expect(result.current.loading).toBe(false);
    expect(mockedAuthWeb.signInAnonymouslyWeb).not.toHaveBeenCalled();
  });

  describe("Native Platform Tests", () => {
    const { Platform } = require("react-native");

    beforeEach(() => {
      Platform.OS = "ios"; // Set to native platform
      jest.clearAllMocks();
    });

    afterEach(() => {
      Platform.OS = "web"; // Reset to default
    });

    test("createAccount calls native function on iOS", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        isAnonymous: false,
      } as any;
      mockedAuthNative.createAccountNative.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.createAccount("test@example.com", "password123");
      });

      expect(mockedAuthNative.createAccountNative).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
      expect(mockedAuthWeb.createAccountWeb).not.toHaveBeenCalled();
    });

    test("signIn calls native function on iOS", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        isAnonymous: false,
      } as any;
      mockedAuthNative.signInNative.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockedAuthNative.signInNative).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
      expect(mockedAuthWeb.signInWeb).not.toHaveBeenCalled();
    });

    test("signOut calls native function on iOS", async () => {
      mockedAuthNative.signOutNative.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockedAuthNative.signOutNative).toHaveBeenCalledWith();
      expect(mockedAuthWeb.signOutWeb).not.toHaveBeenCalled();
    });

    test("signInAnonymously calls native function on iOS", async () => {
      const mockUser = {
        uid: "test-uid",
        email: null,
        isAnonymous: true,
      } as any;
      mockedAuthNative.signInAnonymouslyNative.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInAnonymously();
      });

      expect(mockedAuthNative.signInAnonymouslyNative).toHaveBeenCalledWith();
      expect(mockedAuthWeb.signInAnonymouslyWeb).not.toHaveBeenCalled();
    });
  });

  describe("Auth Initialization and Error Scenarios", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Clear test environment variables to test normal initialization
      delete (process.env as any).CHROME_TEST;
      delete (process.env as any).CI;
      delete (process.env as any).NODE_ENV;
    });

    test("handles auth initialization timeout", async () => {
      // Mock initAuth to throw a timeout error
      mockedAuthWeb.initAuth.mockImplementation(() => {
        throw new Error("Auth initialization timeout");
      });

      const { result } = renderHook(() => useAuth());

      // Wait for the initialization to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for initialization attempt
      });

      // Should handle timeout gracefully
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    test("handles auth listener setup", async () => {
      const mockUnsubscribe = jest.fn();
      mockedAuthWeb.initAuth.mockReturnValue(undefined);
      mockedAuthWeb.onAuthStateChangedWeb.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useAuth());

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Unmount to trigger cleanup
      unmount();

      // The cleanup function should handle unsubscribe properly
      // Note: The actual unsubscribe call happens in cleanup, which is tested by the error handling
    });

    test("handles signInAnonymously error in normal environment", async () => {
      const testError = {
        code: "auth/network-error",
        message: "Network error",
      };
      mockedAuthWeb.signInAnonymouslyWeb.mockRejectedValue(testError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInAnonymously();
      });

      expect(result.current.error).toEqual({
        code: "auth/network-error",
        message: "Network error",
      });
      expect(result.current.loading).toBe(false);
    });

    test("handles auth functions with missing properties", async () => {
      const testError = { message: "Auth error without code" };
      mockedAuthWeb.signInWeb.mockRejectedValue(testError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(result.current.error).toEqual({
        code: "unknown",
        message: "Auth error without code",
      });
    });

    test("handles auth functions with no message", async () => {
      const testError = { code: "auth/custom-error" };
      mockedAuthWeb.signOutWeb.mockRejectedValue(testError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toEqual({
        code: "auth/custom-error",
        message: "An error occurred",
      });
    });
  });
});
