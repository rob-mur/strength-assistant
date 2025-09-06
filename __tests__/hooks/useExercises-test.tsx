import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useExercises } from "@/lib/hooks/useExercises";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";
import { logger } from "@/lib/data/firebase/logger";

// Mock dependencies
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

jest.mock("@/lib/data/firebase");
jest.mock("@/lib/repo/ExerciseRepo");
jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRepo = mock<ExerciseRepo>();

describe("useExercises", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("adding an exercise refreshes the exercise list", async () => {
    const testUid = "test-user-uid";
    
    // Mock the subscription method
    mockRepo.subscribeToExercises.mockReturnValue(jest.fn());

    // Render both hooks together with UID
    const { result } = renderHook(() => ({
      exercises: useExercises(testUid),
      addExercise: useAddExercise(testUid),
    }));

    // Add a new exercise
    await result.current.addExercise("Push-ups");

    // Get the callback that was passed to subscribeToExercises
    const subscriptionCallback = mockRepo.subscribeToExercises.mock.calls[0][1];

    // Verify that the uid was passed correctly
    expect(mockRepo.subscribeToExercises.mock.calls[0][0]).toBe(testUid);

    // Simulate the repo calling back with updated exercise list
    act(() => {
      subscriptionCallback([
        { id: "1", name: "Squats", user_id: testUid, created_at: "2023-01-01T00:00:00Z" }, 
        { id: "2", name: "Push-ups", user_id: testUid, created_at: "2023-01-01T00:00:00Z" }
      ]);
    });

    // Verify the exercises list was updated
    await waitFor(() => {
      expect(result.current.exercises.exercises).toEqual([
        { id: "1", name: "Squats", user_id: testUid, created_at: "2023-01-01T00:00:00Z" },
        { id: "2", name: "Push-ups", user_id: testUid, created_at: "2023-01-01T00:00:00Z" },
      ]);
    });
  });

  test("handles unauthenticated user with warning", () => {
    const { result } = renderHook(() => useExercises(""));

    expect(result.current.exercises).toEqual([]);
    expect(mockRepo.subscribeToExercises).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "useExercises: User not authenticated, exercises will be empty",
      expect.objectContaining({
        service: "useExercises",
        platform: "React Native",
        operation: "fetch_exercises"
      })
    );
  });

  test("cleans up subscription on unmount", () => {
    const testUid = "test-user-uid";
    const mockUnsubscribe = jest.fn();
    
    mockRepo.subscribeToExercises.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useExercises(testUid));

    expect(mockRepo.subscribeToExercises).toHaveBeenCalledWith(testUid, expect.any(Function));
    
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
