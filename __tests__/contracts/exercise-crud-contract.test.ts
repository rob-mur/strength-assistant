/**
 * Contract Test: Exercise CRUD Operations
 *
 * This test ensures that Exercise CRUD operations work correctly with
 * both local storage and cloud sync, respecting the local-first architecture.
 *
 * CRITICAL: This test MUST fail initially - implementations don't exist yet.
 */

import type { ExerciseRecord } from "../../lib/models/ExerciseRecord";

describe("Exercise CRUD Contract", () => {
  let exerciseService: any;

  beforeEach(async () => {
    // This will fail initially - ExerciseService doesn't exist yet
    const { ExerciseService } = require("../../lib/data/ExerciseService");
    exerciseService = new ExerciseService();

    // Clean up any existing test data
    await exerciseService.clearAll();
  });

  afterEach(async () => {
    // Cleanup after each test
    await exerciseService.clearAll();
  });

  describe("Local-First Exercise Creation", () => {
    it("should create exercise locally with immediate response", async () => {
      const exerciseName = "Push-ups";
      const startTime = Date.now();

      const exercise = await exerciseService.createExercise(exerciseName);
      const endTime = Date.now();

      // Should respond immediately (local-first)
      expect(endTime - startTime).toBeLessThan(50);

      expect(exercise).toBeDefined();
      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      expect(exercise.createdAt).toBeInstanceOf(Date);
      expect(exercise.updatedAt).toBeInstanceOf(Date);
      expect(exercise.syncStatus).toBe("pending");
      expect(exercise.userId).toBeUndefined(); // Anonymous user
    });

    it("should create exercise with user ID when authenticated", async () => {
      const userId = "test-user-123";
      await exerciseService.setCurrentUser({ id: userId, isAnonymous: false });

      const exercise = await exerciseService.createExercise("Squats");

      expect(exercise.userId).toBe(userId);
      expect(exercise.syncStatus).toBe("pending");
    });

    it("should validate exercise name requirements", async () => {
      // Empty name should fail
      await expect(exerciseService.createExercise("")).rejects.toThrow(
        "Exercise name cannot be empty",
      );

      // Too long name should fail
      const longName = "a".repeat(256);
      await expect(exerciseService.createExercise(longName)).rejects.toThrow(
        "Exercise name too long",
      );

      // Valid name should succeed
      const exercise = await exerciseService.createExercise("Valid Name");
      expect(exercise.name).toBe("Valid Name");
    });
  });

  describe("Local-First Exercise Retrieval", () => {
    beforeEach(async () => {
      // Create test exercises
      await exerciseService.createExercise("Exercise 1");
      await exerciseService.createExercise("Exercise 2");
      await exerciseService.createExercise("Exercise 3");
    });

    it("should retrieve exercises locally with immediate response", async () => {
      const startTime = Date.now();

      const exercises = await exerciseService.getExercises();
      const endTime = Date.now();

      // Should respond immediately from local storage
      expect(endTime - startTime).toBeLessThan(100);

      expect(exercises).toHaveLength(3);
      exercises.forEach((exercise: any) => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.createdAt).toBeInstanceOf(Date);
        expect(["pending", "synced", "error"]).toContain(exercise.syncStatus);
      });
    });

    it("should filter exercises by user ID", async () => {
      const userId = "specific-user";
      await exerciseService.setCurrentUser({ id: userId, isAnonymous: false });
      await exerciseService.createExercise("User Specific Exercise");

      const userExercises = await exerciseService.getExercises(userId);
      const defaultUserExercises =
        await exerciseService.getExercises("default-user");

      expect(userExercises.length).toBe(1);
      expect(userExercises[0].name).toBe("User Specific Exercise");
      expect(defaultUserExercises.length).toBe(3); // 3 original exercises for default user
    });

    it("should return exercises sorted by creation date", async () => {
      const exercises = await exerciseService.getExercises();

      expect(exercises[0].createdAt.getTime()).toBeLessThanOrEqual(
        exercises[1].createdAt.getTime(),
      );
      expect(exercises[1].createdAt.getTime()).toBeLessThanOrEqual(
        exercises[2].createdAt.getTime(),
      );
    });
  });

  describe("Local-First Exercise Updates", () => {
    let testExercise: ExerciseRecord;

    beforeEach(async () => {
      testExercise = await exerciseService.createExercise("Original Name");
    });

    it("should update exercise locally with immediate response", async () => {
      const startTime = Date.now();

      const updated = await exerciseService.updateExercise(testExercise.id, {
        name: "Updated Name",
      });
      const endTime = Date.now();

      // Should respond immediately (local-first)
      expect(endTime - startTime).toBeLessThan(50);

      expect(updated.id).toBe(testExercise.id);
      expect(updated.name).toBe("Updated Name");
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        testExercise.updatedAt.getTime(),
      );
      expect(updated.syncStatus).toBe("pending");
    });

    it("should validate update parameters", async () => {
      // Invalid exercise ID
      await expect(
        exerciseService.updateExercise("invalid-id", { name: "New Name" }),
      ).rejects.toThrow("Exercise not found");

      // Empty name
      await expect(
        exerciseService.updateExercise(testExercise.id, { name: "" }),
      ).rejects.toThrow("Exercise name cannot be empty");

      // No updates provided
      await expect(
        exerciseService.updateExercise(testExercise.id, {}),
      ).rejects.toThrow("No updates provided");
    });

    it("should mark previously synced exercise as pending after update", async () => {
      // Simulate exercise being synced
      await exerciseService.markSynced(testExercise.id);

      const synced = await exerciseService.getExercise(testExercise.id);
      expect(synced.syncStatus).toBe("synced");

      // Update the exercise
      const updated = await exerciseService.updateExercise(testExercise.id, {
        name: "Modified Name",
      });

      expect(updated.syncStatus).toBe("pending");
    });
  });

  describe("Local-First Exercise Deletion", () => {
    let testExercise: ExerciseRecord;

    beforeEach(async () => {
      testExercise = await exerciseService.createExercise("To Be Deleted");
    });

    it("should delete exercise locally with immediate response", async () => {
      const startTime = Date.now();

      await exerciseService.deleteExercise(testExercise.id);
      const endTime = Date.now();

      // Should respond immediately (local-first)
      expect(endTime - startTime).toBeLessThan(50);

      // Verify exercise is no longer available
      await expect(
        exerciseService.getExercise(testExercise.id),
      ).rejects.toThrow("Exercise not found");

      const exercises = await exerciseService.getExercises();
      expect(
        exercises.find((ex: any) => ex.id === testExercise.id),
      ).toBeUndefined();
    });

    it("should handle deletion of non-existent exercise", async () => {
      await expect(
        exerciseService.deleteExercise("non-existent-id"),
      ).rejects.toThrow("Exercise not found");
    });

    it("should create sync record for deletion when exercise was synced", async () => {
      // Mark exercise as synced
      await exerciseService.markSynced(testExercise.id);

      // Delete the exercise
      await exerciseService.deleteExercise(testExercise.id);

      // Should create a sync record for the deletion
      const syncRecords = await exerciseService.getPendingSyncRecords();
      const deleteRecord = syncRecords.find(
        (r: any) => r.recordId === testExercise.id && r.operation === "delete",
      );

      expect(deleteRecord).toBeDefined();
    });
  });

  describe("Offline Persistence", () => {
    it("should persist exercises across app restarts", async () => {
      // Create exercises
      await exerciseService.createExercise("Persistent Exercise 1");
      await exerciseService.createExercise("Persistent Exercise 2");

      // Simulate app restart by creating new service instance
      const { ExerciseService } = require("../../lib/data/ExerciseService");
      const newServiceInstance = new ExerciseService();

      const exercises = await newServiceInstance.getExercises();

      expect(exercises).toHaveLength(2);
      expect(exercises.map((e: any) => e.name)).toContain(
        "Persistent Exercise 1",
      );
      expect(exercises.map((e: any) => e.name)).toContain(
        "Persistent Exercise 2",
      );
    });

    it("should maintain sync status across app restarts", async () => {
      const exercise = await exerciseService.createExercise("Status Test");
      expect(exercise.syncStatus).toBe("pending");

      // Mark as synced
      await exerciseService.markSynced(exercise.id);

      // Restart app
      const { ExerciseService } = require("../../lib/data/ExerciseService");
      const newServiceInstance = new ExerciseService();

      const restoredExercise = await newServiceInstance.getExercise(
        exercise.id,
      );
      expect(restoredExercise.syncStatus).toBe("synced");
    });
  });

  describe("Sync Status Management", () => {
    let testExercise: ExerciseRecord;

    beforeEach(async () => {
      testExercise = await exerciseService.createExercise("Sync Test");
    });

    it("should track sync status transitions", async () => {
      // Initially pending
      expect(testExercise.syncStatus).toBe("pending");

      // Mark as synced
      await exerciseService.markSynced(testExercise.id);
      const synced = await exerciseService.getExercise(testExercise.id);
      expect(synced.syncStatus).toBe("synced");

      // Mark as error
      await exerciseService.markSyncError(testExercise.id, "Network error");
      const errored = await exerciseService.getExercise(testExercise.id);
      expect(errored.syncStatus).toBe("error");

      // Back to pending after retry
      await exerciseService.markPending(testExercise.id);
      const pending = await exerciseService.getExercise(testExercise.id);
      expect(pending.syncStatus).toBe("pending");
    });

    it("should get pending sync records", async () => {
      // Create a few exercises
      await exerciseService.createExercise("Pending 1");
      await exerciseService.createExercise("Pending 2");

      const syncRecords = await exerciseService.getPendingSyncRecords();

      expect(syncRecords.length).toBeGreaterThanOrEqual(3); // Including testExercise
      syncRecords.forEach((record: any) => {
        expect(record.recordType).toBe("exercise");
        expect(record.operation).toBe("create");
        expect(record.pendingSince).toBeInstanceOf(Date);
        expect(record.attempts).toBe(0);
      });
    });
  });
});
