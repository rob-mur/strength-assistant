---
work_package_id: WP03
title: Local State Management
lane: "doing"
subtasks:
  - T010: Configure Legend State syncedCrud with Supabase
  - T011: Write unit tests for Legend State store operations
  - T012: Implement workout set actions using Legend State CRUD
  - T013: Add computed values for form defaults and session data
priority: Critical
dependencies: WP01, WP02
agent: "claude"
shell_pid: "8010"
history:
  - created: 2025-11-18
    author: Claude
    notes: Local state management for offline capability and smart defaults
---

# WP03: Local State Management

## Objective

Implement Legend State store for local persistence, smart form defaults, and offline sync queue management. Enable 50% input time reduction through intelligent defaults from last set.

## Context

The app must work offline and provide smart defaults. Legend State provides reactive local state with Supabase synchronization. Form defaults should populate weight/reps from the last set but leave RPE blank.

## Detailed Guidance

### T010: Design Legend State store structure
**File**: `lib/store/workoutSetStore.ts`

```typescript
import { observable, syncedCrud } from '@legendapp/state';
import { WorkoutSet } from '../models/WorkoutSet';
import { supabase } from '../repo/supabase/client';

// Use Legend State's built-in Supabase sync
export const workoutSets = observable(
  syncedCrud({
    supabase,
    table: 'workout_sets',
    select: '*',
    actions: ['read', 'create', 'update', 'delete'],
    // Legend State handles offline/online sync automatically
    realtime: true, // Optional: real-time updates
  })
);

// Session-specific state (not synced)
interface SessionState {
  currentSession: {
    date: string;
    exerciseId: string;
    lastSet?: WorkoutSet;
  };
  formDefaults: {
    weight: number;
    repetitions: number;
  };
}

export const sessionStore = observable<SessionState>({
  currentSession: {
    date: new Date().toISOString().split('T')[0],
    exerciseId: '',
    lastSet: undefined
  },
  formDefaults: { weight: 0, repetitions: 0 },
});
```

### T011: Write unit tests for Legend State store
**File**: `__tests__/unit/store.test.ts`

Test store operations and Legend State sync:

```typescript
describe('workoutSetStore', () => {
  it('updates form defaults from last set', () => {
    const newSet = createMockSet({ weight: 135, repetitions: 8 });
    sessionStore.currentSession.lastSet.set(newSet);
    
    expect(formDefaults.get()).toEqual({
      weight: 135,
      repetitions: 8
    });
  });

  it('syncs with Supabase automatically', async () => {
    const newSet = createMockSet();
    
    // Legend State handles sync automatically
    await workoutSets.create(newSet);
    
    // Verify local state updated
    expect(workoutSets.get()).toContain(newSet);
    
    // Legend State handles Supabase sync behind the scenes
    // No manual sync queue management needed
  });

  it('works offline with automatic sync when online', () => {
    // Legend State handles offline/online transitions automatically
    // Test that local operations work regardless of connection
    expect(() => workoutSets.create(createMockSet())).not.toThrow();
  });
});
```

### T012: Implement Legend State store actions
Add workout set actions using Legend State's built-in CRUD:

```typescript
export const workoutSetActions = {
  createSet: async (setData: Omit<WorkoutSet, 'id' | 'created_at' | 'updated_at'>) => {
    // Legend State handles ID generation and timestamps
    const newSet = await workoutSets.create(setData);
    
    // Update session state
    sessionStore.currentSession.lastSet.set(newSet);
    
    return newSet;
  },

  updateSet: async (id: string, updates: Partial<WorkoutSet>) => {
    // Legend State handles optimistic updates and sync automatically
    return await workoutSets.update(id, updates);
  },

  deleteSet: async (id: string) => {
    // Legend State handles deletion and sync
    await workoutSets.delete(id);
    
    // Clear from session if it was the last set
    const lastSetId = sessionStore.currentSession.lastSet.get()?.id;
    if (lastSetId === id) {
      sessionStore.currentSession.lastSet.set(undefined);
    }
  },

  // Get sets for current session (computed from synced data)
  getSessionSets: (exerciseId: string, sessionDate: string) => {
    return workoutSets.get()?.filter(set => 
      set.exercise_id === exerciseId && 
      set.session_date === sessionDate
    ) || [];
  }
};
```

### T013: Add computed values for form defaults
Create reactive computed values for form defaults:

```typescript
import { computed } from '@legendapp/state';

export const formDefaults = computed(() => {
  const lastSet = sessionStore.currentSession.lastSet.get();
  return lastSet 
    ? { weight: lastSet.weight, repetitions: lastSet.repetitions }
    : { weight: 0, repetitions: 0 };
});

// Computed value for current session sets (reactive to Legend State sync)
export const currentSessionSets = computed(() => {
  const { exerciseId, date } = sessionStore.currentSession.get();
  if (!exerciseId) return [];
  
  return workoutSets.get()?.filter(set => 
    set.exercise_id === exerciseId && 
    set.session_date === date
  ).sort((a, b) => b.created_at.localeCompare(a.created_at)) || [];
});

// Sync status from Legend State (automatically managed)
export const syncStatus = computed(() => {
  // Legend State provides sync status automatically
  // This would access Legend State's internal sync state
  return workoutSets.sync?.status?.get() || 'synced';
});
```

## Definition of Done

- [ ] Legend State syncedCrud configured with Supabase
- [ ] Computed values update form defaults automatically  
- [ ] Unit tests cover store operations and sync behavior
- [ ] Performance suitable for real-time updates
- [ ] Store persists across app restarts with Legend State persistence
- [ ] Offline capability works automatically via Legend State

## Risk Mitigation

**Risk**: Legend State sync configuration complexity
**Mitigation**: Follow Legend State documentation exactly, test sync scenarios thoroughly

**Risk**: Performance issues with large datasets
**Mitigation**: Use Legend State's built-in pagination and filtering features

## Dependencies

**Requires**: WP01 (WorkoutSet types), WP02 (validation schemas)

## Activity Log

- 2025-11-19T20:55:55Z – claude – shell_pid=8010 – lane=doing – Started implementation of local state management with Legend State
