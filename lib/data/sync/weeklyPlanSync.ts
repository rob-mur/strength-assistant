import { observable, computed } from '@legendapp/state';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseClient } from '../supabase/SupabaseClient';
import { user$, exercises$ } from '../store';
import type { ExerciseScheduleRow } from '../../models/supabase';

// Type for exercise schedule with exercise details
export interface ExerciseScheduleWithExercise extends ExerciseScheduleRow {
  exercise?: {
    id: string;
    name: string;
  };
}

// Create a configured AsyncStorage plugin instance
const configuredAsyncStoragePlugin = new ObservablePersistAsyncStorage({
  AsyncStorage: AsyncStorage,
});

/**
 * Exercise schedules observable with automatic Supabase sync
 * Uses Legend State's syncedSupabase for real-time sync and offline persistence
 * Note: We handle exercise details separately to keep the sync simple
 */
export const exerciseSchedules$ = observable(
  syncedSupabase({
    supabase: supabaseClient.getSupabaseClient(),
    collection: 'exercise_schedules',
    
    // Enable all CRUD operations
    actions: ['read', 'create', 'update', 'delete'],
    
    // Real-time updates (RLS handles user filtering automatically)
    realtime: true,
    
    // Offline persistence with automatic retry
    persist: {
      name: 'exercise_schedules',
      plugin: configuredAsyncStoragePlugin,
      retrySync: true,
    },
    
    // Automatic retry until success
    retry: {
      infinite: true,
    },
    
    // Efficient differential sync
    changesSince: 'last-sync',
    fieldCreatedAt: 'created_at',
    fieldUpdatedAt: 'updated_at',
    
    // Transform data for sync - safely set user_id from current user
    transform: {
      save: (schedule: Partial<ExerciseScheduleRow>) => {
        // Get current user synchronously for user_id assignment
        const currentUser = user$.peek();
        return {
          id: schedule.id || '',
          user_id: currentUser?.id || schedule.user_id || '',
          exercise_id: schedule.exercise_id || '',
          day_of_week: schedule.day_of_week || 0,
          order_index: schedule.order_index || 0,
          created_at: schedule.created_at || new Date().toISOString(),
          updated_at: schedule.updated_at || new Date().toISOString(),
        };
      },
    },
  })
);

/**
 * Computed observable that enriches exercise schedules with exercise details
 * Automatically updates when either schedules or exercises change
 */
export const enrichedExerciseSchedules$ = computed(() => {
  const schedules = exerciseSchedules$.get();
  const exercisesList = exercises$.get();
  
  if (!schedules || !exercisesList) return {};
  
  // Create a lookup map for exercises for efficiency
  const exerciseLookup = exercisesList.reduce((acc, exercise) => {
    acc[exercise.id] = exercise;
    return acc;
  }, {} as Record<string, any>);
  
  // Enrich schedules with exercise details
  const enrichedSchedules: Record<string, ExerciseScheduleWithExercise> = {};
  
  for (const [id, schedule] of Object.entries(schedules)) {
    if (schedule && schedule.exercise_id) {
      const exercise = exerciseLookup[schedule.exercise_id];
      enrichedSchedules[id] = {
        id: schedule.id || id,
        user_id: schedule.user_id || '',
        exercise_id: schedule.exercise_id || '',
        day_of_week: schedule.day_of_week || 0,
        order_index: schedule.order_index || 0,
        created_at: schedule.created_at || '',
        updated_at: schedule.updated_at || '',
        exercise: exercise ? {
          id: exercise.id,
          name: exercise.name,
        } : undefined,
      };
    } else if (schedule) {
      enrichedSchedules[id] = {
        id: schedule.id || id,
        user_id: schedule.user_id || '',
        exercise_id: schedule.exercise_id || '',
        day_of_week: schedule.day_of_week || 0,
        order_index: schedule.order_index || 0,
        created_at: schedule.created_at || '',
        updated_at: schedule.updated_at || '',
      };
    }
  }
  
  return enrichedSchedules;
});

/**
 * Helper to get current user's schedules with exercise details
 * Returns empty object when user is not authenticated
 */
export const getCurrentUserSchedules = (): Record<string, ExerciseScheduleWithExercise> => {
  const currentUser = user$.get();
  if (!currentUser) return {};
  
  const allSchedules = enrichedExerciseSchedules$.get();
  
  // Filter schedules for current user (additional client-side filtering for safety)
  // RLS should handle this server-side, but this provides extra safety
  const userSchedules: Record<string, ExerciseScheduleWithExercise> = {};
  
  for (const [id, schedule] of Object.entries(allSchedules || {})) {
    if (schedule && schedule.user_id === currentUser.id) {
      userSchedules[id] = schedule;
    }
  }
  
  return userSchedules;
};

/**
 * Helper to get current user ID
 * Returns null if user is not authenticated
 */
export const getCurrentUserId = (): string | null => {
  const currentUser = user$.get();
  return currentUser?.id || null;
};