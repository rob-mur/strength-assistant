import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { Exercise } from "@/lib/models/Exercise";
import {
  getDb,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  onSnapshot,
} from "@/lib/data/firebase";
// Removed unused import from jest-mock-extended

// Mock Firebase functions
jest.mock("@/lib/data/firebase", () => ({
  getDb: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

const mockGetDb = jest.mocked(getDb);
const mockCollection = jest.mocked(collection);
const mockDoc = jest.mocked(doc);
const mockGetDoc = jest.mocked(getDoc);
const mockGetDocs = jest.mocked(getDocs);
const mockAddDoc = jest.mocked(addDoc);
const mockOnSnapshot = jest.mocked(onSnapshot);

describe("ExerciseRepo", () => {
  let exerciseRepo: ExerciseRepo;
  const mockDb = {} as any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup common mock returns
    mockGetDb.mockReturnValue(mockDb);

    // Get fresh instance for each test
    exerciseRepo = ExerciseRepo.getInstance();
  });

  afterEach(() => {
    // Reset singleton instance for clean tests
    (ExerciseRepo as any).instance = null;
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance", () => {
      const instance1 = ExerciseRepo.getInstance();
      const instance2 = ExerciseRepo.getInstance();
      expect(instance1).toBe(instance2);
    });

    test("should create only one instance", () => {
      const instance1 = ExerciseRepo.getInstance();
      const instance2 = ExerciseRepo.getInstance();
      const instance3 = ExerciseRepo.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });
  });

  describe("addExercise", () => {
    test("should add exercise successfully and return document id", async () => {
      const mockCollectionRef = {} as any;
      const mockDocRef = { id: "mock-doc-id" };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const result = await exerciseRepo.addExercise("Push-ups");

      expect(mockCollection).toHaveBeenCalledWith(mockDb, "exercises");
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, { name: "Push-ups" });
      expect(result).toBe("mock-doc-id");
    });

    test("should handle empty exercise name", async () => {
      const mockCollectionRef = {} as any;
      const mockDocRef = { id: "empty-exercise-id" };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const result = await exerciseRepo.addExercise("");

      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, { name: "" });
      expect(result).toBe("empty-exercise-id");
    });

    test("should throw error when Firebase addDoc fails", async () => {
      const mockCollectionRef = {} as any;
      const error = new Error("Firebase add failed");
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockRejectedValue(error);

      await expect(exerciseRepo.addExercise("Push-ups")).rejects.toThrow("Firebase add failed");
    });
  });

  describe("getExerciseById", () => {
    test("should return exercise when document exists", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: "exercise-1",
        data: () => ({ name: "Push-ups" })
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await exerciseRepo.getExerciseById("exercise-1");

      expect(mockDoc).toHaveBeenCalledWith(mockDb, "exercises", "exercise-1");
      expect(mockGetDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual({ id: "exercise-1", name: "Push-ups" });
    });

    test("should return undefined when document does not exist", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        data: () => undefined
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await exerciseRepo.getExerciseById("non-existent");

      expect(result).toBeUndefined();
    });

    test("should throw error for invalid exercise data", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: "invalid-exercise",
        data: () => ({ invalidField: "value" }) // Missing name field
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      await expect(exerciseRepo.getExerciseById("invalid-exercise"))
        .rejects.toThrow("Invalid exercise data from Firestore");
    });

    test("should handle Firebase getDoc failure", async () => {
      const mockDocRef = {} as any;
      const error = new Error("Firebase get failed");
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockRejectedValue(error);

      await expect(exerciseRepo.getExerciseById("exercise-1"))
        .rejects.toThrow("Firebase get failed");
    });
  });

  describe("getExercises", () => {
    test("should return array of exercises", async () => {
      const mockCollectionRef = {} as any;
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Push-ups" }) },
          { id: "2", data: () => ({ name: "Squats" }) }
        ]
      };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await exerciseRepo.getExercises();

      expect(mockCollection).toHaveBeenCalledWith(mockDb, "exercises");
      expect(mockGetDocs).toHaveBeenCalledWith(mockCollectionRef);
      expect(result).toEqual([
        { id: "1", name: "Push-ups" },
        { id: "2", name: "Squats" }
      ]);
    });

    test("should return empty array when no exercises exist", async () => {
      const mockCollectionRef = {} as any;
      const mockQuerySnapshot = { docs: [] };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await exerciseRepo.getExercises();

      expect(result).toEqual([]);
    });

    test("should throw error for invalid exercise data in collection", async () => {
      const mockCollectionRef = {} as any;
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Push-ups" }) },
          { id: "2", data: () => ({ invalidField: "value" }) } // Invalid data
        ]
      };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("Invalid exercise data from Firestore for doc 2");
    });

    test("should handle Firebase getDocs failure", async () => {
      const mockCollectionRef = {} as any;
      const error = new Error("Firebase getDocs failed");
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockRejectedValue(error);

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("Firebase getDocs failed");
    });
  });

  describe("subscribeToExercises", () => {
    test("should subscribe to exercises and call callback with data", () => {
      const mockCollectionRef = {} as any;
      const mockUnsubscribe = jest.fn();
      const callback = jest.fn();
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Push-ups" }) },
          { id: "2", data: () => ({ name: "Squats" }) }
        ]
      };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation((collection, callback) => {
        // Immediately call the callback with mock data
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = exerciseRepo.subscribeToExercises(callback);

      expect(mockCollection).toHaveBeenCalledWith(mockDb, "exercises");
      expect(mockOnSnapshot).toHaveBeenCalledWith(mockCollectionRef, expect.any(Function));
      expect(callback).toHaveBeenCalledWith([
        { id: "1", name: "Push-ups" },
        { id: "2", name: "Squats" }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    test("should handle empty subscription data", () => {
      const mockCollectionRef = {} as any;
      const mockUnsubscribe = jest.fn();
      const callback = jest.fn();
      const mockQuerySnapshot = { docs: [] };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation((collection, callback) => {
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      exerciseRepo.subscribeToExercises(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    test("should throw error for invalid exercise data in subscription", () => {
      const mockCollectionRef = {} as any;
      const callback = jest.fn();
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Push-ups" }) },
          { id: "invalid", data: () => ({ invalidField: "value" }) }
        ]
      };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation((collection, callback) => {
        callback(mockQuerySnapshot);
        return jest.fn();
      });

      expect(() => exerciseRepo.subscribeToExercises(callback))
        .toThrow("Invalid exercise data from Firestore for doc invalid");
    });

    test("should return unsubscribe function", () => {
      const mockCollectionRef = {} as any;
      const mockUnsubscribe = jest.fn();
      const callback = jest.fn();
      const mockQuerySnapshot = { docs: [] };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = exerciseRepo.subscribeToExercises(callback);

      expect(typeof unsubscribe).toBe("function");
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe("validateExerciseData", () => {
    test("should validate correct exercise data", () => {
      const validData = { name: "Push-ups" };
      const result = (exerciseRepo as any).validateExerciseData(validData);
      expect(result).toBe(true);
    });

    test("should reject null data", () => {
      const result = (exerciseRepo as any).validateExerciseData(null);
      expect(result).toBe(false);
    });

    test("should reject undefined data", () => {
      const result = (exerciseRepo as any).validateExerciseData(undefined);
      expect(result).toBe(false);
    });

    test("should reject non-object data", () => {
      const result = (exerciseRepo as any).validateExerciseData("string");
      expect(result).toBe(false);
    });

    test("should reject data without name field", () => {
      const result = (exerciseRepo as any).validateExerciseData({});
      expect(result).toBe(false);
    });

    test("should reject data with non-string name", () => {
      const result = (exerciseRepo as any).validateExerciseData({ name: 123 });
      expect(result).toBe(false);
    });

    test("should accept data with empty string name", () => {
      const result = (exerciseRepo as any).validateExerciseData({ name: "" });
      expect(result).toBe(true);
    });
  });
});