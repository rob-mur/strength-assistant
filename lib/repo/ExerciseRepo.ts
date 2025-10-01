import { IExerciseRepo } from "./IExerciseRepo";
import { ExerciseRepoFactory } from "./ExerciseRepoFactory";

/**
 * Factory-based ExerciseRepo that delegates to Supabase implementation
 * Uses ExerciseRepoFactory to get SupabaseExerciseRepo instance
 *
 * This class maintains backwards compatibility for existing code
 */
export class ExerciseRepo implements IExerciseRepo {
  private static instance: ExerciseRepo;
  private delegate: IExerciseRepo;

  private constructor() {
    // Initialize Supabase delegate
    this.delegate = ExerciseRepoFactory.getInstance();
  }

  public static getInstance(): ExerciseRepo {
    if (!ExerciseRepo.instance) {
      ExerciseRepo.instance = new ExerciseRepo();
    }
    // Always refresh the delegate to ensure singleton consistency
    ExerciseRepo.instance.delegate = ExerciseRepoFactory.getInstance();
    return ExerciseRepo.instance;
  }

  /**
   * Initialize the repository - delegates to Supabase implementation
   */
  async initialize(): Promise<void> {
    return this.delegate.initialize();
  }

  /**
   * Add a new exercise - delegates to Supabase implementation
   */
  async addExercise(
    userId: string,
    exercise: import("../models/Exercise").ExerciseInput,
  ): Promise<void> {
    console.log(
      "📚 ExerciseRepo - addExercise called with userId:",
      userId,
      "exercise:",
      exercise,
    );
    console.log(
      "📚 ExerciseRepo - Delegating to:",
      this.delegate.constructor.name,
    );
    const result = await this.delegate.addExercise(userId, exercise);
    console.log(
      "📚 ExerciseRepo - delegate.addExercise completed successfully",
    );
    console.log("📚 ExerciseRepo - About to return from addExercise...");
    return result;
  }

  /**
   * Get all exercises as a reactive observable - delegates to Supabase implementation
   */
  getExercises(
    userId: string,
  ): import("@legendapp/state").Observable<
    import("../models/Exercise").Exercise[]
  > {
    return this.delegate.getExercises(userId);
  }

  /**
   * Subscribe to real-time exercise updates - delegates to Supabase implementation
   */
  subscribeToExercises(
    uid: string,
    callback: (exercises: import("../models/Exercise").Exercise[]) => void,
  ): () => void {
    return this.delegate.subscribeToExercises(uid, callback);
  }

  /**
   * Delete an exercise - delegates to Supabase implementation
   */
  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    return this.delegate.deleteExercise(userId, exerciseId);
  }

  /**
   * Get a specific exercise by ID - delegates to Supabase implementation
   */
  async getExerciseById(
    exerciseId: string,
    userId: string,
  ): Promise<import("../models/Exercise").Exercise | undefined> {
    return this.delegate.getExerciseById(exerciseId, userId);
  }

  // Offline-first capabilities - delegates to Supabase implementation
  /**
   * Check if the repository is currently syncing data
   */
  isSyncing(): boolean {
    return this.delegate.isSyncing();
  }

  /**
   * Check if the repository is currently online
   */
  isOnline(): boolean {
    return this.delegate.isOnline();
  }

  /**
   * Get the count of pending changes that need to be synced
   */
  getPendingChangesCount(): number {
    return this.delegate.getPendingChangesCount();
  }

  /**
   * Force synchronization of pending changes
   */
  async forceSync(): Promise<void> {
    return this.delegate.forceSync();
  }

  /**
   * Check if there are any sync errors
   */
  hasErrors(): boolean {
    return this.delegate.hasErrors();
  }

  /**
   * Get the current error message if any
   */
  getErrorMessage(): string | null {
    return this.delegate.getErrorMessage();
  }

  /**
   * Get the current data source being used (always Supabase)
   */
  getCurrentDataSource(): "supabase" {
    return ExerciseRepoFactory.getCurrentDataSource();
  }
}
