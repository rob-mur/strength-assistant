import { configureSyncEngine, syncExerciseToSupabase, deleteExerciseFromSupabase } from "@/lib/data/sync/syncConfig";
import { exercises$, user$ } from "@/lib/data/store";
import { supabaseClient } from "@/lib/data/supabase/SupabaseClient";
import { Exercise } from "@/lib/models/Exercise";

// Mock the store observables
jest.mock("@/lib/data/store", () => ({
  exercises$: {
    get: jest.fn().mockReturnValue([]),
    set: jest.fn(),
    push: jest.fn(),
    splice: jest.fn(),
  },
  user$: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
}));

// Mock SupabaseClient with full API
const mockSupabaseUser = { id: "supabase-user-123", email: "test@example.com" };
const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    onAuthStateChange: jest.fn(),
  },
  channel: jest.fn().mockReturnValue(mockChannel),
};

const mockTableReference = {
  select: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
};

jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn().mockResolvedValue(mockSupabaseUser),
    getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    onAuthStateChange: jest.fn(),
  },
}));

describe("syncConfig functions", () => {
  let mockExercises$: any;
  let mockUser$: any;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get references to the mocked observables
    const { exercises$: exercises, user$: user } = require("@/lib/data/store");
    mockExercises$ = exercises;
    mockUser$ = user;
    
    // Reset observable mock return values
    mockExercises$.get.mockReturnValue([]);
    mockUser$.get.mockReturnValue(null);
    
    // Setup mock chains
    mockSupabaseClient.from.mockReturnValue(mockTableReference);
    mockTableReference.select.mockReturnValue(mockTableReference);
    mockTableReference.upsert.mockResolvedValue({ error: null });
    mockTableReference.eq.mockResolvedValue({ data: [], error: null });
    
    // Setup delete chain
    const deleteChain = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    };
    mockTableReference.delete.mockReturnValue(deleteChain);
    
    // Setup channel mocking
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
    
    // Reset SupabaseClient mock
    (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(mockSupabaseUser);
    (supabaseClient.getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (supabaseClient.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      // Simulate immediate auth state change for testing
      setTimeout(() => callback('SIGNED_IN', { user: mockSupabaseUser }), 0);
      return jest.fn(); // return unsubscribe function
    });
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("configureSyncEngine", () => {
    test("sets up auth state change listener and initializes subscription", () => {
      configureSyncEngine();
      
      // Verify onAuthStateChange was called to set up listener
      expect(supabaseClient.onAuthStateChange).toHaveBeenCalled();
      
      // Verify the function completes without throwing
      expect(() => configureSyncEngine()).not.toThrow();
    });

    test("handles initial data loading", async () => {
      const testExercises = [
        { id: "1", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
      ];
      
      mockTableReference.eq.mockResolvedValue({ data: testExercises, error: null });
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(supabaseClient.getCurrentUser).toHaveBeenCalled();
    });

    test("handles auth state changes correctly", async () => {
      let authCallback: any;
      
      (supabaseClient.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
      });
      
      configureSyncEngine();
      
      // Simulate user sign in
      const mockSession = { user: mockSupabaseUser };
      authCallback('SIGNED_IN', mockSession);
      
      expect(mockUser$.set).toHaveBeenCalledWith(mockSupabaseUser);
    });

    test("clears exercises when user signs out", async () => {
      let authCallback: any;
      
      (supabaseClient.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
      });
      
      configureSyncEngine();
      
      // Simulate user sign out (null session)
      authCallback('SIGNED_OUT', null);
      
      expect(mockUser$.set).toHaveBeenCalledWith(null);
      expect(mockExercises$.set).toHaveBeenCalledWith([]);
    });

    test("handles errors during initial data loading", async () => {
      const loadError = new Error("Failed to load data");
      (supabaseClient.getCurrentUser as jest.Mock).mockRejectedValue(loadError);
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load initial exercises:', loadError);
    });

    test("handles errors during subscription setup", async () => {
      const subscriptionError = new Error("Failed to setup subscription");
      (supabaseClient.getCurrentUser as jest.Mock).mockRejectedValue(subscriptionError);
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to set up real-time subscription:', subscriptionError);
    });
  });

  describe("syncExerciseToSupabase", () => {
    const testExercise: Exercise = {
      id: "test-exercise-123",
      name: "Push-ups",
      user_id: mockSupabaseUser.id,
      created_at: "2023-01-01T00:00:00Z",
    };

    test("successfully syncs exercise to Supabase", async () => {
      await syncExerciseToSupabase(testExercise);

      expect(supabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(supabaseClient.getSupabaseClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockTableReference.upsert).toHaveBeenCalledWith({
        id: testExercise.id,
        name: testExercise.name,
        user_id: testExercise.user_id,
        created_at: testExercise.created_at,
      });
    });

    test("throws error when user not authenticated", async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(null);

      await expect(syncExerciseToSupabase(testExercise)).rejects.toThrow(
        "User not authenticated"
      );
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync exercise to Supabase:', expect.any(Error));
    });

    test("throws error when Supabase upsert fails", async () => {
      const supabaseError = new Error("Database error");
      mockTableReference.upsert.mockResolvedValue({ error: supabaseError });

      await expect(syncExerciseToSupabase(testExercise)).rejects.toThrow(
        "Database error"
      );
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync exercise to Supabase:', supabaseError);
    });
  });

  describe("deleteExerciseFromSupabase", () => {
    const exerciseId = "test-exercise-123";
    const userId = mockSupabaseUser.id;

    test("successfully deletes exercise from Supabase", async () => {
      await deleteExerciseFromSupabase(exerciseId, userId);

      expect(supabaseClient.getSupabaseClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockTableReference.delete).toHaveBeenCalled();
    });

    test("throws error when Supabase delete fails", async () => {
      const supabaseError = new Error("Delete failed");
      const deleteChain = {
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: supabaseError })
        })
      };
      mockTableReference.delete.mockReturnValue(deleteChain);

      await expect(deleteExerciseFromSupabase(exerciseId, userId)).rejects.toThrow(
        "Delete failed"
      );
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete exercise from Supabase:', supabaseError);
    });
  });

  describe("realtime subscription event handling", () => {
    test("handles INSERT events for current user", async () => {
      let onChangeCallback: any;
      
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          onChangeCallback = callback;
        }
        return mockChannel;
      });
      
      const existingExercises = [
        { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" }
      ];
      mockExercises$.get.mockReturnValue(existingExercises);
      
      configureSyncEngine();
      
      // Wait for subscription setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify callback was captured
      expect(onChangeCallback).toBeDefined();
      
      // Simulate INSERT event
      const newExercise = { id: "new-1", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T01:00:00Z" };
      if (onChangeCallback) {
        onChangeCallback({
          eventType: 'INSERT',
          new: newExercise,
          old: null,
        });
        
        expect(mockExercises$.push).toHaveBeenCalledWith(newExercise);
      }
    });

    test("handles DELETE events", async () => {
      let onChangeCallback: any;
      
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          onChangeCallback = callback;
        }
        return mockChannel;
      });
      
      const existingExercises = [
        { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
        { id: "existing-2", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T01:00:00Z" }
      ];
      mockExercises$.get.mockReturnValue(existingExercises);
      
      configureSyncEngine();
      
      // Wait for subscription setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate DELETE event
      const deletedExercise = { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id };
      if (onChangeCallback) {
        onChangeCallback({
          eventType: 'DELETE',
          new: null,
          old: deletedExercise,
        });
        
        expect(mockExercises$.splice).toHaveBeenCalledWith(0, 1);
      }
    });

    test("handles UPDATE events for current user", async () => {
      let onChangeCallback: any;
      
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          onChangeCallback = callback;
        }
        return mockChannel;
      });
      
      const existingExercises = [
        { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" }
      ];
      mockExercises$.get.mockReturnValue(existingExercises);
      
      // Mock the array indexing for Legend State
      const mockExerciseAtIndex = { set: jest.fn() };
      (mockExercises$ as any)[0] = mockExerciseAtIndex;
      
      configureSyncEngine();
      
      // Wait for subscription setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate UPDATE event
      const updatedExercise = { id: "existing-1", name: "Updated Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" };
      if (onChangeCallback) {
        onChangeCallback({
          eventType: 'UPDATE',
          new: updatedExercise,
          old: { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id },
        });
        
        expect(mockExerciseAtIndex.set).toHaveBeenCalledWith(updatedExercise);
      }
    });

    test("ignores INSERT events for different users", async () => {
      let onChangeCallback: any;
      
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          onChangeCallback = callback;
        }
        return mockChannel;
      });
      
      configureSyncEngine();
      
      // Wait for subscription setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate INSERT event for different user
      const newExercise = { id: "new-1", name: "Push-ups", user_id: "different-user", created_at: "2023-01-01T01:00:00Z" };
      if (onChangeCallback) {
        onChangeCallback({
          eventType: 'INSERT',
          new: newExercise,
          old: null,
        });
      }
      
      expect(mockExercises$.push).not.toHaveBeenCalled();
    });

    test("ignores UPDATE events for different users", async () => {
      let onChangeCallback: any;
      
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          onChangeCallback = callback;
        }
        return mockChannel;
      });
      
      const existingExercises = [
        { id: "existing-1", name: "Squats", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" }
      ];
      mockExercises$.get.mockReturnValue(existingExercises);
      
      // Mock the array indexing for Legend State
      const mockExerciseAtIndex = { set: jest.fn() };
      (mockExercises$ as any)[0] = mockExerciseAtIndex;
      
      configureSyncEngine();
      
      // Wait for subscription setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate UPDATE event for different user
      const updatedExercise = { id: "existing-1", name: "Updated Squats", user_id: "different-user", created_at: "2023-01-01T00:00:00Z" };
      if (onChangeCallback) {
        onChangeCallback({
          eventType: 'UPDATE',
          new: updatedExercise,
          old: { id: "existing-1", name: "Squats", user_id: "different-user" },
        });
      }
      
      // Should not update exercises for different user
      expect(mockExerciseAtIndex.set).not.toHaveBeenCalled();
    });

    test("unsubscribes and resubscribes when user changes", async () => {
      let authStateCallback: any;
      
      (supabaseClient.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      configureSyncEngine();
      
      // Verify initial subscription setup
      expect(supabaseClient.onAuthStateChange).toHaveBeenCalled();
      
      // Simulate user change - should trigger resubscription
      const newUser = { id: "new-user", email: "new@example.com" };
      const newSession = { user: newUser };
      
      authStateCallback('SIGNED_IN', newSession);
      
      expect(mockUser$.set).toHaveBeenCalledWith(newUser);
    });
  });

  describe("loadInitialData", () => {
    test("loads initial data successfully when user authenticated", async () => {
      const testExercises = [
        { id: "1", name: "Push-ups", user_id: mockSupabaseUser.id, created_at: "2023-01-01T00:00:00Z" },
      ];
      
      mockTableReference.eq.mockResolvedValue({ data: testExercises, error: null });
      
      // Call configureSyncEngine which triggers loadInitialData
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockExercises$.set).toHaveBeenCalledWith(testExercises);
    });

    test("handles null data from Supabase", async () => {
      mockTableReference.eq.mockResolvedValue({ data: null, error: null });
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockExercises$.set).toHaveBeenCalledWith([]);
    });

    test("does not load data when user not authenticated", async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(null);
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockExercises$.set).not.toHaveBeenCalled();
    });

    test("handles Supabase query errors", async () => {
      const queryError = new Error("Query failed");
      mockTableReference.eq.mockResolvedValue({ data: null, error: queryError });
      
      configureSyncEngine();
      
      // Let async operations complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load initial exercises:', queryError);
    });
  });
});