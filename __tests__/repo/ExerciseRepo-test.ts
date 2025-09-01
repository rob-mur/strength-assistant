import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { mock, mockReset } from "jest-mock-extended";

jest.mock("@/lib/data/firebase");
jest.mock("@/lib/repo/ExerciseRepo");

const mockRepo = mock<ExerciseRepo>();

describe("ExerciseRepo", () => {
  const testUid = "test-user-123";
  const testExercise = "Push-ups";

  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("getInstance returns singleton instance", () => {
    const repo1 = ExerciseRepo.getInstance();
    const repo2 = ExerciseRepo.getInstance();
    
    expect(repo1).toBe(repo2);
  });

  describe("addExercise", () => {
    test("successfully adds an exercise", async () => {
      const mockDocId = "exercise-123";
      mockRepo.addExercise.mockResolvedValue(mockDocId);

      const result = await mockRepo.addExercise(testExercise, testUid);

      expect(mockRepo.addExercise).toHaveBeenCalledWith(testExercise, testUid);
      expect(result).toBe(mockDocId);
    });

    test("throws error when addDoc fails", async () => {
      const error = new Error("Firestore error");
      mockRepo.addExercise.mockRejectedValue(error);

      await expect(mockRepo.addExercise(testExercise, testUid)).rejects.toThrow("Firestore error");
    });
  });

  describe("getExerciseById", () => {
    test("successfully retrieves an exercise", async () => {
      const mockExercise = { id: "exercise-123", name: testExercise };
      mockRepo.getExerciseById.mockResolvedValue(mockExercise);

      const result = await mockRepo.getExerciseById("exercise-123", testUid);

      expect(mockRepo.getExerciseById).toHaveBeenCalledWith("exercise-123", testUid);
      expect(result).toEqual(mockExercise);
    });

    test("returns undefined when exercise not found", async () => {
      mockRepo.getExerciseById.mockResolvedValue(undefined);

      const result = await mockRepo.getExerciseById("exercise-123", testUid);

      expect(result).toBeUndefined();
    });

    test("throws error for data access failure", async () => {
      const error = new Error("Database error");
      mockRepo.getExerciseById.mockRejectedValue(error);

      await expect(mockRepo.getExerciseById("exercise-123", testUid)).rejects.toThrow("Database error");
    });
  });

  describe("getExercises", () => {
    test("successfully retrieves all exercises", async () => {
      const mockExercises = [
        { id: "ex1", name: "Push-ups" },
        { id: "ex2", name: "Squats" },
      ];
      mockRepo.getExercises.mockResolvedValue(mockExercises);

      const result = await mockRepo.getExercises(testUid);

      expect(mockRepo.getExercises).toHaveBeenCalledWith(testUid);
      expect(result).toEqual(mockExercises);
    });

    test("throws error for data access failure", async () => {
      const error = new Error("Database error");
      mockRepo.getExercises.mockRejectedValue(error);

      await expect(mockRepo.getExercises(testUid)).rejects.toThrow("Database error");
    });
  });

  describe("subscribeToExercises", () => {
    test("sets up subscription and calls callback with exercises", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockRepo.subscribeToExercises.mockReturnValue(mockUnsubscribe);

      const unsubscribe = mockRepo.subscribeToExercises(testUid, mockCallback);

      expect(mockRepo.subscribeToExercises).toHaveBeenCalledWith(testUid, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    test("returns unsubscribe function", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockRepo.subscribeToExercises.mockReturnValue(mockUnsubscribe);

      const unsubscribe = mockRepo.subscribeToExercises(testUid, mockCallback);

      expect(typeof unsubscribe).toBe("function");
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});