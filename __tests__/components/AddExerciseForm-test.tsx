import { render } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";

jest.mock("expo-router");
jest.mock("@/lib/data/firebase");

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();
  });

  test("When the user enters a name and pressed submit the callback is executed", async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const { getByTestId } = render(<AddExerciseForm onSubmit={mockOnSubmit} />);
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockOnSubmit).toHaveBeenCalledWith("Exercise Name");
  });
});
