import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useExercises } from "@/lib/hooks/useExercises";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";
import { logger } from "@/lib/data/firebase/logger";

jest.mock("@/lib/data/firebase");
jest.mock("@/lib/repo/ExerciseRepo");
jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRepo = mock<ExerciseRepo>();

describe("useExercises", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("adding an exercise refreshes the exercise list", async () => {
    const testUid = "test-user-uid";
    
    // Mock the subscription method
    mockRepo.subscribeToExercises.mockReturnValue(jest.fn());

    // Render both hooks together with UID
    const { result } = renderHook(() => ({
      exercises: useExercises(testUid),
      addExercise: useAddExercise(testUid),
    }));

    // Add a new exercise
    await result.current.addExercise("Push-ups");

    // Get the callback that was passed to subscribeToExercises
    const subscriptionCallback = mockRepo.subscribeToExercises.mock.calls[0][1];

    // Verify that the uid was passed correctly
    expect(mockRepo.subscribeToExercises.mock.calls[0][0]).toBe(testUid);

    // Simulate the repo calling back with updated exercise list
    act(() => {
      subscriptionCallback([{ name: "Squats" }, { name: "Push-ups" }]);
    });

    // Verify the exercises list was updated
    await waitFor(() => {
      expect(result.current.exercises.exercises).toEqual([
        { name: "Squats" },
        { name: "Push-ups" },
      ]);
    });
  });

  test("handles unauthenticated user with warning", () => {
    const { result } = renderHook(() => useExercises(""));

    expect(result.current.exercises).toEqual([]);
    expect(mockRepo.subscribeToExercises).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "useExercises: User not authenticated, exercises will be empty",
      expect.objectContaining({
        service: "useExercises",
        platform: "React Native",
        operation: "fetch_exercises"
      })
    );
  });

  test("cleans up subscription on unmount", () => {
    const testUid = "test-user-uid";
    const mockUnsubscribe = jest.fn();
    
    mockRepo.subscribeToExercises.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useExercises(testUid));

    expect(mockRepo.subscribeToExercises).toHaveBeenCalledWith(testUid, expect.any(Function));
    
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
