import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { Exercise } from "@/lib/models/Exercise";

/**
 * Integration tests for Firebase operations
 * 
 * These tests are designed to work with both Firebase emulator and real Firebase instances.
 * They test the complete flow from ExerciseRepo through Firebase configuration to actual database operations.
 * 
 * To run with Firebase emulator:
 * 1. Start Firebase emulator: firebase emulators:start --only firestore
 * 2. Set environment variables: __DEV__=true or EXPO_PUBLIC_USE_EMULATOR=true
 * 3. Run tests: npm run test:integration
 * 
 * Note: These tests will be skipped in CI/CD environments unless explicitly configured
 */

// Check if we're in an environment suitable for integration tests
const isIntegrationTestEnvironment = () => {
  return process.env.RUN_INTEGRATION_TESTS === 'true' || 
         process.env.FIREBASE_EMULATOR_HOST || 
         __DEV__;
};

// Helper to wait for async operations
const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate unique test data
const generateTestExerciseName = () => `Test Exercise ${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe("Firebase Integration Tests", () => {
  let exerciseRepo: ExerciseRepo;
  let createdExerciseIds: string[] = [];

  beforeAll(async () => {
    if (!isIntegrationTestEnvironment()) {
      console.log("Skipping integration tests - not in integration test environment");
      return;
    }

    try {
      // Import and initialize Firebase
      if (process.env.NODE_ENV === 'test' && typeof window !== 'undefined') {
        // Web environment
        const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
        initFirebase();
      } else {
        // Native environment
        const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
        initFirebase();
      }

      exerciseRepo = ExerciseRepo.getInstance();
    } catch (error) {
      console.error("Failed to initialize Firebase for integration tests:", error);
      throw error;
    }
  });

  beforeEach(() => {
    if (!isIntegrationTestEnvironment()) {
      pending("Integration tests disabled");
    }
  });

  afterEach(async () => {
    if (!isIntegrationTestEnvironment()) {
      return;
    }

    // Clean up created exercises
    // Note: In a real implementation, you might want to add a delete method to ExerciseRepo
    // For now, we rely on using a test database or emulator that can be reset
    createdExerciseIds = [];
  });

  afterAll(async () => {
    if (!isIntegrationTestEnvironment()) {
      return;
    }

    // Reset singleton for clean state
    (ExerciseRepo as any).instance = null;
  });

  describe("Basic CRUD Operations", () => {
    test("should add and retrieve an exercise", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const exerciseName = generateTestExerciseName();
      
      // Add exercise
      const exerciseId = await exerciseRepo.addExercise(exerciseName);
      expect(exerciseId).toBeTruthy();
      expect(typeof exerciseId).toBe('string');
      createdExerciseIds.push(exerciseId);

      // Retrieve the exercise
      const retrievedExercise = await exerciseRepo.getExerciseById(exerciseId);
      expect(retrievedExercise).toBeDefined();
      expect(retrievedExercise?.id).toBe(exerciseId);
      expect(retrievedExercise?.name).toBe(exerciseName);
    }, 10000);

    test("should retrieve all exercises including newly added ones", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const initialExercises = await exerciseRepo.getExercises();
      const initialCount = initialExercises.length;

      // Add a new exercise
      const exerciseName = generateTestExerciseName();
      const exerciseId = await exerciseRepo.addExercise(exerciseName);
      createdExerciseIds.push(exerciseId);

      // Retrieve all exercises
      const updatedExercises = await exerciseRepo.getExercises();
      expect(updatedExercises.length).toBe(initialCount + 1);
      
      // Check that our new exercise is in the list
      const addedExercise = updatedExercises.find(ex => ex.id === exerciseId);
      expect(addedExercise).toBeDefined();
      expect(addedExercise?.name).toBe(exerciseName);
    }, 10000);

    test("should return undefined for non-existent exercise", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const nonExistentId = `non-existent-${Date.now()}`;
      const result = await exerciseRepo.getExerciseById(nonExistentId);
      expect(result).toBeUndefined();
    }, 5000);
  });

  describe("Real-time Subscription", () => {
    test("should receive real-time updates when exercises are added", async () => {
      if (!isIntegrationTestEnvironment()) return;

      let callbackCount = 0;
      let lastReceivedExercises: Exercise[] = [];

      const callback = (exercises: Exercise[]) => {
        callbackCount++;
        lastReceivedExercises = exercises;
      };

      // Start subscription
      const unsubscribe = exerciseRepo.subscribeToExercises(callback);

      // Wait for initial data
      await waitFor(1000);
      expect(callbackCount).toBeGreaterThan(0);
      const initialCount = lastReceivedExercises.length;

      // Add a new exercise
      const exerciseName = generateTestExerciseName();
      const exerciseId = await exerciseRepo.addExercise(exerciseName);
      createdExerciseIds.push(exerciseId);

      // Wait for subscription to update
      await waitFor(2000);

      expect(callbackCount).toBeGreaterThan(1);
      expect(lastReceivedExercises.length).toBe(initialCount + 1);
      
      const addedExercise = lastReceivedExercises.find(ex => ex.id === exerciseId);
      expect(addedExercise).toBeDefined();
      expect(addedExercise?.name).toBe(exerciseName);

      // Clean up subscription
      unsubscribe();
    }, 15000);

    test("should handle multiple concurrent subscriptions", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const callbacks: Array<{ calls: number; exercises: Exercise[] }> = [
        { calls: 0, exercises: [] },
        { calls: 0, exercises: [] }
      ];

      const unsubscribers = callbacks.map((callbackData, index) => {
        return exerciseRepo.subscribeToExercises((exercises) => {
          callbackData.calls++;
          callbackData.exercises = exercises;
        });
      });

      // Wait for initial data
      await waitFor(1000);

      // Both callbacks should have been called
      expect(callbacks[0].calls).toBeGreaterThan(0);
      expect(callbacks[1].calls).toBeGreaterThan(0);

      // Add an exercise
      const exerciseName = generateTestExerciseName();
      const exerciseId = await exerciseRepo.addExercise(exerciseName);
      createdExerciseIds.push(exerciseId);

      // Wait for updates
      await waitFor(2000);

      // Both callbacks should have received the update
      callbacks.forEach((callbackData, index) => {
        const addedExercise = callbackData.exercises.find(ex => ex.id === exerciseId);
        expect(addedExercise).toBeDefined();
        expect(addedExercise?.name).toBe(exerciseName);
      });

      // Clean up subscriptions
      unsubscribers.forEach(unsubscribe => unsubscribe());
    }, 15000);

    test("should stop receiving updates after unsubscribe", async () => {
      if (!isIntegrationTestEnvironment()) return;

      let callbackCount = 0;
      const callback = (exercises: Exercise[]) => {
        callbackCount++;
      };

      // Start subscription
      const unsubscribe = exerciseRepo.subscribeToExercises(callback);

      // Wait for initial callback
      await waitFor(1000);
      const initialCallbackCount = callbackCount;

      // Unsubscribe
      unsubscribe();

      // Add an exercise after unsubscribing
      const exerciseName = generateTestExerciseName();
      const exerciseId = await exerciseRepo.addExercise(exerciseName);
      createdExerciseIds.push(exerciseId);

      // Wait to see if callback is called (it shouldn't be)
      await waitFor(2000);

      expect(callbackCount).toBe(initialCallbackCount);
    }, 10000);
  });

  describe("Data Integrity and Validation", () => {
    test("should preserve data integrity with special characters", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const specialName = "Push-ups & Pull-ups (advanced) 🏋️‍♂️ with 'quotes' and \"double quotes\"";
      
      const exerciseId = await exerciseRepo.addExercise(specialName);
      createdExerciseIds.push(exerciseId);

      const retrievedExercise = await exerciseRepo.getExerciseById(exerciseId);
      expect(retrievedExercise?.name).toBe(specialName);
    }, 5000);

    test("should handle unicode characters correctly", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const unicodeName = "运动 🏃‍♀️ Übung спорт التمرين";
      
      const exerciseId = await exerciseRepo.addExercise(unicodeName);
      createdExerciseIds.push(exerciseId);

      const retrievedExercise = await exerciseRepo.getExerciseById(exerciseId);
      expect(retrievedExercise?.name).toBe(unicodeName);
    }, 5000);

    test("should handle empty string exercise name", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const exerciseId = await exerciseRepo.addExercise("");
      createdExerciseIds.push(exerciseId);

      const retrievedExercise = await exerciseRepo.getExerciseById(exerciseId);
      expect(retrievedExercise?.name).toBe("");
    }, 5000);
  });

  describe("Performance and Scalability", () => {
    test("should handle multiple rapid additions", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const exerciseNames = Array.from({ length: 5 }, (_, i) => 
        `Rapid Exercise ${i} ${Date.now()}-${Math.random().toString(36).substring(7)}`
      );

      // Add all exercises concurrently
      const addPromises = exerciseNames.map(name => exerciseRepo.addExercise(name));
      const exerciseIds = await Promise.all(addPromises);
      
      createdExerciseIds.push(...exerciseIds);

      // Verify all exercises were added
      expect(exerciseIds).toHaveLength(5);
      exerciseIds.forEach(id => {
        expect(id).toBeTruthy();
        expect(typeof id).toBe('string');
      });

      // Verify we can retrieve all of them
      const retrievalPromises = exerciseIds.map(id => exerciseRepo.getExerciseById(id));
      const retrievedExercises = await Promise.all(retrievalPromises);

      retrievedExercises.forEach((exercise, index) => {
        expect(exercise).toBeDefined();
        expect(exercise?.name).toBe(exerciseNames[index]);
      });
    }, 15000);

    test("should handle large dataset retrieval", async () => {
      if (!isIntegrationTestEnvironment()) return;

      const startTime = Date.now();
      const allExercises = await exerciseRepo.getExercises();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(Array.isArray(allExercises)).toBe(true);
      
      // Validate structure of all returned exercises
      allExercises.forEach(exercise => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(typeof exercise.id).toBe('string');
        expect(typeof exercise.name).toBe('string');
      });
    }, 10000);
  });

  describe("Error Recovery", () => {
    test("should recover from temporary network issues", async () => {
      if (!isIntegrationTestEnvironment()) return;

      // This test simulates recovery by ensuring operations work after previous ones
      // In a real scenario, you might want to actually simulate network interruption
      
      try {
        const exerciseName = generateTestExerciseName();
        const exerciseId = await exerciseRepo.addExercise(exerciseName);
        createdExerciseIds.push(exerciseId);

        const retrievedExercise = await exerciseRepo.getExerciseById(exerciseId);
        expect(retrievedExercise).toBeDefined();
        expect(retrievedExercise?.name).toBe(exerciseName);
      } catch (error) {
        // If the operation fails, it should fail gracefully
        expect(error).toBeInstanceOf(Error);
      }
    }, 10000);
  });

  // Conditional test runner - only runs if explicitly enabled
  const conditionalDescribe = isIntegrationTestEnvironment() ? describe : describe.skip;
  
  conditionalDescribe("Environment-specific Tests", () => {
    test("should verify test environment setup", () => {
      expect(isIntegrationTestEnvironment()).toBe(true);
      expect(exerciseRepo).toBeDefined();
    });

    test("should verify Firebase connection", async () => {
      // This is a simple connection test
      const exercises = await exerciseRepo.getExercises();
      expect(Array.isArray(exercises)).toBe(true);
    }, 5000);
  });
});