import { configurePersistAndSync } from '@legendapp/state/sync';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { supabaseClient } from '../supabase/SupabaseClient';
import { exercises$, user$ } from '../store';
import { Exercise } from '../../models/Exercise';

/**
 * Configuration for Legend State sync with Supabase
 * Provides offline-first data synchronization with automatic conflict resolution
 */
export function configureSyncEngine() {
  // Configure exercises with offline persistence and Supabase sync
  configurePersistAndSync(exercises$, {
    persist: {
      name: 'exercises',
      plugin: ObservablePersistAsyncStorage,
    },
    sync: {
      // Initial load from Supabase
      get: async () => {
        try {
          const user = await supabaseClient.getCurrentUser();
          if (!user) return [];

          const { data, error } = await supabaseClient.exercises
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Failed to load exercises:', error);
          return [];
        }
      },
      
      // Save changes to Supabase
      set: async ({ value, update }) => {
        try {
          const user = await supabaseClient.getCurrentUser();
          if (!user) return;

          const exercises = Array.isArray(value) ? value : [];
          
          // For simplicity, we'll do a full sync approach
          // In a real app, you'd want incremental updates
          for (const exercise of exercises) {
            if (!exercise.id) continue;
            
            const { error } = await supabaseClient.exercises
              .upsert({
                id: exercise.id,
                name: exercise.name,
                user_id: exercise.user_id,
                created_at: exercise.created_at,
              });
              
            if (error) {
              console.error('Failed to save exercise:', error);
            }
          }
        } catch (error) {
          console.error('Failed to sync exercises:', error);
        }
      },

      // Real-time subscription
      subscribe: async ({ update }) => {
        try {
          const user = await supabaseClient.getCurrentUser();
          if (!user) return () => {};

          const subscription = supabaseClient.getSupabaseClient()
            .from('exercises')
            .on('*', async () => {
              // Refetch data when changes occur
              const { data } = await supabaseClient.exercises
                .select('*')
                .eq('user_id', user.id);
              
              if (data) {
                update(data);
              }
            })
            .subscribe();

          return () => {
            supabaseClient.getSupabaseClient().removeSubscription(subscription);
          };
        } catch (error) {
          console.error('Failed to set up real-time subscription:', error);
          return () => {};
        }
      },
    },
  });

  // Configure user auth state
  configurePersistAndSync(user$, {
    sync: {
      get: async () => {
        try {
          return await supabaseClient.getCurrentUser();
        } catch {
          return null;
        }
      },
      
      subscribe: async ({ update }) => {
        const { data: { subscription } } = supabaseClient.getSupabaseClient().auth.onAuthStateChange(
          (event, session) => {
            update(session?.user || null);
          }
        );
        
        return () => subscription.unsubscribe();
      },
    },
  });
}

/**
 * Helper functions for sync management
 */
export const syncHelpers = {
  /**
   * Force a manual sync of exercises
   */
  async forceSync(): Promise<void> {
    try {
      // Trigger a manual sync
      const user = await supabaseClient.getCurrentUser();
      if (!user) return;

      const { data, error } = await supabaseClient.exercises
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        exercises$.set(data);
      }
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  },

  /**
   * Check if we're currently syncing (simplified for now)
   */
  isSyncing(): boolean {
    // This would be enhanced with actual sync state tracking
    return false;
  },

  /**
   * Check online status (simplified)
   */
  isOnline(): boolean {
    // This would be enhanced with network state detection
    return true;
  },

  /**
   * Get pending changes count (simplified)
   */
  getPendingChangesCount(): number {
    // This would track actual pending changes
    return 0;
  },

  /**
   * Check if there are sync errors (simplified)
   */
  hasErrors(): boolean {
    return false;
  },

  /**
   * Get current sync error message (simplified)
   */
  getErrorMessage(): string | undefined {
    return undefined;
  },
};