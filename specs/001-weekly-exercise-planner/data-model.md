# Data Model: Weekly Exercise Planner

**Feature**: Weekly Exercise Planner  
**Created**: 2025-11-22  
**Based on**: Feature specification and research findings

## Core Entities

### ExerciseSchedule (New)

Represents the assignment of an exercise to a specific day of the week for a user.

**Attributes**:
- `id`: UUID - Unique identifier for the schedule entry
- `userId`: UUID - Reference to the user who created the schedule (auth.users.id)
- `exerciseId`: UUID - Reference to the assigned exercise (exercises.id)
- `dayOfWeek`: Integer (0-6) - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
- `orderIndex`: Integer - Order of exercise within the day (for multiple exercises per day)
- `createdAt`: Timestamp - When the schedule entry was created
- `updatedAt`: Timestamp - When the schedule entry was last modified

**Validation Rules**:
- `dayOfWeek` must be between 0 and 6 inclusive
- `userId` must exist in auth.users table
- `exerciseId` must exist in exercises table
- `orderIndex` defaults to 0, allows for ordering exercises within a day
- Unique constraint on (userId, exerciseId, dayOfWeek) to prevent duplicate assignments

**Relationships**:
- Belongs to User (userId → auth.users.id)
- Belongs to Exercise (exerciseId → exercises.id)
- Many-to-many relationship between Users and Exercises through days of the week

### Exercise (Existing)

Existing entity representing individual exercises that can be assigned to weekly schedules.

**Referenced Attributes**:
- `id`: UUID - Primary key
- `name`: String - Exercise name (e.g., "Push-ups", "Bench Press")
- `user_id`: UUID - Owner of the exercise
- Additional fields as defined in existing schema

### WeeklyPlan (Computed View)

Virtual entity representing a user's complete weekly exercise plan. This is computed from ExerciseSchedule entities.

**Structure**:
- `userId`: UUID - The user this plan belongs to
- `days`: Array of DayPlan objects (7 items, Sunday through Saturday)

### DayPlan (Computed)

Represents exercises assigned to a specific day within a weekly plan.

**Structure**:
- `dayOfWeek`: Integer (0-6) - Day identifier
- `exercises`: Array of assigned exercises with metadata
- `hasExercises`: Boolean - Whether any exercises are assigned to this day

## Database Schema

### Supabase Migration

```sql
-- Create exercise_schedules table
CREATE TABLE exercise_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate exercise assignments to same day
  UNIQUE(user_id, exercise_id, day_of_week)
);

-- Enable RLS (Row Level Security)
ALTER TABLE exercise_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own schedules
CREATE POLICY "Users can manage their own exercise schedules" ON exercise_schedules
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX exercise_schedules_user_day_idx ON exercise_schedules(user_id, day_of_week);
CREATE INDEX exercise_schedules_exercise_idx ON exercise_schedules(exercise_id);
CREATE INDEX exercise_schedules_user_idx ON exercise_schedules(user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercise_schedules_updated_at 
  BEFORE UPDATE ON exercise_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## State Management

### Legend State Store Structure

```typescript
interface WeeklyPlanStore {
  // Exercise schedules keyed by ID
  exerciseSchedules: Record<string, {
    id: string;
    userId: string;
    exerciseId: string;
    dayOfWeek: number;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    syncStatus: 'pending' | 'synced' | 'error';
  }>;
  
  // Computed weekly plan for current user
  weeklyPlan: {
    userId: string | null;
    days: Array<{
      dayOfWeek: number;
      exercises: Array<{
        scheduleId: string;
        exerciseId: string;
        exerciseName: string;
        orderIndex: number;
      }>;
      hasExercises: boolean;
    }>;
  };
  
  // UI state
  ui: {
    selectedDay: number | null;
    calendarExpanded: boolean;
    isLoading: boolean;
  };
}
```

### Legend State Sync Configuration

```typescript
import { configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';

// Use Legend State's built-in Supabase sync - no custom sync code needed
const exerciseSchedules$ = observable(
  configureSyncedSupabase({
    supabase: supabaseClient,
    collection: 'exercise_schedules',
    select: '*, exercises(id, name)',
    filter: (userId: string) => `user_id.eq.${userId}`,
    realtime: true, // Legend State automatically handles real-time subscriptions
    // Built-in features handled automatically:
    // - Optimistic updates
    // - Offline persistence  
    // - Real-time sync
    // - Conflict resolution
    // - Background sync
    // - Error handling and retries
  })
);
```

## Data Flow Patterns

### Creating a Weekly Plan Assignment

1. User selects a day in the calendar
2. User chooses exercises from their exercise library  
3. Create ExerciseSchedule records: `exerciseSchedules$.set(id, newSchedule)`
4. Legend State automatically handles optimistic updates and Supabase sync
5. UI reflects changes immediately via Legend State reactivity

### Loading Weekly Plan

1. Legend State's configureSyncedSupabase automatically loads and syncs data
2. Compute WeeklyPlan view from exerciseSchedules$ observable
3. Real-time updates handled automatically by Legend State
4. Offline/online state managed automatically

### Modifying Assignments  

1. User adds/removes exercises from days
2. Update observables: `exerciseSchedules$.set()` or `exerciseSchedules$.delete()`
3. Legend State automatically handles:
   - Optimistic UI updates
   - Background sync to Supabase
   - Real-time propagation
   - Offline queueing
   - Error handling and retries

## Edge Cases and Constraints

### Business Rules

- Users can assign multiple exercises to the same day
- Same exercise can be assigned to multiple days
- Exercise assignment is specific to individual users
- Deleting an exercise removes all its schedule assignments
- Users can only modify their own weekly plans

### Data Integrity

- Cascade deletes: If user is deleted, all their schedules are deleted
- Cascade deletes: If exercise is deleted, all its schedule assignments are deleted
- Unique constraint prevents duplicate exercise assignments to same day
- Foreign key constraints ensure referential integrity

### Performance Considerations

- Index on (user_id, day_of_week) for fast weekly plan queries
- Index on exercise_id for efficient exercise deletion cascades
- Limit real-time subscriptions to current user's data only
- Cache computed weekly plans in memory with TTL

## Migration Strategy

### Database Migration

1. Create exercise_schedules table with proper constraints and indexes
2. Set up RLS policies for data security
3. Add real-time replication filters
4. Test with sample data

### Application Changes

1. Extend Legend State store with exercise schedule observables
2. Add sync configuration for exercise schedules
3. Create computed selectors for weekly plan views
4. Implement CRUD operations for schedule management

### Rollback Plan

- Drop exercise_schedules table if issues arise
- Feature is additive - no breaking changes to existing functionality
- Can disable feature with simple configuration flag