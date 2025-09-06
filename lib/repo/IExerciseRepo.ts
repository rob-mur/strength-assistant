import { Observable } from "@legendapp/state";
import { Exercise, ExerciseInput } from "../models/Exercise";

/**
 * Interface for Exercise repository implementations
 * Defines the contract for data access operations on exercises
 */
export interface IExerciseRepo {
  /**
   * Get all exercises for a user as an Observable
   * @param userId - The user ID
   * @returns Observable array of exercises that updates in real-time
   */
  getExercises(userId: string): Observable<Exercise[]>;

  /**
   * Get a specific exercise by ID for a user
   * @param exerciseId - The ID of the exercise to retrieve
   * @param userId - The user ID
   * @returns Promise that resolves to the exercise or undefined if not found
   */
  getExerciseById(exerciseId: string, userId: string): Promise<Exercise | undefined>;

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

  // Offline-first capabilities
  /**
   * Check if the repository is currently syncing data
   * @returns true if syncing is in progress
   */
  isSyncing(): boolean;

  /**
   * Check if the repository is currently online
   * @returns true if online, false if offline
   */
  isOnline(): boolean;

  /**
   * Get the count of pending changes that need to be synced
   * @returns number of pending changes
   */
  getPendingChangesCount(): number;

  /**
   * Force synchronization of pending changes
   * @returns Promise that resolves when sync is complete
   */
  forceSync(): Promise<void>;

  /**
   * Check if there are any sync errors
   * @returns true if there are errors
   */
  hasErrors(): boolean;

  /**
   * Get the current error message if any
   * @returns error message or null if no errors
   */
  getErrorMessage(): string | null;
}