export interface Exercise {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface ExerciseInput {
  name: string;
}

/**
 * Validation utilities for exercise data
 */
export class ExerciseValidator {
  private static readonly MIN_NAME_LENGTH = 1;
  private static readonly MAX_NAME_LENGTH = 100;
  private static readonly VALID_NAME_PATTERN = /^[a-zA-Z0-9\s\-_.,()]+$/;

  /**
   * Validates exercise input data
   * @param input - The exercise input to validate
   * @throws Error if validation fails
   */
  static validateExerciseInput(input: ExerciseInput): void {
    if (!input) {
      throw new Error('Exercise input is required');
    }

    this.validateExerciseName(input.name);
  }

  /**
   * Validates exercise name
   * @param name - The exercise name to validate
   * @throws Error if validation fails
   */
  static validateExerciseName(name: string): void {
    if (name === null || name === undefined || typeof name !== 'string') {
      throw new Error('Exercise name is required and must be a string');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < this.MIN_NAME_LENGTH) {
      throw new Error('Exercise name cannot be empty');
    }

    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      throw new Error(`Exercise name cannot exceed ${this.MAX_NAME_LENGTH} characters`);
    }

    if (!this.VALID_NAME_PATTERN.test(trimmedName)) {
      throw new Error('Exercise name contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed');
    }
  }

  /**
   * Sanitizes exercise name for safe storage
   * @param name - The exercise name to sanitize
   * @returns Sanitized name
   */
  static sanitizeExerciseName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }
}
