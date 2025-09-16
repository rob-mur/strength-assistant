/**
 * Unified Data Layer Entry Point
 * 
 * Provides a single interface for accessing all data layer functionality
 * including storage backends, feature flags, and Legend State integration.
 */

// Storage backends and management
export { StorageBackend, SupabaseStorage } from './supabase/SupabaseStorage';
export { FirebaseStorage } from './firebase/FirebaseStorage';
export { StorageManager, IStorageManager, FeatureFlags, storageManager } from './StorageManager';

// Legend State integration
export { exerciseStore, initializeSync, reinitializeSync, disposeSync } from './legend-state/ExerciseStore';
export { 
  exerciseActions, 
  ExerciseActions,
  getExercises,
  getCurrentUser,
  getSyncState,
  getFeatureFlags
} from './legend-state/ExerciseActions';

// Models and types
export type { ExerciseRecord } from '../models/ExerciseRecord';
export type { UserAccount } from '../models/UserAccount';
export type { SyncStateRecord } from '../models/SyncStateRecord';

// Configuration and utilities
export { isSupabaseDataEnabled, validateSupabaseEnvironment } from '../config/supabase-env';

// Re-export key functions from models for convenience
export {
  createExerciseRecord,
  updateExerciseRecord,
  validateExerciseRecord,
  needsSync,
  ExerciseSort
} from '../models/ExerciseRecord';

export {
  createAnonymousUser,
  createAuthenticatedUser,
  validateCredentials,
  canSyncToCloud,
  needsAccountUpgrade
} from '../models/UserAccount';

/**
 * Data Layer API
 * 
 * This provides the main API that components should use to interact
 * with the data layer. It abstracts away the complexity of backend
 * switching and provides a consistent interface.
 */
export class DataLayerAPI {
  private constructor() {
    // Private constructor - use singleton instance
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): DataLayerAPI {
    if (!DataLayerAPI.instance) {
      DataLayerAPI.instance = new DataLayerAPI();
    }
    return DataLayerAPI.instance;
  }
  
  private static instance: DataLayerAPI;

  /**
   * Initialize the data layer
   * Should be called once during app startup
   */
  async initialize(): Promise<void> {
    try {
      // Import functions from the actual modules
      const { validateSupabaseEnvironment } = await import('../config/supabase-env');
      const { initializeSync } = await import('./legend-state/ExerciseStore');
      const { storageManager } = await import('./StorageManager');
      const { exerciseStore } = await import('./legend-state/ExerciseStore');
      
      // Validate environment
      validateSupabaseEnvironment();
      
      // Initialize sync engine
      initializeSync();
      
      // Check for existing user session
      const activeBackend = storageManager.getActiveStorageBackend();
      const currentUser = await activeBackend.getCurrentUser();
      
      if (currentUser) {
        // Update store with current user
        exerciseStore.user.set({
          id: currentUser.id,
          email: currentUser.email,
          isAnonymous: currentUser.isAnonymous,
          isAuthenticated: !currentUser.isAnonymous
        });
        
        if (__DEV__) {
          console.info(`✅ Data layer initialized with ${currentUser.isAnonymous ? 'anonymous' : 'authenticated'} user`);
        }
      } else {
        if (__DEV__) {
          console.info('✅ Data layer initialized - no active user session');
        }
      }
      
    } catch (error) {
      const errorMessage = `Data layer initialization failed: ${error instanceof Error ? error.message : String(error)}`;
      
      if (__DEV__) {
        console.error('❌', errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the current backend info
   */
  async getBackendInfo() {
    const { storageManager } = await import('./StorageManager');
    return storageManager.getBackendInfo();
  }

  /**
   * Get current feature flags
   */
  async getFeatureFlags() {
    const { storageManager } = await import('./StorageManager');
    return storageManager.getFeatureFlags();
  }

  /**
   * Subscribe to auth state changes
   */
  async subscribeToAuthState(callback: (user: unknown | null) => void): Promise<() => void> {
    const { storageManager } = await import('./StorageManager');
    const activeBackend = storageManager.getActiveStorageBackend();
    return activeBackend.subscribeToAuthState(callback);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { exerciseStore } = await import('./legend-state/ExerciseStore');
    const user = exerciseStore.user.get();
    return user?.isAuthenticated ?? false;
  }

  /**
   * Check if user is anonymous
   */
  async isAnonymous(): Promise<boolean> {
    const { exerciseStore } = await import('./legend-state/ExerciseStore');
    const user = exerciseStore.user.get();
    return user?.isAnonymous ?? true;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const { exerciseStore } = await import('./legend-state/ExerciseStore');
    const syncState = exerciseStore.syncState.get();
    const exercises = Object.values(exerciseStore.exercises.get());
    
    interface ExerciseWithSyncStatus {
      syncStatus: 'synced' | 'pending' | 'error';
    }
    
    return {
      isOnline: syncState.isOnline,
      isSyncing: syncState.isSyncing,
      lastSyncAt: syncState.lastSyncAt,
      pendingChanges: syncState.pendingChanges,
      errorCount: syncState.errors.length,
      totalExercises: exercises.length,
      syncedExercises: exercises.filter((e: ExerciseWithSyncStatus) => e.syncStatus === 'synced').length,
      pendingExercises: exercises.filter((e: ExerciseWithSyncStatus) => e.syncStatus === 'pending').length,
      failedExercises: exercises.filter((e: ExerciseWithSyncStatus) => e.syncStatus === 'error').length
    };
  }

  /**
   * Cleanup - dispose all resources
   */
  async dispose(): Promise<void> {
    const { disposeSync } = await import('./legend-state/ExerciseStore');
    disposeSync();
    
    if (__DEV__) {
      console.info('🗑️ Data layer disposed');
    }
  }
}

// Export singleton instance
export const dataLayerAPI = DataLayerAPI.getInstance();

// Export for convenience
export default dataLayerAPI;