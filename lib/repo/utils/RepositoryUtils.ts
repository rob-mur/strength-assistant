/**
 * Common utilities shared across repository implementations
 */
export class RepositoryUtils {
  /**
   * Validate exercise data structure
   */
  static validateExerciseData(data: unknown): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;
    if (typeof obj.name !== "string") return false;
    if (obj.name.trim().length === 0) return false;
    return true;
  }

  /**
   * Get exercises collection path for a user
   */
  static getExercisesCollectionPath(userId: string): string {
    return `users/${userId}/exercises`;
  }

  /**
   * Validate exercise ID input
   */
  static validateExerciseId(exerciseId: string): void {
    if (
      !exerciseId ||
      typeof exerciseId !== "string" ||
      exerciseId.trim().length === 0
    ) {
      throw new Error("Valid exerciseId is required");
    }
  }
}
