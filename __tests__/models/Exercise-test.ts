import { ExerciseValidator } from "@/lib/models/Exercise";

describe("ExerciseValidator", () => {
  describe("validateExerciseInput", () => {
    test("validates valid exercise input", () => {
      const validInput = { name: "Push-ups" };
      expect(() => ExerciseValidator.validateExerciseInput(validInput)).not.toThrow();
    });

    test("throws error for null input", () => {
      expect(() => ExerciseValidator.validateExerciseInput(null as any)).toThrow(
        "Exercise input is required"
      );
    });

    test("throws error for undefined input", () => {
      expect(() => ExerciseValidator.validateExerciseInput(undefined as any)).toThrow(
        "Exercise input is required"
      );
    });
  });

  describe("validateExerciseName", () => {
    test("validates valid exercise names", () => {
      const validNames = [
        "Push-ups",
        "Bench Press",
        "Squats (Bodyweight)",
        "Pull-ups",
        "Deadlift 123",
        "Bicep Curls - 15 lbs",
        "Plank (60 sec.)"
      ];

      validNames.forEach(name => {
        expect(() => ExerciseValidator.validateExerciseName(name)).not.toThrow();
      });
    });

    test("throws error for empty name", () => {
      expect(() => ExerciseValidator.validateExerciseName("")).toThrow(
        "Exercise name cannot be empty"
      );
    });

    test("throws error for whitespace-only name", () => {
      expect(() => ExerciseValidator.validateExerciseName("   ")).toThrow(
        "Exercise name cannot be empty"
      );
    });

    test("throws error for null name", () => {
      expect(() => ExerciseValidator.validateExerciseName(null as any)).toThrow(
        "Exercise name is required and must be a string"
      );
    });

    test("throws error for undefined name", () => {
      expect(() => ExerciseValidator.validateExerciseName(undefined as any)).toThrow(
        "Exercise name is required and must be a string"
      );
    });

    test("throws error for non-string name", () => {
      expect(() => ExerciseValidator.validateExerciseName(123 as any)).toThrow(
        "Exercise name is required and must be a string"
      );
    });

    test("throws error for names exceeding max length", () => {
      const tooLongName = "a".repeat(101);
      expect(() => ExerciseValidator.validateExerciseName(tooLongName)).toThrow(
        "Exercise name cannot exceed 100 characters"
      );
    });

    test("throws error for names with invalid characters", () => {
      const invalidNames = [
        "Exercise<script>alert('xss')</script>",
        "Exercise; DROP TABLE exercises;",
        "Exercise & malicious code",
        "Exercise | dangerous",
        "Exercise $ injection",
        "Exercise % attack",
        "Exercise ^ symbol",
        "Exercise * wildcard",
        "Exercise + plus",
        "Exercise = equals",
        "Exercise { brace",
        "Exercise [ bracket",
        "Exercise \\ backslash",
        "Exercise / slash",
        "Exercise ? question",
        "Exercise # hash",
        "Exercise @ at",
        "Exercise ! exclamation"
      ];

      invalidNames.forEach(name => {
        expect(() => ExerciseValidator.validateExerciseName(name)).toThrow(
          "Exercise name contains invalid characters"
        );
      });
    });
  });

  describe("sanitizeExerciseName", () => {
    test("trims whitespace", () => {
      expect(ExerciseValidator.sanitizeExerciseName("  Push-ups  ")).toBe("Push-ups");
    });

    test("normalizes multiple spaces", () => {
      expect(ExerciseValidator.sanitizeExerciseName("Bench    Press")).toBe("Bench Press");
    });

    test("handles tabs and newlines", () => {
      expect(ExerciseValidator.sanitizeExerciseName("Exercise\t\nName")).toBe("Exercise Name");
    });

    test("handles empty string", () => {
      expect(ExerciseValidator.sanitizeExerciseName("")).toBe("");
    });

    test("preserves single spaces", () => {
      expect(ExerciseValidator.sanitizeExerciseName("Bicep Curls")).toBe("Bicep Curls");
    });
  });
});