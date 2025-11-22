export interface ExerciseSchedule {
  id: string;
  userId: string;
  exerciseId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseScheduleWithExercise extends ExerciseSchedule {
  exercise: {
    id: string;
    name: string;
  };
}

export interface DayPlan {
  dayOfWeek: number;
  exercises: Array<{
    scheduleId: string;
    exerciseId: string;
    exerciseName: string;
    orderIndex: number;
  }>;
  hasExercises: boolean;
}

export interface WeeklyPlan {
  userId: string | null;
  days: DayPlan[]; // Always 7 items (Sunday-Saturday)
}

/**
 * Validation utilities for exercise schedule data
 */
export class ExerciseScheduleValidator {
  /**
   * Validates day of week value
   * @param dayOfWeek - The day of week to validate (0-6)
   * @throws Error if validation fails
   */
  static validateDayOfWeek(dayOfWeek: number): void {
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('Day of week must be a number between 0 (Sunday) and 6 (Saturday)');
    }
  }

  /**
   * Validates order index value
   * @param orderIndex - The order index to validate
   * @throws Error if validation fails
   */
  static validateOrderIndex(orderIndex: number): void {
    if (typeof orderIndex !== 'number' || orderIndex < 0) {
      throw new Error('Order index must be a non-negative number');
    }
  }

  /**
   * Validates exercise schedule input data
   * @param schedule - The exercise schedule to validate
   * @throws Error if validation fails
   */
  static validateExerciseSchedule(schedule: Omit<ExerciseSchedule, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!schedule) {
      throw new Error('Exercise schedule is required');
    }

    if (!schedule.userId || typeof schedule.userId !== 'string') {
      throw new Error('User ID is required');
    }

    if (!schedule.exerciseId || typeof schedule.exerciseId !== 'string') {
      throw new Error('Exercise ID is required');
    }

    this.validateDayOfWeek(schedule.dayOfWeek);
    this.validateOrderIndex(schedule.orderIndex);
  }
}

/**
 * Helper utilities for working with exercise schedules
 */
export class ExerciseScheduleUtils {
  /**
   * Gets day name from day of week number
   * @param dayOfWeek - Day of week (0-6)
   * @returns Day name
   */
  static getDayName(dayOfWeek: number): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayOfWeek] || 'Invalid Day';
  }

  /**
   * Gets short day name from day of week number
   * @param dayOfWeek - Day of week (0-6)
   * @returns Short day name
   */
  static getShortDayName(dayOfWeek: number): string {
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return shortDayNames[dayOfWeek] || 'Invalid';
  }

  /**
   * Creates an empty weekly plan
   * @param userId - User ID or null for anonymous
   * @returns Empty weekly plan
   */
  static createEmptyWeeklyPlan(userId: string | null = null): WeeklyPlan {
    return {
      userId,
      days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        exercises: [],
        hasExercises: false,
      })),
    };
  }

  /**
   * Sorts exercises within a day by order index
   * @param exercises - Array of exercises to sort
   * @returns Sorted array
   */
  static sortExercisesByOrder(exercises: DayPlan['exercises']): DayPlan['exercises'] {
    return [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  }
}