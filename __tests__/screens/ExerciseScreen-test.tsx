import ExerciseScreen from "@/app/(tabs)/exercises";
import { useExercises } from "@/lib/hooks/useExercises";
import { render, screen } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";

jest.mock("@/lib/hooks/useExercises", () => ({
  useExercises: jest.fn(),
}));

jest.mock("expo-router");

describe("<ExerciseScreen/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();
  });

  test("When the user request to add an exercise their request is accepted", async () => {
    // Given
    (useExercises as jest.Mock).mockReturnValue({ exercises: [] });
    render(<ExerciseScreen />);

    // When
    await state.user.press(screen.getByTestId("add-exercise"));

    // Then
    expect(state.mockRouter.navigate).toHaveBeenCalledWith("/exercises/add");
  });

  test("displays exercises returned from the useExercises hook", () => {
    // Given
    const exercises = [
      { id: "1", name: "Squat" },
      { id: "2", name: "Bench Press" },
    ];
    (useExercises as jest.Mock).mockReturnValue({ exercises });

    // When
    render(<ExerciseScreen />);

    // Then
    expect(screen.getByText("Squat")).toBeVisible();
    expect(screen.getByText("Bench Press")).toBeVisible();
  });
});
