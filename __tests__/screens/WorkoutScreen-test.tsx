import HomeScreen from "@/app/(tabs)";
import { CommonTestState } from "@/__test_utils__/utils";
import WorkoutScreen from "@/app/(tabs)/workout";
import { render } from "@testing-library/react-native";

jest.mock("expo-router");

describe("<WorkoutScreen/>", () => {
  let state: CommonTestState;
  beforeEach(() => {
    state = new CommonTestState();
  });

  test("The screen displays the selected exercise", async () => {
    // Given
    const selectedExercise = "Squat";
    // When
    const { findByText } = render(
      <WorkoutScreen selectedExercise={selectedExercise} />,
    );
    // Then
    expect(await findByText(selectedExercise)).toBeOnTheScreen();
  });
});
