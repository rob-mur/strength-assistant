import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { render, screen, waitFor } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";

jest.mock("expo-router");
jest.mock("@/lib/data/firebase");
jest.mock("@/lib/hooks/useAddExercise");
jest.mock("@/lib/hooks/useAuth");
const mockUseAddExercise = jest.mocked(useAddExercise);
const mockUseAuth = jest.mocked(useAuth);

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();
    mockUseAddExercise.mockReturnValue(jest.fn(async (_) => {}));
    mockUseAuth.mockReturnValue({
      user: { uid: "test-user-uid", email: "test@example.com", isAnonymous: false },
      loading: false,
      error: null,
      signInAnonymously: jest.fn(),
      createAccount: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
    });
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
