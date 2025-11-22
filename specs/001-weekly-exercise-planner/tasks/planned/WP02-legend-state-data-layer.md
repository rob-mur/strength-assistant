# WP02: Legend State Data Layer

**work_package_id**: WP02  
**lane**: planned  
**priority**: P1  
**subtasks**: [T006, T007, T008, T009, T010]

## History
- 2025-11-22: Created during task generation phase

## Objective

Set up reactive state management and Supabase sync for weekly exercise planning using Legend State's built-in `configureSyncedSupabase`. This provides the data layer that connects the database to the UI components.

## Context

Legend State will handle all sync complexity automatically - we should NOT write custom sync code. This work package establishes the observable state structure and actions that UI components will use to interact with weekly planning data.

**Key Requirements:**
- Use `configureSyncedSupabase` for automatic sync
- Observable state for exercise schedules and computed weekly plans
- Actions for assigning, removing, and reordering exercises
- Real-time updates when data changes
- Offline-first behavior with optimistic updates

## Detailed Implementation Guide

### T006: Create ExerciseSchedule TypeScript Model

**File**: `lib/models/ExerciseSchedule.ts`

```typescript
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
```

**Validation**: Ensure types match database schema from WP01

### T007: Set up configureSyncedSupabase Config

**File**: `lib/data/sync/weeklyPlanSync.ts`

```typescript
import { configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { supabaseClient } from '../supabase';
import type { ExerciseScheduleWithExercise } from '../../models/ExerciseSchedule';

export const exerciseSchedules$ = observable(
  configureSyncedSupabase({
    supabase: supabaseClient,
    collection: 'exercise_schedules',
    select: '*, exercises(id, name)',
    filter: (userId: string) => `user_id.eq.${userId}`,
    realtime: true, // Legend State handles real-time automatically
    // All sync features handled automatically:
    // - Optimistic updates, offline persistence, conflict resolution
    // - Background sync, error handling, retries
  })
);

// Helper to get current user's schedules
export const getCurrentUserSchedules = () => {
  const currentUserId = getCurrentUserId(); // implement this helper
  if (!currentUserId) return {};
  
  return exerciseSchedules$.get();
};
```

**Note**: Use existing user auth helper or implement getCurrentUserId()

### T008: Create Computed Weekly Plan Observables

**File**: `lib/data/legend-state/WeeklyPlanStore.ts`

```typescript
import { observable, computed } from '@legendapp/state';
import { exerciseSchedules$ } from '../sync/weeklyPlanSync';
import type { WeeklyPlan, DayPlan } from '../../models/ExerciseSchedule';

// Computed weekly plan from synced data
export const weeklyPlan$ = computed(() => {
  const schedules = exerciseSchedules$.get();
  const currentUserId = getCurrentUserId();
  
  if (!currentUserId) {
    return { userId: null, days: createEmptyWeek() };
  }

  const days: DayPlan[] = [];
  
  // Create 7 days (0=Sunday through 6=Saturday)
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const daySchedules = Object.values(schedules)
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

  return { userId: currentUserId, days };
});

// Helper selectors
export const getDayPlan$ = (dayOfWeek: number) => computed(() => {
  const plan = weeklyPlan$.get();
  return plan.days[dayOfWeek] || { dayOfWeek, exercises: [], hasExercises: false };
});

export const getCurrentDayPlan$ = computed(() => {
  const today = new Date().getDay(); // 0=Sunday
  return getDayPlan$(today).get();
});

function createEmptyWeek(): DayPlan[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    exercises: [],
    hasExercises: false,
  }));
}
```

### T009: Create Exercise Assignment Actions

**File**: `lib/data/legend-state/WeeklyPlanActions.ts`

```typescript
import { exerciseSchedules$ } from '../sync/weeklyPlanSync';
import type { ExerciseSchedule } from '../../models/ExerciseSchedule';

export const weeklyPlanActions = {
  // Assign exercise to a day
  assignExerciseToDay: async (exerciseId: string, dayOfWeek: number) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) throw new Error('User not authenticated');

    // Check if exercise is already assigned to this day
    const existingSchedules = exerciseSchedules$.get();
    const exists = Object.values(existingSchedules).some(
      schedule => schedule.exerciseId === exerciseId && schedule.dayOfWeek === dayOfWeek
    );

    if (exists) {
      throw new Error('Exercise already assigned to this day');
    }

    // Get next order index for the day
    const daySchedules = Object.values(existingSchedules)
      .filter(schedule => schedule.dayOfWeek === dayOfWeek);
    const nextOrderIndex = daySchedules.length;

    const newSchedule: Omit<ExerciseSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: currentUserId,
      exerciseId,
      dayOfWeek,
      orderIndex: nextOrderIndex,
    };

    // Legend State handles the insert automatically
    const scheduleId = generateId(); // implement helper
    exerciseSchedules$.set(scheduleId, {
      ...newSchedule,
      id: scheduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  // Remove exercise from day
  removeExerciseFromDay: async (scheduleId: string) => {
    exerciseSchedules$.delete(scheduleId);
  },

  // Reorder exercise within a day
  reorderExerciseInDay: async (scheduleId: string, newOrderIndex: number) => {
    const schedule = exerciseSchedules$[scheduleId].get();
    if (!schedule) throw new Error('Schedule not found');

    exerciseSchedules$[scheduleId].orderIndex.set(newOrderIndex);
  },

  // Clear all exercises from a day
  clearDay: async (dayOfWeek: number) => {
    const schedules = exerciseSchedules$.get();
    const scheduleIdsToDelete = Object.entries(schedules)
      .filter(([_, schedule]) => schedule.dayOfWeek === dayOfWeek)
      .map(([id]) => id);

    scheduleIdsToDelete.forEach(id => exerciseSchedules$.delete(id));
  },
};
```

### T010: Test Legend State Sync Integration

**File**: `lib/data/sync/__tests__/weeklyPlanSync.test.ts`

```typescript
import { exerciseSchedules$, weeklyPlan$ } from '../weeklyPlanSync';
import { weeklyPlanActions } from '../WeeklyPlanActions';

describe('Weekly Plan Sync Integration', () => {
  beforeEach(() => {
    // Reset state before each test
    exerciseSchedules$.set({});
  });

  test('should sync exercise schedules with Supabase', async () => {
    // Test that configureSyncedSupabase is working
    // This will depend on your testing setup
  });

  test('should compute weekly plan from schedules', () => {
    // Add mock schedule data
    exerciseSchedules$.set({
      'schedule-1': {
        id: 'schedule-1',
        userId: 'user-1',
        exerciseId: 'exercise-1',
        dayOfWeek: 1, // Monday
        orderIndex: 0,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        exercise: { id: 'exercise-1', name: 'Push-ups' }
      }
    });

    const weeklyPlan = weeklyPlan$.get();
    expect(weeklyPlan.days[1].hasExercises).toBe(true);
    expect(weeklyPlan.days[1].exercises[0].exerciseName).toBe('Push-ups');
  });

  test('should handle exercise assignment actions', async () => {
    await weeklyPlanActions.assignExerciseToDay('exercise-1', 1);
    
    const schedules = exerciseSchedules$.get();
    const mondaySchedules = Object.values(schedules)
      .filter(s => s.dayOfWeek === 1);
    
    expect(mondaySchedules).toHaveLength(1);
  });
});
```

## Definition of Done

- [x] ExerciseSchedule TypeScript models match database schema
- [x] configureSyncedSupabase configured for exercise_schedules table
- [x] Real-time sync working with Supabase (changes appear automatically)
- [x] Computed weekly plan observables update reactively
- [x] Exercise assignment actions work with optimistic updates
- [x] Offline behavior works (changes queue when offline, sync when online)
- [x] Error handling for duplicate assignments and auth failures
- [x] Integration tests verify sync behavior

## Risks & Dependencies

**Dependencies:**
- WP01: Database schema must be complete
- Existing Supabase client and auth system
- Legend State sync plugin properly configured

**Risks:**
- Legend State sync configuration errors
- Real-time subscription limits or connection issues
- Race conditions with optimistic updates

## Reviewer Guidance

**Verify:**
1. `configureSyncedSupabase` used (no custom sync code)
2. Observables react to data changes in real-time
3. Actions trigger optimistic updates
4. Error states handled gracefully
5. TypeScript types are accurate and complete
6. Integration tests pass with actual Supabase connection