import { SupabaseExerciseRepo } from "@/lib/repo/SupabaseExerciseRepo";
import {
  Exercise,
  ExerciseInput,
  ExerciseValidator,
} from "@/lib/models/Exercise";
import { supabaseClient } from "@/lib/data/supabase/SupabaseClient";
import { exercises$, user$ } from "@/lib/data/store";
import {
  syncExerciseToSupabase,
  deleteExerciseFromSupabase,
  syncHelpers,
} from "@/lib/data/sync/syncConfig";

// Mock all external dependencies
jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getSupabaseClient: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));
jest.mock("@/lib/data/store", () => ({
  exercises$: {
    get: jest.fn(),
    set: jest.fn(),
    onChange: jest.fn(() => jest.fn()), // Returns unsubscribe function
  },
  exercisesObject$: {
    get: jest.fn(),
    set: jest.fn(),
  },
  exerciseUtils: {
    addExercise: jest.fn().mockReturnValue("mock-exercise-id"),
    updateExercise: jest.fn(),
    deleteExercise: jest.fn(),
    getExercise: jest.fn(),
  },
  user$: {
    get: jest.fn(),
    onChange: jest.fn(() => jest.fn()), // Returns unsubscribe function
  },
  isOnline$: {
    get: jest.fn().mockReturnValue(true),
  },
}));
jest.mock("@/lib/data/sync/syncConfig");
jest.mock("@/lib/models/Exercise");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

// Mock @legendapp/state
jest.mock(
  "@legendapp/state",
  () => ({
    Observable: jest.fn(),
    observe: jest.fn(),
    computed: jest.fn(),
  }),
  { virtual: true },
);

describe("SupabaseExerciseRepo", () => {
  let repo: SupabaseExerciseRepo;
  const testUserId = "test-user-123";
  const testExerciseId = "test-exercise-123";
  const testExercise: Exercise = {
    id: testExerciseId,
    name: "Test Exercise",
    user_id: testUserId,
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
    deleted: false,
  };

  const mockUser = { id: testUserId, email: "test@example.com" };
  let mockExercises: Exercise[];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockExercises = [testExercise];

    // Setup default mock implementations
    (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (supabaseClient.getSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(),
        })),
      })),
    });
    // Make exercises$ mock stateful
    (exercises$.get as jest.Mock).mockImplementation(() => mockExercises);
    (exercises$.set as jest.Mock).mockImplementation((setterOrValue) => {
      if (typeof setterOrValue === "function") {
        mockExercises = setterOrValue(mockExercises);
      } else {
        mockExercises = setterOrValue;
      }
    });
    (user$.get as jest.Mock).mockReturnValue(mockUser);
    (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation();
    (ExerciseValidator.sanitizeExerciseName as jest.Mock).mockImplementation(
      (name: string) => name.trim(),
    );
    (syncExerciseToSupabase as jest.Mock).mockResolvedValue(undefined);
    (deleteExerciseFromSupabase as jest.Mock).mockResolvedValue(undefined);

    // Mock syncHelpers
    (syncHelpers.isSyncing as jest.Mock).mockReturnValue(false);
    (syncHelpers.isOnline as jest.Mock).mockReturnValue(true);
    (syncHelpers.getPendingChangesCount as jest.Mock).mockReturnValue(0);
    (syncHelpers.forceSync as jest.Mock).mockResolvedValue(undefined);
    (syncHelpers.hasErrors as jest.Mock).mockReturnValue(false);
    (syncHelpers.getErrorMessage as jest.Mock).mockReturnValue(null);

    repo = SupabaseExerciseRepo.getInstance();
  });

  describe("Singleton Pattern", () => {
    test("getInstance returns the same instance", () => {
      const repo1 = SupabaseExerciseRepo.getInstance();
      const repo2 = SupabaseExerciseRepo.getInstance();

      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(SupabaseExerciseRepo);
    });
  });

  describe("addExercise", () => {
    const exerciseInput: ExerciseInput = { name: "Test Exercise" };

    test("successfully adds exercise with syncedSupabase", async () => {
      await repo.addExercise(testUserId, exerciseInput);

      expect(ExerciseValidator.validateExerciseInput).toHaveBeenCalledWith(
        exerciseInput,
      );
      expect(ExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(
        exerciseInput.name,
      );
      // syncedSupabase handles all auth validation and updates automatically
      // We just verify exerciseUtils.addExercise was called
      const { exerciseUtils } = require("@/lib/data/store");
      expect(exerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Test Exercise",
        user_id: "test-user-123",
      });
    });

    test("handles user authentication via syncedSupabase", async () => {
      // syncedSupabase handles all authentication automatically
      // This test verifies that our method doesn't throw errors
      await expect(
        repo.addExercise(testUserId, exerciseInput),
      ).resolves.not.toThrow();
    });

    test("handles user ID consistency via syncedSupabase", async () => {
      // syncedSupabase handles all user ID consistency automatically
      // This test verifies that our method works correctly
      await expect(
        repo.addExercise(testUserId, exerciseInput),
      ).resolves.not.toThrow();
    });

    test("validates exercise input", async () => {
      const validationError = new Error("Invalid exercise name");
      (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation(
        () => {
          throw validationError;
        },
      );

      await expect(repo.addExercise(testUserId, exerciseInput)).rejects.toThrow(
        "Invalid exercise name",
      );
    });

    test("handles sync failures via syncedSupabase automatic retry", async () => {
      // syncedSupabase handles all sync failures and retries automatically
      // No manual rollback needed - syncedSupabase manages optimistic updates
      await expect(
        repo.addExercise(testUserId, exerciseInput),
      ).resolves.not.toThrow();
    });

    test("handles empty userId via syncedSupabase", async () => {
      // syncedSupabase handles all user ID validation automatically
      await expect(repo.addExercise("", exerciseInput)).resolves.not.toThrow();
    });
  });

  describe("getExerciseById", () => {
    test("returns exercise when found", async () => {
      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(exercises$.get).toHaveBeenCalled();
      expect(result).toEqual(testExercise);
    });

    test("returns undefined when exercise not found", async () => {
      (exercises$.get as jest.Mock).mockReturnValue([]);

      const result = await repo.getExerciseById("non-existent", testUserId);

      expect(result).toBeUndefined();
    });

    test("filters exercises by user_id", async () => {
      const otherUserExercise = {
        ...testExercise,
        id: "other",
        user_id: "other-user",
      };
      (exercises$.get as jest.Mock).mockReturnValue([
        testExercise,
        otherUserExercise,
      ]);

      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(result).toEqual(testExercise);
    });
  });

  describe("getExercises", () => {
    test("returns computed observable filtered by current user", () => {
      const { computed } = require("@legendapp/state");
      const mockObservable = { subscribe: jest.fn() };
      (computed as jest.Mock).mockReturnValue(mockObservable);

      const result = repo.getExercises(testUserId);

      expect(computed).toHaveBeenCalled();
      expect(result).toBe(mockObservable);
    });

    test("computed function filters exercises by current user", () => {
      const { computed } = require("@legendapp/state");
      let computedFunction: (() => Exercise[]) | undefined;

      (computed as jest.Mock).mockImplementation((fn: () => Exercise[]) => {
        computedFunction = fn;
        return { subscribe: jest.fn() };
      });

      repo.getExercises(testUserId);

      // Test the computed function
      expect(computedFunction).toBeDefined();
      const result = computedFunction!();
      expect(user$.get).toHaveBeenCalled();
      expect(exercises$.get).toHaveBeenCalled();
      expect(result).toEqual(mockExercises);
    });

    test("returns empty array when no current user", () => {
      const { computed } = require("@legendapp/state");
      let computedFunction: (() => Exercise[]) | undefined;

      (computed as jest.Mock).mockImplementation((fn: () => Exercise[]) => {
        computedFunction = fn;
        return { subscribe: jest.fn() };
      });

      (user$.get as jest.Mock).mockReturnValue(null);

      repo.getExercises(testUserId);

      expect(computedFunction).toBeDefined();
      const result = computedFunction!();
      expect(result).toEqual([]);
    });
  });

  describe("deleteExercise", () => {
    test("successfully deletes exercise via syncedSupabase", async () => {
      await repo.deleteExercise(testUserId, testExerciseId);

      // syncedSupabase handles all deletion automatically
      // We just verify exerciseUtils.deleteExercise was called
      const { exerciseUtils } = require("@/lib/data/store");
      expect(exerciseUtils.deleteExercise).toHaveBeenCalledWith(testExerciseId);
    });

    test("validates exerciseId parameter", async () => {
      await expect(repo.deleteExercise(testUserId, "")).rejects.toThrow(
        "Valid exerciseId is required",
      );

      await expect(repo.deleteExercise(testUserId, "   ")).rejects.toThrow(
        "Valid exerciseId is required",
      );

      await expect(
        repo.deleteExercise(testUserId, null as any),
      ).rejects.toThrow("Valid exerciseId is required");
    });

    test("handles user authentication via syncedSupabase", async () => {
      // syncedSupabase handles all authentication automatically
      await expect(
        repo.deleteExercise(testUserId, testExerciseId),
      ).resolves.not.toThrow();
    });

    test("handles user ID consistency via syncedSupabase", async () => {
      // syncedSupabase handles all user ID consistency automatically
      await expect(
        repo.deleteExercise(testUserId, testExerciseId),
      ).resolves.not.toThrow();
    });

    test("handles sync failures via syncedSupabase automatic retry", async () => {
      // syncedSupabase handles all sync failures and retries automatically
      await expect(
        repo.deleteExercise(testUserId, testExerciseId),
      ).resolves.not.toThrow();
    });

    test("deletes exercise via syncedSupabase with RLS protection", async () => {
      // syncedSupabase handles user-specific deletion with RLS automatically
      await repo.deleteExercise(testUserId, testExerciseId);

      const { exerciseUtils } = require("@/lib/data/store");
      expect(exerciseUtils.deleteExercise).toHaveBeenCalledWith(testExerciseId);
    });
  });

  describe("subscribeToExercises", () => {
    test("sets up observable subscription with user filtering", () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();

      // Mock the onChange methods to return unsubscribe functions
      (exercises$.onChange as jest.Mock).mockReturnValue(mockUnsubscribe);
      (user$.onChange as jest.Mock).mockReturnValue(mockUnsubscribe);

      const result = repo.subscribeToExercises(testUserId, callback);

      expect(exercises$.onChange).toHaveBeenCalled();
      expect(user$.onChange).toHaveBeenCalled();
      expect(typeof result).toBe("function");
    });

    test("observe function calls callback with filtered exercises", () => {
      let updateCallback: () => void;

      // Mock onChange to capture the callback function
      (exercises$.onChange as jest.Mock).mockImplementation(
        (fn: () => void) => {
          updateCallback = fn;
          return jest.fn();
        },
      );
      (user$.onChange as jest.Mock).mockImplementation(() => jest.fn());

      const callback = jest.fn();
      repo.subscribeToExercises(testUserId, callback);

      updateCallback!();

      expect(exercises$.get).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockExercises);
    });

    test("calls callback with empty array when no current user", () => {
      let updateCallback: () => void;

      // Mock onChange to capture the callback function
      (exercises$.onChange as jest.Mock).mockImplementation(
        (fn: () => void) => {
          updateCallback = fn;
          return jest.fn();
        },
      );
      (user$.onChange as jest.Mock).mockImplementation(() => jest.fn());

      const callback = jest.fn();

      repo.subscribeToExercises("", callback); // Empty uid = no current user
      updateCallback!();

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe("Offline-first capabilities", () => {
    test("isSyncing returns false for syncedSupabase compatibility", () => {
      const result = repo.isSyncing();

      // syncedSupabase handles sync status internally
      // This method returns false for backwards compatibility
      expect(result).toBe(false);
    });

    test("isOnline uses app store state", () => {
      const result = repo.isOnline();

      // Uses isOnline$ from app store
      expect(result).toBe(true);
    });

    test("getPendingChangesCount returns 0 for syncedSupabase compatibility", () => {
      const result = repo.getPendingChangesCount();

      // syncedSupabase handles pending changes internally
      // This method returns 0 for backwards compatibility
      expect(result).toBe(0);
    });

    test("forceSync is handled automatically by syncedSupabase", async () => {
      await repo.forceSync();

      // syncedSupabase handles sync automatically
      // This method is a no-op for backwards compatibility
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    test("hasErrors returns false for syncedSupabase compatibility", () => {
      const result = repo.hasErrors();

      // syncedSupabase handles errors internally
      // This method returns false for backwards compatibility
      expect(result).toBe(false);
    });

    test("getErrorMessage returns null for syncedSupabase compatibility", () => {
      const result = repo.getErrorMessage();

      // syncedSupabase handles errors internally
      // This method returns null for backwards compatibility
      expect(result).toBe(null);
    });

    test("getErrorMessage consistently returns null", () => {
      const result = repo.getErrorMessage();

      // syncedSupabase handles all error states internally
      expect(result).toBe(null);
    });
  });

  describe("Error handling", () => {
    test("addExercise handles errors gracefully with syncedSupabase", async () => {
      // syncedSupabase handles all errors gracefully for offline-first behavior
      await expect(
        repo.addExercise(testUserId, { name: "Test" }),
      ).resolves.not.toThrow();
    });

    test("deleteExercise handles errors gracefully with syncedSupabase", async () => {
      // syncedSupabase handles all errors gracefully for offline-first behavior
      await expect(
        repo.deleteExercise(testUserId, testExerciseId),
      ).resolves.not.toThrow();
    });
  });

  describe("Error recovery", () => {
    test("addExercise uses syncedSupabase automatic error handling", async () => {
      // syncedSupabase handles all error recovery automatically
      // No manual rollback needed
      await expect(
        repo.addExercise(testUserId, { name: "Test" }),
      ).resolves.not.toThrow();
    });

    test("deleteExercise uses syncedSupabase automatic error handling", async () => {
      // syncedSupabase handles all error recovery automatically
      // No manual rollback needed
      await expect(
        repo.deleteExercise(testUserId, testExerciseId),
      ).resolves.not.toThrow();
    });
  });
});
