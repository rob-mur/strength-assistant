/**
 * Legend State Actions for Exercise Operations
 * 
 * Defines actions that can be performed on the exercise store,
 * with automatic local-first updates and background cloud sync.
 */

import { exerciseStore, reinitializeSync } from './ExerciseStore';
import { storageManager } from '../StorageManager';
import type { UserAccount } from '../../models/UserAccount';

/**
 * Exercise Actions Interface
 */
export interface ExerciseActions {
  // Exercise operations
  addExercise: (name: string) => Promise<void>;
  updateExercise: (id: string, name: string) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  
  // Authentication operations
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Sync operations
  forceSync: () => Promise<void>;
  clearSyncErrors: () => void;
  
  // Migration operations
  validateConsistency: () => Promise<{isConsistent: boolean; errors: string[]}>;
  migrateToSupabase: () => Promise<void>;
  switchBackend: (useSupabase: boolean) => void;
}

/**
 * Exercise Actions Implementation
 */
class ExerciseActionsImpl implements ExerciseActions {
  
  // Exercise operations
  async addExercise(name: string): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const currentUser = exerciseStore.user.get();
      const exerciseId = `temp-${Date.now()}-${Math.random()}`;
      
      // Optimistic update - add to local store immediately
      exerciseStore.exercises[exerciseId].set({
        id: exerciseId,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser?.id,
        syncStatus: 'pending'
      });
      
      exerciseStore.syncState.pendingChanges.set(prev => prev + 1);

      // Background sync will handle cloud update automatically
      // Legend State sync engine will replace temp ID with real ID from backend
      
    } catch (error) {
      this.handleActionError('Failed to add exercise', error);
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  async updateExercise(id: string, name: string): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const existingExercise = exerciseStore.exercises[id].get();
      if (!existingExercise) {
        throw new Error('Exercise not found');
      }

      // Optimistic update
      exerciseStore.exercises[id].set({
        ...existingExercise,
        name: name.trim(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      });
      
      exerciseStore.syncState.pendingChanges.set(prev => prev + 1);

      // Background sync will handle cloud update automatically
      
    } catch (error) {
      this.handleActionError('Failed to update exercise', error);
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  async deleteExercise(id: string): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const exercise = exerciseStore.exercises[id].get();
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      // Optimistic delete - remove from local store immediately
      exerciseStore.exercises[id].delete();
      exerciseStore.syncState.pendingChanges.set(prev => prev + 1);

      // Background sync will handle cloud deletion automatically
      
    } catch (error) {
      this.handleActionError('Failed to delete exercise', error);
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  // Authentication operations
  async signIn(email: string, password: string): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const authBackend = storageManager.getAuthBackend();
      const userAccount = await authBackend.signInWithEmail(email, password);
      
      this.updateUserState(userAccount);
      
      // Reinitialize sync for authenticated user
      reinitializeSync();
      
      if (__DEV__) {
        console.info('✅ User signed in successfully');
      }
      
    } catch (error) {
      this.handleActionError('Sign in failed', error);
      throw error; // Re-throw for UI error handling
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const authBackend = storageManager.getAuthBackend();
      const userAccount = await authBackend.signUpWithEmail(email, password);
      
      this.updateUserState(userAccount);
      
      // Reinitialize sync for new authenticated user
      reinitializeSync();
      
      if (__DEV__) {
        console.info('✅ User signed up successfully');
      }
      
    } catch (error) {
      this.handleActionError('Sign up failed', error);
      throw error; // Re-throw for UI error handling
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  async signInAnonymously(): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const authBackend = storageManager.getAuthBackend();
      const userAccount = await authBackend.signInAnonymously();
      
      this.updateUserState(userAccount);
      
      if (__DEV__) {
        console.info('✅ Anonymous sign in successful');
      }
      
    } catch (error) {
      this.handleActionError('Anonymous sign in failed', error);
      throw error; // Re-throw for UI error handling
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      const authBackend = storageManager.getAuthBackend();
      await authBackend.signOut();
      
      // Clear user state
      exerciseStore.user.set(null);
      
      // Clear exercises (they belonged to the signed-out user)
      exerciseStore.exercises.set({});
      
      // Clear sync errors
      this.clearSyncErrors();
      
      if (__DEV__) {
        console.info('✅ User signed out successfully');
      }
      
    } catch (error) {
      this.handleActionError('Sign out failed', error);
      throw error; // Re-throw for UI error handling
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  // Sync operations
  async forceSync(): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      // Force sync by reinitializing the sync engine
      reinitializeSync();
      
      if (__DEV__) {
        console.info('🔄 Force sync completed');
      }
      
    } catch (error) {
      this.handleActionError('Force sync failed', error);
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  clearSyncErrors(): void {
    exerciseStore.syncState.errors.set([]);
  }

  // Migration operations
  async validateConsistency(): Promise<{isConsistent: boolean; errors: string[]}> {
    try {
      return await storageManager.validateDataConsistency();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isConsistent: false,
        errors: [errorMessage]
      };
    }
  }

  async migrateToSupabase(): Promise<void> {
    try {
      exerciseStore.syncState.isSyncing.set(true);
      
      if (exerciseStore.featureFlags.useSupabaseData.get()) {
        throw new Error('Already using Supabase backend');
      }
      
      // Get Firebase and Supabase backends
      const firebaseStorage = storageManager['firebaseStorage']; // Access private member for migration
      const supabaseStorage = storageManager['supabaseStorage']; // Access private member for migration
      
      // Migrate data from Firebase to Supabase
      await storageManager.migrateUserData(firebaseStorage, supabaseStorage);
      
      if (__DEV__) {
        console.info('✅ Migration to Supabase completed');
      }
      
    } catch (error) {
      this.handleActionError('Migration to Supabase failed', error);
      throw error; // Re-throw for UI error handling
    } finally {
      exerciseStore.syncState.isSyncing.set(false);
    }
  }

  switchBackend(useSupabase: boolean): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Backend switching is not allowed in production');
    }

    try {
      // Switch backend in storage manager
      storageManager.switchBackend(useSupabase);
      
      // Update feature flag in store
      exerciseStore.featureFlags.useSupabaseData.set(useSupabase);
      
      // Reinitialize sync with new backend
      reinitializeSync();
      
      if (__DEV__) {
        console.info(`🔄 Switched to ${useSupabase ? 'Supabase' : 'Firebase'} backend`);
      }
      
    } catch (error) {
      this.handleActionError('Backend switch failed', error);
      throw error;
    }
  }

  // Private helper methods
  private updateUserState(userAccount: UserAccount): void {
    exerciseStore.user.set({
      id: userAccount.id,
      email: userAccount.email,
      isAnonymous: userAccount.isAnonymous,
      isAuthenticated: !userAccount.isAnonymous
    });
    
    // Update last sync time
    exerciseStore.syncState.lastSyncAt.set(new Date().toISOString());
  }

  private handleActionError(message: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = `${message}: ${errorMessage}`;
    
    // Add error to sync state
    exerciseStore.syncState.errors.set(prev => [...prev, fullMessage]);
    
    if (__DEV__) {
      console.error('❌', fullMessage);
    }
  }
}

// Export singleton instance
export const exerciseActions = new ExerciseActionsImpl();

// Export class for testing
export default ExerciseActionsImpl;

// Export helper functions for store access
export const getExercises = () => {
  return Object.values(exerciseStore.exercises.get());
};

export const getCurrentUser = () => {
  return exerciseStore.user.get();
};

export const getSyncState = () => {
  return exerciseStore.syncState.get();
};

export const getFeatureFlags = () => {
  return exerciseStore.featureFlags.get();
};