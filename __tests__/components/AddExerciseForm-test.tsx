import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { render, screen, waitFor } from "@testing-library/react-native";
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
    render(<AddExerciseForm />);
    // When
    await state.user.type(screen.getByTestId("name"), "Exercise Name");
    await state.user.press(screen.getByTestId("submit"));
    // Then
    expect(mockUseAddExercise.mock.lastCall).not.toBeNull();
  });

  test("Button is disabled and shows loading state during submission", async () => {
    // Given
    let resolveAddExercise: () => void;
    const addExercisePromise = new Promise<void>((resolve) => {
      resolveAddExercise = resolve;
    });
    mockUseAddExercise.mockReturnValue(jest.fn(async (_) => {
      await addExercisePromise;
    }));
    
    render(<AddExerciseForm />);
    const submitButton = screen.getByTestId("submit");
    
    // When
    await state.user.type(screen.getByTestId("name"), "Exercise Name");
    await state.user.press(submitButton);
    
    // Then - button should be disabled during loading
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    
    // Resolve the promise to complete the operation
    resolveAddExercise!();
    
    // Wait for the loading state to clear
    await waitFor(() => {
      expect(submitButton.props.accessibilityState?.disabled).toBe(false);
    });
  });
});
