import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { render, waitFor } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";

jest.mock("expo-router");
jest.mock("@/lib/data/firebase");
jest.mock("@/lib/hooks/useAddExercise");
const mockUseAddExercise = jest.mocked(useAddExercise);

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();
    mockUseAddExercise.mockReturnValue(jest.fn(async (_) => {}));
  });

  test("When the user enters a name and pressed submit the callback is executed", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockUseAddExercise.mock.lastCall).not.toBeNull();
  });

  test("When addExercise fails, error message is displayed", async () => {
    // Given
    const errorMessage = "Failed to add exercise";
    const mockAddExercise = jest.fn().mockRejectedValue(new Error(errorMessage));
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    const { getByTestId, getByText } = render(<AddExerciseForm />);
    
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    
    // Then
    await waitFor(() => {
      expect(getByTestId("error-snackbar")).toBeTruthy();
      expect(getByText(errorMessage)).toBeTruthy();
    });
    
    // And router navigation should not be called
    expect(state.mockRouter.back).not.toHaveBeenCalled();
    expect(state.mockRouter.navigate).not.toHaveBeenCalled();
  });

  test("When addExercise fails with unknown error, generic message is displayed", async () => {
    // Given
    const mockAddExercise = jest.fn().mockRejectedValue("Unknown error");
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    const { getByTestId, getByText } = render(<AddExerciseForm />);
    
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    
    // Then
    await waitFor(() => {
      expect(getByTestId("error-snackbar")).toBeTruthy();
      expect(getByText("Failed to add exercise. Please try again.")).toBeTruthy();
    });
  });
});
