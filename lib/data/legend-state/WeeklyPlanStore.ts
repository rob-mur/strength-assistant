import { observable, computed } from '@legendapp/state';
import { exerciseSchedules$ } from '../sync/weeklyPlanSync';
import { getCurrentUserId } from '../../utils/auth/userHelpers';
import type { WeeklyPlan, DayPlan } from '../../models/ExerciseSchedule';

/**
 * Computed weekly plan from synced exercise schedules
 * Automatically updates when schedules change or user authenticates/signs out
 */
export const weeklyPlan$ = computed(() => {
  const schedules = exerciseSchedules$.get();
  
  // Return empty plan if no schedules loaded
  if (!schedules || Object.keys(schedules).length === 0) {
    return createEmptyWeeklyPlan();
  }
  
  const days: DayPlan[] = [];
  const allSchedules = Object.values(schedules);
  
  // Create 7 days (0=Sunday through 6=Saturday)
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const daySchedules = allSchedules
      .filter(schedule => schedule.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    days.push({
      dayOfWeek,
      exercises: daySchedules.map(schedule => ({
        scheduleId: schedule.id,
        exerciseId: schedule.exerciseId,
        exerciseName: schedule.exercise?.name || 'Unknown Exercise',
        orderIndex: schedule.orderIndex,
      })),
      hasExercises: daySchedules.length > 0,
    });
  }

  return {
    userId: allSchedules.length > 0 ? allSchedules[0]?.userId : null,
    days,
  } as WeeklyPlan;
});

/**
 * Helper selectors for specific days
 * These are computed observables that efficiently update when the weekly plan changes
 */

/**
 * Get a specific day's plan
 * @param dayOfWeek - Day index (0=Sunday, 1=Monday, etc.)
 */
export const getDayPlan$ = (dayOfWeek: number) => computed(() => {
  const plan = weeklyPlan$.get();
  return plan.days[dayOfWeek] || createEmptyDayPlan(dayOfWeek);
});

/**
 * Get today's plan based on current date
 * Automatically updates at midnight
 */
export const getCurrentDayPlan$ = computed(() => {
  const today = new Date().getDay(); // 0=Sunday
  return getDayPlan$(today).get();
});

/**
 * Get tomorrow's plan
 */
export const getTomorrowDayPlan$ = computed(() => {
  const tomorrow = (new Date().getDay() + 1) % 7;
  return getDayPlan$(tomorrow).get();
});

/**
 * Get all days that have exercises
 */
export const getDaysWithExercises$ = computed(() => {
  const plan = weeklyPlan$.get();
  return plan.days.filter(day => day.hasExercises);
});

/**
 * Get count of exercises for the current week
 */
export const getTotalExercisesCount$ = computed(() => {
  const plan = weeklyPlan$.get();
  return plan.days.reduce((total, day) => total + day.exercises.length, 0);
});

/**
 * Get count of days with exercises
 */
export const getActiveDaysCount$ = computed(() => {
  const plan = weeklyPlan$.get();
  return plan.days.filter(day => day.hasExercises).length;
});

/**
 * Check if a specific day has exercises
 * @param dayOfWeek - Day index (0=Sunday, 1=Monday, etc.)
 */
export const hasDayExercises$ = (dayOfWeek: number) => computed(() => {
  const dayPlan = getDayPlan$(dayOfWeek).get();
  return dayPlan.hasExercises;
});

/**
 * Get exercises for a specific exercise ID across all days
 * Useful for showing where an exercise is scheduled
 * @param exerciseId - Exercise ID to search for
 */
export const getExerciseScheduleDays$ = (exerciseId: string) => computed(() => {
  const plan = weeklyPlan$.get();
  const scheduleDays: Array<{ dayOfWeek: number; dayName: string; orderIndex: number }> = [];
  
  plan.days.forEach(day => {
    const exerciseInDay = day.exercises.find(ex => ex.exerciseId === exerciseId);
    if (exerciseInDay) {
      scheduleDays.push({
        dayOfWeek: day.dayOfWeek,
        dayName: getDayName(day.dayOfWeek),
        orderIndex: exerciseInDay.orderIndex,
      });
    }
  });
  
  return scheduleDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
});

/**
 * Utility observables for UI state
 */

/**
 * Is the weekly plan loading from sync?
 * This can be used to show loading indicators
 */
export const isWeeklyPlanLoading$ = observable(false);

/**
 * Weekly plan error state
 * Can be used to show error messages in UI
 */
export const weeklyPlanError$ = observable<string | null>(null);

/**
 * Last sync timestamp for weekly plan
 */
export const weeklyPlanLastSync$ = observable<Date | null>(null);

// Helper functions

/**
 * Creates an empty weekly plan
 */
function createEmptyWeeklyPlan(): WeeklyPlan {
  return {
    userId: null,
    days: Array.from({ length: 7 }, (_, dayOfWeek) => createEmptyDayPlan(dayOfWeek)),
  };
}

/**
 * Creates an empty day plan
 * @param dayOfWeek - Day index (0=Sunday, 1=Monday, etc.)
 */
function createEmptyDayPlan(dayOfWeek: number): DayPlan {
  return {
    dayOfWeek,
    exercises: [],
    hasExercises: false,
  };
}

/**
 * Gets day name from day index
 * @param dayOfWeek - Day index (0=Sunday, 1=Monday, etc.)
 */
function getDayName(dayOfWeek: number): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayOfWeek] || 'Invalid Day';
}

/**
 * Actions to manage the weekly plan observables
 * These are mainly for internal state management, not data mutations
 */
export const weeklyPlanStoreActions = {
  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    isWeeklyPlanLoading$.set(loading);
  },

  /**
   * Set error state
   */
  setError: (error: string | null) => {
    weeklyPlanError$.set(error);
  },

  /**
   * Update last sync timestamp
   */
  updateLastSync: () => {
    weeklyPlanLastSync$.set(new Date());
  },

  /**
   * Clear error state
   */
  clearError: () => {
    weeklyPlanError$.set(null);
  },

  /**
   * Reset all state (useful for sign out)
   */
  reset: () => {
    isWeeklyPlanLoading$.set(false);
    weeklyPlanError$.set(null);
    weeklyPlanLastSync$.set(null);
  },
};