import { RepositoryUtils } from "../../../lib/repo/utils/RepositoryUtils";

describe("RepositoryUtils", () => {
  describe("validateExerciseData", () => {
    test("validates correct exercise data", () => {
      expect(RepositoryUtils.validateExerciseData({ name: "Push-ups" })).toBe(
        true,
      );
      expect(
        RepositoryUtils.validateExerciseData({
          name: "Pull-ups",
          created_at: "2023-01-01",
        }),
      ).toBe(true);
    });

    test("rejects null and undefined data", () => {
      expect(RepositoryUtils.validateExerciseData(null)).toBe(false);
      expect(RepositoryUtils.validateExerciseData(undefined)).toBe(false);
    });

    test("rejects non-object data", () => {
      expect(RepositoryUtils.validateExerciseData("string")).toBe(false);
      expect(RepositoryUtils.validateExerciseData(123)).toBe(false);
      expect(RepositoryUtils.validateExerciseData(true)).toBe(false);
    });

    test("rejects missing or invalid name field", () => {
      expect(RepositoryUtils.validateExerciseData({})).toBe(false);
      expect(RepositoryUtils.validateExerciseData({ name: null })).toBe(false);
      expect(RepositoryUtils.validateExerciseData({ name: 123 })).toBe(false);
      expect(RepositoryUtils.validateExerciseData({ name: "" })).toBe(false);
      expect(RepositoryUtils.validateExerciseData({ name: "   " })).toBe(false);
    });
  });

  describe("getExercisesCollectionPath", () => {
    test("returns correct path for user ID", () => {
      const testUserId = "user123";
      expect(RepositoryUtils.getExercisesCollectionPath(testUserId)).toBe(
        `users/${testUserId}/exercises`,
      );
      expect(RepositoryUtils.getExercisesCollectionPath("another-user")).toBe(
        "users/another-user/exercises",
      );
    });
  });

  describe("validateExerciseId", () => {
    test("accepts valid exercise IDs", () => {
      expect(() =>
        RepositoryUtils.validateExerciseId("valid-id"),
      ).not.toThrow();
      expect(() => RepositoryUtils.validateExerciseId("123")).not.toThrow();
      expect(() =>
        RepositoryUtils.validateExerciseId("uuid-12345"),
      ).not.toThrow();
    });

    test("rejects invalid exercise IDs", () => {
      expect(() => RepositoryUtils.validateExerciseId("")).toThrow(
        "Valid exerciseId is required",
      );
      expect(() => RepositoryUtils.validateExerciseId("   ")).toThrow(
        "Valid exerciseId is required",
      );
      expect(() => RepositoryUtils.validateExerciseId(null as any)).toThrow(
        "Valid exerciseId is required",
      );
      expect(() =>
        RepositoryUtils.validateExerciseId(undefined as any),
      ).toThrow("Valid exerciseId is required");
      expect(() => RepositoryUtils.validateExerciseId(123 as any)).toThrow(
        "Valid exerciseId is required",
      );
    });
  });
});
