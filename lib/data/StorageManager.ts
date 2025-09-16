/**
 * Storage Manager with Feature Flag Control
 * 
 * Manages feature-flag controlled switching between Firebase and Supabase backends.
 * Provides a unified interface that delegates to the active backend based on
 * the USE_SUPABASE_DATA environment variable.
 */

import { isSupabaseDataEnabled } from '../config/supabase-env';

// Import storage backend implementations
import { StorageBackend, SupabaseStorage } from './supabase/SupabaseStorage';
import { FirebaseStorage } from './firebase/FirebaseStorage';

/**
 * Feature Flag Interface
 */
export interface FeatureFlags {
  useSupabaseData: boolean;
}

/**
 * Storage Manager Interface
 * Manages feature-flag controlled switching between backends
 */
export interface IStorageManager {
  // Delegates to active backend based on feature flags
  getActiveStorageBackend(): StorageBackend;
  getAuthBackend(): StorageBackend;
  
  // Migration utilities
  validateDataConsistency(): Promise<{isConsistent: boolean; errors: string[]}>;
  migrateUserData(fromBackend: StorageBackend, toBackend: StorageBackend): Promise<void>;
  
  // Feature flag access
  getFeatureFlags(): FeatureFlags;
}

/**
 * Storage Manager Implementation
 * 
 * This class provides a unified interface to both Firebase and Supabase backends,
 * switching between them based on the USE_SUPABASE_DATA environment variable.
 */
export class StorageManager implements IStorageManager {
  private readonly supabaseStorage: SupabaseStorage;
  private readonly firebaseStorage: FirebaseStorage;
  private readonly featureFlags: FeatureFlags;

  constructor() {
    // Initialize both backends
    this.supabaseStorage = new SupabaseStorage();
    this.firebaseStorage = new FirebaseStorage();
    
    // Read feature flags from environment
    this.featureFlags = {
      useSupabaseData: isSupabaseDataEnabled()
    };

    if (__DEV__) {
      console.info(`🔄 StorageManager initialized with ${this.featureFlags.useSupabaseData ? 'Supabase' : 'Firebase'} backend`);
    }
  }

  /**
   * Returns the active storage backend based on feature flags
   */
  getActiveStorageBackend(): StorageBackend {
    return this.featureFlags.useSupabaseData ? this.supabaseStorage : this.firebaseStorage;
  }

  /**
   * Returns the active authentication backend (same as storage for now)
   */
  getAuthBackend(): StorageBackend {
    return this.getActiveStorageBackend();
  }

  /**
   * Returns current feature flag configuration
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Validates data consistency between Firebase and Supabase
   * This is useful during migration periods to ensure data integrity
   */
  async validateDataConsistency(): Promise<{isConsistent: boolean; errors: string[]}> {
    const errors: string[] = [];
    let isConsistent = true;

    try {
      // Get current user from both backends
      const [supabaseUser, firebaseUser] = await Promise.all([
        this.supabaseStorage.getCurrentUser(),
        this.firebaseStorage.getCurrentUser()
      ]);

      // Validate user consistency
      const userValidation = this.validateUserConsistency(supabaseUser, firebaseUser);
      errors.push(...userValidation.errors);
      if (!userValidation.isConsistent) isConsistent = false;

      // Validate exercise consistency
      const userId = supabaseUser?.id || firebaseUser?.id;
      const exerciseValidation = await this.validateExerciseConsistency(userId);
      errors.push(...exerciseValidation.errors);
      if (!exerciseValidation.isConsistent) isConsistent = false;

    } catch (error) {
      errors.push(`Consistency validation failed: ${error instanceof Error ? error.message : String(error)}`);
      isConsistent = false;
    }

    this.logValidationResults(isConsistent, errors);
    return { isConsistent, errors };
  }

  private validateUserConsistency(supabaseUser: { email?: string; isAnonymous?: boolean } | null, firebaseUser: { email?: string; isAnonymous?: boolean } | null): {isConsistent: boolean; errors: string[]} {
    const errors: string[] = [];
    let isConsistent = true;

    if (supabaseUser && firebaseUser) {
      if (supabaseUser.email !== firebaseUser.email) {
        errors.push(`User email mismatch: Supabase(${supabaseUser.email}) vs Firebase(${firebaseUser.email})`);
        isConsistent = false;
      }
      
      if (supabaseUser.isAnonymous !== firebaseUser.isAnonymous) {
        errors.push(`User anonymous status mismatch: Supabase(${supabaseUser.isAnonymous}) vs Firebase(${firebaseUser.isAnonymous})`);
        isConsistent = false;
      }
    } else if (supabaseUser !== firebaseUser) {
      errors.push(`User presence mismatch: Supabase(${!!supabaseUser}) vs Firebase(${!!firebaseUser})`);
      isConsistent = false;
    }

    return { isConsistent, errors };
  }

  private async validateExerciseConsistency(userId?: string): Promise<{isConsistent: boolean; errors: string[]}> {
    type Exercise = { name: string };
    const [supabaseExercises, firebaseExercises]: [Exercise[], Exercise[]] = await Promise.all([
      this.supabaseStorage.getExercises(userId),
      this.firebaseStorage.getExercises(userId)
    ]);

    const errors: string[] = [];
    let isConsistent = true;

    // Compare exercise counts
    if (supabaseExercises.length !== firebaseExercises.length) {
      errors.push(`Exercise count mismatch: Supabase(${supabaseExercises.length}) vs Firebase(${firebaseExercises.length})`);
      isConsistent = false;
    }

    // Compare exercise names
    const nameValidation = this.validateExerciseNames(supabaseExercises, firebaseExercises);
    errors.push(...nameValidation.errors);
    if (!nameValidation.isConsistent) isConsistent = false;

    return { isConsistent, errors };
  }

  private validateExerciseNames(supabaseExercises: { name: string }[], firebaseExercises: { name: string }[]): {isConsistent: boolean; errors: string[]} {
    const errors: string[] = [];
    let isConsistent = true;

    const supabaseNames = new Set(supabaseExercises.map(e => e.name));
    const firebaseNames = new Set(firebaseExercises.map(e => e.name));
    
    for (const name of supabaseNames) {
      if (!firebaseNames.has(name)) {
        errors.push(`Exercise "${name}" exists in Supabase but not Firebase`);
        isConsistent = false;
      }
    }

    for (const name of firebaseNames) {
      if (!supabaseNames.has(name)) {
        errors.push(`Exercise "${name}" exists in Firebase but not Supabase`);
        isConsistent = false;
      }
    }

    return { isConsistent, errors };
  }

  private logValidationResults(isConsistent: boolean, errors: string[]): void {
    if (__DEV__) {
      if (isConsistent) {
        console.info('✅ Data consistency validation passed');
      } else {
        console.warn('⚠️ Data consistency issues detected:', errors);
      }
    }
  }

  /**
   * Migrates user data from one backend to another
   * This is used during the migration process to copy data between systems
   */
  async migrateUserData(fromBackend: StorageBackend, toBackend: StorageBackend): Promise<void> {
    try {
      // Get current user from source backend
      const sourceUser = await fromBackend.getCurrentUser();
      
      if (!sourceUser) {
        throw new Error('No user found in source backend');
      }

      // Get exercises from source backend
      const sourceExercises = await fromBackend.getExercises(sourceUser.id);

      if (__DEV__) {
        console.info(`🔄 Migrating ${sourceExercises.length} exercises for user ${sourceUser.email || 'anonymous'}`);
      }

      // Create exercises in destination backend
      const migrationPromises = sourceExercises.map(async (exercise) => {
        try {
          await toBackend.createExercise({
            name: exercise.name,
            userId: exercise.userId
          });
        } catch (error) {
          // If exercise already exists, that's okay - skip it
          if (error instanceof Error && error.message.includes('already exists')) {
            return;
          }
          throw error;
        }
      });

      await Promise.all(migrationPromises);

      if (__DEV__) {
        console.info('✅ User data migration completed successfully');
      }

    } catch (error) {
      const errorMessage = `User data migration failed: ${error instanceof Error ? error.message : String(error)}`;
      
      if (__DEV__) {
        console.error('❌', errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Switches the active backend (for testing purposes)
   * Note: This temporarily overrides the environment variable setting
   */
  switchBackend(useSupabase: boolean): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Backend switching is not allowed in production');
    }

    this.featureFlags.useSupabaseData = useSupabase;
    
    if (__DEV__) {
      console.info(`🔄 Switched to ${useSupabase ? 'Supabase' : 'Firebase'} backend`);
    }
  }

  /**
   * Gets backend information for debugging
   */
  getBackendInfo(): { active: string; available: string[] } {
    return {
      active: this.featureFlags.useSupabaseData ? 'Supabase' : 'Firebase',
      available: ['Firebase', 'Supabase']
    };
  }

  /**
   * Clears all data from both backends (testing only)
   */
  async clearAllData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('clearAllData is not available in production');
    }

    await Promise.all([
      this.supabaseStorage.clearAllData(),
      this.firebaseStorage.clearAllData()
    ]);

    if (__DEV__) {
      console.info('🗑️ Cleared all data from both backends');
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export for testing
export default StorageManager;