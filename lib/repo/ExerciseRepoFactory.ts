import { IExerciseRepo } from "./IExerciseRepo";
import { FirebaseExerciseRepo } from "./FirebaseExerciseRepo";
import { SupabaseExerciseRepo } from "./SupabaseExerciseRepo";

/**
 * Factory class for creating appropriate Exercise Repository instances
 * Based on the USE_SUPABASE_DATA environment variable
 */
export class ExerciseRepoFactory {
  private static firebaseInstance: FirebaseExerciseRepo | null = null;
  private static supabaseInstance: SupabaseExerciseRepo | null = null;

  /**
   * Creates and returns the appropriate ExerciseRepo implementation
   * based on the USE_SUPABASE_DATA environment variable
   */
  static getInstance(): IExerciseRepo {
    const useSupabase = this.shouldUseSupabase();
    
    if (useSupabase) {
      this.supabaseInstance ??= SupabaseExerciseRepo.getInstance();
      return this.supabaseInstance;
    } else {
      this.firebaseInstance ??= FirebaseExerciseRepo.getInstance();
      return this.firebaseInstance;
    }
  }

  /**
   * Determines whether to use Supabase based on environment variable
   */
  private static shouldUseSupabase(): boolean {
    // Check process.env first (preferred for web builds and testing)
    const useSupabaseProcess = process.env.USE_SUPABASE_DATA;
    
    // Fall back to expo-constants if process.env not set
    let useSupabaseEnv;
    try {
      // Use require for compatibility with Jest mocking
      const { default: Constants } = require('expo-constants');
      useSupabaseEnv = Constants.expoConfig?.extra?.useSupabaseData;
    } catch {
      useSupabaseEnv = undefined;
    }
    
    // Prefer process.env, fall back to expo config
    const useSupabase = useSupabaseProcess ?? useSupabaseEnv;
    
    // Convert string values to boolean
    if (typeof useSupabase === 'string') {
      return useSupabase.toLowerCase() === 'true';
    }
    
    return Boolean(useSupabase);
  }

  /**
   * Get the current data source being used
   */
  static getCurrentDataSource(): 'firebase' | 'supabase' {
    return this.shouldUseSupabase() ? 'supabase' : 'firebase';
  }

  /**
   * Force reset of instances (useful for testing)
   */
  static resetInstances(): void {
    this.firebaseInstance = null;
    this.supabaseInstance = null;
  }
}