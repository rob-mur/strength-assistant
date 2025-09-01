import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { renderHook } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";

jest.mock("@/lib/repo/ExerciseRepo");

const mockRepo = mock<ExerciseRepo>();

describe("useAddExercise", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("returns a function that adds an exercise", () => {
    const testUid = "test-user-uid";
    const { result } = renderHook(() => useAddExercise(testUid));
    
    expect(typeof result.current).toBe("function");
  });

  test("calls repo addExercise with correct parameters", async () => {
    const testUid = "test-user-uid";
    const testExercise = "Push-ups";
    
    mockRepo.addExercise.mockResolvedValue("mock-id");
    
    const { result } = renderHook(() => useAddExercise(testUid));
    
    await result.current(testExercise);
    
    expect(mockRepo.addExercise).toHaveBeenCalledWith(testExercise, testUid);
  });

  test("throws error when uid is empty", async () => {
    const { result } = renderHook(() => useAddExercise(""));
    
    await expect(result.current("Push-ups")).rejects.toThrow(
      "User must be authenticated to add exercises"
    );
  });

  test("propagates repo errors", async () => {
    const testUid = "test-user-uid";
    const testError = new Error("Database error");
    
    mockRepo.addExercise.mockRejectedValue(testError);
    
    const { result } = renderHook(() => useAddExercise(testUid));
    
    await expect(result.current("Push-ups")).rejects.toThrow("Database error");
  });
});