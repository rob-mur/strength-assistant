import { render } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;
  beforeEach(() => {
    state = new CommonTestState();
  });
  test("When the user enters a name and pressed submit the callback is executed", async () => {
    // Given
    let mockOnExerciseSubmitted = jest.fn();
    const { getByTestId } = render(
      <AddExerciseForm onExerciseSubmitted={mockOnExerciseSubmitted} />,
    );
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockOnExerciseSubmitted.mock.lastCall).not.toBeNull();
  });
});
