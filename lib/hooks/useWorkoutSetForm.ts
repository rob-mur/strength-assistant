/**
 * Exercise Set Logging: Form Validation Hook
 *
 * Purpose: React Hook Form integration with Zod validation for workout sets
 * Features: Real-time validation, smart defaults, performance optimization
 */

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useEffect } from "react";
import {
  WorkoutSetFormValidation,
  WorkoutSetFormInput,
  WorkoutSetFormOutput,
} from "../models/validation";
import { WorkoutSetFormData } from "../models/WorkoutSet";
import { formDefaults, sessionStore } from "../store/workoutSetStore";

/**
 * Props for the workout set form hook
 */
interface UseWorkoutSetFormProps {
  /** Exercise ID for the current workout session */
  exerciseId: string;

  /** Callback fired when form is successfully submitted */
  onSubmit: (data: WorkoutSetFormData) => Promise<void>;

  /** Custom session date override (defaults to today) */
  sessionDate?: string;
}

/**
 * Return type for the workout set form hook
 */
interface UseWorkoutSetFormReturn {
  /** React Hook Form instance with all methods */
  form: UseFormReturn<WorkoutSetFormInput, any, WorkoutSetFormOutput>;

  /** Get default values from Legend State store */
  getDefaultValues: () => WorkoutSetFormInput;

  /** Submit handler that can be called directly */
  submitForm: () => Promise<void>;
}

/**
 * Custom hook for managing workout set form state with validation
 *
 * Provides real-time validation, smart defaults, and optimized performance
 * for the <15 second set logging requirement.
 */
export function useWorkoutSetForm({
  exerciseId,
  onSubmit,
  sessionDate,
}: UseWorkoutSetFormProps): UseWorkoutSetFormReturn {
  /**
   * Get reactive default values from Legend State store
   */
  const getDefaultValues = useCallback((): WorkoutSetFormInput => {
    try {
      const defaults = formDefaults.get();
      const date = sessionDate || new Date().toISOString().split("T")[0];
      return {
        weight: defaults.weight || 20, // Default to reasonable weight
        repetitions: defaults.repetitions || 5, // Default to reasonable reps
        rpe: 5.0, // Start with neutral RPE for user adjustment
        exercise_id: exerciseId,
        session_date: date,
      };
    } catch {
      // Fallback to safe defaults if Legend State fails
      const date = sessionDate || new Date().toISOString().split("T")[0];
      return {
        weight: 20, // Default to reasonable weight
        repetitions: 5, // Default to reasonable reps
        rpe: 5.0,
        exercise_id: exerciseId,
        session_date: date,
      };
    }
  }, [exerciseId, sessionDate]);

  /**
   * Initial default values for form initialization
   */
  const defaultValues = useMemo(() => getDefaultValues(), [getDefaultValues]);

  /**
   * Set current session context in Legend State store
   */
  useEffect(() => {
    const date = sessionDate || new Date().toISOString().split("T")[0];
    sessionStore.currentSession.set({
      date,
      exerciseId,
      lastSet: undefined,
    });
  }, [exerciseId, sessionDate]);

  /**
   * Configure React Hook Form with Zod validation
   */
  const form = useForm<WorkoutSetFormInput, any, WorkoutSetFormOutput>({
    resolver: zodResolver(WorkoutSetFormValidation),
    defaultValues,
    mode: "onChange", // Real-time validation for immediate feedback
    criteriaMode: "firstError",
    shouldFocusError: true,
    shouldUseNativeValidation: false,
  });

  const { handleSubmit } = form;

  const submitForm = useCallback(async (): Promise<void> => {
    await handleSubmit(async (data: WorkoutSetFormOutput) => {
      // Convert to the format expected by onSubmit
      const formData: WorkoutSetFormData = {
        weight: data.weight,
        repetitions: data.repetitions,
        rpe: data.rpe,
      };
      await onSubmit(formData);
    })();
  }, [handleSubmit, onSubmit]);

  return {
    form,
    getDefaultValues,
    submitForm,
  };
}

/**
 * Type exports for component usage
 */
export type { UseWorkoutSetFormProps, UseWorkoutSetFormReturn };
