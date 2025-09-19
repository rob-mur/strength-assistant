import type { IExerciseRepo } from "@/lib/repo/IExerciseRepo";

describe("IExerciseRepo", () => {
  it("should define the exercise repository interface", () => {
    // This test verifies that the interface is properly defined
    // by creating a mock object that implements it
    const mockRepo: IExerciseRepo = {
      initialize: jest.fn(),
      getExercises: jest.fn(),
      getExerciseById: jest.fn(),
      subscribeToExercises: jest.fn(),
      addExercise: jest.fn(),
      deleteExercise: jest.fn(),
      isSyncing: jest.fn(),
      isOnline: jest.fn(),
      getPendingChangesCount: jest.fn(),
      forceSync: jest.fn(),
      hasErrors: jest.fn(),
      getErrorMessage: jest.fn(),
    };

    expect(mockRepo).toBeDefined();
    expect(typeof mockRepo.initialize).toBe("function");
    expect(typeof mockRepo.getExercises).toBe("function");
    expect(typeof mockRepo.addExercise).toBe("function");
  });
});