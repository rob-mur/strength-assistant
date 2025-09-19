import { renderHook } from "@testing-library/react-native";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";

// Mock the ExerciseRepo
jest.mock("@/lib/repo/ExerciseRepo");

const mockExerciseRepo = ExerciseRepo as jest.Mocked<typeof ExerciseRepo>;

describe("useAddExercise", () => {
  const mockAddExercise = jest.fn();
  const mockGetInstance = jest.fn().mockReturnValue({
    addExercise: mockAddExercise,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockExerciseRepo.getInstance = mockGetInstance;
  });

  it("should return addExercise function", () => {
    const { result } = renderHook(() => useAddExercise("user123"));

    expect(typeof result.current).toBe("function");
  });

  it("should call repo addExercise when adding exercise", async () => {
    const { result } = renderHook(() => useAddExercise("user123"));

    await result.current("Test Exercise");

    expect(mockGetInstance).toHaveBeenCalled();
    expect(mockAddExercise).toHaveBeenCalledWith("user123", {
      name: "Test Exercise",
    });
  });

  it("should throw error when uid is empty", async () => {
    const { result } = renderHook(() => useAddExercise(""));

    await expect(result.current("Test Exercise")).rejects.toThrow(
      "User must be authenticated to add exercises",
    );
  });
});
