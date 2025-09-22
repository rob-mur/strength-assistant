import { ExerciseRepoFactory } from "@/lib/repo/ExerciseRepoFactory";
import { SupabaseExerciseRepo } from "@/lib/repo/SupabaseExerciseRepo";

// Mock @legendapp/state first
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

// Mock SupabaseExerciseRepo
jest.mock("@/lib/repo/SupabaseExerciseRepo");

describe("ExerciseRepoFactory", () => {
  const MockedSupabaseExerciseRepo = SupabaseExerciseRepo as jest.Mocked<
    typeof SupabaseExerciseRepo
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    ExerciseRepoFactory.resetInstances();
    // Set up the mock to return a proper instance
    MockedSupabaseExerciseRepo.getInstance.mockReturnValue({
      initialize: jest.fn(),
      addExercise: jest.fn(),
      getExercises: jest.fn(),
      subscribeToExercises: jest.fn(),
      deleteExercise: jest.fn(),
      getExerciseById: jest.fn(),
      isSyncing: jest.fn(),
      isOnline: jest.fn(),
      getPendingChangesCount: jest.fn(),
      forceSync: jest.fn(),
      hasErrors: jest.fn(),
      getErrorMessage: jest.fn(),
    } as any);
  });

  describe("getInstance", () => {
    it("should always return Supabase implementation", () => {
      const repo = ExerciseRepoFactory.getInstance();

      expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalled();
      expect(repo).toBeDefined();
    });

    it("should return the same instance on multiple calls (singleton)", () => {
      const repo1 = ExerciseRepoFactory.getInstance();
      const repo2 = ExerciseRepoFactory.getInstance();

      expect(repo1).toBe(repo2);
      expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCurrentDataSource", () => {
    it("should always return 'supabase'", () => {
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe("supabase");
    });
  });

  describe("resetInstances", () => {
    it("should reset instances causing new instance creation", () => {
      // Get initial instance
      ExerciseRepoFactory.getInstance();
      expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);

      // Reset and get again
      ExerciseRepoFactory.resetInstances();
      ExerciseRepoFactory.getInstance();
      expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalledTimes(2);
    });
  });
});
