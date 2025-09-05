import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { renderHook } from "@testing-library/react-native";
import { mock, mockReset } from "jest-mock-extended";

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

jest.mock("@/lib/repo/ExerciseRepo");

const mockRepo = mock<ExerciseRepo>();

describe("useAddExercise", () => {
  beforeEach(() => {
    mockReset(mockRepo);
    jest.mocked(ExerciseRepo.getInstance).mockReturnValue(mockRepo);
  });

  test("returns a function that adds an exercise", () => {
    const testUid = "test-user-uid";
    const { result } = renderHook(() => useAddExercise(testUid));
    
    expect(typeof result.current).toBe("function");
  });

  test("calls repo addExercise with correct parameters", async () => {
    const testUid = "test-user-uid";
    const testExercise = "Push-ups";
    
    mockRepo.addExercise.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAddExercise(testUid));
    
    await result.current(testExercise);
    
    expect(mockRepo.addExercise).toHaveBeenCalledWith(testUid, { name: testExercise });
  });

  test("throws error when uid is empty", async () => {
    const { result } = renderHook(() => useAddExercise(""));
    
    await expect(result.current("Push-ups")).rejects.toThrow(
      "User must be authenticated to add exercises"
    );
  });

  test("propagates repo errors", async () => {
    const testUid = "test-user-uid";
    const testError = new Error("Database error");
    
    mockRepo.addExercise.mockRejectedValue(testError);
    
    const { result } = renderHook(() => useAddExercise(testUid));
    
    await expect(result.current("Push-ups")).rejects.toThrow("Database error");
  });
});