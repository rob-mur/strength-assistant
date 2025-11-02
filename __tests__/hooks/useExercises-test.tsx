import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useExercises } from "@/lib/hooks/useExercises";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";
// Firebase logger removed

// Mock dependencies
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

// Use global store mock from jest.setup.js which includes exerciseUtils

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
    validateExerciseName: jest.fn(),
    sanitizeExerciseName: jest.fn((name) =>
      name.trim().replaceAll(/\s+/g, " "),
    ),
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

jest.mock("@/lib/repo/ExerciseRepo");
// Firebase logger mock removed

const mockRepo = mock<ExerciseRepo>();

describe("useExercises", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("handles unauthenticated user with warning", () => {
    const { result } = renderHook(() => useExercises(""));

    expect(result.current.exercises).toEqual([]);
    expect(mockRepo.subscribeToExercises).not.toHaveBeenCalled();
    // Logger expectation removed - Firebase no longer used
  });

  test("cleans up subscription on unmount", () => {
    const testUid = "test-user-uid";
    const mockUnsubscribe = jest.fn();

    mockRepo.subscribeToExercises.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useExercises(testUid));

    expect(mockRepo.subscribeToExercises).toHaveBeenCalledWith(
      testUid,
      expect.any(Function),
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
