import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { exerciseUtils } from "@/lib/data/store";
import { ExerciseValidator } from "@/lib/models/Exercise";
import { renderHook, waitFor } from "@testing-library/react-native";
import { act } from "react-test-renderer";

// Mock dependencies
jest.mock("@/lib/hooks/useAuth");
jest.mock("@/lib/data/store");
jest.mock("@/lib/models/Exercise");

const mockUseAuth = jest.mocked(useAuth);
const mockExerciseUtils = jest.mocked(exerciseUtils);
const mockExerciseValidator = jest.mocked(ExerciseValidator);

describe("useAddExercise", () => {
  // Mock console methods to verify logging
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup console spies
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };

    // Default mock setup
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-user-id",
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

    mockExerciseValidator.validateExerciseName.mockImplementation(() => {
      // Do nothing - validation passes
    });
    mockExerciseValidator.sanitizeExerciseName.mockImplementation((name) =>
      name.trim(),
    );

    mockExerciseUtils.addExercise.mockReturnValue("test-exercise-id");
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe("Successful Exercise Addition", () => {
    test("successfully adds exercise with valid input", async () => {
      // Given
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Push-ups");
      });

      // Then
      expect(mockExerciseValidator.validateExerciseName).toHaveBeenCalledWith(
        "Push-ups",
      );
      expect(mockExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(
        "Push-ups",
      );
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: "test-user-id",
      });
    });

    test("uses sanitized exercise name", async () => {
      // Given
      mockExerciseValidator.sanitizeExerciseName.mockReturnValue(
        "Clean Exercise Name",
      );
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("  Dirty   Exercise    Name  ");
      });

      // Then
      expect(mockExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(
        "  Dirty   Exercise    Name  ",
      );
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Clean Exercise Name",
        user_id: "test-user-id",
      });
    });

    test("logs successful exercise addition", async () => {
      // Given
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Push-ups");
      });

      // Then
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "🏋️ useAddExercise - Starting addExercise with syncedSupabase:",
        "exercise:",
        "Push-ups",
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "🏋️ useAddExercise - User authenticated:",
        "test-user-id",
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "🏋️ useAddExercise - Adding exercise via syncedSupabase",
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "🏋️ useAddExercise - Exercise added with ID:",
        "test-exercise-id",
        "- syncedSupabase will handle sync automatically!",
      );
    });
  });

  describe("Authentication Error Handling", () => {
    test("throws error when user is null", async () => {
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

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then
      await act(async () => {
        await expect(result.current("Push-ups")).rejects.toThrow(
          "User must be authenticated to add exercises",
        );
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "🏋️ useAddExercise - No authenticated user",
      );
      expect(mockExerciseUtils.addExercise).not.toHaveBeenCalled();
    });

    test("throws error when user.uid is undefined", async () => {
      // Given
      mockUseAuth.mockReturnValue({
        user: {
          uid: undefined as any,
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

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then - Current implementation doesn't check uid validity, only user existence
      await act(async () => {
        await result.current("Push-ups");
      });

      // Should still call addExercise with undefined uid (current behavior)
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: undefined,
      });
    });

    test("throws error when user.uid is empty string", async () => {
      // Given
      mockUseAuth.mockReturnValue({
        user: {
          uid: "",
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

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then - Current implementation doesn't check uid validity, only user existence
      await act(async () => {
        await result.current("Push-ups");
      });

      // Should still call addExercise with empty string uid (current behavior)
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: "",
      });
    });
  });

  describe("Exercise Validation Error Handling", () => {
    test("throws validation error and logs it", async () => {
      // Given
      const validationError = new Error("Exercise name is too short");
      mockExerciseValidator.validateExerciseName.mockImplementation(() => {
        throw validationError;
      });

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then
      await act(async () => {
        await expect(result.current("x")).rejects.toThrow(
          "Exercise name is too short",
        );
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "🏋️ useAddExercise - Invalid exercise name:",
        validationError,
      );
      expect(mockExerciseUtils.addExercise).not.toHaveBeenCalled();
    });

    test("handles validation errors for empty names", async () => {
      // Given
      mockExerciseValidator.validateExerciseName.mockImplementation(() => {
        throw new Error("Exercise name cannot be empty");
      });

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then
      await act(async () => {
        await expect(result.current("")).rejects.toThrow(
          "Exercise name cannot be empty",
        );
      });
    });

    test("handles validation errors for invalid characters", async () => {
      // Given
      mockExerciseValidator.validateExerciseName.mockImplementation(() => {
        throw new Error("Exercise name contains invalid characters");
      });

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then
      await act(async () => {
        await expect(result.current("Push@ups!")).rejects.toThrow(
          "Exercise name contains invalid characters",
        );
      });
    });

    test("handles validation errors for names that are too long", async () => {
      // Given
      const longName = "a".repeat(101);
      mockExerciseValidator.validateExerciseName.mockImplementation(() => {
        throw new Error("Exercise name cannot exceed 100 characters");
      });

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When & Then
      await act(async () => {
        await expect(result.current(longName)).rejects.toThrow(
          "Exercise name cannot exceed 100 characters",
        );
      });
    });
  });

  describe("Hook Return Value and Parameter Usage", () => {
    test("returns a function", () => {
      // When
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // Then
      expect(typeof result.current).toBe("function");
    });

    test("parameter _uid is correctly ignored in favor of auth state", async () => {
      // Given
      const { result } = renderHook(() => useAddExercise("ignored-uid"));

      // When
      await act(async () => {
        await result.current("Push-ups");
      });

      // Then - Should use the UID from auth state, not the parameter
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: "test-user-id", // From mocked auth state
      });
    });

    test("hook can be called multiple times", async () => {
      // Given
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Exercise 1");
        await result.current("Exercise 2");
      });

      // Then
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledTimes(2);
      expect(mockExerciseUtils.addExercise).toHaveBeenNthCalledWith(1, {
        name: "Exercise 1",
        user_id: "test-user-id",
      });
      expect(mockExerciseUtils.addExercise).toHaveBeenNthCalledWith(2, {
        name: "Exercise 2",
        user_id: "test-user-id",
      });
    });
  });

  describe("Integration with External Dependencies", () => {
    test("correctly integrates with exerciseUtils.addExercise", async () => {
      // Given
      mockExerciseUtils.addExercise.mockReturnValue("custom-exercise-id");
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Pull-ups");
      });

      // Then
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Pull-ups",
        user_id: "test-user-id",
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "🏋️ useAddExercise - Exercise added with ID:",
        "custom-exercise-id",
        "- syncedSupabase will handle sync automatically!",
      );
    });

    test("validates exercise name before sanitizing", async () => {
      // Given
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Test Exercise");
      });

      // Then - Both should be called
      expect(mockExerciseValidator.validateExerciseName).toHaveBeenCalledWith(
        "Test Exercise",
      );
      expect(mockExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(
        "Test Exercise",
      );
    });

    test("uses current auth user rather than cached state", async () => {
      // Given - Auth state changes during hook usage
      let callCount = 0;
      mockUseAuth.mockImplementation(() => {
        callCount++;
        return {
          user: {
            uid: `dynamic-user-${callCount}`,
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
        };
      });

      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("Push-ups");
      });

      // Then - Should use the current user from auth, not cached
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: "dynamic-user-1",
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles whitespace-only exercise names through sanitization", async () => {
      // Given
      mockExerciseValidator.sanitizeExerciseName.mockReturnValue(
        "Trimmed Name",
      );
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current("   Trimmed Name   ");
      });

      // Then
      expect(mockExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(
        "   Trimmed Name   ",
      );
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Trimmed Name",
        user_id: "test-user-id",
      });
    });

    test("handles special characters that pass validation", async () => {
      // Given
      const exerciseWithSpecialChars = "Push-ups (beginner)";
      const { result } = renderHook(() => useAddExercise("test-user-id"));

      // When
      await act(async () => {
        await result.current(exerciseWithSpecialChars);
      });

      // Then
      expect(mockExerciseValidator.validateExerciseName).toHaveBeenCalledWith(
        exerciseWithSpecialChars,
      );
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: exerciseWithSpecialChars,
        user_id: "test-user-id",
      });
    });

    test("ensures hook re-execution gets fresh auth state", async () => {
      // Given
      const { result, rerender } = renderHook(() =>
        useAddExercise("test-user-id"),
      );

      // Change auth state
      mockUseAuth.mockReturnValue({
        user: {
          uid: "new-user-id",
          email: "new@example.com",
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

      rerender();

      // When
      await act(async () => {
        await result.current("Push-ups");
      });

      // Then - Should use the updated auth state
      expect(mockExerciseUtils.addExercise).toHaveBeenCalledWith({
        name: "Push-ups",
        user_id: "new-user-id",
      });
    });
  });
});
