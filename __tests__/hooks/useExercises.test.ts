import { renderHook } from "@testing-library/react-native";
import { useExercises } from "@/lib/hooks/useExercises";
import { ExerciseRepo } from "@/lib/repo/ExerciseRepo";
import { logger } from "@/lib/data/firebase/logger";

// Mock dependencies
jest.mock("@/lib/repo/ExerciseRepo");
jest.mock("@/lib/data/firebase/logger");

const mockExerciseRepo = ExerciseRepo as jest.Mocked<typeof ExerciseRepo>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("useExercises", () => {
  const mockUnsubscribe = jest.fn();
  const mockSubscribeToExercises = jest.fn().mockReturnValue(mockUnsubscribe);
  const mockGetInstance = jest.fn().mockReturnValue({
    subscribeToExercises: mockSubscribeToExercises,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockExerciseRepo.getInstance = mockGetInstance;
  });

  it("should warn and return empty exercises when uid is empty", () => {
    const { result } = renderHook(() => useExercises(""));

    expect(result.current.exercises).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "useExercises: User not authenticated, exercises will be empty",
      expect.objectContaining({
        service: "useExercises",
        platform: "React Native",
        operation: "fetch_exercises",
      }),
    );
  });

  it("should subscribe to exercises when uid is provided", () => {
    const { result } = renderHook(() => useExercises("user123"));

    expect(mockGetInstance).toHaveBeenCalled();
    expect(mockSubscribeToExercises).toHaveBeenCalledWith(
      "user123",
      expect.any(Function),
    );
    expect(result.current.exercises).toEqual([]);
  });

  it("should handle subscription callback properly", () => {
    let subscriptionCallback: ((exercises: any[]) => void) | undefined;

    const mockSubscribe = jest.fn().mockImplementation((uid, callback) => {
      subscriptionCallback = callback;
      // Immediately call the callback to simulate subscription
      callback([{ id: "1", name: "Exercise 1" }]);
      return mockUnsubscribe;
    });

    mockGetInstance.mockReturnValue({
      subscribeToExercises: mockSubscribe,
    });

    const { result } = renderHook(() => useExercises("user123"));

    // Should have been called with exercises
    expect(mockSubscribe).toHaveBeenCalled();
    expect(subscriptionCallback).toBeDefined();
  });
});
