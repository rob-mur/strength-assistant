/**
 * Form Validation Test
 *
 * Purpose: Test that workout set form validation allows valid inputs
 */

import { WorkoutSetFormValidation } from "../../lib/models/validation";

describe("Workout Set Form Validation", () => {
  it("should validate valid form data", () => {
    const validData = {
      weight: 50,
      repetitions: 5,
      rpe: 7.5,
      exercise_id: "bench-press",
      session_date: "2023-01-01",
    };

    const result = WorkoutSetFormValidation.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(50);
      expect(result.data.repetitions).toBe(5);
      expect(result.data.rpe).toBe(7.5);
    }
  });

  it("should accept numeric string inputs and convert them", () => {
    const stringData = {
      weight: "50", // Should be converted to number
      repetitions: "5", // Should be converted to number
      rpe: 7.5,
      exercise_id: "bench-press",
      session_date: "2023-01-01",
    };

    const result = WorkoutSetFormValidation.safeParse(stringData);
    expect(result.success).toBe(true); // Should succeed with valid string numbers
    if (result.success) {
      expect(result.data.weight).toBe(50);
      expect(result.data.repetitions).toBe(5);
    }
  });

  it("should reject invalid data", () => {
    const invalidData = {
      weight: 0, // Must be positive
      repetitions: 0, // Must be positive
      rpe: 7.5,
      exercise_id: "bench-press",
      session_date: "2023-01-01",
    };

    const result = WorkoutSetFormValidation.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes("weight"))).toBe(true);
      expect(result.error.issues.some(issue => issue.path.includes("repetitions"))).toBe(true);
    }
  });

  it("should accept reasonable default values", () => {
    const defaultData = {
      weight: 20,
      repetitions: 5,
      rpe: 5.0,
      exercise_id: "bench-press",
      session_date: new Date().toISOString().split("T")[0],
    };

    const result = WorkoutSetFormValidation.safeParse(defaultData);
    expect(result.success).toBe(true);
  });
});