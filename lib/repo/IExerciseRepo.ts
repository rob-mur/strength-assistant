import { Observable } from "@legendapp/state";
import { Exercise, ExerciseInput } from "../models/Exercise";

/**
 * Interface for Exercise repository implementations
 * Defines the contract for data access operations on exercises
 */
export interface IExerciseRepo {
  /**
   * Get all exercises for a user
   * @param userId - The user ID
   * @returns Promise that resolves to array of exercises
   */
  getExercises(userId: string): Promise<Exercise[]>;

  /**
   * Subscribe to real-time exercise updates for a user
   * @param userId - The user ID
   * @param callback - Function called when exercises change
   * @returns Unsubscribe function
   */
  subscribeToExercises(userId: string, callback: (exercises: Exercise[]) => void): () => void;

  /**
   * Add a new exercise for a user
   * @param userId - The user ID
   * @param exercise - The exercise input data
   * @returns Promise that resolves when the exercise is added
   */
  addExercise(userId: string, exercise: ExerciseInput): Promise<void>;

  /**
   * Delete an exercise for a user
   * @param userId - The user ID
   * @param exerciseId - The ID of the exercise to delete
   * @returns Promise that resolves when the exercise is deleted
   */
  deleteExercise(userId: string, exerciseId: string): Promise<void>;
}