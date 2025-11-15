/**
 * @jest-environment node
 */

/**
 * Simplified Tests for syncedSupabase Implementation
 *
 * These tests focus on OUR implementation and integration with Legend State,
 * not testing Legend State's sync engine itself (covered by end-to-end tests).
 */

import { observable } from "@legendapp/state";

// Test utilities
const createTestExercise = (id: string, name: string) => ({
  id,
  name,
  user_id: "test-user",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted: false,
});

// Mock user for testing
const mockUser = { id: "test-user-123" };

describe("syncedSupabase Store Implementation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Store Configuration", () => {
    it("should have properly configured exercisesObject$ with syncedSupabase", () => {
      const { exercisesObject$ } = require("../../lib/data/store");

      // Verify the observable exists and can be accessed
      expect(exercisesObject$).toBeDefined();
      expect(typeof exercisesObject$.get).toBe("function");

      // Should handle undefined initial state gracefully
      const initialValue = exercisesObject$.get();
      expect(initialValue).toBeDefined();
    });

    it("should provide exercises$ array view that handles empty state", () => {
      const { exercises$ } = require("../../lib/data/store");

      // Should not throw on empty/undefined state
      expect(() => exercises$.get()).not.toThrow();

      // Should return empty array for undefined state
      const exercises = exercises$.get();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe("Exercise Utils Integration", () => {
    // Mock user for consistent testing
    beforeEach(() => {
      const { user$ } = require("../../lib/data/store");
      user$.set(mockUser);
    });

    it("should add exercise with proper data structure", () => {
      const { exerciseUtils } = require("../../lib/data/store");

      const exerciseId = exerciseUtils.addExercise({ name: "Test Exercise" });

      // Should return a valid ID
      expect(exerciseId).toBeDefined();
      expect(typeof exerciseId).toBe("string");
      expect(exerciseId.length).toBeGreaterThan(0);
    });

    it("should update exercise correctly", () => {
      const {
        exerciseUtils,
        exercisesObject$,
      } = require("../../lib/data/store");

      // Add exercise first
      const exerciseId = exerciseUtils.addExercise({ name: "Original Name" });

      // Update exercise
      exerciseUtils.updateExercise(exerciseId, { name: "Updated Name" });

      // Verify update
      const exercise = exerciseUtils.getExercise(exerciseId);
      expect(exercise?.name).toBe("Updated Name");
      expect(exercise?.updated_at).toBeDefined();
    });

    it("should soft delete exercise", () => {
      const { exerciseUtils, exercises$ } = require("../../lib/data/store");

      // Add exercise
      const exerciseId = exerciseUtils.addExercise({ name: "To Delete" });

      // Verify it's in the array view
      const beforeDelete = exercises$.get();
      expect(beforeDelete.some((ex) => ex.id === exerciseId)).toBe(true);

      // Delete exercise
      exerciseUtils.deleteExercise(exerciseId);

      // Should be filtered out of array view
      const afterDelete = exercises$.get();
      expect(afterDelete.some((ex) => ex.id === exerciseId)).toBe(false);

      // But still exist in object with deleted flag
      const exercise = exerciseUtils.getExercise(exerciseId);
      expect(exercise?.deleted).toBe(true);
    });

    it("should handle user_id transform", () => {
      const { exerciseUtils } = require("../../lib/data/store");

      const exerciseId = exerciseUtils.addExercise({ name: "Test Exercise" });
      const exercise = exerciseUtils.getExercise(exerciseId);

      // user_id should be set to empty initially (transform handles it during sync)
      expect(exercise?.user_id).toBe("");
    });
  });

  describe("Backwards Compatibility", () => {
    it("should maintain exercises$ array view reactivity", () => {
      const { exerciseUtils, exercises$ } = require("../../lib/data/store");

      const initialCount = exercises$.get().length;

      // Add exercise via utils
      exerciseUtils.addExercise({ name: "Reactive Test" });

      // Array view should update
      const afterAdd = exercises$.get();
      expect(afterAdd.length).toBe(initialCount + 1);
      expect(afterAdd.some((ex) => ex.name === "Reactive Test")).toBe(true);
    });

    it("should filter deleted exercises from array view", () => {
      const { exerciseUtils, exercises$ } = require("../../lib/data/store");

      // Add and delete exercise
      const exerciseId = exerciseUtils.addExercise({ name: "Will Delete" });
      exerciseUtils.deleteExercise(exerciseId);

      // Array view should not include deleted exercises
      const exercises = exercises$.get();
      expect(exercises.some((ex) => ex.id === exerciseId)).toBe(false);
      expect(exercises.every((ex) => !ex.deleted)).toBe(true);
    });

    it("should handle repository interface compatibility", () => {
      // Test that existing repository methods still work
      const {
        SupabaseExerciseRepo,
      } = require("../../lib/repo/SupabaseExerciseRepo");
      const repo = SupabaseExerciseRepo.getInstance();

      // Should have expected interface methods
      expect(typeof repo.addExercise).toBe("function");
      expect(typeof repo.deleteExercise).toBe("function");
      expect(typeof repo.getExercises).toBe("function");
      expect(typeof repo.isOnline).toBe("function");
    });
  });

  describe("Data Persistence Configuration", () => {
    it("should have AsyncStorage persistence configured", () => {
      const { exercisesObject$ } = require("../../lib/data/store");

      // Verify the observable exists and is configured
      // (Actual persistence testing requires real AsyncStorage)
      expect(exercisesObject$).toBeDefined();
      expect(typeof exercisesObject$.get).toBe("function");
    });

    it("should handle initialization gracefully", () => {
      // Test that store handles empty/undefined initial state
      const { exercises$, exercisesObject$ } = require("../../lib/data/store");

      expect(() => {
        const arrayView = exercises$.get();
        const objectView = exercisesObject$.get();
      }).not.toThrow();
    });
  });
});
