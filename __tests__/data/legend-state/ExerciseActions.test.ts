/**
 * ExerciseActions Tests - Comprehensive Coverage
 *
 * Essential test coverage for the ExerciseActions class focusing on:
 * - Exercise CRUD operations with optimistic updates
 * - Authentication operations and state management
 * - Sync operations and error handling
 * - Migration and backend switching functionality
 * - Helper functions and state access
 */

import ExerciseActionsImpl, {
  exerciseActions,
  getExercises,
  getCurrentUser,
  getSyncState,
  getFeatureFlags,
} from "../../../lib/data/legend-state/ExerciseActions";

// Mock dependencies
jest.mock("../../../lib/data/legend-state/ExerciseStore", () => {
  // Create a mock function that can be overridden in tests
  const mockExercisesGet = jest.fn(() => ({}));

  // Create a proxy that handles dynamic property access for exercises
  const exercisesProxy = new Proxy(
    {},
    {
      get: function (target: any, prop: string | symbol) {
        if (typeof prop === "string") {
          if (prop === "get") {
            return mockExercisesGet;
          } else if (prop === "set") {
            return jest.fn();
          } else {
            // Dynamic exercise ID - return mock with get, set, delete methods
            return {
              get: jest.fn(),
              set: jest.fn(),
              delete: jest.fn(),
            };
          }
        }
        // Default return for symbol props or other cases
        return undefined;
      },
    },
  );

  return {
    exerciseStore: {
      exercises: exercisesProxy,
      user: {
        get: jest.fn(() => null),
        set: jest.fn(),
      },
      syncState: {
        isSyncing: {
          set: jest.fn(),
        },
        pendingChanges: {
          set: jest.fn(),
        },
        errors: {
          set: jest.fn(),
        },
        lastSyncAt: {
          set: jest.fn(),
        },
        get: jest.fn(() => ({
          isOnline: true,
          isSyncing: false,
          lastSyncAt: null,
          pendingChanges: 0,
          errors: [],
        })),
      },
      featureFlags: {
        useSupabaseData: {
          get: jest.fn(() => false),
          set: jest.fn(),
        },
        get: jest.fn(() => ({
          useSupabaseData: false,
        })),
      },
    },
    reinitializeSync: jest.fn(),
  };
});

jest.mock("../../../lib/data/StorageManager", () => ({
  storageManager: {
    getAuthBackend: jest.fn(),
    validateDataConsistency: jest.fn(),
    migrateUserData: jest.fn(),
    switchBackend: jest.fn(),
    firebaseStorage: {},
    supabaseStorage: {},
  },
}));

// Import mocked modules for type safety
import {
  exerciseStore,
  reinitializeSync,
} from "../../../lib/data/legend-state/ExerciseStore";
import { storageManager } from "../../../lib/data/StorageManager";

describe("ExerciseActions", () => {
  const originalConsole = console;
  const mockConsole = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(console, mockConsole);

    // Reset all mocks to default state
    (reinitializeSync as jest.Mock).mockImplementation(() => {});

    // Setup default mock returns
    (exerciseStore.user.get as jest.Mock).mockReturnValue({
      id: "user123",
      email: "test@example.com",
      isAnonymous: false,
      isAuthenticated: true,
    });

    (exerciseStore.exercises.get as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  describe("Singleton Pattern", () => {
    it("should export a singleton instance", () => {
      expect(exerciseActions).toBeInstanceOf(ExerciseActionsImpl);
      expect(typeof exerciseActions.addExercise).toBe("function");
      expect(typeof exerciseActions.signIn).toBe("function");
    });

    it("should export the class for testing", () => {
      expect(ExerciseActionsImpl).toBeDefined();
      const instance = new ExerciseActionsImpl();
      expect(instance).toBeInstanceOf(ExerciseActionsImpl);
    });
  });

  describe("Exercise CRUD Operations", () => {
    describe("addExercise", () => {
      it("should handle add exercise workflow", async () => {
        await exerciseActions.addExercise("Push Up");

        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          true,
        );
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });

      it("should handle errors during add exercise", async () => {
        const error = new Error("Add failed");
        (exerciseStore.user.get as jest.Mock).mockImplementation(() => {
          throw error;
        });

        await exerciseActions.addExercise("Push Up");

        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });
    });

    describe("updateExercise", () => {
      it("should handle update exercise workflow", async () => {
        // Mock that exercise exists
        const mockExercise = {
          id: "ex123",
          name: "Old Name",
          createdAt: "2023-01-01T00:00:00.000Z",
        };
        const mockExerciseGet = jest.fn().mockReturnValue(mockExercise);
        const mockExerciseSet = jest.fn();

        // Mock the store structure correctly
        (exerciseStore.exercises as any)["ex123"] = {
          get: mockExerciseGet,
          set: mockExerciseSet,
        };

        await exerciseActions.updateExercise("ex123", "New Name");

        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          true,
        );
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });

      it("should handle error when exercise not found", async () => {
        const mockExerciseGet = jest.fn().mockReturnValue(null);
        (exerciseStore.exercises as any)["nonexistent"] = {
          get: mockExerciseGet,
        };

        await exerciseActions.updateExercise("nonexistent", "New Name");

        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });

    describe("deleteExercise", () => {
      it("should handle delete exercise workflow", async () => {
        const mockExercise = { id: "ex123", name: "Exercise" };
        const mockExerciseGet = jest.fn().mockReturnValue(mockExercise);
        const mockExerciseDelete = jest.fn();
        (exerciseStore.exercises as any)["ex123"] = {
          get: mockExerciseGet,
          delete: mockExerciseDelete,
        };

        await exerciseActions.deleteExercise("ex123");

        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          true,
        );
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });

      it("should handle error when exercise not found for delete", async () => {
        const mockExerciseGet = jest.fn().mockReturnValue(null);
        (exerciseStore.exercises as any)["nonexistent"] = {
          get: mockExerciseGet,
        };

        await exerciseActions.deleteExercise("nonexistent");

        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });
  });

  describe("Authentication Operations", () => {
    describe("signIn", () => {
      it("should sign in user and update state", async () => {
        const mockUserAccount = {
          id: "user123",
          email: "test@example.com",
          isAnonymous: false,
        };

        const mockAuthBackend = {
          signInWithEmail: jest.fn().mockResolvedValue(mockUserAccount),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await exerciseActions.signIn("test@example.com", "password123");

        expect(mockAuthBackend.signInWithEmail).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
        );
        expect(exerciseStore.user.set).toHaveBeenCalledWith({
          id: "user123",
          email: "test@example.com",
          isAnonymous: false,
          isAuthenticated: true,
        });
        expect(reinitializeSync).toHaveBeenCalled();
      });

      it("should handle sign in errors", async () => {
        const error = new Error("Invalid credentials");
        const mockAuthBackend = {
          signInWithEmail: jest.fn().mockRejectedValue(error),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await expect(
          exerciseActions.signIn("test@example.com", "wrong"),
        ).rejects.toThrow("Invalid credentials");
        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });

    describe("signUp", () => {
      it("should sign up new user and update state", async () => {
        const mockUserAccount = {
          id: "newuser123",
          email: "new@example.com",
          isAnonymous: false,
        };

        const mockAuthBackend = {
          signUpWithEmail: jest.fn().mockResolvedValue(mockUserAccount),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await exerciseActions.signUp("new@example.com", "password123");

        expect(mockAuthBackend.signUpWithEmail).toHaveBeenCalledWith(
          "new@example.com",
          "password123",
        );
        expect(exerciseStore.user.set).toHaveBeenCalledWith({
          id: "newuser123",
          email: "new@example.com",
          isAnonymous: false,
          isAuthenticated: true,
        });
        expect(reinitializeSync).toHaveBeenCalled();
      });

      it("should handle sign up errors", async () => {
        const error = new Error("Email already exists");
        const mockAuthBackend = {
          signUpWithEmail: jest.fn().mockRejectedValue(error),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await expect(
          exerciseActions.signUp("existing@example.com", "password"),
        ).rejects.toThrow("Email already exists");
        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });

    describe("signInAnonymously", () => {
      it("should sign in anonymously and update state", async () => {
        const mockUserAccount = {
          id: "anon123",
          email: undefined,
          isAnonymous: true,
        };

        const mockAuthBackend = {
          signInAnonymously: jest.fn().mockResolvedValue(mockUserAccount),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await exerciseActions.signInAnonymously();

        expect(mockAuthBackend.signInAnonymously).toHaveBeenCalled();
        expect(exerciseStore.user.set).toHaveBeenCalledWith({
          id: "anon123",
          email: undefined,
          isAnonymous: true,
          isAuthenticated: false,
        });
      });

      it("should handle anonymous sign in errors", async () => {
        const error = new Error("Anonymous auth failed");
        const mockAuthBackend = {
          signInAnonymously: jest.fn().mockRejectedValue(error),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await expect(exerciseActions.signInAnonymously()).rejects.toThrow(
          "Anonymous auth failed",
        );
        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });

    describe("signOut", () => {
      it("should sign out user and clear state", async () => {
        const mockAuthBackend = {
          signOut: jest.fn().mockResolvedValue(undefined),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await exerciseActions.signOut();

        expect(mockAuthBackend.signOut).toHaveBeenCalled();
        expect(exerciseStore.user.set).toHaveBeenCalledWith(null);
        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith([]);
      });

      it("should handle sign out errors", async () => {
        const error = new Error("Sign out failed");
        const mockAuthBackend = {
          signOut: jest.fn().mockRejectedValue(error),
        };

        (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
          mockAuthBackend,
        );

        await expect(exerciseActions.signOut()).rejects.toThrow(
          "Sign out failed",
        );
        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });
  });

  describe("Sync Operations", () => {
    describe("forceSync", () => {
      it("should force sync by reinitializing", async () => {
        await exerciseActions.forceSync();

        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          true,
        );
        expect(reinitializeSync).toHaveBeenCalled();
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });

      it("should handle force sync errors", async () => {
        const error = new Error("Sync failed");
        (reinitializeSync as jest.Mock).mockImplementation(() => {
          throw error;
        });

        await exerciseActions.forceSync();

        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
          expect.any(Function),
        );
        expect(exerciseStore.syncState.isSyncing.set).toHaveBeenCalledWith(
          false,
        );
      });
    });

    describe("clearSyncErrors", () => {
      it("should clear sync errors", () => {
        exerciseActions.clearSyncErrors();

        expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith([]);
      });
    });
  });

  describe("Migration Operations", () => {
    describe("validateConsistency", () => {
      it("should validate data consistency (Supabase only)", async () => {
        const result = await exerciseActions.validateConsistency();

        // With Firebase removed, consistency validation always returns true
        expect(result).toEqual({ isConsistent: true, errors: [] });
      });

      it("should handle validation errors (Supabase only)", async () => {
        const result = await exerciseActions.validateConsistency();

        // With Firebase removed, validation errors don't occur
        expect(result).toEqual({ isConsistent: true, errors: [] });
      });

      it("should handle string errors (Supabase only)", async () => {
        const result = await exerciseActions.validateConsistency();

        // With Firebase removed, string errors don't occur
        expect(result).toEqual({ isConsistent: true, errors: [] });
      });
    });

    // migrateToSupabase method removed - Firebase no longer exists

    // switchBackend method removed - Firebase no longer exists
  });

  describe("Helper Functions", () => {
    describe("getExercises", () => {
      it("should return exercises as array", () => {
        const mockExercises = {
          ex1: { id: "ex1", name: "Push Up" },
          ex2: { id: "ex2", name: "Squats" },
        };

        // Set up the mock and test directly with the current module
        (exerciseStore.exercises.get as jest.Mock).mockReturnValue(
          mockExercises,
        );

        const result = getExercises();

        expect(result).toEqual([
          { id: "ex1", name: "Push Up" },
          { id: "ex2", name: "Squats" },
        ]);
        expect(exerciseStore.exercises.get).toHaveBeenCalled();
      });

      it("should return empty array when no exercises", () => {
        (exerciseStore.exercises.get as jest.Mock).mockReturnValue({});

        const result = getExercises();

        expect(result).toEqual([]);
      });
    });

    describe("getCurrentUser", () => {
      it("should return current user", () => {
        const mockUser = {
          id: "user123",
          email: "test@example.com",
          isAnonymous: false,
          isAuthenticated: true,
        };

        (exerciseStore.user.get as jest.Mock).mockReturnValue(mockUser);

        const result = getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(exerciseStore.user.get).toHaveBeenCalled();
      });

      it("should return null when no user", () => {
        (exerciseStore.user.get as jest.Mock).mockReturnValue(null);

        const result = getCurrentUser();

        expect(result).toBeNull();
      });
    });

    describe("getSyncState", () => {
      it("should return sync state", () => {
        const mockSyncState = {
          isOnline: true,
          isSyncing: false,
          lastSyncAt: "2024-01-01T00:00:00.000Z",
          pendingChanges: 2,
          errors: [],
        };

        (exerciseStore.syncState.get as jest.Mock).mockReturnValue(
          mockSyncState,
        );

        const result = getSyncState();

        expect(result).toEqual(mockSyncState);
        expect(exerciseStore.syncState.get).toHaveBeenCalled();
      });
    });

    describe("getFeatureFlags", () => {
      it("should return feature flags", () => {
        const mockFlags = {
          useSupabaseData: true,
        };

        (exerciseStore.featureFlags.get as jest.Mock).mockReturnValue(
          mockFlags,
        );

        const result = getFeatureFlags();

        expect(result).toEqual(mockFlags);
        expect(exerciseStore.featureFlags.get).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle error strings in handleActionError", async () => {
      (exerciseStore.user.get as jest.Mock).mockImplementation(() => {
        throw "String error message";
      });

      await exerciseActions.addExercise("Test");

      expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should handle unknown error types", async () => {
      (exerciseStore.user.get as jest.Mock).mockImplementation(() => {
        throw { complex: "object error" };
      });

      await exerciseActions.addExercise("Test");

      expect(exerciseStore.syncState.errors.set).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });

  describe("Development Logging", () => {
    beforeEach(() => {
      (global as any).__DEV__ = true;
    });

    afterEach(() => {
      (global as any).__DEV__ = false;
    });

    it("should log success messages in development", async () => {
      const mockUserAccount = {
        id: "user123",
        email: "test@example.com",
        isAnonymous: false,
      };

      const mockAuthBackend = {
        signInWithEmail: jest.fn().mockResolvedValue(mockUserAccount),
      };

      (storageManager.getAuthBackend as jest.Mock).mockReturnValue(
        mockAuthBackend,
      );

      await exerciseActions.signIn("test@example.com", "password");

      expect(mockConsole.info).toHaveBeenCalledWith(
        "✅ User signed in successfully",
      );
    });

    it("should log error messages in development", async () => {
      const error = new Error("Test error");
      (exerciseStore.user.get as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await exerciseActions.addExercise("Test");

      expect(mockConsole.error).toHaveBeenCalledWith(
        "❌",
        "Failed to add exercise: Test error",
      );
    });
  });

  describe("Helper Functions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("getExercises", () => {
      it("should return array of exercises from store", () => {
        const mockExercises = {
          ex1: { id: "ex1", name: "Exercise 1" },
          ex2: { id: "ex2", name: "Exercise 2" },
        };
        (exerciseStore.exercises.get as jest.Mock).mockReturnValue(
          mockExercises,
        );

        const result = getExercises();

        expect(result).toEqual([
          { id: "ex1", name: "Exercise 1" },
          { id: "ex2", name: "Exercise 2" },
        ]);
        expect(exerciseStore.exercises.get).toHaveBeenCalled();
      });
    });

    describe("getCurrentUser", () => {
      it("should return current user from store", () => {
        const mockUser = { id: "user123", email: "test@example.com" };
        (exerciseStore.user.get as jest.Mock).mockReturnValue(mockUser);

        const result = getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(exerciseStore.user.get).toHaveBeenCalled();
      });
    });

    describe("getSyncState", () => {
      it("should return sync state from store", () => {
        const mockSyncState = { isOnline: true, lastSync: new Date() };
        (exerciseStore.syncState.get as jest.Mock).mockReturnValue(
          mockSyncState,
        );

        const result = getSyncState();

        expect(result).toEqual(mockSyncState);
        expect(exerciseStore.syncState.get).toHaveBeenCalled();
      });
    });

    describe("getFeatureFlags", () => {
      it("should return feature flags from store", () => {
        const mockFeatureFlags = { newFeature: true, betaFeature: false };
        (exerciseStore.featureFlags.get as jest.Mock).mockReturnValue(
          mockFeatureFlags,
        );

        const result = getFeatureFlags();

        expect(result).toEqual(mockFeatureFlags);
        expect(exerciseStore.featureFlags.get).toHaveBeenCalled();
      });
    });
  });
});
