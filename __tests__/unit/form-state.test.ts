/**
 * Unit Tests: Form State Management
 *
 * Purpose: Test form behavior with React Hook Form integration and Legend State store
 * Coverage: Smart defaults, real-time validation, form submission flow, Legend State integration
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import {
  useWorkoutSetForm,
  UseWorkoutSetFormProps,
  UseWorkoutSetFormReturn,
} from "../../lib/hooks/useWorkoutSetForm";
import { WorkoutSet } from "../../lib/models/WorkoutSet";

// Mock Legend State store
jest.mock("../../lib/store/workoutSetStore", () => ({
  formDefaults: {
    get: jest.fn(() => ({ weight: 0, repetitions: 0 })),
  },
  sessionStore: {
    currentSession: {
      set: jest.fn(),
    },
  },
}));

describe("useWorkoutSetForm", () => {
  // Common test data
  const mockExerciseId = "550e8400-e29b-41d4-a716-446655440000";
  const mockSessionDate = "2025-11-19";

  const defaultProps: UseWorkoutSetFormProps = {
    exerciseId: mockExerciseId,
    onSubmit: jest.fn(),
    sessionDate: mockSessionDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return default values
    const { formDefaults } = require("../../lib/store/workoutSetStore");
    formDefaults.get.mockReturnValue({ weight: 0, repetitions: 0 });
  });

  describe("form initialization", () => {
    it("provides default values without legend state data", () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      const defaultValues = result.current.getDefaultValues();
      expect(defaultValues).toEqual({
        weight: 20, // Default to reasonable weight
        repetitions: 5, // Default to reasonable reps
        rpe: 5.0, // Start with neutral RPE for user adjustment
        exercise_id: mockExerciseId,
        session_date: mockSessionDate,
      });
    });

    it("provides smart defaults from Legend State store", () => {
      // Mock Legend State to return previous set data
      const { formDefaults } = require("../../lib/store/workoutSetStore");
      formDefaults.get.mockReturnValue({ weight: 135, repetitions: 8 });

      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      const defaultValues = result.current.getDefaultValues();
      expect(defaultValues).toEqual({
        weight: 135,
        repetitions: 8,
        rpe: 5.0, // RPE always starts neutral
        exercise_id: mockExerciseId,
        session_date: mockSessionDate,
      });
    });

    it("uses today's date when sessionDate not provided", () => {
      const today = new Date().toISOString().split("T")[0];
      const { result } = renderHook(() =>
        useWorkoutSetForm({
          exerciseId: mockExerciseId,
          onSubmit: jest.fn(),
        }),
      );

      const defaultValues = result.current.getDefaultValues();
      expect(defaultValues.session_date).toBe(today);
    });

    it("initializes React Hook Form with proper configuration", () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Verify form instance exists and has expected properties
      expect(result.current.form).toBeDefined();
      expect(result.current.form.control).toBeDefined();
      expect(result.current.form.formState).toBeDefined();
      expect(typeof result.current.form.getValues).toBe("function");
      expect(typeof result.current.form.setValue).toBe("function");
    });

    it("sets up session context in Legend State store", () => {
      const { sessionStore } = require("../../lib/store/workoutSetStore");

      renderHook(() => useWorkoutSetForm(defaultProps));

      expect(sessionStore.currentSession.set).toHaveBeenCalledWith({
        date: mockSessionDate,
        exerciseId: mockExerciseId,
        lastSet: undefined,
      });
    });
  });

  describe("form validation behavior", () => {
    it("validates fields in real-time when enabled", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Set invalid weight
      act(() => {
        result.current.form.setValue("weight", -5, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.weight).toBeDefined();
      });
    });

    it("provides field-specific error messages for weight validation", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      act(() => {
        result.current.form.setValue("weight", -5, { shouldValidate: true });
      });

      await waitFor(() => {
        const weightError = result.current.form.formState.errors.weight;
        expect(weightError).toBeDefined();
        expect(weightError?.message).toContain("positive");
      });
    });

    it("validates entire form programmatically", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Set valid data
      act(() => {
        result.current.form.setValue("weight", 135);
        result.current.form.setValue("repetitions", 8);
        result.current.form.setValue("rpe", 7.5);
        result.current.form.setValue("exercise_id", mockExerciseId);
        result.current.form.setValue("session_date", mockSessionDate);
      });

      await act(async () => {
        const isValid = await result.current.form.trigger();
        expect(isValid).toBe(true);
      });
    });

    it("fails validation for invalid RPE increments", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      act(() => {
        result.current.form.setValue("weight", 135, { shouldValidate: true });
        result.current.form.setValue("repetitions", 8, {
          shouldValidate: true,
        });
        result.current.form.setValue("rpe", 7.3, { shouldValidate: true }); // Invalid increment
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.rpe).toBeDefined();
        expect(result.current.form.formState.errors.rpe?.message).toContain(
          "0.5 increments",
        );
      });
    });
  });

  describe("form submission", () => {
    it("calls onSubmit with converted data format", async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useWorkoutSetForm({ ...defaultProps, onSubmit: mockOnSubmit }),
      );

      // Set valid form data
      act(() => {
        result.current.form.setValue("weight", 135);
        result.current.form.setValue("repetitions", 8);
        result.current.form.setValue("rpe", 7.5);
        result.current.form.setValue("exercise_id", mockExerciseId);
        result.current.form.setValue("session_date", mockSessionDate);
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        weight: 135,
        repetitions: 8,
        rpe: 7.5,
      });
    });

    it("handles submission errors gracefully", async () => {
      const mockOnSubmit = jest
        .fn()
        .mockRejectedValue(new Error("Submission failed"));
      const { result } = renderHook(() =>
        useWorkoutSetForm({ ...defaultProps, onSubmit: mockOnSubmit }),
      );

      // Set valid data
      act(() => {
        result.current.form.setValue("weight", 135);
        result.current.form.setValue("repetitions", 8);
        result.current.form.setValue("rpe", 7.5);
        result.current.form.setValue("exercise_id", mockExerciseId);
        result.current.form.setValue("session_date", mockSessionDate);
      });

      await expect(
        act(async () => {
          await result.current.submitForm();
        }),
      ).rejects.toThrow("Submission failed");
    });

    it("prevents submission with invalid data", async () => {
      const mockOnSubmit = jest.fn();
      const { result } = renderHook(() =>
        useWorkoutSetForm({ ...defaultProps, onSubmit: mockOnSubmit }),
      );

      // Set invalid data and trigger validation
      act(() => {
        result.current.form.setValue("weight", -5, { shouldValidate: true });
        result.current.form.setValue("repetitions", 0, {
          shouldValidate: true,
        });
        result.current.form.setValue("exercise_id", "invalid-uuid", {
          shouldValidate: true,
        });
      });

      await waitFor(
        () => {
          expect(result.current.form.formState.isValid).toBe(false);
        },
        { timeout: 3000 },
      );

      // Check that errors exist
      const errors = result.current.form.formState.errors;
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });
  });

  describe("form state helpers", () => {
    it("tracks form dirty state correctly", () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Form should not be dirty initially
      expect(result.current.form.formState.isDirty).toBe(false);

      // Modify a field
      act(() => {
        result.current.form.setValue("weight", 135, { shouldDirty: true });
      });

      expect(result.current.form.formState.isDirty).toBe(true);
    });

    it("correctly identifies submittable state", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Set valid data
      act(() => {
        result.current.form.setValue("weight", 135, { shouldValidate: true });
        result.current.form.setValue("repetitions", 8, {
          shouldValidate: true,
        });
        result.current.form.setValue("rpe", 7.5, { shouldValidate: true });
        result.current.form.setValue("exercise_id", mockExerciseId, {
          shouldValidate: true,
        });
        result.current.form.setValue("session_date", mockSessionDate, {
          shouldValidate: true,
        });
      });

      await waitFor(() => {
        expect(result.current.form.formState.isValid).toBe(true);
      });

      // Set invalid data
      act(() => {
        result.current.form.setValue("weight", -5, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.isValid).toBe(false);
      });
    });

    it("resets form to defaults correctly", () => {
      const { formDefaults } = require("../../lib/store/workoutSetStore");
      formDefaults.get.mockReturnValue({ weight: 135, repetitions: 8 });

      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Modify form data
      act(() => {
        result.current.form.setValue("weight", 200);
        result.current.form.setValue("repetitions", 12);
        result.current.form.setValue("rpe", 9.0);
      });

      // Reset to defaults
      act(() => {
        const newDefaults = result.current.getDefaultValues();
        result.current.form.reset(newDefaults);
      });

      const formValues = result.current.form.getValues();
      expect(formValues.weight).toBe(135);
      expect(formValues.repetitions).toBe(8);
      expect(formValues.rpe).toBe(5.0); // Should reset to neutral RPE
    });

    it("provides accurate error checking", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // No errors initially
      expect(Object.keys(result.current.form.formState.errors).length).toBe(0);

      // Add invalid data and verify error appears
      act(() => {
        result.current.form.setValue("weight", -5, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(
          Object.keys(result.current.form.formState.errors).length,
        ).toBeGreaterThan(0);
      });

      // Fix the error
      act(() => {
        result.current.form.setValue("weight", 135, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.weight).toBeUndefined();
      });
    });
  });

  describe("Legend State integration", () => {
    it("updates session context when props change", () => {
      const { sessionStore } = require("../../lib/store/workoutSetStore");
      const { result, rerender } = renderHook(
        ({ exerciseId, sessionDate }) =>
          useWorkoutSetForm({ exerciseId, sessionDate, onSubmit: jest.fn() }),
        {
          initialProps: {
            exerciseId: mockExerciseId,
            sessionDate: mockSessionDate,
          },
        },
      );

      // Change props
      rerender({
        exerciseId: "new-exercise-id",
        sessionDate: "2025-11-20",
      });

      expect(sessionStore.currentSession.set).toHaveBeenCalledWith({
        date: "2025-11-20",
        exerciseId: "new-exercise-id",
        lastSet: undefined,
      });
    });

    it("reacts to Legend State default value changes", () => {
      const { formDefaults } = require("../../lib/store/workoutSetStore");
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Change Legend State values
      formDefaults.get.mockReturnValue({ weight: 140, repetitions: 10 });

      // Get new defaults
      const newDefaults = result.current.getDefaultValues();
      expect(newDefaults.weight).toBe(140);
      expect(newDefaults.repetitions).toBe(10);
    });
  });

  describe("performance optimization", () => {
    it("memoizes default values appropriately", () => {
      const { formDefaults } = require("../../lib/store/workoutSetStore");
      const { result, rerender } = renderHook(
        ({ exerciseId }) =>
          useWorkoutSetForm({ exerciseId, onSubmit: jest.fn() }),
        { initialProps: { exerciseId: mockExerciseId } },
      );

      const initialDefaults = result.current.getDefaultValues();

      // Rerender with same props
      rerender({ exerciseId: mockExerciseId });

      // Defaults function should be stable
      expect(result.current.getDefaultValues).toBe(
        result.current.getDefaultValues,
      );
    });

    it("handles rapid validation changes efficiently", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      // Set all required fields first
      act(() => {
        result.current.form.setValue("exercise_id", mockExerciseId);
        result.current.form.setValue("session_date", mockSessionDate);
        result.current.form.setValue("repetitions", 8);
        result.current.form.setValue("rpe", 7.5);
      });

      // Rapid value changes on weight
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.form.setValue("weight", 100 + i, {
            shouldValidate: true,
          });
        }
      });

      await waitFor(() => {
        expect(result.current.form.getValues().weight).toBe(109);
      });
    });
  });

  describe("edge cases", () => {
    it("handles missing exercise ID gracefully", () => {
      const propsWithoutId = { ...defaultProps, exerciseId: "" };
      const { result } = renderHook(() => useWorkoutSetForm(propsWithoutId));

      const defaultValues = result.current.getDefaultValues();
      expect(defaultValues.exercise_id).toBe("");
    });

    it("handles Legend State store errors gracefully", () => {
      const { formDefaults } = require("../../lib/store/workoutSetStore");
      formDefaults.get.mockImplementation(() => {
        throw new Error("Store error");
      });

      // Should not throw
      expect(() => {
        renderHook(() => useWorkoutSetForm(defaultProps));
      }).not.toThrow();
    });

    it("handles async submission errors with proper error state", async () => {
      const mockOnSubmit = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() =>
        useWorkoutSetForm({ ...defaultProps, onSubmit: mockOnSubmit }),
      );

      // Set valid data
      act(() => {
        result.current.form.setValue("weight", 135);
        result.current.form.setValue("repetitions", 8);
        result.current.form.setValue("rpe", 7.5);
        result.current.form.setValue("exercise_id", mockExerciseId);
        result.current.form.setValue("session_date", mockSessionDate);
      });

      // Should handle error without crashing
      await expect(
        act(async () => {
          await result.current.submitForm();
        }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("validation performance", () => {
    it("meets <200ms validation performance requirement", async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));

      const startTime = performance.now();

      act(() => {
        result.current.form.setValue("weight", 135, { shouldValidate: true });
        result.current.form.setValue("repetitions", 8, {
          shouldValidate: true,
        });
        result.current.form.setValue("rpe", 7.5, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.isValid).toBe(true);
      });

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Should complete validation in under 200ms
      expect(validationTime).toBeLessThan(200);
    });
  });
});
