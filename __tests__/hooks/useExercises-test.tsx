import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useExercises } from "@/lib/hooks/useExercises";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";

jest.mock("@/lib/data/firebase");
jest.mock("@/lib/repo/ExerciseRepo");

const mockRepo = mock<ExerciseRepo>();

describe("useExercises", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("adding an exercise refreshes the exercise list", async () => {
    // Mock the subscription method
    mockRepo.subscribeToExercises.mockReturnValue(jest.fn());

    // Render both hooks together
    const { result } = renderHook(() => ({
      exercises: useExercises(),
      addExercise: useAddExercise(),
    }));

    // Add a new exercise
    await result.current.addExercise("Push-ups");

    // Get the callback that was passed to subscribeToExercises
    const subscriptionCallback = mockRepo.subscribeToExercises.mock.calls[0][0];

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
});
