import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { logger } from "@/lib/data/firebase/logger";
import { Exercise } from "@/lib/models/Exercise";

// Create mock observables with necessary methods
const mockExercisesObservable = {
  get: jest.fn().mockReturnValue([]),
  set: jest.fn(),
};

const mockUserObservable = {
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
};

// Mock Legend State functions
const mockObserve = jest.fn();
const mockComputed = jest.fn();

jest.mock("@legendapp/state", () => ({
  observable: jest.fn(),
  observe: jest.fn(),
  computed: jest.fn(),
}));

// Mock the store observables
jest.mock("@/lib/data/store", () => {
  const mockExercisesObservable = {
    get: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  };
  
  const mockUserObservable = {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  };
  
  return {
    exercises$: mockExercisesObservable,
    user$: mockUserObservable,
    store$: {
      exercises: mockExercisesObservable,
      user: mockUserObservable,
    },
  };
});

// Mock the sync functions
const mockSyncExerciseToSupabase = jest.fn();
const mockDeleteExerciseFromSupabase = jest.fn();
const mockSyncHelpers = {
  isSyncing: jest.fn().mockReturnValue(false),
  isOnline: jest.fn().mockReturnValue(true),
  getPendingChangesCount: jest.fn().mockReturnValue(0),
  forceSync: jest.fn(),
  hasErrors: jest.fn().mockReturnValue(false),
  getErrorMessage: jest.fn().mockReturnValue(undefined),
};

jest.mock("@/lib/data/sync/syncConfig", () => ({
  syncExerciseToSupabase: jest.fn(),
  deleteExerciseFromSupabase: jest.fn(),
  syncHelpers: {
    isSyncing: jest.fn().mockReturnValue(false),
    isOnline: jest.fn().mockReturnValue(true),
    getPendingChangesCount: jest.fn().mockReturnValue(0),
    forceSync: jest.fn(),
    hasErrors: jest.fn().mockReturnValue(false),
    getErrorMessage: jest.fn().mockReturnValue(undefined),
  },
}));

// Mock logger
jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock SupabaseClient
const mockSupabaseUser = { id: "supabase-user-123", email: "test@example.com" };
jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn().mockResolvedValue(mockSupabaseUser),
  },
}));

// Mock crypto.randomUUID for consistent testing
const mockUUID = "test-uuid-123";
global.crypto = {
  randomUUID: jest.fn().mockReturnValue(mockUUID),
} as any;

describe("ExerciseRepo", () => {
  let repo: ExerciseRepo;
  let mockExercises$: any;
  let mockUser$: any;
  let mockSyncExercise: any;
  let mockDeleteExercise: any;
  let mockHelpers: any;
  const testUid = "test-user-123";
  const testExercise = { name: "Push-ups" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get references to the mocked observables
    const { exercises$, user$ } = require("@/lib/data/store");
    mockExercises$ = exercises$;
    mockUser$ = user$;
    
    // Get references to the mocked sync functions
    const { syncExerciseToSupabase, deleteExerciseFromSupabase, syncHelpers } = require("@/lib/data/sync/syncConfig");
    mockSyncExercise = syncExerciseToSupabase;
    mockDeleteExercise = deleteExerciseFromSupabase;
    mockHelpers = syncHelpers;
    
    // Get references to Legend State mocked functions
    const { observe, computed } = require("@legendapp/state");
    mockObserve.mockImplementation(observe);
    mockComputed.mockImplementation(computed);
    
    // Reset observable mock return values
    mockExercises$.get.mockReturnValue([]);
    mockUser$.get.mockReturnValue(null);
    
    // Reset sync mocks
    mockSyncExercise.mockResolvedValue(undefined);
    mockDeleteExercise.mockResolvedValue(undefined);
    
    // Reset SupabaseClient mock
    const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
    supabaseClient.getCurrentUser.mockResolvedValue(mockSupabaseUser);
    
    // Reset the singleton instance
    (ExerciseRepo as any).instance = undefined;
    repo = ExerciseRepo.getInstance();
  });

  test("getInstance returns singleton instance", () => {
    const repo1 = ExerciseRepo.getInstance();
    const repo2 = ExerciseRepo.getInstance();
    
    expect(repo1).toBe(repo2);
  });

  test("getExercisesCollectionPath returns correct path", () => {
    const path = (repo as any).getExercisesCollectionPath(testUid);
    expect(path).toBe(`users/${testUid}/exercises`);
  });

  describe("validateExerciseData", () => {
    test("validates correct exercise data", () => {
      const validData = { name: "Push-ups" };
      const isValid = (repo as any).validateExerciseData(validData);
      expect(isValid).toBe(true);
    });

    test("rejects data without name", () => {
      const invalidData = { id: "123" };
      const isValid = (repo as any).validateExerciseData(invalidData);
      expect(isValid).toBe(false);
    });

    test("rejects null data", () => {
      const isValid = (repo as any).validateExerciseData(null);
      expect(isValid).toBe(false);
    });

    test("rejects non-object data", () => {
      const isValid = (repo as any).validateExerciseData("string");
      expect(isValid).toBe(false);
    });

    test("rejects data with non-string name", () => {
      const invalidData = { name: 123 };
      const isValid = (repo as any).validateExerciseData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe("addExercise", () => {
    test("successfully adds an exercise with optimistic update", async () => {
      await repo.addExercise(testUid, testExercise);

      // Verify optimistic update was applied via set call with Supabase user ID
      expect(mockExercises$.set).toHaveBeenCalledWith([{
        id: mockUUID,
        name: testExercise.name,
        user_id: mockSupabaseUser.id,
        created_at: expect.any(String),
      }]);

      // Verify sync was called with Supabase user ID
      expect(mockSyncExercise).toHaveBeenCalledWith({
        id: mockUUID,
        name: testExercise.name,
        user_id: mockSupabaseUser.id,
        created_at: expect.any(String),
      });
    });

    test("throws error when sync fails and rolls back optimistic update", async () => {
      const syncError = new Error("Supabase sync error");
      mockSyncExercise.mockRejectedValue(syncError);

      await expect(repo.addExercise(testUid, testExercise)).rejects.toThrow("Supabase sync error");
      
      // Verify rollback was called - should be called twice: once for optimistic add, once for rollback
      expect(mockExercises$.set).toHaveBeenCalledTimes(2);
      // The second call should be the rollback to original state
      expect(mockExercises$.set).toHaveBeenLastCalledWith([]);
    });

    test("validates exercise input and throws error for invalid data", async () => {
      const invalidExercise = { name: "" };
      
      await expect(repo.addExercise(testUid, invalidExercise)).rejects.toThrow("Exercise name cannot be empty");
    });

    test("throws error when user not authenticated", async () => {
      const validExercise = { name: "Valid Exercise" };
      const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
      supabaseClient.getCurrentUser.mockResolvedValue(null);
      
      await expect(repo.addExercise(testUid, validExercise)).rejects.toThrow("User not authenticated with Supabase");
    });

    test("sanitizes exercise name before saving", async () => {
      const exerciseWithExtraSpaces = { name: "  Bench   Press  " };

      await repo.addExercise(testUid, exerciseWithExtraSpaces);

      // Verify the set was called with sanitized name and Supabase user ID
      expect(mockExercises$.set).toHaveBeenCalledWith([{
        id: mockUUID,
        name: "Bench Press",
        user_id: mockSupabaseUser.id,
        created_at: expect.any(String),
      }]);
    });
  });

  describe("getExerciseById", () => {
    test("successfully retrieves an exercise from local store", async () => {
      const testExerciseData: Exercise = {
        id: "exercise-123",
        name: testExercise.name,
        user_id: testUid,
        created_at: "2023-01-01T00:00:00Z",
      };
      
      // Mock the observable to return test data
      mockExercises$.get.mockReturnValue([testExerciseData]);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(result).toEqual(testExerciseData);
    });

    test("returns undefined when exercise not found", async () => {
      // Empty store
      mockExercises$.get.mockReturnValue([]);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(result).toBeUndefined();
    });

    test("returns undefined when exercise belongs to different user", async () => {
      const testExerciseData: Exercise = {
        id: "exercise-123",
        name: testExercise.name,
        user_id: "other-user",
        created_at: "2023-01-01T00:00:00Z",
      };
      
      mockExercises$.get.mockReturnValue([testExerciseData]);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(result).toBeUndefined();
    });
  });

  describe("getExercises", () => {
    test("returns a computed observable that filters exercises by current Supabase user", () => {
      const testExercises: Exercise[] = [
        { id: "ex1", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
        { id: "ex2", name: "Squats", user_id: "other-user", created_at: "2023-01-01T01:00:00Z" },
        { id: "ex3", name: "Pull-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T02:00:00Z" },
      ];
      
      // Mock computed to return a function that filters exercises
      const { computed } = require("@legendapp/state");
      computed.mockImplementation((fn: () => Exercise[]) => {
        return {
          get: fn,
          set: jest.fn(),
        };
      });
      
      mockExercises$.get.mockReturnValue(testExercises);
      mockUser$.get.mockReturnValue(mockSupabaseUser);

      const exercises$ = repo.getExercises(testUid);
      
      // Verify computed was called
      expect(computed).toHaveBeenCalled();
      
      // Get the computed function and test it
      const computedFn = computed.mock.calls[0][0];
      const result = computedFn();
      
      // Should only return exercises for the current Supabase user
      expect(result).toHaveLength(2);
      expect(result.every((ex: Exercise) => ex.user_id === mockSupabaseUser.id)).toBe(true);
    });
  });

  describe("subscribeToExercises", () => {
    test("sets up observation and calls callback with filtered exercises", () => {
      const mockCallback = jest.fn();
      const testExercises: Exercise[] = [
        { id: "ex1", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
        { id: "ex2", name: "Squats", user_id: "other-user", created_at: "2023-01-01T01:00:00Z" },
      ];
      
      const { observe } = require("@legendapp/state");
      
      // Mock observe to immediately call the callback with filtered data
      observe.mockImplementation((fn: () => void) => {
        fn(); // Immediately execute to simulate subscription
        return jest.fn(); // Return unsubscribe function
      });
      
      mockExercises$.get.mockReturnValue(testExercises);
      mockUser$.get.mockReturnValue(mockSupabaseUser);

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);

      expect(observe).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith([testExercises[0]]); // Only Supabase user's exercise
      expect(typeof unsubscribe).toBe("function");
    });

    test("returns unsubscribe function", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const { observe } = require("@legendapp/state");
      
      observe.mockReturnValue(mockUnsubscribe);

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);
      
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe("deleteExercise", () => {
    test("successfully deletes an exercise with optimistic update", async () => {
      const exerciseId = "exercise-123";
      const testExercises: Exercise[] = [
        { id: exerciseId, name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
        { id: "exercise-456", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T01:00:00Z" },
      ];
      
      mockExercises$.get.mockReturnValue(testExercises);

      await repo.deleteExercise(testUid, exerciseId);

      // Verify optimistic delete - set should be called with remaining exercise
      expect(mockExercises$.set).toHaveBeenCalledWith([
        { id: "exercise-456", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T01:00:00Z" },
      ]);

      // Verify sync was called with Supabase user ID
      expect(mockDeleteExercise).toHaveBeenCalledWith(exerciseId, mockSupabaseUser.id);
    });

    test("handles delete sync errors with rollback", async () => {
      const exerciseId = "exercise-123";
      const testExercises: Exercise[] = [
        { id: exerciseId, name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
      ];
      const syncError = new Error("Supabase delete error");
      
      mockExercises$.get.mockReturnValue(testExercises);
      mockDeleteExercise.mockRejectedValue(syncError);

      await expect(repo.deleteExercise(testUid, exerciseId)).rejects.toThrow("Supabase delete error");
      
      // Verify rollback - set should be called twice: once for optimistic delete, once for rollback
      expect(mockExercises$.set).toHaveBeenCalledTimes(2);
      expect(mockExercises$.set).toHaveBeenLastCalledWith(testExercises);
    });

    test("throws error when user not authenticated", async () => {
      const exerciseId = "valid-exercise-id";
      const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
      supabaseClient.getCurrentUser.mockResolvedValue(null);
      
      await expect(repo.deleteExercise(testUid, exerciseId)).rejects.toThrow("User not authenticated with Supabase");
    });

    test("validates exerciseId and throws error for invalid exerciseId", async () => {
      await expect(repo.deleteExercise(testUid, "")).rejects.toThrow("Valid exerciseId is required");
      await expect(repo.deleteExercise(testUid, "   ")).rejects.toThrow("Valid exerciseId is required");
    });
  });

  describe("offline-first capabilities", () => {
    test("isSyncing returns sync helper status", () => {
      mockHelpers.isSyncing.mockReturnValue(true);
      
      expect(repo.isSyncing()).toBe(true);
      expect(mockHelpers.isSyncing).toHaveBeenCalled();
    });

    test("isOnline returns online status", () => {
      mockHelpers.isOnline.mockReturnValue(false);
      
      expect(repo.isOnline()).toBe(false);
      expect(mockHelpers.isOnline).toHaveBeenCalled();
    });

    test("getPendingChangesCount returns count from helper", () => {
      mockHelpers.getPendingChangesCount.mockReturnValue(5);
      
      expect(repo.getPendingChangesCount()).toBe(5);
      expect(mockHelpers.getPendingChangesCount).toHaveBeenCalled();
    });

    test("forceSync calls sync helper", async () => {
      await repo.forceSync();
      
      expect(mockHelpers.forceSync).toHaveBeenCalled();
    });

    test("hasErrors returns error status", () => {
      mockHelpers.hasErrors.mockReturnValue(true);
      
      expect(repo.hasErrors()).toBe(true);
      expect(mockHelpers.hasErrors).toHaveBeenCalled();
    });

    test("getErrorMessage returns error message", () => {
      const errorMessage = "Sync failed";
      mockHelpers.getErrorMessage.mockReturnValue(errorMessage);
      
      expect(repo.getErrorMessage()).toBe(errorMessage);
      expect(mockHelpers.getErrorMessage).toHaveBeenCalled();
    });
  });
});