import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import {
  getDb,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  onSnapshot,
} from "@/lib/data/firebase";

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

describe("ExerciseRepo Error Scenarios", () => {
  let exerciseRepo: ExerciseRepo;
  const mockDb = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb);
    exerciseRepo = ExerciseRepo.getInstance();
  });

  afterEach(() => {
    (ExerciseRepo as any).instance = null;
  });

  describe("Network and Connection Errors", () => {
    test("should handle network timeout in addExercise", async () => {
      const mockCollectionRef = {} as any;
      const networkError = new Error("TIMEOUT");
      networkError.name = "TIMEOUT";
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockRejectedValue(networkError);

      await expect(exerciseRepo.addExercise("Push-ups"))
        .rejects.toThrow("TIMEOUT");
    });

    test("should handle permission denied in addExercise", async () => {
      const mockCollectionRef = {} as any;
      const permissionError = new Error("Missing or insufficient permissions");
      permissionError.name = "PERMISSION_DENIED";
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockRejectedValue(permissionError);

      await expect(exerciseRepo.addExercise("Push-ups"))
        .rejects.toThrow("Missing or insufficient permissions");
    });

    test("should handle unavailable service in getExercises", async () => {
      const mockCollectionRef = {} as any;
      const serviceError = new Error("The service is currently unavailable");
      serviceError.name = "UNAVAILABLE";
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockRejectedValue(serviceError);

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("The service is currently unavailable");
    });

    test("should handle quota exceeded error", async () => {
      const mockCollectionRef = {} as any;
      const quotaError = new Error("Quota exceeded");
      quotaError.name = "RESOURCE_EXHAUSTED";
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockRejectedValue(quotaError);

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("Quota exceeded");
    });
  });

  describe("Database Not Initialized Errors", () => {
    test("should handle database not initialized in addExercise", async () => {
      const dbError = new Error("Firebase not initialized. Call initFirebase() first.");
      mockGetDb.mockImplementation(() => {
        throw dbError;
      });

      await expect(exerciseRepo.addExercise("Push-ups"))
        .rejects.toThrow("Firebase not initialized. Call initFirebase() first.");
    });

    test("should handle database not initialized in getExercises", async () => {
      const dbError = new Error("Firebase not initialized. Call initFirebase() first.");
      mockGetDb.mockImplementation(() => {
        throw dbError;
      });

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("Firebase not initialized. Call initFirebase() first.");
    });

    test("should handle database not initialized in getExerciseById", async () => {
      const dbError = new Error("Firebase not initialized. Call initFirebase() first.");
      mockGetDb.mockImplementation(() => {
        throw dbError;
      });

      await expect(exerciseRepo.getExerciseById("test-id"))
        .rejects.toThrow("Firebase not initialized. Call initFirebase() first.");
    });

    test("should handle database not initialized in subscribeToExercises", () => {
      const dbError = new Error("Firebase not initialized. Call initFirebase() first.");
      mockGetDb.mockImplementation(() => {
        throw dbError;
      });

      const callback = jest.fn();

      expect(() => exerciseRepo.subscribeToExercises(callback))
        .toThrow("Firebase not initialized. Call initFirebase() first.");
    });
  });

  describe("Data Corruption and Validation Errors", () => {
    test("should handle corrupted document data with null values", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: "corrupted-doc",
        data: () => ({ name: null })
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      await expect(exerciseRepo.getExerciseById("corrupted-doc"))
        .rejects.toThrow("Invalid exercise data from Firestore");
    });

    test("should handle document with additional unexpected fields", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: "extra-fields-doc",
        data: () => ({ 
          name: "Push-ups",
          unexpectedField: "should not break",
          anotherField: { nested: "object" }
        })
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      // Should not throw error - extra fields should be ignored
      const result = await exerciseRepo.getExerciseById("extra-fields-doc");
      expect(result).toEqual({ id: "extra-fields-doc", name: "Push-ups" });
    });

    test("should handle mixed valid and invalid documents in collection", async () => {
      const mockCollectionRef = {} as any;
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Valid Exercise" }) },
          { id: "2", data: () => ({ invalidField: "no name" }) },
          { id: "3", data: () => ({ name: "Another Valid Exercise" }) }
        ]
      };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      await expect(exerciseRepo.getExercises())
        .rejects.toThrow("Invalid exercise data from Firestore for doc 2");
    });

    test("should handle empty string as valid name", async () => {
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: "empty-name-doc",
        data: () => ({ name: "" })
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await exerciseRepo.getExerciseById("empty-name-doc");
      expect(result).toEqual({ id: "empty-name-doc", name: "" });
    });
  });

  describe("Subscription Error Scenarios", () => {
    test("should handle subscription callback throwing error", () => {
      const mockCollectionRef = {} as any;
      const callback = jest.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      const mockQuerySnapshot = {
        docs: [{ id: "1", data: () => ({ name: "Push-ups" }) }]
      };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation((collection, callback) => {
        callback(mockQuerySnapshot);
        return jest.fn();
      });

      expect(() => exerciseRepo.subscribeToExercises(callback))
        .toThrow("Callback error");
    });

    test("should handle onSnapshot throwing initialization error", () => {
      const mockCollectionRef = {} as any;
      const callback = jest.fn();
      const subscriptionError = new Error("Failed to subscribe");
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation(() => {
        throw subscriptionError;
      });

      expect(() => exerciseRepo.subscribeToExercises(callback))
        .toThrow("Failed to subscribe");
    });

    test("should handle corrupted data in subscription updates", () => {
      const mockCollectionRef = {} as any;
      const callback = jest.fn();
      const mockQuerySnapshot = {
        docs: [
          { id: "1", data: () => ({ name: "Valid Exercise" }) },
          { id: "corrupted", data: () => ({ invalid: "data" }) }
        ]
      };

      mockCollection.mockReturnValue(mockCollectionRef);
      mockOnSnapshot.mockImplementation((collection, callback) => {
        callback(mockQuerySnapshot);
        return jest.fn();
      });

      expect(() => exerciseRepo.subscribeToExercises(callback))
        .toThrow("Invalid exercise data from Firestore for doc corrupted");
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    test("should handle extremely long exercise names", async () => {
      const longName = "A".repeat(10000);
      const mockCollectionRef = {} as any;
      const mockDocRef = { id: "long-name-id" };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const result = await exerciseRepo.addExercise(longName);
      
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, { name: longName });
      expect(result).toBe("long-name-id");
    });

    test("should handle special characters in exercise names", async () => {
      const specialName = "Push-ups & Pull-ups (advanced) 🏋️‍♂️";
      const mockCollectionRef = {} as any;
      const mockDocRef = { id: "special-chars-id" };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const result = await exerciseRepo.addExercise(specialName);
      
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, { name: specialName });
      expect(result).toBe("special-chars-id");
    });

    test("should handle concurrent access to singleton", () => {
      // Reset singleton
      (ExerciseRepo as any).instance = null;

      // Simulate concurrent access
      const instance1 = ExerciseRepo.getInstance();
      const instance2 = ExerciseRepo.getInstance();
      const instance3 = ExerciseRepo.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    test("should handle document ID with special characters", async () => {
      const specialId = "doc-with-special-chars-!@#$%^&*()";
      const mockDocRef = {} as any;
      const mockDocSnap = {
        id: specialId,
        data: () => ({ name: "Special ID Exercise" })
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await exerciseRepo.getExerciseById(specialId);
      
      expect(mockDoc).toHaveBeenCalledWith(mockDb, "exercises", specialId);
      expect(result).toEqual({ id: specialId, name: "Special ID Exercise" });
    });
  });

  describe("Firebase SDK Version Compatibility", () => {
    test("should handle different document snapshot formats", async () => {
      const mockDocRef = {} as any;
      // Simulate different SDK version behavior
      const mockDocSnap = {
        id: "compat-test",
        data: () => ({ name: "Compatibility Exercise" }),
        exists: () => true,
        metadata: { hasPendingWrites: false }
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await exerciseRepo.getExerciseById("compat-test");
      expect(result).toEqual({ id: "compat-test", name: "Compatibility Exercise" });
    });

    test("should handle query snapshot with different formats", async () => {
      const mockCollectionRef = {} as any;
      const mockQuerySnapshot = {
        docs: [
          { 
            id: "1", 
            data: () => ({ name: "Exercise 1" }),
            exists: () => true
          }
        ],
        empty: false,
        size: 1,
        metadata: { hasPendingWrites: false }
      };
      
      mockCollection.mockReturnValue(mockCollectionRef);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await exerciseRepo.getExercises();
      expect(result).toEqual([{ id: "1", name: "Exercise 1" }]);
    });
  });
});