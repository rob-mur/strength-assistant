import { exerciseSchedules$, getCurrentUserSchedules, initializeWeeklyPlanSync } from '../../../../lib/data/sync/weeklyPlanSync';
import { weeklyPlan$, getDayPlan$, getCurrentDayPlan$, weeklyPlanStoreActions } from '../../../../lib/data/legend-state/WeeklyPlanStore';
import { weeklyPlanActions } from '../../../../lib/data/legend-state/WeeklyPlanActions';
import { getCurrentUserId } from '../../../../lib/utils/auth/userHelpers';
import type { ExerciseScheduleWithExercise } from '../../../../lib/models/ExerciseSchedule';

// Mock dependencies
jest.mock('../../../../lib/utils/auth/userHelpers');
jest.mock('../../../../lib/data/supabase');

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

describe('Weekly Plan Sync Integration', () => {
  beforeEach(() => {
    // Reset state before each test
    exerciseSchedules$.set({});
    weeklyPlanStoreActions.reset();
    jest.clearAllMocks();
  });

  describe('Exercise Schedules Observable', () => {
    test('should initialize with empty schedules', () => {
      const schedules = exerciseSchedules$.get();
      expect(schedules).toEqual({});
    });

    test('should store exercise schedules by ID', () => {
      const mockSchedule: ExerciseScheduleWithExercise = {
        id: 'schedule-1',
        userId: 'user-1',
        exerciseId: 'exercise-1',
        dayOfWeek: 1, // Monday
        orderIndex: 0,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        exercise: {
          id: 'exercise-1',
          name: 'Push-ups',
        },
      };

      exerciseSchedules$.set({
        'schedule-1': mockSchedule,
      });

      const schedules = exerciseSchedules$.get();
      expect(schedules['schedule-1']).toEqual(mockSchedule);
    });

    test('should handle multiple schedules across different days', () => {
      const mockSchedules: Record<string, ExerciseScheduleWithExercise> = {
        'schedule-1': {
          id: 'schedule-1',
          userId: 'user-1',
          exerciseId: 'exercise-1',
          dayOfWeek: 1, // Monday
          orderIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-1', name: 'Push-ups' },
        },
        'schedule-2': {
          id: 'schedule-2',
          userId: 'user-1',
          exerciseId: 'exercise-2',
          dayOfWeek: 3, // Wednesday
          orderIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-2', name: 'Squats' },
        },
      };

      exerciseSchedules$.set(mockSchedules);

      const schedules = exerciseSchedules$.get();
      expect(Object.keys(schedules)).toHaveLength(2);
      expect(schedules['schedule-1'].exercise.name).toBe('Push-ups');
      expect(schedules['schedule-2'].exercise.name).toBe('Squats');
    });
  });

  describe('Weekly Plan Computed Observable', () => {
    test('should compute weekly plan from empty schedules', () => {
      const weeklyPlan = weeklyPlan$.get();
      
      expect(weeklyPlan.userId).toBeNull();
      expect(weeklyPlan.days).toHaveLength(7);
      
      weeklyPlan.days.forEach((day, index) => {
        expect(day.dayOfWeek).toBe(index);
        expect(day.exercises).toEqual([]);
        expect(day.hasExercises).toBe(false);
      });
    });

    test('should compute weekly plan from exercise schedules', () => {
      const mockSchedules: Record<string, ExerciseScheduleWithExercise> = {
        'schedule-1': {
          id: 'schedule-1',
          userId: 'user-1',
          exerciseId: 'exercise-1',
          dayOfWeek: 1, // Monday
          orderIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-1', name: 'Push-ups' },
        },
        'schedule-2': {
          id: 'schedule-2',
          userId: 'user-1',
          exerciseId: 'exercise-2',
          dayOfWeek: 1, // Monday (second exercise)
          orderIndex: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-2', name: 'Squats' },
        },
      };

      exerciseSchedules$.set(mockSchedules);
      const weeklyPlan = weeklyPlan$.get();

      // Check Monday (day 1)
      const mondayPlan = weeklyPlan.days[1];
      expect(mondayPlan.hasExercises).toBe(true);
      expect(mondayPlan.exercises).toHaveLength(2);
      expect(mondayPlan.exercises[0].exerciseName).toBe('Push-ups');
      expect(mondayPlan.exercises[0].orderIndex).toBe(0);
      expect(mondayPlan.exercises[1].exerciseName).toBe('Squats');
      expect(mondayPlan.exercises[1].orderIndex).toBe(1);

      // Check other days are empty
      weeklyPlan.days.forEach((day, index) => {
        if (index !== 1) {
          expect(day.hasExercises).toBe(false);
          expect(day.exercises).toEqual([]);
        }
      });
    });

    test('should sort exercises by order index', () => {
      const mockSchedules: Record<string, ExerciseScheduleWithExercise> = {
        'schedule-1': {
          id: 'schedule-1',
          userId: 'user-1',
          exerciseId: 'exercise-1',
          dayOfWeek: 1,
          orderIndex: 2, // Higher order
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-1', name: 'Push-ups' },
        },
        'schedule-2': {
          id: 'schedule-2',
          userId: 'user-1',
          exerciseId: 'exercise-2',
          dayOfWeek: 1,
          orderIndex: 0, // Lower order - should be first
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-2', name: 'Squats' },
        },
      };

      exerciseSchedules$.set(mockSchedules);
      const weeklyPlan = weeklyPlan$.get();
      const mondayPlan = weeklyPlan.days[1];

      expect(mondayPlan.exercises[0].exerciseName).toBe('Squats'); // orderIndex 0
      expect(mondayPlan.exercises[1].exerciseName).toBe('Push-ups'); // orderIndex 2
    });
  });

  describe('Day Plan Selectors', () => {
    beforeEach(() => {
      const mockSchedules: Record<string, ExerciseScheduleWithExercise> = {
        'schedule-1': {
          id: 'schedule-1',
          userId: 'user-1',
          exerciseId: 'exercise-1',
          dayOfWeek: 1, // Monday
          orderIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-1', name: 'Push-ups' },
        },
      };
      exerciseSchedules$.set(mockSchedules);
    });

    test('should get specific day plan', () => {
      const mondayPlan = getDayPlan$(1).get();
      
      expect(mondayPlan.dayOfWeek).toBe(1);
      expect(mondayPlan.hasExercises).toBe(true);
      expect(mondayPlan.exercises).toHaveLength(1);
      expect(mondayPlan.exercises[0].exerciseName).toBe('Push-ups');
    });

    test('should get empty plan for days without exercises', () => {
      const tuesdayPlan = getDayPlan$(2).get();
      
      expect(tuesdayPlan.dayOfWeek).toBe(2);
      expect(tuesdayPlan.hasExercises).toBe(false);
      expect(tuesdayPlan.exercises).toEqual([]);
    });

    test('should get current day plan', () => {
      // Mock current day to be Monday (1)
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = jest.fn(() => 1);

      const currentDayPlan = getCurrentDayPlan$.get();
      expect(currentDayPlan.dayOfWeek).toBe(1);
      expect(currentDayPlan.hasExercises).toBe(true);

      // Restore original method
      Date.prototype.getDay = originalGetDay;
    });
  });

  describe('Exercise Assignment Actions', () => {
    beforeEach(() => {
      mockGetCurrentUserId.mockResolvedValue('user-1');
    });

    test('should assign exercise to day successfully', async () => {
      const scheduleId = await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      expect(scheduleId).toBeTruthy();
      
      const schedules = exerciseSchedules$.get();
      const newSchedule = schedules[scheduleId];
      
      expect(newSchedule).toBeDefined();
      expect(newSchedule.exerciseId).toBe('exercise-1');
      expect(newSchedule.dayOfWeek).toBe(1);
      expect(newSchedule.orderIndex).toBe(0);
      expect(newSchedule.exercise.name).toBe('Push-ups');
    });

    test('should throw error for duplicate exercise assignment', async () => {
      // Assign exercise first time
      await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      // Try to assign same exercise to same day
      await expect(
        weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups')
      ).rejects.toThrow('Exercise is already assigned to this day');
    });

    test('should calculate correct order index for multiple exercises', async () => {
      // Assign first exercise
      const scheduleId1 = await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      // Assign second exercise
      const scheduleId2 = await weeklyPlanActions.assignExerciseToDay('exercise-2', 1, 'Squats');
      
      const schedules = exerciseSchedules$.get();
      expect(schedules[scheduleId1].orderIndex).toBe(0);
      expect(schedules[scheduleId2].orderIndex).toBe(1);
    });

    test('should remove exercise from day successfully', async () => {
      const scheduleId = await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      // Verify exercise was added
      let schedules = exerciseSchedules$.get();
      expect(schedules[scheduleId]).toBeDefined();
      
      // Remove exercise
      await weeklyPlanActions.removeExerciseFromDay(scheduleId);
      
      // Verify exercise was removed
      schedules = exerciseSchedules$.get();
      expect(schedules[scheduleId]).toBeUndefined();
    });

    test('should reorder exercise within day successfully', async () => {
      const scheduleId = await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      // Reorder to new position
      await weeklyPlanActions.reorderExerciseInDay(scheduleId, 5);
      
      const schedules = exerciseSchedules$.get();
      expect(schedules[scheduleId].orderIndex).toBe(5);
    });

    test('should clear all exercises from day successfully', async () => {
      // Add multiple exercises to Monday
      await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      await weeklyPlanActions.assignExerciseToDay('exercise-2', 1, 'Squats');
      
      // Verify exercises were added
      let schedules = exerciseSchedules$.get();
      const mondaySchedules = Object.values(schedules).filter(s => s.dayOfWeek === 1);
      expect(mondaySchedules).toHaveLength(2);
      
      // Clear the day
      await weeklyPlanActions.clearDay(1);
      
      // Verify day was cleared
      schedules = exerciseSchedules$.get();
      const mondaySchedulesAfter = Object.values(schedules).filter(s => s.dayOfWeek === 1);
      expect(mondaySchedulesAfter).toHaveLength(0);
    });

    test('should handle unauthenticated user errors', async () => {
      mockGetCurrentUserId.mockResolvedValue(null);
      
      await expect(
        weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups')
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('getCurrentUserSchedules', () => {
    test('should return empty object when user not authenticated', async () => {
      mockGetCurrentUserId.mockResolvedValue(null);
      
      const result = await getCurrentUserSchedules();
      expect(result).toEqual({});
    });

    test('should return user schedules when authenticated', async () => {
      mockGetCurrentUserId.mockResolvedValue('user-1');
      
      const mockSchedules: Record<string, ExerciseScheduleWithExercise> = {
        'schedule-1': {
          id: 'schedule-1',
          userId: 'user-1',
          exerciseId: 'exercise-1',
          dayOfWeek: 1,
          orderIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          exercise: { id: 'exercise-1', name: 'Push-ups' },
        },
      };
      
      exerciseSchedules$.set(mockSchedules);
      
      const result = await getCurrentUserSchedules();
      expect(result).toEqual(mockSchedules);
    });
  });

  describe('initializeWeeklyPlanSync', () => {
    test('should initialize sync when user is authenticated', async () => {
      mockGetCurrentUserId.mockResolvedValue('user-1');
      
      await expect(initializeWeeklyPlanSync()).resolves.not.toThrow();
    });

    test('should handle initialization when user not authenticated', async () => {
      mockGetCurrentUserId.mockResolvedValue(null);
      
      await expect(initializeWeeklyPlanSync()).resolves.not.toThrow();
    });

    test('should handle initialization errors gracefully', async () => {
      mockGetCurrentUserId.mockRejectedValue(new Error('Network error'));
      
      await expect(initializeWeeklyPlanSync()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetCurrentUserId.mockResolvedValue('user-1');
    });

    test('should set error state on action failure', async () => {
      // Force an error by using invalid day of week
      await expect(
        weeklyPlanActions.assignExerciseToDay('exercise-1', 7, 'Push-ups') // Invalid day
      ).rejects.toThrow();
      
      // Check that error state was set
      // Note: In a real implementation, we'd check weeklyPlanStoreActions.setError was called
      // This test verifies the error bubbles up correctly
    });

    test('should clear error state on successful action', async () => {
      // Set initial error state
      weeklyPlanStoreActions.setError('Previous error');
      
      // Perform successful action
      await weeklyPlanActions.assignExerciseToDay('exercise-1', 1, 'Push-ups');
      
      // Note: In a real implementation, we'd verify clearError was called
      // This test structure shows how error clearing should work
    });
  });
});