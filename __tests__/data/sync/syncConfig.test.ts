/**
 * Comprehensive tests for syncConfig.ts to achieve 80% code coverage
 */

import {
  configureSyncEngine,
  syncExerciseToSupabase,
  deleteExerciseFromSupabase,
  syncHelpers,
} from "@/lib/data/sync/syncConfig";
import { Exercise } from "@/lib/models/Exercise";

// Mock all dependencies
jest.mock("@/lib/data/store", () => ({
  exercises$: {
    get: jest.fn(() => []),
    set: jest.fn(),
    push: jest.fn(),
    splice: jest.fn(),
  },
  user$: {
    set: jest.fn(),
  },
}));

jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
    getSupabaseClient: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

// Mock StorageManager
const mockAuthBackend = {
  getCurrentUser: jest.fn(),
};

const mockStorageManager = {
  getAuthBackend: jest.fn(() => mockAuthBackend),
};

jest.mock("@/lib/data/StorageManager", () => ({
  storageManager: mockStorageManager,
}));

// Mock global navigator
const mockNavigator = {
  onLine: true,
};
Object.defineProperty(global, "navigator", {
  value: mockNavigator,
  writable: true,
});

describe("syncConfig.ts", () => {
  let mockSupabaseClient: any;
  let mockExercises$: any;
  let mockUser$: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked dependencies
    mockSupabaseClient =
      require("@/lib/data/supabase/SupabaseClient").supabaseClient;
    const store = require("@/lib/data/store");
    mockExercises$ = store.exercises$;
    mockUser$ = store.user$;

    // Default mock implementations
    mockSupabaseClient.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe("syncExerciseToSupabase", () => {
    const mockExercise: Exercise = {
      id: "test-exercise-id",
      name: "Test Exercise",
      user_id: "test-user-id",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
      deleted: false,
    };

    it("successfully syncs exercise when user is authenticated", async () => {
      // Mock successful authentication
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
      mockSupabaseClient.getCurrentUser.mockResolvedValue({
        id: "supabase-user-id",
      });

      // Mock successful database operation
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await syncExerciseToSupabase(mockExercise, mockStorageManagerModule);

      expect(mockAuthBackend.getCurrentUser).toHaveBeenCalled();
      expect(mockSupabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith("exercises");
      expect(mockUpsert).toHaveBeenCalledWith({
        id: mockExercise.id,
        name: mockExercise.name,
        user_id: "supabase-user-id",
        created_at: mockExercise.created_at,
      });
    });

    it("skips sync when no Supabase session user", async () => {
      // Mock successful auth backend but no Supabase session
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
      mockSupabaseClient.getCurrentUser.mockResolvedValue(null);

      const mockFrom = jest.fn();
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await syncExerciseToSupabase(mockExercise, mockStorageManagerModule);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("handles Supabase client error gracefully", async () => {
      // Mock successful auth backend
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });

      // Mock Supabase getCurrentUser to throw error
      mockSupabaseClient.getCurrentUser.mockRejectedValue(
        new Error("Supabase error"),
      );

      const mockFrom = jest.fn();
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Should not throw and should skip sync
      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await syncExerciseToSupabase(mockExercise, mockStorageManagerModule);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("throws error when upsert fails with non-network error", async () => {
      // Mock successful authentication
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
      mockSupabaseClient.getCurrentUser.mockResolvedValue({
        id: "supabase-user-id",
      });

      // Mock database error
      const upsertError = new Error("Validation error");
      const mockUpsert = jest.fn().mockResolvedValue({ error: upsertError });
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await expect(
        syncExerciseToSupabase(mockExercise, mockStorageManagerModule),
      ).rejects.toThrow("Validation error");
    });

    it("handles network errors gracefully", async () => {
      // Mock successful authentication
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
      mockSupabaseClient.getCurrentUser.mockResolvedValue({
        id: "supabase-user-id",
      });

      // Mock network error
      const networkError = new Error("Network timeout");
      const mockUpsert = jest.fn().mockRejectedValue(networkError);
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Should not throw for network errors
      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await syncExerciseToSupabase(mockExercise, mockStorageManagerModule);

      expect(mockUpsert).toHaveBeenCalled();
    });

    it("handles timeout errors gracefully", async () => {
      // Mock successful authentication
      mockAuthBackend.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
      mockSupabaseClient.getCurrentUser.mockResolvedValue({
        id: "supabase-user-id",
      });

      // Mock timeout error
      const timeoutError = new Error("Request timeout");
      const mockUpsert = jest.fn().mockRejectedValue(timeoutError);
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      // Should not throw for timeout errors
      // Use dependency injection to avoid dynamic import
      const mockStorageManagerModule = { storageManager: mockStorageManager };
      await syncExerciseToSupabase(mockExercise, mockStorageManagerModule);

      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe("deleteExerciseFromSupabase", () => {
    it("successfully deletes exercise", async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ error: null });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = jest.fn().mockReturnValue({
        delete: mockDelete,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      await deleteExerciseFromSupabase("exercise-id", "user-id");

      expect(mockFrom).toHaveBeenCalledWith("exercises");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith("id", "exercise-id");
      expect(mockEq2).toHaveBeenCalledWith("user_id", "user-id");
    });

    it("throws error when delete fails", async () => {
      const deleteError = new Error("Delete failed");
      const mockEq2 = jest.fn().mockResolvedValue({ error: deleteError });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = jest.fn().mockReturnValue({
        delete: mockDelete,
      });
      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        from: mockFrom,
      });

      await expect(
        deleteExerciseFromSupabase("exercise-id", "user-id"),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("syncHelpers", () => {
    describe("forceSync", () => {
      it("successfully forces sync when user is authenticated", async () => {
        mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

        const mockData = [{ id: "1", name: "Exercise 1" }];
        const mockEq = jest
          .fn()
          .mockResolvedValue({ data: mockData, error: null });
        const mockSelect = jest.fn().mockReturnValue({
          eq: mockEq,
        });
        const mockFrom = jest.fn().mockReturnValue({
          select: mockSelect,
        });
        mockSupabaseClient.getSupabaseClient.mockReturnValue({
          from: mockFrom,
        });

        await syncHelpers.forceSync();

        expect(mockSupabaseClient.getCurrentUser).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith("exercises");
        expect(mockSelect).toHaveBeenCalledWith("*");
        expect(mockEq).toHaveBeenCalledWith("user_id", "user-id");
        expect(mockExercises$.set).toHaveBeenCalledWith(mockData);
      });

      it("skips sync when no user is authenticated", async () => {
        mockSupabaseClient.getCurrentUser.mockResolvedValue(null);

        const mockFrom = jest.fn();
        mockSupabaseClient.getSupabaseClient.mockReturnValue({
          from: mockFrom,
        });

        await syncHelpers.forceSync();

        expect(mockFrom).not.toHaveBeenCalled();
        expect(mockExercises$.set).not.toHaveBeenCalled();
      });

      it("handles errors gracefully", async () => {
        mockSupabaseClient.getCurrentUser.mockRejectedValue(
          new Error("Auth error"),
        );

        // Should not throw
        await syncHelpers.forceSync();

        expect(mockExercises$.set).not.toHaveBeenCalled();
      });

      it("handles database errors gracefully", async () => {
        mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

        const mockEq = jest
          .fn()
          .mockResolvedValue({ data: null, error: new Error("DB error") });
        const mockSelect = jest.fn().mockReturnValue({
          eq: mockEq,
        });
        const mockFrom = jest.fn().mockReturnValue({
          select: mockSelect,
        });
        mockSupabaseClient.getSupabaseClient.mockReturnValue({
          from: mockFrom,
        });

        // Should not throw and should not call set
        await syncHelpers.forceSync();

        expect(mockExercises$.set).not.toHaveBeenCalled();
      });
    });

    describe("isSyncing", () => {
      it("returns false (simplified implementation)", () => {
        expect(syncHelpers.isSyncing()).toBe(false);
      });
    });

    describe("isOnline", () => {
      it("returns navigator.onLine when available", () => {
        mockNavigator.onLine = true;
        expect(syncHelpers.isOnline()).toBe(true);

        mockNavigator.onLine = false;
        expect(syncHelpers.isOnline()).toBe(false);
      });

      it("returns true when navigator is not available", () => {
        const originalNavigator = global.navigator;
        // @ts-ignore
        delete global.navigator;

        expect(syncHelpers.isOnline()).toBe(true);

        global.navigator = originalNavigator;
      });

      it("returns true when navigator.onLine is not available", () => {
        const originalNavigator = global.navigator;
        global.navigator = {} as any;

        expect(syncHelpers.isOnline()).toBe(true);

        global.navigator = originalNavigator;
      });
    });

    describe("getPendingChangesCount", () => {
      it("returns 0 (simplified implementation)", () => {
        expect(syncHelpers.getPendingChangesCount()).toBe(0);
      });
    });

    describe("hasErrors", () => {
      it("returns false (simplified implementation)", () => {
        expect(syncHelpers.hasErrors()).toBe(false);
      });
    });

    describe("getErrorMessage", () => {
      it("returns undefined (simplified implementation)", () => {
        expect(syncHelpers.getErrorMessage()).toBeUndefined();
      });
    });
  });

  describe("real-time subscription", () => {
    it("sets up real-time subscription on auth state change", async () => {
      let authStateCallback: (event: string, session: any) => void;

      // Mock channel setup
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockReturnValue({
        subscribe: mockSubscribe,
      });
      const mockChannel = jest.fn().mockReturnValue({
        on: mockOn,
      });

      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        channel: mockChannel,
      });

      mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      // Configure sync engine
      configureSyncEngine();

      // Trigger auth state change with user
      authStateCallback("SIGNED_IN", { user: { id: "test-user" } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockUser$.set).toHaveBeenCalledWith({ id: "test-user" });
      expect(mockSupabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(mockChannel).toHaveBeenCalledWith("exercises");
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercises",
          filter: "user_id=eq.user-id",
        },
        expect.any(Function),
      );
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it("clears exercises on sign out", () => {
      let authStateCallback: (event: string, session: any) => void;

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      configureSyncEngine();

      // Trigger auth state change without user (sign out)
      authStateCallback("SIGNED_OUT", null);

      expect(mockUser$.set).toHaveBeenCalledWith(null);
      expect(mockExercises$.set).toHaveBeenCalledWith([]);
    });

    it("handles real-time INSERT events", async () => {
      let authStateCallback: (event: string, session: any) => void;
      let realtimeCallback: (payload: any) => void;

      // Mock channel setup
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockImplementation((event, config, callback) => {
        realtimeCallback = callback;
        return { subscribe: mockSubscribe };
      });
      const mockChannel = jest.fn().mockReturnValue({
        on: mockOn,
      });

      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        channel: mockChannel,
      });

      mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      // Set up initial exercises
      const existingExercises = [{ id: "existing", name: "Existing Exercise" }];
      mockExercises$.get.mockReturnValue(existingExercises);

      configureSyncEngine();

      // Trigger auth state change to set up subscription
      authStateCallback("SIGNED_IN", { user: { id: "test-user" } });

      // Wait for subscription setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate INSERT event
      const newExercise = {
        id: "new-exercise",
        name: "New Exercise",
        user_id: "user-id",
      };
      realtimeCallback({
        eventType: "INSERT",
        new: newExercise,
      });

      expect(mockExercises$.push).toHaveBeenCalledWith(newExercise);
    });

    it("handles real-time DELETE events", async () => {
      let authStateCallback: (event: string, session: any) => void;
      let realtimeCallback: (payload: any) => void;

      // Mock channel setup and capture callback
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockImplementation((event, config, callback) => {
        realtimeCallback = callback;
        return { subscribe: mockSubscribe };
      });
      const mockChannel = jest.fn().mockReturnValue({
        on: mockOn,
      });

      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        channel: mockChannel,
      });

      mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      // Set up exercises with one to delete
      const exercises = [
        { id: "keep", name: "Keep Exercise" },
        { id: "delete-me", name: "Delete Exercise" },
      ];
      mockExercises$.get.mockReturnValue(exercises);

      configureSyncEngine();

      // Trigger auth state change to set up subscription
      authStateCallback("SIGNED_IN", { user: { id: "test-user" } });

      // Wait for subscription setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate DELETE event
      realtimeCallback({
        eventType: "DELETE",
        old: { id: "delete-me", name: "Delete Exercise" },
      });

      expect(mockExercises$.splice).toHaveBeenCalledWith(1, 1);
    });

    it("handles real-time UPDATE events", async () => {
      let authStateCallback: (event: string, session: any) => void;
      let realtimeCallback: (payload: any) => void;

      // Mock channel setup
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockImplementation((event, config, callback) => {
        realtimeCallback = callback;
        return { subscribe: mockSubscribe };
      });
      const mockChannel = jest.fn().mockReturnValue({
        on: mockOn,
      });

      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        channel: mockChannel,
      });

      mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      // Set up exercises with one to update
      const exercises = [
        { id: "update-me", name: "Old Name" },
        { id: "other", name: "Other Exercise" },
      ];
      mockExercises$.get.mockReturnValue(exercises);

      // Mock the array-like access for exercises$
      const mockExerciseAtIndex = {
        set: jest.fn(),
      };
      mockExercises$[0] = mockExerciseAtIndex;

      configureSyncEngine();

      // Trigger auth state change to set up subscription
      authStateCallback("SIGNED_IN", { user: { id: "test-user" } });

      // Wait for subscription setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate UPDATE event
      const updatedExercise = {
        id: "update-me",
        name: "New Name",
        user_id: "user-id",
      };
      realtimeCallback({
        eventType: "UPDATE",
        new: updatedExercise,
      });

      expect(mockExerciseAtIndex.set).toHaveBeenCalledWith(updatedExercise);
    });

    it("handles subscription errors gracefully", async () => {
      let authStateCallback: (event: string, session: any) => void;

      mockSupabaseClient.getCurrentUser.mockRejectedValue(
        new Error("Connection error"),
      );

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      configureSyncEngine();

      // Should not throw when auth state change triggers subscription error
      expect(() => {
        authStateCallback("SIGNED_IN", { user: { id: "test-user" } });
      }).not.toThrow();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("unsubscribes from previous subscription on auth state change", () => {
      let authStateCallback: (event: string, session: any) => void;
      const mockUnsubscribe = jest.fn();

      // Mock subscription object
      const mockSubscription = {
        unsubscribe: mockUnsubscribe,
      };

      // Mock channel setup
      const mockSubscribe = jest.fn().mockReturnValue(mockSubscription);
      const mockOn = jest.fn().mockReturnValue({
        subscribe: mockSubscribe,
      });
      const mockChannel = jest.fn().mockReturnValue({
        on: mockOn,
      });

      mockSupabaseClient.getSupabaseClient.mockReturnValue({
        channel: mockChannel,
      });

      mockSupabaseClient.getCurrentUser.mockResolvedValue({ id: "user-id" });

      mockSupabaseClient.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      configureSyncEngine();

      // First auth state change - creates subscription
      authStateCallback("SIGNED_IN", { user: { id: "user1" } });

      // Wait for subscription setup
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Second auth state change - should unsubscribe previous
          authStateCallback("SIGNED_IN", { user: { id: "user2" } });

          expect(mockUnsubscribe).toHaveBeenCalled();
          resolve();
        }, 20);
      });
    });
  });
});
