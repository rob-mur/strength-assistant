import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { render, screen, waitFor } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { testHelper, actWithAnimations } from "@/lib/test-utils/ReactNativeTestHelper";

// Mock dependencies first
jest.mock('@legendapp/state', () => ({
  observable: jest.fn(),
  observe: jest.fn(),
  computed: jest.fn(),
}), { virtual: true });

jest.mock('@/lib/data/firebase/initializer', () => ({
  initializeFirebaseServices: jest.fn(),
  getDb: jest.fn(),
}));

jest.mock('@/lib/data/supabase/SupabaseClient', () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
  }
}));

jest.mock('@/lib/data/store', () => ({
  exercises$: {
    get: jest.fn(),
    set: jest.fn(),
  },
  user$: {
    get: jest.fn(),
  },
}));

jest.mock('@/lib/data/sync/syncConfig', () => ({
  syncExerciseToSupabase: jest.fn(),
  deleteExerciseFromSupabase: jest.fn(),
  syncHelpers: {
    isSyncing: jest.fn(),
    isOnline: jest.fn(),
    getPendingChangesCount: jest.fn(),
    forceSync: jest.fn(),
    hasErrors: jest.fn(),
    getErrorMessage: jest.fn(),
  }
}));

jest.mock('@/lib/models/Exercise', () => ({
  ExerciseValidator: {
    validateExerciseInput: jest.fn(),
    sanitizeExerciseName: jest.fn(),
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

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
    const renderResult = render(<AddExerciseForm />);
    await testHelper.waitForRender(renderResult);
    
    // When
    await testHelper.performUserFlow([
      async () => await testHelper.typeText(screen.getByTestId("name"), "Exercise Name"),
      async () => await testHelper.pressButton(screen.getByTestId("submit")),
    ]);
    
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
    
    const renderResult = render(<AddExerciseForm />);
    await testHelper.waitForRender(renderResult);
    const submitButton = screen.getByTestId("submit");
    
    // When & Then - Use helper to test loading state
    await testHelper.testLoadingState(
      async () => {
        await testHelper.performUserFlow([
          async () => await testHelper.typeText(screen.getByTestId("name"), "Exercise Name"),
          async () => await testHelper.pressButton(submitButton),
        ]);
        
        // Resolve the promise to complete the operation
        resolveAddExercise!();
        await addExercisePromise;
      },
      () => submitButton.props.accessibilityState?.disabled === true
    );
    
    // Wait for the loading state to clear
    await actWithAnimations(async () => {
      await waitFor(() => {
        expect(submitButton.props.accessibilityState?.disabled).toBe(false);
      });
    });
  });
});
