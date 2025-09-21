import { renderHook, act } from "@testing-library/react-native";
import { useAuth } from "@/lib/hooks/useAuth";
import { storageManager } from "@/lib/data/StorageManager";
import type { UserAccount } from "@/lib/models/UserAccount";

// Mock the storage manager
jest.mock("@/lib/data/StorageManager", () => ({
  storageManager: {
    getAuthBackend: jest.fn(),
  },
}));

describe("useAuth", () => {
  let mockAuthBackend: any;
  let authStateCallback: (user: UserAccount | null) => void;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock auth backend
    mockAuthBackend = {
      subscribeToAuthState: jest.fn(),
      getCurrentUser: jest.fn(),
      signInAnonymously: jest.fn(),
      signUpWithEmail: jest.fn(),
      signInWithEmail: jest.fn(),
      signOut: jest.fn(),
    };

    (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
      mockAuthBackend,
    );

    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should start with loading state", () => {
      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn(); // unsubscribe function
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe("Authentication State Management", () => {
    it("should handle user authentication", async () => {
      const mockUser: UserAccount = {
        id: "test-user-id",
        email: "test@example.com",
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: null,
      };

      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Wait for the effect to complete
      await act(async () => {
        // Simulate auth state change
        authStateCallback(mockUser);
      });

      expect(result.current.user).toEqual({
        uid: "test-user-id",
        email: "test@example.com",
        isAnonymous: false,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle anonymous user", async () => {
      const mockUser: UserAccount = {
        id: "anon-user-id",
        email: null,
        isAnonymous: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: null,
      };

      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        authStateCallback(mockUser);
      });

      expect(result.current.user).toEqual({
        uid: "anon-user-id",
        email: null,
        isAnonymous: true,
      });
    });

    it("should handle no authenticated user", async () => {
      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        authStateCallback(null);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Chrome Test Environment", () => {
    let originalEnv: any;

    beforeEach(() => {
      originalEnv = process.env;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should auto-sign in anonymously in Chrome test environment", async () => {
      process.env.CHROME_TEST = "true";

      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);
      mockAuthBackend.signInAnonymously.mockResolvedValue(undefined);

      renderHook(() => useAuth());

      await act(async () => {
        // Wait for the effect to complete
      });

      expect(mockAuthBackend.signInAnonymously).toHaveBeenCalled();
    });

    it("should not auto-sign in if user already authenticated in test environment", async () => {
      process.env.EXPO_PUBLIC_CHROME_TEST = "true";

      const mockUser: UserAccount = {
        id: "existing-user",
        email: "test@example.com",
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: null,
      };

      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(mockUser);

      renderHook(() => useAuth());

      await act(async () => {
        // Wait for the effect to complete
      });

      expect(mockAuthBackend.signInAnonymously).not.toHaveBeenCalled();
    });

    it("should handle CI environment", async () => {
      process.env.CI = "true";

      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);
      mockAuthBackend.signInAnonymously.mockResolvedValue(undefined);

      renderHook(() => useAuth());

      await act(async () => {
        // Wait for the effect to complete
      });

      expect(mockAuthBackend.signInAnonymously).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle initialization errors", async () => {
      const error = new Error("Auth initialization failed");
      mockAuthBackend.subscribeToAuthState.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Wait for the effect to handle the error
      });

      expect(result.current.error).toEqual({
        code: "init-error",
        message: "Auth initialization failed",
      });
      expect(result.current.loading).toBe(false);
    });

    it("should handle unknown errors during initialization", async () => {
      mockAuthBackend.subscribeToAuthState.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Wait for the effect to handle the error
      });

      expect(result.current.error).toEqual({
        code: "init-error",
        message: "Unknown error",
      });
    });
  });

  describe("Authentication Methods", () => {
    beforeEach(() => {
      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return jest.fn();
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);
    });

    describe("signInAnonymously", () => {
      it("should sign in anonymously successfully", async () => {
        mockAuthBackend.signInAnonymously.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth());

        // Wait for initialization to complete first
        await act(async () => {
          // Wait for useEffect to complete
        });

        await act(async () => {
          await result.current.signInAnonymously();
        });

        expect(mockAuthBackend.signInAnonymously).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      it("should handle anonymous sign-in errors", async () => {
        const { result } = renderHook(() => useAuth());

        // Wait for initialization to complete first
        await act(async () => {
          // Wait for useEffect to complete
        });

        const error = new Error("Anonymous sign-in failed");
        mockAuthBackend.signInAnonymously.mockRejectedValue(error);

        await act(async () => {
          await result.current.signInAnonymously();
        });

        expect(result.current.error).toEqual({
          code: "sign-in-anonymous-error",
          message: "Anonymous sign-in failed",
        });
        expect(result.current.loading).toBe(false);
      });

      it("should handle unknown errors during anonymous sign-in", async () => {
        const { result } = renderHook(() => useAuth());

        // Wait for initialization to complete first
        await act(async () => {
          // Wait for useEffect to complete
        });

        mockAuthBackend.signInAnonymously.mockRejectedValue("Unknown error");

        await act(async () => {
          await result.current.signInAnonymously();
        });

        expect(result.current.error).toEqual({
          code: "sign-in-anonymous-error",
          message: "Failed to sign in anonymously",
        });
      });
    });

    describe("createAccount", () => {
      it("should create account successfully", async () => {
        mockAuthBackend.signUpWithEmail.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.createAccount("test@example.com", "password123");
        });

        expect(mockAuthBackend.signUpWithEmail).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
        );
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      it("should handle account creation errors", async () => {
        const error = new Error("Email already exists");
        mockAuthBackend.signUpWithEmail.mockRejectedValue(error);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.createAccount("test@example.com", "password123");
        });

        expect(result.current.error).toEqual({
          code: "create-account-error",
          message: "Email already exists",
        });
        expect(result.current.loading).toBe(false);
      });

      it("should handle unknown errors during account creation", async () => {
        mockAuthBackend.signUpWithEmail.mockRejectedValue("Unknown error");

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.createAccount("test@example.com", "password123");
        });

        expect(result.current.error).toEqual({
          code: "create-account-error",
          message: "Failed to create account",
        });
      });
    });

    describe("signIn", () => {
      it("should sign in successfully", async () => {
        mockAuthBackend.signInWithEmail.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockAuthBackend.signInWithEmail).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
        );
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      it("should handle sign-in errors", async () => {
        const error = new Error("Invalid credentials");
        mockAuthBackend.signInWithEmail.mockRejectedValue(error);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "wrongpassword");
        });

        expect(result.current.error).toEqual({
          code: "sign-in-error",
          message: "Invalid credentials",
        });
        expect(result.current.loading).toBe(false);
      });

      it("should handle unknown errors during sign-in", async () => {
        mockAuthBackend.signInWithEmail.mockRejectedValue("Unknown error");

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(result.current.error).toEqual({
          code: "sign-in-error",
          message: "Failed to sign in",
        });
      });
    });

    describe("signOut", () => {
      it("should sign out successfully", async () => {
        mockAuthBackend.signOut.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signOut();
        });

        expect(mockAuthBackend.signOut).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      it("should handle sign-out errors", async () => {
        const error = new Error("Sign-out failed");
        mockAuthBackend.signOut.mockRejectedValue(error);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signOut();
        });

        expect(result.current.error).toEqual({
          code: "sign-out-error",
          message: "Sign-out failed",
        });
        expect(result.current.loading).toBe(false);
      });

      it("should handle unknown errors during sign-out", async () => {
        mockAuthBackend.signOut.mockRejectedValue("Unknown error");

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signOut();
        });

        expect(result.current.error).toEqual({
          code: "sign-out-error",
          message: "Failed to sign out",
        });
      });
    });

    describe("clearError", () => {
      it("should clear error state", async () => {
        const error = new Error("Test error");
        mockAuthBackend.signOut.mockRejectedValue(error);

        const { result } = renderHook(() => useAuth());

        // First, create an error
        await act(async () => {
          await result.current.signOut();
        });

        expect(result.current.error).toBeTruthy();

        // Then clear the error
        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBe(null);
      });
    });
  });

  describe("Cleanup", () => {
    it("should unsubscribe from auth state changes on unmount", async () => {
      const unsubscribeMock = jest.fn();
      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return unsubscribeMock;
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);

      const { unmount } = renderHook(() => useAuth());

      // Wait for initialization to complete
      await act(async () => {
        // Wait for useEffect to complete
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it("should handle unmount when unsubscribe is undefined", () => {
      mockAuthBackend.subscribeToAuthState.mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return undefined; // No unsubscribe function
        },
      );
      mockAuthBackend.getCurrentUser.mockResolvedValue(null);

      const { unmount } = renderHook(() => useAuth());

      expect(() => unmount()).not.toThrow();
    });
  });
});
