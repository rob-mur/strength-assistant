import { exerciseSchedules$, enrichedExerciseSchedules$, getCurrentUserId } from '../sync/weeklyPlanSync';
import { weeklyPlanStoreActions } from './WeeklyPlanStore';
import { ExerciseScheduleValidator } from '../../models/ExerciseSchedule';
import { v4 as uuidv4 } from 'uuid';
import type { ExerciseScheduleRow } from '../../models/supabase';

/**
 * Actions for managing weekly exercise assignments
 * Uses Legend State's automatic sync - all changes are optimistically updated and synced to Supabase
 */
export const weeklyPlanActions = {
  /**
   * Assign an exercise to a specific day of the week
   * @param exerciseId - ID of the exercise to assign
   * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
   * @param exerciseName - Optional exercise name (for optimistic update display)
   * @throws Error if validation fails or user not authenticated
   */
  assignExerciseToDay: async (
    exerciseId: string, 
    dayOfWeek: number, 
    exerciseName?: string
  ): Promise<string> => {
    console.log('📅 assignExerciseToDay - Starting assignment:', { exerciseId, dayOfWeek, exerciseName });
    
    try {
      // Validate inputs
      ExerciseScheduleValidator.validateDayOfWeek(dayOfWeek);
      if (!exerciseId || typeof exerciseId !== 'string') {
        throw new Error('Exercise ID is required');
      }

      // Get current user
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      console.log('📅 assignExerciseToDay - User authenticated:', currentUserId);

      // Check if exercise is already assigned to this day
      const existingSchedules = enrichedExerciseSchedules$.get();
      const allSchedules = Object.values(existingSchedules);
      const duplicateSchedule = allSchedules.find(
        schedule => schedule.exercise_id === exerciseId && schedule.day_of_week === dayOfWeek
      );

      if (duplicateSchedule) {
        throw new Error('Exercise is already assigned to this day');
      }

      // Get next order index for the day
      const daySchedules = allSchedules.filter(schedule => schedule.day_of_week === dayOfWeek);
      const nextOrderIndex = daySchedules.length;

      // Create new schedule
      const scheduleId = uuidv4();
      const now = new Date().toISOString();
      
      const newSchedule: ExerciseScheduleRow = {
        id: scheduleId,
        user_id: currentUserId,
        exercise_id: exerciseId,
        day_of_week: dayOfWeek,
        order_index: nextOrderIndex,
        created_at: now,
        updated_at: now,
      };

      console.log('📅 assignExerciseToDay - Creating new schedule:', newSchedule);

      // Clear any previous errors
      weeklyPlanStoreActions.clearError();

      // Optimistic update - syncedSupabase handles sync automatically
      exerciseSchedules$[scheduleId].set(newSchedule);

      console.log('📅 assignExerciseToDay - Assignment successful, schedule ID:', scheduleId);
      return scheduleId;

    } catch (error) {
      console.error('📅 assignExerciseToDay - Assignment failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to assign exercise'
      );
      throw error;
    }
  },

  /**
   * Remove an exercise assignment from a day
   * @param scheduleId - ID of the schedule to remove
   * @throws Error if schedule not found
   */
  removeExerciseFromDay: async (scheduleId: string): Promise<void> => {
    console.log('📅 removeExerciseFromDay - Removing schedule:', scheduleId);

    try {
      if (!scheduleId || typeof scheduleId !== 'string') {
        throw new Error('Schedule ID is required');
      }

      // Verify schedule exists
      const allSchedules = enrichedExerciseSchedules$.get();
      const schedule = allSchedules[scheduleId];
      if (!schedule) {
        throw new Error('Exercise schedule not found');
      }

      console.log('📅 removeExerciseFromDay - Found schedule to remove:', {
        exerciseId: schedule.exercise_id,
        dayOfWeek: schedule.day_of_week,
        exerciseName: schedule.exercise?.name,
      });

      // Clear any previous errors
      weeklyPlanStoreActions.clearError();

      // Optimistic delete - syncedSupabase handles sync automatically
      exerciseSchedules$[scheduleId].delete();

      console.log('📅 removeExerciseFromDay - Removal successful');

    } catch (error) {
      console.error('📅 removeExerciseFromDay - Removal failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to remove exercise'
      );
      throw error;
    }
  },

  /**
   * Reorder an exercise within its day
   * @param scheduleId - ID of the schedule to reorder
   * @param newOrderIndex - New order index (0-based)
   * @throws Error if schedule not found or invalid order
   */
  reorderExerciseInDay: async (scheduleId: string, newOrderIndex: number): Promise<void> => {
    console.log('📅 reorderExerciseInDay - Reordering schedule:', { scheduleId, newOrderIndex });

    try {
      // Validate inputs
      if (!scheduleId || typeof scheduleId !== 'string') {
        throw new Error('Schedule ID is required');
      }
      ExerciseScheduleValidator.validateOrderIndex(newOrderIndex);

      // Get the schedule to reorder
      const allSchedules = enrichedExerciseSchedules$.get();
      const schedule = allSchedules[scheduleId];
      if (!schedule) {
        throw new Error('Exercise schedule not found');
      }

      console.log('📅 reorderExerciseInDay - Current order index:', schedule.order_index);

      // Clear any previous errors
      weeklyPlanStoreActions.clearError();

      // Update order index and timestamp - syncedSupabase handles sync automatically
      const now = new Date().toISOString();
      exerciseSchedules$[scheduleId].assign({
        order_index: newOrderIndex,
        updated_at: now,
      });

      console.log('📅 reorderExerciseInDay - Reorder successful, new index:', newOrderIndex);

    } catch (error) {
      console.error('📅 reorderExerciseInDay - Reorder failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to reorder exercise'
      );
      throw error;
    }
  },

  /**
   * Clear all exercises from a specific day
   * @param dayOfWeek - Day of week to clear (0=Sunday, 1=Monday, etc.)
   */
  clearDay: async (dayOfWeek: number): Promise<void> => {
    console.log('📅 clearDay - Clearing day:', dayOfWeek);

    try {
      // Validate day of week
      ExerciseScheduleValidator.validateDayOfWeek(dayOfWeek);

      // Get all schedules for the day
      const schedules = enrichedExerciseSchedules$.get();
      const scheduleIdsToDelete = Object.entries(schedules)
        .filter(([_, schedule]) => schedule.day_of_week === dayOfWeek)
        .map(([id]) => id);

      if (scheduleIdsToDelete.length === 0) {
        console.log('📅 clearDay - No exercises found for day:', dayOfWeek);
        return;
      }

      console.log('📅 clearDay - Found schedules to delete:', scheduleIdsToDelete.length);

      // Clear any previous errors
      weeklyPlanStoreActions.clearError();

      // Delete all schedules for the day - syncedSupabase handles sync automatically
      scheduleIdsToDelete.forEach(id => {
        exerciseSchedules$[id].delete();
      });

      console.log('📅 clearDay - Day cleared successfully');

    } catch (error) {
      console.error('📅 clearDay - Clear failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to clear day'
      );
      throw error;
    }
  },

  /**
   * Move an exercise from one day to another
   * @param scheduleId - ID of the schedule to move
   * @param newDayOfWeek - Target day of week (0=Sunday, 1=Monday, etc.)
   * @throws Error if schedule not found or invalid day
   */
  moveExerciseToDay: async (scheduleId: string, newDayOfWeek: number): Promise<void> => {
    console.log('📅 moveExerciseToDay - Moving schedule:', { scheduleId, newDayOfWeek });

    try {
      // Validate inputs
      if (!scheduleId || typeof scheduleId !== 'string') {
        throw new Error('Schedule ID is required');
      }
      ExerciseScheduleValidator.validateDayOfWeek(newDayOfWeek);

      // Get the schedule to move
      const allSchedules = enrichedExerciseSchedules$.get();
      const schedule = allSchedules[scheduleId];
      if (!schedule) {
        throw new Error('Exercise schedule not found');
      }

      const oldDayOfWeek = schedule.day_of_week;
      if (oldDayOfWeek === newDayOfWeek) {
        console.log('📅 moveExerciseToDay - Schedule already on target day');
        return;
      }

      // Check for duplicate exercise on target day
      const allExistingSchedules = Object.values(allSchedules);
      const duplicateSchedule = allExistingSchedules.find(
        s => s.exercise_id === schedule.exercise_id && s.day_of_week === newDayOfWeek
      );

      if (duplicateSchedule) {
        throw new Error('Exercise is already assigned to the target day');
      }

      // Get next order index for target day
      const targetDaySchedules = allExistingSchedules.filter(s => s.day_of_week === newDayOfWeek);
      const newOrderIndex = targetDaySchedules.length;

      console.log('📅 moveExerciseToDay - Moving from day', oldDayOfWeek, 'to day', newDayOfWeek, 'with order', newOrderIndex);

      // Clear any previous errors
      weeklyPlanStoreActions.clearError();

      // Update day and order - syncedSupabase handles sync automatically
      const now = new Date().toISOString();
      exerciseSchedules$[scheduleId].assign({
        day_of_week: newDayOfWeek,
        order_index: newOrderIndex,
        updated_at: now,
      });

      console.log('📅 moveExerciseToDay - Move successful');

    } catch (error) {
      console.error('📅 moveExerciseToDay - Move failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to move exercise'
      );
      throw error;
    }
  },

  /**
   * Copy an exercise assignment to another day
   * @param scheduleId - ID of the schedule to copy
   * @param targetDayOfWeek - Target day of week (0=Sunday, 1=Monday, etc.)
   * @throws Error if schedule not found or duplicate exists
   */
  copyExerciseToDay: async (scheduleId: string, targetDayOfWeek: number): Promise<string> => {
    console.log('📅 copyExerciseToDay - Copying schedule:', { scheduleId, targetDayOfWeek });

    try {
      // Validate inputs
      if (!scheduleId || typeof scheduleId !== 'string') {
        throw new Error('Schedule ID is required');
      }
      ExerciseScheduleValidator.validateDayOfWeek(targetDayOfWeek);

      // Get the schedule to copy
      const allSchedules = enrichedExerciseSchedules$.get();
      const sourceSchedule = allSchedules[scheduleId];
      if (!sourceSchedule) {
        throw new Error('Exercise schedule not found');
      }

      console.log('📅 copyExerciseToDay - Source schedule:', {
        exerciseId: sourceSchedule.exercise_id,
        dayOfWeek: sourceSchedule.day_of_week,
        exerciseName: sourceSchedule.exercise?.name,
      });

      // Use the assign action to create the copy
      const newScheduleId = await weeklyPlanActions.assignExerciseToDay(
        sourceSchedule.exercise_id || '',
        targetDayOfWeek,
        sourceSchedule.exercise?.name
      );

      console.log('📅 copyExerciseToDay - Copy successful, new schedule ID:', newScheduleId);
      return newScheduleId;

    } catch (error) {
      console.error('📅 copyExerciseToDay - Copy failed:', error);
      // Error handling is done in assignExerciseToDay
      throw error;
    }
  },

  /**
   * Refresh the weekly plan from server
   * Useful for manual sync or error recovery
   */
  refreshWeeklyPlan: async (): Promise<void> => {
    console.log('📅 refreshWeeklyPlan - Refreshing weekly plan from server');

    try {
      weeklyPlanStoreActions.setLoading(true);
      weeklyPlanStoreActions.clearError();

      // Legend State automatically handles refresh when we access the observable
      // This will trigger a fresh sync from Supabase
      const schedules = enrichedExerciseSchedules$.get();
      
      console.log('📅 refreshWeeklyPlan - Refreshed schedules count:', Object.keys(schedules).length);
      
      weeklyPlanStoreActions.updateLastSync();
      
    } catch (error) {
      console.error('📅 refreshWeeklyPlan - Refresh failed:', error);
      weeklyPlanStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to refresh weekly plan'
      );
      throw error;
    } finally {
      weeklyPlanStoreActions.setLoading(false);
    }
  },
};