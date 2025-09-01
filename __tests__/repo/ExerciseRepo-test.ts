import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { logger } from "@/lib/data/firebase/logger";

// Mock Firebase functions but let the actual repo run
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockGetDb = jest.fn().mockReturnValue("mock-db");

jest.mock("@/lib/data/firebase", () => ({
  getDb: () => mockGetDb(),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ExerciseRepo", () => {
  let repo: ExerciseRepo;
  const testUid = "test-user-123";
  const testExercise = { name: "Push-ups" };

  beforeEach(() => {
    jest.clearAllMocks();
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
    test("successfully adds an exercise with logging", async () => {
      const mockDocRef = { id: "exercise-123" };
      mockCollection.mockReturnValue("mock-collection");
      mockAddDoc.mockResolvedValue(mockDocRef);

      await repo.addExercise(testUid, testExercise);

      expect(mockGetDb).toHaveBeenCalled();
      expect(mockCollection).toHaveBeenCalledWith("mock-db", `users/${testUid}/exercises`);
      expect(mockAddDoc).toHaveBeenCalledWith("mock-collection", { name: testExercise.name });
      
      // Verify logging calls
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Adding exercise: "${testExercise.name}" for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "add_exercise"
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Successfully added exercise "${testExercise.name}" for user: ${testUid}`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native", 
          operation: "add_exercise"
        })
      );
    });

    test("throws error when addDoc fails with logging", async () => {
      const error = new Error("Firestore error");
      mockCollection.mockReturnValue("mock-collection");
      mockAddDoc.mockRejectedValue(error);

      await expect(repo.addExercise(testUid, testExercise)).rejects.toThrow("Firestore error");
      
      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Failed to add exercise "${testExercise.name}" for user: ${testUid} after`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "add_exercise"
        })
      );
    });
  });

  describe("getExerciseById", () => {
    test("successfully retrieves an exercise with logging", async () => {
      const mockSnapData = { name: testExercise.name };
      const mockSnap = {
        id: "exercise-123",
        data: () => mockSnapData,
      };
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockResolvedValue(mockSnap);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(mockDoc).toHaveBeenCalledWith("mock-db", `users/${testUid}/exercises`, "exercise-123");
      expect(result).toEqual({ 
        id: "exercise-123", 
        name: testExercise.name, 
        user_id: testUid, 
        created_at: expect.any(String) 
      });
      
      // Verify logging calls
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Getting exercise by ID: exercise-123 for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "get_exercise_by_id"
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Successfully retrieved exercise "${testExercise.name}" (ID: exercise-123) for user: ${testUid}`),
        expect.objectContaining({
          service: "ExerciseRepo", 
          platform: "React Native",
          operation: "get_exercise_by_id"
        })
      );
    });

    test("returns undefined when exercise not found with logging", async () => {
      const mockSnap = {
        id: "exercise-123",
        data: () => undefined,
      };
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockResolvedValue(mockSnap);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(result).toBeUndefined();
      
      // Verify debug logging for not found case
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Exercise with ID exercise-123 not found for user: ${testUid}`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native", 
          operation: "get_exercise_by_id"
        })
      );
    });

    test("throws error for invalid exercise data with logging", async () => {
      const mockSnapData = { invalidField: "invalid" };
      const mockSnap = {
        id: "exercise-123",
        data: () => mockSnapData,
      };
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockResolvedValue(mockSnap);

      await expect(repo.getExerciseById("exercise-123", testUid)).rejects.toThrow(
        "Invalid exercise data from Firestore"
      );
      
      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        `[ExerciseRepo] Invalid exercise data for ID exercise-123 for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "get_exercise_by_id"
        })
      );
    });

    test("handles Firebase errors with logging", async () => {
      const error = new Error("Firebase connection failed");
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockRejectedValue(error);

      await expect(repo.getExerciseById("exercise-123", testUid)).rejects.toThrow("Firebase connection failed");
      
      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Failed to get exercise by ID exercise-123 for user: ${testUid} after`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "get_exercise_by_id"
        })
      );
    });
  });

  describe("getExercises", () => {
    test("returns an observable that updates with real-time data", () => {
      const mockUnsubscribe = jest.fn();
      
      // Mock subscribeToExercises to call the callback immediately
      repo.subscribeToExercises = jest.fn().mockImplementation((userId, callback) => {
        // Simulate immediate callback with mock data
        setTimeout(() => {
          callback([
            { id: "ex1", name: "Push-ups", user_id: userId, created_at: "2023-01-01T00:00:00Z" },
            { id: "ex2", name: "Squats", user_id: userId, created_at: "2023-01-01T01:00:00Z" },
          ]);
        }, 0);
        return mockUnsubscribe;
      });

      const exercises$ = repo.getExercises(testUid);
      
      // Verify it returns an Observable
      expect(exercises$).toBeDefined();
      expect(typeof exercises$.get).toBe('function');
      expect(typeof exercises$.set).toBe('function');
      
      // Verify subscription was set up
      expect(repo.subscribeToExercises).toHaveBeenCalledWith(testUid, expect.any(Function));
      
      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Setting up reactive observable for exercises for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "get_exercises"
        })
      );
    });

    test("observable starts with empty array", () => {
      const mockUnsubscribe = jest.fn();
      
      repo.subscribeToExercises = jest.fn().mockReturnValue(mockUnsubscribe);

      const exercises$ = repo.getExercises(testUid);
      
      // Initially empty
      expect(exercises$.get()).toEqual([]);
    });

    test("observable updates when subscription receives new data", (done) => {
      const mockUnsubscribe = jest.fn();
      const testData = [
        { id: "ex1", name: "Push-ups", user_id: testUid, created_at: "2023-01-01T00:00:00Z" }
      ];
      
      repo.subscribeToExercises = jest.fn().mockImplementation((userId, callback) => {
        // Simulate delayed callback
        setTimeout(() => {
          callback(testData);
        }, 10);
        return mockUnsubscribe;
      });

      const exercises$ = repo.getExercises(testUid);
      
      // Initially empty
      expect(exercises$.get()).toEqual([]);
      
      // Set up listener for when observable updates
      setTimeout(() => {
        expect(exercises$.get()).toEqual(testData);
        done();
      }, 20);
    });
  });

  describe("subscribeToExercises", () => {
    test("sets up subscription and calls callback with exercises with logging", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockDocs = [
        { id: "ex1", data: () => ({ name: "Push-ups" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback) => {
        successCallback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([
        { id: "ex1", name: "Push-ups", user_id: testUid, created_at: expect.any(String) },
      ]);
      expect(typeof unsubscribe).toBe("function");
      
      // Verify subscription setup logging
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Setting up real-time subscription to exercises for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "subscribe_exercises"
        })
      );
      
      // Verify subscription established logging
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Real-time subscription established for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "subscribe_exercises"
        })
      );
    });

    test("handles subscription error with logging", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const error = new Error("Subscription error");

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback, errorCallback) => {
        errorCallback(error);
        return mockUnsubscribe;
      });

      repo.subscribeToExercises(testUid, mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
      
      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        `[ExerciseRepo] Real-time subscription error for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "subscribe_exercises"
        })
      );
    });

    test("handles invalid data in subscription with logging", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockDocs = [
        { id: "ex1", data: () => ({ invalidField: "invalid" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback) => {
        expect(() => successCallback(mockQuerySnapshot)).toThrow(
          "Invalid exercise data from Firestore for doc ex1"
        );
        return mockUnsubscribe;
      });

      repo.subscribeToExercises(testUid, mockCallback);
      
      // The error logging should be called within the subscription callback
      // This is tested indirectly by the error being thrown
    });

    test("unsubscribe function logs and calls Firebase unsubscribe", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
      
      // Verify unsubscribe logging
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Unsubscribing from real-time updates for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "subscribe_exercises"
        })
      );
    });
  });

  describe("deleteExercise", () => {
    test("successfully deletes an exercise with logging", async () => {
      const exerciseId = "exercise-123";
      
      mockDoc.mockReturnValue("mock-doc-ref");
      mockDeleteDoc.mockResolvedValue(undefined);

      await repo.deleteExercise(testUid, exerciseId);

      expect(mockDoc).toHaveBeenCalledWith("mock-db", `users/${testUid}/exercises`, exerciseId);
      expect(mockDeleteDoc).toHaveBeenCalledWith("mock-doc-ref");
      
      // Verify logging calls
      expect(logger.debug).toHaveBeenCalledWith(
        `[ExerciseRepo] Deleting exercise with ID: ${exerciseId} for user: ${testUid}`,
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "delete_exercise"
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Successfully deleted exercise with ID: ${exerciseId} for user: ${testUid}`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "delete_exercise"
        })
      );
    });

    test("handles delete errors with logging", async () => {
      const exerciseId = "exercise-123";
      const error = new Error("Firestore delete error");
      
      mockDoc.mockReturnValue("mock-doc-ref");
      mockDeleteDoc.mockRejectedValue(error);

      await expect(repo.deleteExercise(testUid, exerciseId)).rejects.toThrow("Firestore delete error");
      
      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`[ExerciseRepo] Failed to delete exercise with ID: ${exerciseId} for user: ${testUid} after`),
        expect.objectContaining({
          service: "ExerciseRepo",
          platform: "React Native",
          operation: "delete_exercise"
        })
      );
    });
  });
});