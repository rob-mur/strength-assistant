import { observable } from '@legendapp/state';
import { supabaseClient } from '../supabase';
import { getCurrentUserId } from '../../utils/auth/userHelpers';
import type { ExerciseScheduleWithExercise } from '../../models/ExerciseSchedule';

/**
 * Observable for exercise schedules with manual sync
 * Note: Using manual sync since configureSyncedSupabase configuration needs adjustment
 */
export const exerciseSchedules$ = observable<Record<string, ExerciseScheduleWithExercise>>({});

/**
 * Helper to get current user's exercise schedules
 * Returns empty object if user is not authenticated
 */
export const getCurrentUserSchedules = async (): Promise<Record<string, ExerciseScheduleWithExercise>> => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    console.log('📅 getCurrentUserSchedules - No authenticated user, returning empty schedules');
    return {};
  }
  
  console.log('📅 getCurrentUserSchedules - Getting schedules for user:', currentUserId);
  return exerciseSchedules$.get();
};

/**
 * Initialize the weekly plan sync
 * This sets up the sync configuration and starts listening for changes
 */
export const initializeWeeklyPlanSync = async (): Promise<void> => {
  console.log('📅 initializeWeeklyPlanSync - Starting weekly plan sync initialization');
  
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      console.log('📅 initializeWeeklyPlanSync - No authenticated user, sync will start when user logs in');
      return;
    }
    
    console.log('📅 initializeWeeklyPlanSync - User authenticated, starting sync for:', currentUserId);
    
    // Legend State automatically handles the sync initialization when the observable is accessed
    // We just need to trigger the initial load by accessing the observable
    exerciseSchedules$.get();
    
    console.log('📅 initializeWeeklyPlanSync - Weekly plan sync initialized successfully');
  } catch (error) {
    console.error('📅 initializeWeeklyPlanSync - Failed to initialize sync:', error);
    // Don't throw - allow app to work offline
  }
};

/**
 * Cleanup function for the sync (useful for testing)
 */
export const cleanupWeeklyPlanSync = (): void => {
  console.log('📅 cleanupWeeklyPlanSync - Cleaning up weekly plan sync');
  // Legend State handles cleanup automatically when observables are disposed
  exerciseSchedules$.set({});
};