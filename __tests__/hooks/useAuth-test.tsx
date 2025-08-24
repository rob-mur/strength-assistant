import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useAuth } from "@/lib/hooks/useAuth";
import { Platform } from "react-native";

// Mock platform-specific auth modules
const mockWebAuth = {
  initAuth: jest.fn(),
  onAuthStateChangedWeb: jest.fn(),
  signInAnonymouslyWeb: jest.fn(),
  createAccountWeb: jest.fn(),
  signInWeb: jest.fn(),
  signOutWeb: jest.fn(),
};

const mockNativeAuth = {
  initAuth: jest.fn(),
  onAuthStateChangedNative: jest.fn(),
  signInAnonymouslyNative: jest.fn(),
  createAccountNative: jest.fn(),
  signInNative: jest.fn(),
  signOutNative: jest.fn(),
};

// Mock the platform-specific imports
jest.mock("@/lib/data/firebase/auth.web", () => mockWebAuth);
jest.mock("@/lib/data/firebase/auth.native", () => mockNativeAuth);

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to native platform for most tests
    Platform.OS = "ios";
    
    // Setup default successful auth state listener
    mockNativeAuth.onAuthStateChangedNative.mockImplementation((callback) => {
      // Initially call with null (signed out)
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  describe("initialization", () => {
    it("should initialize with loading state", () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should call initAuth on mount for native platform", () => {
      renderHook(() => useAuth());
      
      expect(mockNativeAuth.initAuth).toHaveBeenCalled();
      expect(mockNativeAuth.onAuthStateChangedNative).toHaveBeenCalled();
    });

    it("should call initAuth on mount for web platform", () => {
      Platform.OS = "web";
      mockWebAuth.onAuthStateChangedWeb.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      renderHook(() => useAuth());
      
      expect(mockWebAuth.initAuth).toHaveBeenCalled();
      expect(mockWebAuth.onAuthStateChangedWeb).toHaveBeenCalled();
    });

    it("should set up auth state listener and cleanup on unmount", () => {
      const mockUnsubscribe = jest.fn();
      mockNativeAuth.onAuthStateChangedNative.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useAuth());
      
      expect(mockNativeAuth.onAuthStateChangedNative).toHaveBeenCalled();
      
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("authentication state transitions", () => {
    it("should transition from loading to signed out state", async () => {
      mockNativeAuth.onAuthStateChangedNative.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    it("should transition to signed in state with user data", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        isAnonymous: false,
      };

      mockNativeAuth.onAuthStateChangedNative.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it("should handle anonymous user state", async () => {
      const mockAnonymousUser = {
        uid: "anonymous-uid",
        email: null,
        isAnonymous: true,
      };

      mockNativeAuth.onAuthStateChangedNative.mockImplementation((callback) => {
        setTimeout(() => callback(mockAnonymousUser), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAnonymousUser);
        expect(result.current.user?.isAnonymous).toBe(true);
      });
    });
  });

  describe("signInAnonymously", () => {
    it("should set loading state and call native signInAnonymously", async () => {
      mockNativeAuth.signInAnonymouslyNative.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      act(() => {
        result.current.signInAnonymously();
      });
      
      expect(mockNativeAuth.signInAnonymouslyNative).toHaveBeenCalled();
    });

    it("should call web signInAnonymously on web platform", async () => {
      Platform.OS = "web";
      mockWebAuth.onAuthStateChangedWeb.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });
      mockWebAuth.signInAnonymouslyWeb.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signInAnonymously();
      });
      
      expect(mockWebAuth.signInAnonymouslyWeb).toHaveBeenCalled();
    });

    it("should handle signInAnonymously errors", async () => {
      const errorMessage = "Network error";
      const error = { code: "network-error", message: errorMessage };
      mockNativeAuth.signInAnonymouslyNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signInAnonymously();
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle errors with missing code/message", async () => {
      const error = {}; // Error without code/message
      mockNativeAuth.signInAnonymouslyNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signInAnonymously();
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual({
          code: "unknown",
          message: "An error occurred"
        });
      });
    });
  });

  describe("createAccount", () => {
    it("should set loading state and call native createAccount", async () => {
      mockNativeAuth.createAccountNative.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.createAccount("test@example.com", "password123");
      });
      
      expect(mockNativeAuth.createAccountNative).toHaveBeenCalledWith(
        "test@example.com", 
        "password123"
      );
    });

    it("should call web createAccount on web platform", async () => {
      Platform.OS = "web";
      mockWebAuth.onAuthStateChangedWeb.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });
      mockWebAuth.createAccountWeb.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.createAccount("test@example.com", "password123");
      });
      
      expect(mockWebAuth.createAccountWeb).toHaveBeenCalledWith(
        "test@example.com", 
        "password123"
      );
    });

    it("should handle createAccount errors", async () => {
      const error = { code: "weak-password", message: "Password is too weak" };
      mockNativeAuth.createAccountNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.createAccount("test@example.com", "123");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("signIn", () => {
    it("should set loading state and call native signIn", async () => {
      mockNativeAuth.signInNative.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });
      
      expect(mockNativeAuth.signInNative).toHaveBeenCalledWith(
        "test@example.com", 
        "password123"
      );
    });

    it("should call web signIn on web platform", async () => {
      Platform.OS = "web";
      mockWebAuth.onAuthStateChangedWeb.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });
      mockWebAuth.signInWeb.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });
      
      expect(mockWebAuth.signInWeb).toHaveBeenCalledWith(
        "test@example.com", 
        "password123"
      );
    });

    it("should handle signIn errors", async () => {
      const error = { code: "invalid-credential", message: "Invalid credentials" };
      mockNativeAuth.signInNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "wrongpassword");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("signOut", () => {
    it("should set loading state and call native signOut", async () => {
      mockNativeAuth.signOutNative.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(mockNativeAuth.signOutNative).toHaveBeenCalled();
    });

    it("should call web signOut on web platform", async () => {
      Platform.OS = "web";
      mockWebAuth.onAuthStateChangedWeb.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });
      mockWebAuth.signOutWeb.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(mockWebAuth.signOutWeb).toHaveBeenCalled();
    });

    it("should handle signOut errors", async () => {
      const error = { code: "network-error", message: "Network unavailable" };
      mockNativeAuth.signOutNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signOut();
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("clearError", () => {
    it("should clear the error state", async () => {
      // First set an error
      const error = { code: "test-error", message: "Test error" };
      mockNativeAuth.signInNative.mockRejectedValue(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "wrongpassword");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
      
      // Then clear the error
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe("error handling edge cases", () => {
    it("should handle network failures during authentication", async () => {
      const networkError = { 
        code: "network-request-failed", 
        message: "A network error has occurred" 
      };
      mockNativeAuth.signInNative.mockRejectedValue(networkError);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(networkError);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle invalid credentials error", async () => {
      const invalidCredError = { 
        code: "invalid-credential", 
        message: "The supplied auth credential is invalid" 
      };
      mockNativeAuth.signInNative.mockRejectedValue(invalidCredError);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("invalid@email.com", "wrongpassword");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(invalidCredError);
      });
    });
  });

  describe("loading states", () => {
    it("should set loading to true during signIn and false after completion", async () => {
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockNativeAuth.signInNative.mockReturnValue(signInPromise);
      
      const { result } = renderHook(() => useAuth());
      
      // Initially not loading (after auth state resolves)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Start signIn - should be loading
      act(() => {
        result.current.signIn("test@example.com", "password123");
      });
      
      expect(result.current.loading).toBe(true);
      
      // Complete signIn - should not be loading
      act(() => {
        resolveSignIn!();
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should clear error when starting new auth operation", async () => {
      // First, create an error
      const error = { code: "test-error", message: "Test error" };
      mockNativeAuth.signInNative.mockRejectedValueOnce(error);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.signIn("test@example.com", "wrongpassword");
      });
      
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
      
      // Now start a new operation - should clear error
      mockNativeAuth.signInNative.mockResolvedValue(undefined);
      
      act(() => {
        result.current.signIn("test@example.com", "correctpassword");
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(true);
    });
  });
});