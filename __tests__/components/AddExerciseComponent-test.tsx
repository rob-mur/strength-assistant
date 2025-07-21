import ExarciseScreen from "@/app/(tabs)/exercises";
import { fireEvent, render, userEvent } from "@testing-library/react-native";
import { act } from "react";
import { CommonTestState } from "../../__test_utils__/utils";
import ExerciseScreen from "@/app/(tabs)/exercises";
import AddExerciseComponent from "@/app/(tabs)/exercises/add";

describe("<AddExerciseComponent/>", () => {
  let state: CommonTestState;
  beforeEach(() => {
    state = new CommonTestState();
  });
  test("When the user enters a name and pressed submit the callback is executed", async () => {
    // Given
    let mockOnExerciseSubmitted = jest.fn();
    const { getByTestId } = render(
      <AddExerciseComponent onExerciseSubmitted={mockOnExerciseSubmitted} />,
    );
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockOnExerciseSubmitted.mock.lastCall).not.toBeNull();
  });
});
