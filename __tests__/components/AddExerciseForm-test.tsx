import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import {
  testHelper,
  actWithAnimations,
} from "../test-utils/ReactNativeTestHelper";

// Mock dependencies first
jest.mock(
  "@legendapp/state",
  () => ({
    observable: jest.fn(),
    observe: jest.fn(),
    computed: jest.fn(),
  }),
  { virtual: true },
);

jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock("@/lib/data/store", () => ({
  exercises$: {
    get: jest.fn(),
    set: jest.fn(),
  },
  user$: {
    get: jest.fn(),
  },
}));

jest.mock("@/lib/data/sync/syncConfig", () => ({
  syncExerciseToSupabase: jest.fn(),
  deleteExerciseFromSupabase: jest.fn(),
  syncHelpers: {
    isSyncing: jest.fn(),
    isOnline: jest.fn(),
    getPendingChangesCount: jest.fn(),
    forceSync: jest.fn(),
    hasErrors: jest.fn(),
    getErrorMessage: jest.fn(),
  },
}));

jest.mock("@/lib/models/Exercise", () => ({
  ExerciseValidator: {
    validateExerciseInput: jest.fn(),
    sanitizeExerciseName: jest.fn(),
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

jest.mock("expo-router");
jest.mock("@/lib/hooks/useAddExercise");
jest.mock("@/lib/hooks/useAuth");
const mockUseAddExercise = jest.mocked(useAddExercise);
const mockUseAuth = jest.mocked(useAuth);

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();

    // Clear all mocks
    jest.clearAllMocks();

    // Set default mock - will be overridden in individual tests
    mockUseAddExercise.mockReturnValue(jest.fn());
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-user-uid",
        email: "test@example.com",
        isAnonymous: false,
      },
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
    const mockAddExercise = jest.fn().mockResolvedValue(undefined);
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    render(<AddExerciseForm />);

    const nameInput = screen.getByTestId("name");
    const submitButton = screen.getByTestId("submit");

    // When
    fireEvent.changeText(nameInput, "Exercise Name");
    fireEvent.press(submitButton);

    // Then
    await waitFor(() => {
      expect(mockAddExercise).toHaveBeenCalledWith("Exercise Name");
    });
  });

  test("Button is disabled and shows loading state during submission", async () => {
    // Given
    let resolveAddExercise: () => void;
    const addExercisePromise = new Promise<void>((resolve) => {
      resolveAddExercise = resolve;
    });
    const mockAddExercise = jest.fn(async (_) => {
      await addExercisePromise;
    });
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    const renderResult = render(<AddExerciseForm />);
    await testHelper.waitForRender(renderResult);
    const submitButton = screen.getByTestId("submit");

    // When & Then - Use helper to test loading state
    await testHelper.testLoadingState(
      async () => {
        await testHelper.performUserFlow([
          async () =>
            await testHelper.typeText(
              screen.getByTestId("name"),
              "Exercise Name",
            ),
          async () => await testHelper.pressButton(submitButton),
        ]);

        // Resolve the promise to complete the operation
        resolveAddExercise!();
        await addExercisePromise;
      },
      () => submitButton.props.accessibilityState?.disabled === true,
    );

    // Wait for the loading state to clear
    await actWithAnimations(async () => {
      await waitFor(() => {
        expect(submitButton.props.accessibilityState?.disabled).toBe(false);
      });
    });
  });

  test("Successfully adds exercise and navigates on successful submission", async () => {
    // Given
    const mockAddExercise = jest.fn().mockResolvedValue(undefined);
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    render(<AddExerciseForm />);

    const nameInput = screen.getByTestId("name");
    const submitButton = screen.getByTestId("submit");

    // When
    fireEvent.changeText(nameInput, "Push-ups");
    fireEvent.press(submitButton);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockAddExercise).toHaveBeenCalledWith("Push-ups");
    });

    // Then
    expect(state.mockRouter.back).toHaveBeenCalled();
    expect(state.mockRouter.navigate).toHaveBeenCalledWith(
      "/workout?exercise=Push-ups",
    );
  });

  test("Handles addExercise failure gracefully", async () => {
    // Given
    const mockAddExercise = jest
      .fn()
      .mockRejectedValue(new Error("Network error"));
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    const renderResult = render(<AddExerciseForm />);
    await testHelper.waitForRender(renderResult);

    // When
    await testHelper.performUserFlow([
      async () =>
        await testHelper.typeText(screen.getByTestId("name"), "Push-ups"),
      async () => await testHelper.pressButton(screen.getByTestId("submit")),
    ]);

    // Then - verify loading state is reset even on error
    await actWithAnimations(async () => {
      await waitFor(() => {
        const submitButton = screen.getByTestId("submit");
        expect(submitButton.props.accessibilityState?.disabled).toBe(false);
      });
    });
  });

  test("Uses user uid from auth hook", async () => {
    // Given
    const mockAddExercise = jest.fn().mockResolvedValue(undefined);
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    // When
    render(<AddExerciseForm />);

    // Then
    expect(mockUseAddExercise).toHaveBeenCalledWith("test-user-uid");
  });

  test("Handles case when user is null", async () => {
    // Given
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signInAnonymously: jest.fn(),
      createAccount: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
    });

    const mockAddExercise = jest.fn().mockResolvedValue(undefined);
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    // When
    render(<AddExerciseForm />);

    // Then
    expect(mockUseAddExercise).toHaveBeenCalledWith("");
  });

  test("Component handles various user interactions", async () => {
    // Given
    const mockAddExercise = jest.fn().mockResolvedValue(undefined);
    mockUseAddExercise.mockReturnValue(mockAddExercise);

    render(<AddExerciseForm />);
    const nameInput = screen.getByTestId("name");
    const submitButton = screen.getByTestId("submit");

    // Test initial empty state
    expect(nameInput.props.value).toBe("");

    // Test text input changes
    fireEvent.changeText(nameInput, "Test Exercise");
    expect(nameInput.props.value).toBe("Test Exercise");

    // Test form submission
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAddExercise).toHaveBeenCalledWith("Test Exercise");
    });
  });

  test("Form renders all required UI components", async () => {
    // Given & When
    const renderResult = render(<AddExerciseForm />);
    await testHelper.waitForRender(renderResult);

    // Then
    expect(screen.getByTestId("name")).toBeTruthy();
    expect(screen.getByTestId("submit")).toBeTruthy();
    expect(screen.getByText("Add Exercise")).toBeTruthy();
    // Check that the form has a TextInput with label "Name"
    const nameElements = screen.getAllByText("Name");
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
  });
});
