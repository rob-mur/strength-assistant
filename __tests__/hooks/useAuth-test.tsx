import { useAuth } from "@/lib/hooks/useAuth";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";
import {
  auth,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "@/lib/data/firebase";

jest.mock("@/lib/utils/devLog");
jest.mock("@/lib/data/firebase");

const mockAuth = mock<typeof auth>();

describe("useAuth", () => {
  const mockUser = {
    uid: "test-user-123",
    email: "test@example.com",
  } as auth.User;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    mockReset(mockAuth);
    mockUnsubscribe = jest.fn();

    // Mock auth functions
    jest.mocked(auth);
    jest.mocked(auth.currentUser).mockReturnValue(null);
    jest.mocked(auth.onAuthStateChanged).mockReturnValue(mockUnsubscribe);
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({} as any);
    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({} as any);
    jest.mocked(signInAnonymously).mockResolvedValue({} as any);
    jest.mocked(signOut).mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with null user and loading state", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should set up auth state listener on mount", () => {
      renderHook(() => useAuth());

      expect(auth.onAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(auth.onAuthStateChanged).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should clean up auth state listener on unmount", () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("auth state changes", () => {
    it("should update state when user signs in", async () => {
      const { result } = renderHook(() => useAuth());

      // Get the callback passed to onAuthStateChanged
      const authStateCallback = jest.mocked(auth.onAuthStateChanged).mock
        .calls[0][0];

      // Simulate user sign in
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should update state when user signs out", async () => {
      const { result } = renderHook(() => useAuth());

      // Get the callback passed to onAuthStateChanged
      const authStateCallback = jest.mocked(auth.onAuthStateChanged).mock
        .calls[0][0];

      // Simulate user sign out
      act(() => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("signInWithEmail", () => {
    it("should successfully sign in with email and password", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithEmail("test@example.com", "password123");
      });

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    it("should handle sign in errors", async () => {
      const error = { code: "auth/user-not-found" };
      jest.mocked(auth.signInWithEmailAndPassword).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signInWithEmail(
            "test@example.com",
            "wrongpassword",
          );
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe("No account found with this email");
        expect(result.current.loading).toBe(false);
      });
    });

    it("should show loading state during sign in", async () => {
      let resolveSignIn: () => void;
      const signInPromise = new Promise<any>((resolve) => {
        resolveSignIn = resolve;
      });
      jest
        .mocked(auth.signInWithEmailAndPassword)
        .mockReturnValue(signInPromise);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signInWithEmail("test@example.com", "password123");
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveSignIn!();
        await signInPromise;
      });
    });
  });

  describe("createAccount", () => {
    it("should successfully create account", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.createAccount("test@example.com", "password123");
      });

      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    it("should handle create account errors", async () => {
      const error = { code: "auth/email-already-in-use" };
      jest.mocked(auth.createUserWithEmailAndPassword).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.createAccount("test@example.com", "password123");
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Email is already registered");
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("signInAnonymously", () => {
    it("should successfully sign in anonymously", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInAnonymously();
      });

      expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
    });

    it("should handle anonymous sign in errors", async () => {
      const error = { code: "auth/operation-not-allowed" };
      jest.mocked(auth.signInAnonymously).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signInAnonymously();
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe("auth/operation-not-allowed");
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("signOut", () => {
    it("should successfully sign out", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("should handle sign out errors", async () => {
      const error = new Error("Sign out failed");
      jest.mocked(auth.signOut).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe("An unexpected error occurred");
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("should map Firebase error codes to user-friendly messages", async () => {
      const errorCodes = [
        {
          code: "auth/user-not-found",
          message: "No account found with this email",
        },
        { code: "auth/wrong-password", message: "Incorrect password" },
        {
          code: "auth/email-already-in-use",
          message: "Email is already registered",
        },
        { code: "auth/weak-password", message: "Password is too weak" },
        { code: "auth/invalid-email", message: "Invalid email address" },
        {
          code: "auth/too-many-requests",
          message: "Too many attempts. Please try again later",
        },
      ];

      for (const { code, message } of errorCodes) {
        jest
          .mocked(auth.signInWithEmailAndPassword)
          .mockRejectedValue({ code });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signInWithEmail(
              "test@example.com",
              "password",
            );
          } catch (e) {
            // Expected to throw
          }
        });

        await waitFor(() => {
          expect(result.current.error).toBe(message);
        });
      }
    });

    it("should clear error state", () => {
      const { result } = renderHook(() => useAuth());

      // Set an error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("error clearing", () => {
    it("should clear error when starting new auth action", async () => {
      // Set up an initial error
      jest
        .mocked(auth.signInWithEmailAndPassword)
        .mockRejectedValue({ code: "auth/user-not-found" });

      const { result } = renderHook(() => useAuth());

      // Create an error
      await act(async () => {
        try {
          await result.current.signInWithEmail(
            "test@example.com",
            "wrongpassword",
          );
        } catch (e) {
          // Expected to throw
        }
      });

      // Verify error exists
      await waitFor(() => {
        expect(result.current.error).toBe("No account found with this email");
      });

      // Mock successful sign in for the next attempt
      jest.mocked(auth.signInWithEmailAndPassword).mockResolvedValue({} as any);

      // Start a new auth action - should clear the error
      await act(async () => {
        await result.current.signInWithEmail(
          "test@example.com",
          "correctpassword",
        );
      });

      // Error should be cleared
      expect(result.current.error).toBeNull();
    });
  });
});

