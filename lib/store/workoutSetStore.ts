/**
 * Exercise Set Logging: Legend State Store
 *
 * Purpose: Local state management for workout sets with Supabase synchronization
 * Features: Offline capability, smart defaults, automatic sync, reactive updates
 */

import { observable, computed } from '@legendapp/state';
import { WorkoutSet, CreateWorkoutSetRequest } from '../models/WorkoutSet';
import { getSupabaseClient } from '../data/supabase/supabase';

/**
 * Session state interface for local-only data
 */
interface SessionState {
  currentSession: {
    date: string;
    exerciseId: string;
    lastSet?: Partial<WorkoutSet>;
  };
  formDefaults: {
    weight: number;
    repetitions: number;
    // RPE is never pre-filled - always requires user input
  };
  ui: {
    isSubmitting: boolean;
    lastSubmissionTime?: number;
  };
}

/**
 * Workout Set Store State
 */
interface WorkoutSetStoreState {
  sets: WorkoutSet[];
  syncState: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncAt?: string;
    pendingChanges: number;
    errors: string[];
  };
}

/**
 * Initial store state
 */
const initialStoreState: WorkoutSetStoreState = {
  sets: [],
  syncState: {
    isOnline: navigator?.onLine ?? true,
    isSyncing: false,
    pendingChanges: 0,
    errors: [],
  },
};

/**
 * Workout Sets Store Observable
 */
export const workoutSets = observable<WorkoutSetStoreState>(initialStoreState);

/**
 * Session-specific state (local only, not synced)
 */
export const sessionStore = observable<SessionState>({
  currentSession: {
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    exerciseId: '',
    lastSet: undefined
  },
  formDefaults: { 
    weight: 0, 
    repetitions: 0 
  },
  ui: {
    isSubmitting: false,
    lastSubmissionTime: undefined
  }
});

/**
 * Computed values for reactive form defaults
 */
export const formDefaults = computed(() => {
  const lastSet = sessionStore.currentSession.lastSet.get();
  return lastSet 
    ? { 
        weight: lastSet.weight || 0, 
        repetitions: lastSet.repetitions || 0 
      }
    : sessionStore.formDefaults.get();
});

/**
 * Computed value for current session sets (reactive to sync changes)
 */
export const currentSessionSets = computed(() => {
  const { exerciseId, date } = sessionStore.currentSession.get();
  if (!exerciseId || !date) return [];
  
  const allSets = workoutSets.sets.get();
  if (!allSets) return [];
  
  return allSets
    .filter((set: WorkoutSet) => 
      set.exercise_id === exerciseId && 
      set.session_date === date
    )
    .sort((a: WorkoutSet, b: WorkoutSet) => {
      // Sort by set_order first, then by created_at as fallback
      if (a.set_order !== b.set_order) {
        return a.set_order - b.set_order;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
});

/**
 * Computed value for session statistics
 */
export const sessionStats = computed(() => {
  const sets = currentSessionSets.get();
  return {
    totalSets: sets.length,
    totalVolume: sets.reduce((sum: number, set: WorkoutSet) => sum + (set.weight * set.repetitions), 0),
    averageRPE: sets.length > 0 
      ? sets.reduce((sum: number, set: WorkoutSet) => sum + set.rpe, 0) / sets.length 
      : 0,
    exercisesPerformed: new Set(sets.map((set: WorkoutSet) => set.exercise_id)).size
  };
});

/**
 * Computed sync status from store state
 */
export const syncStatus = computed(() => {
  const syncState = workoutSets.syncState.get();
  return {
    isSynced: !syncState.isSyncing && syncState.errors.length === 0,
    isPending: syncState.isSyncing,
    hasError: syncState.errors.length > 0,
    lastSyncTime: syncState.lastSyncAt,
    pendingCount: syncState.pendingChanges
  };
});

/**
 * Helper function to get the next set order for a session
 */
async function getNextSetOrder(exerciseId: string, sessionDate: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('workout_sets')
    .select('set_order')
    .eq('exercise_id', exerciseId)
    .eq('session_date', sessionDate)
    .order('set_order', { ascending: false })
    .limit(1);
    
  if (error) {
    console.warn('Error getting max set order, defaulting to 1:', error);
    return 1;
  }
  
  return data && data.length > 0 ? ((data[0] as any).set_order + 1) : 1;
}

/**
 * Workout Set Actions using direct Supabase integration
 */
export const workoutSetActions = {
  /**
   * Create a new workout set
   */
  createSet: async (setData: CreateWorkoutSetRequest): Promise<WorkoutSet> => {
    try {
      // Set UI state to submitting
      sessionStore.ui.isSubmitting.set(true);
      workoutSets.syncState.isSyncing.set(true);
      
      // Get user ID for the set
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User must be authenticated to create sets');
      }
      
      // Get next set order
      const setOrder = await getNextSetOrder(setData.exercise_id, setData.session_date);
      
      // Create the set in Supabase
      const { data, error } = await (supabase
        .from('workout_sets') as any)
        .insert({
          ...setData,
          user_id: userId,
          set_order: setOrder,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newSet = data as WorkoutSet;
      
      // Update local store
      const currentSets = workoutSets.sets.get();
      workoutSets.sets.set([...currentSets, newSet]);
      
      // Update session state with the new set as last set
      sessionStore.currentSession.lastSet.set({
        weight: newSet.weight,
        repetitions: newSet.repetitions,
        rpe: newSet.rpe
      });
      
      // Update form defaults for next set (exclude RPE)
      sessionStore.formDefaults.set({
        weight: newSet.weight,
        repetitions: newSet.repetitions
      });
      
      // Record submission time for performance tracking
      sessionStore.ui.lastSubmissionTime.set(Date.now());
      
      return newSet;
    } catch (error) {
      // Add error to sync state
      const currentErrors = workoutSets.syncState.errors.get();
      workoutSets.syncState.errors.set([
        ...currentErrors,
        error instanceof Error ? error.message : 'Unknown error'
      ]);
      throw error;
    } finally {
      // Always clear submitting state
      sessionStore.ui.isSubmitting.set(false);
      workoutSets.syncState.isSyncing.set(false);
    }
  },

  /**
   * Update an existing workout set
   */
  updateSet: async (id: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet> => {
    try {
      sessionStore.ui.isSubmitting.set(true);
      workoutSets.syncState.isSyncing.set(true);
      
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase
        .from('workout_sets') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedSet = data as WorkoutSet;
      
      // Update local store
      const currentSets = workoutSets.sets.get();
      const setIndex = currentSets.findIndex(set => set.id === id);
      if (setIndex !== -1) {
        const newSets = [...currentSets];
        newSets[setIndex] = updatedSet;
        workoutSets.sets.set(newSets);
      }
      
      // If this was the last set in the session, update session state
      const lastSet = sessionStore.currentSession.lastSet.get();
      if (lastSet && 'id' in lastSet && (lastSet as any).id === id) {
        sessionStore.currentSession.lastSet.set({
          weight: updatedSet.weight,
          repetitions: updatedSet.repetitions,
          rpe: updatedSet.rpe
        });
      }
      
      return updatedSet;
    } catch (error) {
      const currentErrors = workoutSets.syncState.errors.get();
      workoutSets.syncState.errors.set([
        ...currentErrors,
        error instanceof Error ? error.message : 'Unknown error'
      ]);
      throw error;
    } finally {
      sessionStore.ui.isSubmitting.set(false);
      workoutSets.syncState.isSyncing.set(false);
    }
  },

  /**
   * Delete a workout set
   */
  deleteSet: async (id: string): Promise<void> => {
    try {
      sessionStore.ui.isSubmitting.set(true);
      workoutSets.syncState.isSyncing.set(true);
      
      const supabase = getSupabaseClient();
      const { error } = await (supabase
        .from('workout_sets') as any)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local store
      const currentSets = workoutSets.sets.get();
      const newSets = currentSets.filter(set => set.id !== id);
      workoutSets.sets.set(newSets);
      
      // Clear from session if it was the last set
      const lastSet = sessionStore.currentSession.lastSet.get();
      if (lastSet && 'id' in lastSet && (lastSet as any).id === id) {
        sessionStore.currentSession.lastSet.set(undefined);
        
        // Reset form defaults to previous values or zero
        const sessionSets = workoutSetActions.getSessionSets(
          sessionStore.currentSession.exerciseId.get(),
          sessionStore.currentSession.date.get()
        );
        if (sessionSets.length > 0) {
          const previousSet = sessionSets[sessionSets.length - 1];
          sessionStore.formDefaults.set({
            weight: previousSet.weight,
            repetitions: previousSet.repetitions
          });
        } else {
          sessionStore.formDefaults.set({ weight: 0, repetitions: 0 });
        }
      }
    } catch (error) {
      const currentErrors = workoutSets.syncState.errors.get();
      workoutSets.syncState.errors.set([
        ...currentErrors,
        error instanceof Error ? error.message : 'Unknown error'
      ]);
      throw error;
    } finally {
      sessionStore.ui.isSubmitting.set(false);
      workoutSets.syncState.isSyncing.set(false);
    }
  },

  /**
   * Get sets for a specific session
   */
  getSessionSets: (exerciseId: string, sessionDate: string): WorkoutSet[] => {
    const allSets = workoutSets.sets.get();
    if (!allSets) return [];
    
    return allSets
      .filter((set: WorkoutSet) => 
        set.exercise_id === exerciseId && 
        set.session_date === sessionDate
      )
      .sort((a: WorkoutSet, b: WorkoutSet) => a.set_order - b.set_order);
  },

  /**
   * Set current session context
   */
  setCurrentSession: (exerciseId: string, sessionDate?: string) => {
    const date = sessionDate || new Date().toISOString().split('T')[0];
    
    sessionStore.currentSession.set({
      date,
      exerciseId,
      lastSet: undefined
    });
    
    // Get the last set from current session to populate defaults
    const sessionSets = workoutSetActions.getSessionSets(exerciseId, date);
    if (sessionSets.length > 0) {
      const lastSessionSet = sessionSets[sessionSets.length - 1];
      sessionStore.currentSession.lastSet.set({
        weight: lastSessionSet.weight,
        repetitions: lastSessionSet.repetitions,
        rpe: lastSessionSet.rpe
      });
      
      sessionStore.formDefaults.set({
        weight: lastSessionSet.weight,
        repetitions: lastSessionSet.repetitions
      });
    }
  },

  /**
   * Reset form defaults to zero
   */
  resetDefaults: () => {
    sessionStore.formDefaults.set({ weight: 0, repetitions: 0 });
  },

  /**
   * Load initial data from Supabase
   */
  loadInitialData: async () => {
    try {
      workoutSets.syncState.isSyncing.set(true);
      
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) return; // No user, skip loading
      
      const { data, error } = await (supabase
        .from('workout_sets') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Update local store
      workoutSets.sets.set(data as WorkoutSet[] || []);
      workoutSets.syncState.lastSyncAt.set(new Date().toISOString());
      
    } catch (error) {
      const currentErrors = workoutSets.syncState.errors.get();
      workoutSets.syncState.errors.set([
        ...currentErrors,
        error instanceof Error ? error.message : 'Failed to load initial data'
      ]);
    } finally {
      workoutSets.syncState.isSyncing.set(false);
    }
  },

  /**
   * Force sync with Supabase
   */
  forceSync: async () => {
    await workoutSetActions.loadInitialData();
  },

  /**
   * Get sync status information
   */
  getSyncStatus: () => syncStatus.get(),

  /**
   * Clear sync errors
   */
  clearSyncErrors: () => {
    workoutSets.syncState.errors.set([]);
  }
};

/**
 * Initialize workout set store
 */
export function initializeWorkoutSetStore() {
  // Monitor online status
  if (typeof window !== 'undefined' && window.addEventListener) {
    const onlineHandler = () => {
      workoutSets.syncState.isOnline.set(true);
      // Auto-sync when coming online
      workoutSetActions.loadInitialData().catch(console.warn);
    };

    const offlineHandler = () => {
      workoutSets.syncState.isOnline.set(false);
    };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }
  
  return () => {
    // No cleanup needed for non-browser environments
  };
}

/**
 * Set up real-time subscription for workout sets
 */
export function setupWorkoutSetRealtimeSubscription() {
  const supabase = getSupabaseClient();
  
  const subscription = supabase
    .channel('workout_sets_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'workout_sets'
      },
      (payload) => {
        const currentSets = workoutSets.sets.get();
        
        if (payload.eventType === 'INSERT') {
          const newSet = payload.new as WorkoutSet;
          workoutSets.sets.set([...currentSets, newSet]);
        } else if (payload.eventType === 'DELETE') {
          const deletedSet = payload.old as WorkoutSet;
          const newSets = currentSets.filter(set => set.id !== deletedSet.id);
          workoutSets.sets.set(newSets);
        } else if (payload.eventType === 'UPDATE') {
          const updatedSet = payload.new as WorkoutSet;
          const setIndex = currentSets.findIndex(set => set.id === updatedSet.id);
          if (setIndex !== -1) {
            const newSets = [...currentSets];
            newSets[setIndex] = updatedSet;
            workoutSets.sets.set(newSets);
          }
        }
      }
    )
    .subscribe();
  
  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Export types for external use
 */
export type { SessionState };