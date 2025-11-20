/**
 * Exercise Set Logging: Zod Validation Schemas
 *
 * Purpose: Client-side validation matching database constraints
 * Features: Real-time validation with user-friendly error messages
 */

import { z } from "zod";
import { WORKOUT_SET_CONSTRAINTS } from "./WorkoutSet";

/**
 * Core validation schema for workout set form data
 * Matches database constraints and API contract
 */
export const WorkoutSetValidation = z.object({
  weight: z
    .number()
    .positive("Weight must be positive")
    .min(
      WORKOUT_SET_CONSTRAINTS.weight.min,
      `Weight must be at least ${WORKOUT_SET_CONSTRAINTS.weight.min}`,
    )
    .max(
      WORKOUT_SET_CONSTRAINTS.weight.max,
      `Weight cannot exceed ${WORKOUT_SET_CONSTRAINTS.weight.max}`,
    )
    .transform((val) => Math.round(val * 100) / 100), // Round to 2 decimal places for precision

  repetitions: z
    .number()
    .int("Repetitions must be a whole number")
    .min(
      WORKOUT_SET_CONSTRAINTS.repetitions.min,
      `At least ${WORKOUT_SET_CONSTRAINTS.repetitions.min} repetition required`,
    )
    .max(
      WORKOUT_SET_CONSTRAINTS.repetitions.max,
      `Cannot exceed ${WORKOUT_SET_CONSTRAINTS.repetitions.max} repetitions`,
    ),

  rpe: z
    .number()
    .min(
      WORKOUT_SET_CONSTRAINTS.rpe.min,
      `RPE must be at least ${WORKOUT_SET_CONSTRAINTS.rpe.min}`,
    )
    .max(
      WORKOUT_SET_CONSTRAINTS.rpe.max,
      `RPE cannot exceed ${WORKOUT_SET_CONSTRAINTS.rpe.max}`,
    )
    .refine(
      (val) => {
        // Check if value is in 0.5 increments: multiply by 2 should give whole number
        const multiplied = val * 2;
        return multiplied === Math.floor(multiplied);
      },
      {
        message:
          "RPE must be in 0.5 increments (e.g., 1.0, 1.5, 2.0, ..., 9.5, 10.0)",
      },
    ),

  exercise_id: z.string().uuid("Invalid exercise ID format"),

  session_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (dateString) => {
        // Validate it's a real date and not in the future
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
      },
      {
        message: "Session date cannot be in the future",
      },
    ),
});

/**
 * Validation schema for updating existing workout sets
 * All fields optional except for required validation of provided fields
 */
export const UpdateWorkoutSetValidation = WorkoutSetValidation.partial().omit({
  exercise_id: true,
  session_date: true,
});

/**
 * Form-specific validation schema for React Hook Form
 * Includes transform functions for form field processing
 */
export const WorkoutSetFormValidation = z.object({
  weight: z.preprocess((val) => {
    // Handle string input from text fields
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, WorkoutSetValidation.shape.weight),

  repetitions: z.preprocess((val) => {
    // Handle string input from text fields
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, WorkoutSetValidation.shape.repetitions),

  rpe: WorkoutSetValidation.shape.rpe,
  exercise_id: WorkoutSetValidation.shape.exercise_id,
  session_date: WorkoutSetValidation.shape.session_date,
});

/**
 * Inferred TypeScript types from validation schemas
 */
export type WorkoutSetFormData = z.infer<typeof WorkoutSetValidation>;
export type UpdateWorkoutSetFormData = z.infer<
  typeof UpdateWorkoutSetValidation
>;
export type WorkoutSetFormInput = z.infer<typeof WorkoutSetFormValidation>;

/**
 * Validation result helpers for form error handling
 */
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
};

/**
 * Helper function to safely validate workout set data
 * Returns user-friendly error format for form display
 */
export function validateWorkoutSet(
  data: unknown,
): ValidationResult<WorkoutSetFormData> {
  try {
    const result = WorkoutSetValidation.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    // Transform Zod errors to field-specific error messages
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path.join(".");
      errors[field] = issue.message;
    });

    return {
      success: false,
      errors,
    };
  } catch {
    return {
      success: false,
      errors: {
        general: "Validation failed due to unexpected error",
      },
    };
  }
}

/**
 * Helper function to validate partial updates
 */
export function validateWorkoutSetUpdate(
  data: unknown,
): ValidationResult<UpdateWorkoutSetFormData> {
  try {
    const result = UpdateWorkoutSetValidation.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path.join(".");
      errors[field] = issue.message;
    });

    return {
      success: false,
      errors,
    };
  } catch {
    return {
      success: false,
      errors: {
        general: "Update validation failed",
      },
    };
  }
}

/**
 * Type guards using validation schemas
 */
export function isValidWorkoutSetData(
  data: unknown,
): data is WorkoutSetFormData {
  return WorkoutSetValidation.safeParse(data).success;
}

export function isValidUpdateData(
  data: unknown,
): data is UpdateWorkoutSetFormData {
  return UpdateWorkoutSetValidation.safeParse(data).success;
}

/**
 * Common validation patterns for reuse
 */
export const ValidationPatterns = {
  // Positive number with 2 decimal places max
  positiveDecimal: z
    .number()
    .positive()
    .transform((val) => Math.round(val * 100) / 100),

  // Positive integer
  positiveInteger: z.number().int().positive(),

  // UUID format
  uuid: z.string().uuid(),

  // Date in YYYY-MM-DD format not in future
  sessionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((dateString) => new Date(dateString) <= new Date()),

  // RPE with 0.5 increment validation
  rpeIncrement: z
    .number()
    .min(1.0)
    .max(10.0)
    .refine((val) => val * 2 === Math.floor(val * 2)),
} as const;
