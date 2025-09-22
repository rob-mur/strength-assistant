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

jest.mock("@/lib/repo/SupabaseExerciseRepo");

describe("ExerciseRepoFactory - Supabase Only", () => {
  const MockedSupabaseExerciseRepo = SupabaseExerciseRepo as jest.Mocked<
    typeof SupabaseExerciseRepo
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    ExerciseRepoFactory.resetInstances();
    MockedSupabaseExerciseRepo.getInstance.mockReturnValue({} as any);
  });

  it("should always return Supabase regardless of environment variables", () => {
    // Test with different environment variable scenarios
    const scenarios = [
      { USE_SUPABASE_DATA: "true" },
      { USE_SUPABASE_DATA: "false" },
      { USE_SUPABASE_DATA: undefined },
      { EXPO_PUBLIC_USE_SUPABASE: "true" },
      { EXPO_PUBLIC_USE_SUPABASE: "false" },
    ];

    scenarios.forEach((envVars) => {
      // Reset for each test
      ExerciseRepoFactory.resetInstances();

      // Set environment variables
      Object.entries(envVars).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });

      // Should always return Supabase
      const instance = ExerciseRepoFactory.getInstance();
      expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalled();
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe("supabase");
    });
  });

  it("should maintain singleton behavior regardless of environment", () => {
    // Set some environment variables
    process.env.USE_SUPABASE_DATA = "false";
    process.env.EXPO_PUBLIC_USE_SUPABASE = "false";

    const instance1 = ExerciseRepoFactory.getInstance();
    const instance2 = ExerciseRepoFactory.getInstance();

    expect(instance1).toBe(instance2);
    expect(MockedSupabaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);
  });
});
