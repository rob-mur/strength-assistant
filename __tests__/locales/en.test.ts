/**
 * English Locales Test
 *
 * Simple test to provide coverage for en.tsx locales
 */

import English from "../../lib/locales/en";

describe("English Locales", () => {
  it("should export English locale object with required keys", () => {
    expect(English).toBeDefined();
    expect(typeof English).toBe("object");

    // Test some key translations
    expect(English.titleHome).toBe("Home");
    expect(English.titleExercises).toBe("Exercises");
    expect(English.titleWorkout).toBe("Workout");
    expect(English.addExerciseTitle).toBe("Add Exercise");
    expect(English.submit).toBe("Submit");
  });

  it("should have all required locale keys", () => {
    const requiredKeys = [
      "titleHome",
      "titleExercises",
      "titleWorkout",
      "getStartedMessage",
      "getStartedCallToAction",
      "submitting",
      "submit",
      "addExerciseTitle",
      "name",
    ];

    requiredKeys.forEach((key) => {
      expect(English).toHaveProperty(key);
      expect(typeof English[key as keyof typeof English]).toBe("string");
    });
  });
});
