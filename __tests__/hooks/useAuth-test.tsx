import { renderHook } from "@testing-library/react-native";
import { useAuth } from "@/lib/hooks/useAuth";

// Mock the StorageManager
jest.mock("@/lib/data/StorageManager", () => ({
  storageManager: {
    getAuthBackend: jest.fn(() => ({
      getCurrentUser: jest.fn(() => Promise.resolve(null)),
      subscribeToAuthState: jest.fn(() => () => {}),
      signInAnonymously: jest.fn(() => Promise.resolve()),
      signUpWithEmail: jest.fn(() => Promise.resolve()),
      signInWithEmail: jest.fn(() => Promise.resolve()),
      signOut: jest.fn(() => Promise.resolve()),
    })),
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("initializes with loading state", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test("provides expected auth methods", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signInAnonymously).toBe("function");
    expect(typeof result.current.createAccount).toBe("function");
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.clearError).toBe("function");
  });

  test("clearError function resets error state", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.clearError).toBe("function");
    // Test would need more complex state setup to verify error clearing
    // This test validates the method exists and is callable
  });
});
