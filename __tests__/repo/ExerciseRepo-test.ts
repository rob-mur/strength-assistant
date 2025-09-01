import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { Exercise } from "@/lib/models/Exercise";

// Mock Firebase functions
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockGetDb = jest.fn();

jest.mock("@/lib/data/firebase", () => ({
  getDb: mockGetDb,
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  onSnapshot: mockOnSnapshot,
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
  const testExercise = "Push-ups";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = ExerciseRepo.getInstance();
  });

  test("getInstance returns singleton instance", () => {
    const repo1 = ExerciseRepo.getInstance();
    const repo2 = ExerciseRepo.getInstance();
    
    expect(repo1).toBe(repo2);
  });

  describe("addExercise", () => {
    test("successfully adds an exercise", async () => {
      const mockDocRef = { id: "exercise-123" };
      mockCollection.mockReturnValue("mock-collection");
      mockAddDoc.mockResolvedValue(mockDocRef);

      const result = await repo.addExercise(testExercise, testUid);

      expect(mockCollection).toHaveBeenCalledWith(undefined, `users/${testUid}/exercises`);
      expect(mockAddDoc).toHaveBeenCalledWith("mock-collection", { name: testExercise });
      expect(result).toBe("exercise-123");
    });

    test("throws error when addDoc fails", async () => {
      const error = new Error("Firestore error");
      mockCollection.mockReturnValue("mock-collection");
      mockAddDoc.mockRejectedValue(error);

      await expect(repo.addExercise(testExercise, testUid)).rejects.toThrow("Firestore error");
    });
  });

  describe("getExerciseById", () => {
    test("successfully retrieves an exercise", async () => {
      const mockSnapData = { name: testExercise };
      const mockSnap = {
        id: "exercise-123",
        data: () => mockSnapData,
      };
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockResolvedValue(mockSnap);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(mockDoc).toHaveBeenCalledWith(undefined, `users/${testUid}/exercises`, "exercise-123");
      expect(result).toEqual({ id: "exercise-123", name: testExercise });
    });

    test("returns undefined when exercise not found", async () => {
      const mockSnap = {
        id: "exercise-123",
        data: () => undefined,
      };
      mockDoc.mockReturnValue("mock-doc-ref");
      mockGetDoc.mockResolvedValue(mockSnap);

      const result = await repo.getExerciseById("exercise-123", testUid);

      expect(result).toBeUndefined();
    });

    test("throws error for invalid exercise data", async () => {
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
    });
  });

  describe("getExercises", () => {
    test("successfully retrieves all exercises", async () => {
      const mockDocs = [
        { id: "ex1", data: () => ({ name: "Push-ups" }) },
        { id: "ex2", data: () => ({ name: "Squats" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };
      
      mockCollection.mockReturnValue("mock-collection");
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await repo.getExercises(testUid);

      expect(result).toEqual([
        { id: "ex1", name: "Push-ups" },
        { id: "ex2", name: "Squats" },
      ]);
    });

    test("throws error for invalid exercise data in collection", async () => {
      const mockDocs = [
        { id: "ex1", data: () => ({ invalidField: "invalid" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };
      
      mockCollection.mockReturnValue("mock-collection");
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await expect(repo.getExercises(testUid)).rejects.toThrow(
        "Invalid exercise data from Firestore for doc ex1"
      );
    });
  });

  describe("subscribeToExercises", () => {
    test("sets up subscription and calls callback with exercises", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockDocs = [
        { id: "ex1", data: () => ({ name: "Push-ups" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback, errorCallback) => {
        // Simulate successful snapshot
        successCallback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([
        { id: "ex1", name: "Push-ups" },
      ]);
      expect(typeof unsubscribe).toBe("function");
    });

    test("handles subscription error", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const error = new Error("Subscription error");

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback, errorCallback) => {
        // Simulate error
        errorCallback(error);
        return mockUnsubscribe;
      });

      repo.subscribeToExercises(testUid, mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test("handles invalid data in subscription", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockDocs = [
        { id: "ex1", data: () => ({ invalidField: "invalid" }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockImplementation((collection, successCallback, errorCallback) => {
        expect(() => successCallback(mockQuerySnapshot)).toThrow(
          "Invalid exercise data from Firestore for doc ex1"
        );
        return mockUnsubscribe;
      });

      repo.subscribeToExercises(testUid, mockCallback);
    });

    test("unsubscribe function works correctly", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockCollection.mockReturnValue("mock-collection");
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = repo.subscribeToExercises(testUid, mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("validateExerciseData", () => {
    test("validates correct exercise data", () => {
      const validData = { name: "Push-ups" };
      
      // Access private method through any casting for testing
      const isValid = (repo as any).validateExerciseData(validData);
      
      expect(isValid).toBe(true);
    });

    test("rejects invalid exercise data", () => {
      const invalidData = { invalidField: "invalid" };
      
      const isValid = (repo as any).validateExerciseData(invalidData);
      
      expect(isValid).toBe(false);
    });

    test("rejects null data", () => {
      const isValid = (repo as any).validateExerciseData(null);
      
      expect(isValid).toBe(false);
    });
  });
});