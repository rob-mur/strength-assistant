import { useAuth } from "@/lib/hooks/useAuth";
import { renderHook, act } from "@testing-library/react-native";
import { Platform } from "react-native";

// Mock the platform-specific auth modules
const mockAuthFunctions = {
  initAuth: jest.fn(),
  onAuthStateChangedWeb: jest.fn(),
  onAuthStateChangedNative: jest.fn(),
  signInAnonymouslyWeb: jest.fn(),
  signInAnonymouslyNative: jest.fn(),
  createAccountWeb: jest.fn(),
  createAccountNative: jest.fn(),
  signInWeb: jest.fn(),
  signInNative: jest.fn(),
  signOutWeb: jest.fn(),
  signOutNative: jest.fn(),
};

jest.mock("@/lib/data/firebase/auth.web", () => mockAuthFunctions);
jest.mock("@/lib/data/firebase/auth.native", () => mockAuthFunctions);

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Platform.OS as web by default
    Object.defineProperty(Platform, "OS", {
      writable: true,
      value: "web",
    });
  });

  test("initializes with loading state", () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockAuthFunctions.initAuth).toHaveBeenCalled();
  });

  test("sets user when auth state changes", () => {
    let authCallback: any;
    mockAuthFunctions.onAuthStateChangedWeb.mockImplementation((callback) => {
      authCallback = callback;
      return jest.fn();
    });
    
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      authCallback({
        uid: "test-uid",
        email: "test@example.com",
        isAnonymous: false,
      });
    });
    
    expect(result.current.user).toEqual({
      uid: "test-uid",
      email: "test@example.com",
      isAnonymous: false,
    });
    expect(result.current.loading).toBe(false);
  });

  test("clears user when signed out", () => {
    let authCallback: any;
    mockAuthFunctions.onAuthStateChangedWeb.mockImplementation((callback) => {
      authCallback = callback;
      return jest.fn();
    });
    
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      authCallback(null);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("uses native auth functions on native platform", () => {
    Object.defineProperty(Platform, "OS", {
      value: "android",
    });
    
    mockAuthFunctions.onAuthStateChangedNative.mockReturnValue(jest.fn());
    
    renderHook(() => useAuth());
    
    expect(mockAuthFunctions.onAuthStateChangedNative).toHaveBeenCalled();
    expect(mockAuthFunctions.onAuthStateChangedWeb).not.toHaveBeenCalled();
  });

  test("signInAnonymously calls correct platform function", async () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    mockAuthFunctions.signInAnonymouslyWeb.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signInAnonymously();
    });
    
    expect(mockAuthFunctions.signInAnonymouslyWeb).toHaveBeenCalled();
  });

  test("handles sign in error", async () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    mockAuthFunctions.signInAnonymouslyWeb.mockRejectedValue(
      new Error("Sign in failed")
    );
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signInAnonymously();
    });
    
    expect(result.current.error).toEqual({
      code: "unknown",
      message: "Sign in failed",
    });
    expect(result.current.loading).toBe(false);
  });

  test("createAccount calls correct platform function", async () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    mockAuthFunctions.createAccountWeb.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.createAccount("test@example.com", "password");
    });
    
    expect(mockAuthFunctions.createAccountWeb).toHaveBeenCalledWith("test@example.com", "password");
  });

  test("signIn calls correct platform function", async () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    mockAuthFunctions.signInWeb.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn("test@example.com", "password");
    });
    
    expect(mockAuthFunctions.signInWeb).toHaveBeenCalledWith("test@example.com", "password");
  });

  test("signOut calls correct platform function", async () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    mockAuthFunctions.signOutWeb.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(mockAuthFunctions.signOutWeb).toHaveBeenCalledWith();
  });

  test("clearError function is available", () => {
    mockAuthFunctions.onAuthStateChangedWeb.mockReturnValue(jest.fn());
    
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.clearError).toBe("function");
  });

  test("uses native auth functions for createAccount on native", async () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    
    mockAuthFunctions.onAuthStateChangedNative.mockReturnValue(jest.fn());
    mockAuthFunctions.createAccountNative.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.createAccount("test@example.com", "password");
    });
    
    expect(mockAuthFunctions.createAccountNative).toHaveBeenCalledWith("test@example.com", "password");
  });

  test("uses native auth functions for signIn on native", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    
    mockAuthFunctions.onAuthStateChangedNative.mockReturnValue(jest.fn());
    mockAuthFunctions.signInNative.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn("test@example.com", "password");
    });
    
    expect(mockAuthFunctions.signInNative).toHaveBeenCalledWith("test@example.com", "password");
  });

  test("uses native auth functions for signOut on native", async () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    
    mockAuthFunctions.onAuthStateChangedNative.mockReturnValue(jest.fn());
    mockAuthFunctions.signOutNative.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(mockAuthFunctions.signOutNative).toHaveBeenCalledWith();
  });
});