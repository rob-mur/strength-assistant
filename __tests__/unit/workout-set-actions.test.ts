/**
 * Unit Tests: Workout Set Actions
 *
 * Purpose: Test workout set actions functionality without mocking Legend State
 * Coverage: CRUD operations, error handling, data validation
 */

import { workoutSetActions } from "../../lib/store/workoutSetStore";
import {
  WorkoutSet,
  CreateWorkoutSetRequest,
} from "../../lib/models/WorkoutSet";

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
};

// Mock data factory
const createMockWorkoutSet = (
  overrides: Partial<WorkoutSet> = {},
): WorkoutSet => ({
  id: `mock-id-${Date.now()}-${Math.random()}`,
  exercise_id: "exercise-123",
  user_id: "user-456",
  session_date: "2025-11-19",
  weight: 135,
  repetitions: 8,
  rpe: 7.5,
  set_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockSetRequest = (
  overrides: Partial<CreateWorkoutSetRequest> = {},
): CreateWorkoutSetRequest => ({
  exercise_id: "exercise-123",
  weight: 135,
  repetitions: 8,
  rpe: 7.5,
  session_date: "2025-11-19",
  ...overrides,
});

// Mock Supabase client
jest.mock("../../lib/data/supabase/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

describe("workoutSetActions", () => {
  const mockSet = createMockWorkoutSet();
  const mockSetRequest = createMockSetRequest();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSet", () => {
    it("creates a new set successfully", async () => {
      // Mock the query chain for getNextSetOrder
      const mockSetOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Mock the query chain for creating the set
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSet, error: null }),
      };

      // Mock Supabase client to return different queries for different calls
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === "workout_sets") {
          // Return different mocks based on the call order
          if (mockSupabaseClient.from.mock.calls.length === 1) {
            return mockSetOrderQuery; // First call is for getting set order
          } else {
            return mockInsertQuery; // Second call is for inserting
          }
        }
        return {};
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-456" } },
      });

      const result = await workoutSetActions.createSet(mockSetRequest);

      expect(result).toEqual(mockSet);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("workout_sets");
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockSetRequest,
          user_id: "user-456",
          set_order: expect.any(Number),
        }),
      );
    });

    it("handles authentication errors", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(workoutSetActions.createSet(mockSetRequest)).rejects.toThrow(
        "User must be authenticated to create sets",
      );
    });

    it("handles Supabase errors", async () => {
      // Mock the query chain for getNextSetOrder
      const mockSetOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Mock the query chain for creating the set with error
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({
            data: null,
            error: new Error("Database error"),
          }),
      };

      // Mock Supabase client to return different queries for different calls
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === "workout_sets") {
          callCount++;
          if (callCount === 1) {
            return mockSetOrderQuery; // First call is for getting set order
          } else {
            return mockInsertQuery; // Second call is for inserting
          }
        }
        return {};
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-456" } },
      });

      await expect(workoutSetActions.createSet(mockSetRequest)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("updateSet", () => {
    it("updates a set successfully", async () => {
      const updatedSet = { ...mockSet, weight: 140 };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedSet, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await workoutSetActions.updateSet(mockSet.id, {
        weight: 140,
      });

      expect(result).toEqual(updatedSet);
      expect(mockQuery.update).toHaveBeenCalledWith({ weight: 140 });
      expect(mockQuery.eq).toHaveBeenCalledWith("id", mockSet.id);
    });

    it("handles update errors", async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: null, error: new Error("Update failed") }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(
        workoutSetActions.updateSet("invalid-id", { weight: 200 }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("deleteSet", () => {
    it("deletes a set successfully", async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(
        workoutSetActions.deleteSet(mockSet.id),
      ).resolves.not.toThrow();
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith("id", mockSet.id);
    });

    it("handles delete errors", async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error("Delete failed") }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(workoutSetActions.deleteSet("invalid-id")).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("loadInitialData", () => {
    it("loads initial data successfully", async () => {
      const mockSets = [mockSet];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockSets, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-456" } },
      });

      await expect(workoutSetActions.loadInitialData()).resolves.not.toThrow();
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-456");
    });

    it("handles no authenticated user gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(workoutSetActions.loadInitialData()).resolves.not.toThrow();
    });

    it("handles load errors gracefully", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: null, error: new Error("Load failed") }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-456" } },
      });

      await expect(workoutSetActions.loadInitialData()).resolves.not.toThrow();
    });
  });
});
