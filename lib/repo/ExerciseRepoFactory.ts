import { IExerciseRepo } from "./IExerciseRepo";
import { SupabaseExerciseRepo } from "./SupabaseExerciseRepo";

/**
 * Factory class for creating Supabase Exercise Repository instances
 */
export class ExerciseRepoFactory {
  private static supabaseInstance: SupabaseExerciseRepo | null = null;

  /**
   * Creates and returns the Supabase ExerciseRepo implementation
   */
  static getInstance(): IExerciseRepo {
    this.supabaseInstance ??= SupabaseExerciseRepo.getInstance();
    return this.supabaseInstance;
  }

  /**
   * Get the current data source being used (always Supabase)
   */
  static getCurrentDataSource(): "supabase" {
    return "supabase";
  }

  /**
   * Force reset of instances (useful for testing)
   */
  static resetInstances(): void {
    this.supabaseInstance = null;
  }
}
