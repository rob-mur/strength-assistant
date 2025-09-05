import { IExerciseRepo } from "./IExerciseRepo";
import { FirebaseExerciseRepo } from "./FirebaseExerciseRepo";
import { SupabaseExerciseRepo } from "./SupabaseExerciseRepo";
import Constants from 'expo-constants';

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
      if (!this.supabaseInstance) {
        this.supabaseInstance = SupabaseExerciseRepo.getInstance();
      }
      return this.supabaseInstance;
    } else {
      if (!this.firebaseInstance) {
        this.firebaseInstance = FirebaseExerciseRepo.getInstance();
      }
      return this.firebaseInstance;
    }
  }

  /**
   * Determines whether to use Supabase based on environment variable
   */
  private static shouldUseSupabase(): boolean {
    // Check environment variable from expo-constants
    const useSupabaseEnv = Constants.expoConfig?.extra?.useSupabaseData;
    
    // Also check process.env for web builds
    const useSupabaseProcess = process.env.USE_SUPABASE_DATA;
    
    // Default to false if not set
    const useSupabase = useSupabaseEnv || useSupabaseProcess;
    
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