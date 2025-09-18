import WorkoutScreen from "@/app/(tabs)/workout";
import { render, screen } from "@testing-library/react-native";

jest.mock("expo-router");

describe("<WorkoutScreen/>", () => {
  beforeEach(() => {
    // Setup if needed
  });

  test("The screen displays the selected exercise", async () => {
    // Given
    const selectedExercise = "Squat";
    // When
    render(<WorkoutScreen selectedExercise={selectedExercise} />);
    // Then
    expect(await screen.findByText(selectedExercise)).toBeOnTheScreen();
  });
});
