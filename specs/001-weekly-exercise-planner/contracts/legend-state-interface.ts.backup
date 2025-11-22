/**
 * Legend State Interface Contract for Weekly Exercise Planner
 * 
 * Defines the state structure and operations for managing weekly exercise schedules
 * using Legend State reactive primitives.
 */

import type { Observable } from '@legendapp/state';

// Core data types
export interface ExerciseSchedule {
  id: string;
  userId: string;
  exerciseId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface Exercise {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  // Additional exercise properties from existing schema
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

// Observable store structure
export interface WeeklyPlanStore {
  // Raw exercise schedules synced from Supabase
  exerciseSchedules: Record<string, ExerciseSchedule>;
  
  // Computed weekly plan view
  weeklyPlan: WeeklyPlan;
  
  // UI state
  ui: {
    selectedDay: number | null;
    calendarExpanded: boolean;
    isLoading: boolean;
    error: string | null;
  };
}

// Observable store type (Legend State)
export type WeeklyPlanState = Observable<WeeklyPlanStore>;

// Action interfaces for modifying the store
export interface WeeklyPlanActions {
  // Schedule management
  assignExerciseToDay(exerciseId: string, dayOfWeek: number): Promise<void>;
  removeExerciseFromDay(scheduleId: string): Promise<void>;
  reorderExerciseInDay(scheduleId: string, newOrderIndex: number): Promise<void>;
  moveExerciseToDay(scheduleId: string, newDayOfWeek: number): Promise<void>;
  
  // Bulk operations
  assignMultipleExercisesToDay(exerciseIds: string[], dayOfWeek: number): Promise<void>;
  clearDay(dayOfWeek: number): Promise<void>;
  duplicateDay(sourceDayOfWeek: number, targetDayOfWeek: number): Promise<void>;
  
  // UI state management
  selectDay(dayOfWeek: number | null): void;
  toggleCalendarExpanded(): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
  
  // Sync operations (handled by Legend State automatically)
  // No custom sync methods needed - Legend State's configureSyncedSupabase handles all sync operations
}

// Selector interfaces for computed values
export interface WeeklyPlanSelectors {
  // Day-specific selectors
  getDayPlan(dayOfWeek: number): Observable<DayPlan>;
  getDayExerciseCount(dayOfWeek: number): Observable<number>;
  isDayEmpty(dayOfWeek: number): Observable<boolean>;
  getCurrentDayPlan(): Observable<DayPlan>;
  
  // Week-level selectors
  getTotalExercisesInWeek(): Observable<number>;
  getActiveDaysCount(): Observable<number>;
  hasAnyExercises(): Observable<boolean>;
  getWeekCompletionPercentage(): Observable<number>;
  
  // Exercise-specific selectors
  getExerciseSchedules(exerciseId: string): Observable<ExerciseSchedule[]>;
  isExerciseAssignedToDay(exerciseId: string, dayOfWeek: number): Observable<boolean>;
  getExerciseAssignmentCount(exerciseId: string): Observable<number>;
  
  // Sync status selectors
  isPending(): Observable<boolean>;
  hasErrors(): Observable<boolean>;
  getSyncErrors(): Observable<string[]>;
}

// Configuration for Legend State's built-in Supabase sync engine
export interface WeeklyPlanSyncConfig {
  // Use Legend State's configureSyncedSupabase
  supabaseConfig: {
    table: 'exercise_schedules';
    select: '*, exercises(id, name)';
    filter: (userId: string) => `user_id.eq.${userId}`;
    // Legend State handles realtime automatically
    realtime: true;
  };
  
  // Legend State built-in options
  syncOptions: {
    // Use Legend State's built-in sync features
    // No custom sync code required - Legend State handles:
    // - Optimistic updates
    // - Real-time subscriptions  
    // - Offline persistence
    // - Conflict resolution
    // - Retry logic
    // - Background sync
  };
}

// Event types for reactive updates
export type WeeklyPlanEvent = 
  | { type: 'EXERCISE_ASSIGNED'; payload: { exerciseId: string; dayOfWeek: number } }
  | { type: 'EXERCISE_REMOVED'; payload: { scheduleId: string } }
  | { type: 'EXERCISE_REORDERED'; payload: { scheduleId: string; oldOrder: number; newOrder: number } }
  | { type: 'DAY_CLEARED'; payload: { dayOfWeek: number } }
  | { type: 'SYNC_STARTED'; payload: {} }
  | { type: 'SYNC_COMPLETED'; payload: { changesCount: number } }
  | { type: 'SYNC_FAILED'; payload: { error: string } };

// Hook interfaces for React components
export interface UseWeeklyPlannerReturn {
  // State
  weeklyPlan: Observable<WeeklyPlan>;
  selectedDay: Observable<number | null>;
  isLoading: Observable<boolean>;
  error: Observable<string | null>;
  calendarExpanded: Observable<boolean>;
  
  // Actions
  actions: WeeklyPlanActions;
  
  // Selectors
  selectors: WeeklyPlanSelectors;
  
  // Event handling
  addEventListener(event: WeeklyPlanEvent['type'], handler: (payload: any) => void): () => void;
}

// Component prop interfaces
export interface WeeklyPlannerCardProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  onDaySelect: (dayOfWeek: number) => void;
  onStartWorkout: (dayOfWeek: number) => void;
  style?: any;
}

export interface DayAssignmentModalProps {
  visible: boolean;
  selectedDay: number | null;
  availableExercises: Exercise[];
  currentAssignments: ExerciseSchedule[];
  onClose: () => void;
  onAssignExercise: (exerciseId: string) => void;
  onRemoveExercise: (scheduleId: string) => void;
}

export interface CalendarViewProps {
  weeklyPlan: WeeklyPlan;
  selectedDay: number | null;
  onDayPress: (dayOfWeek: number) => void;
  markedDates: Record<string, any>;
  theme: any;
}

// Error types for type-safe error handling
export interface WeeklyPlannerError {
  code: string;
  message: string;
  context?: {
    exerciseId?: string;
    dayOfWeek?: number;
    scheduleId?: string;
    operation?: string;
  };
}

// Validation schemas (for runtime type checking)
export interface WeeklyPlannerValidators {
  validateDayOfWeek(day: number): boolean;
  validateExerciseId(exerciseId: string): boolean;
  validateOrderIndex(orderIndex: number): boolean;
  validateScheduleAssignment(assignment: Partial<ExerciseSchedule>): boolean;
}

// Export all interfaces for implementation
export type {
  ExerciseSchedule,
  Exercise,
  DayPlan,
  WeeklyPlan,
  WeeklyPlanStore,
  WeeklyPlanState,
  WeeklyPlanActions,
  WeeklyPlanSelectors,
  WeeklyPlanSyncConfig,
  WeeklyPlanEvent,
  UseWeeklyPlannerReturn,
  WeeklyPlannerCardProps,
  DayAssignmentModalProps,
  CalendarViewProps,
  WeeklyPlannerError,
  WeeklyPlannerValidators,
};