# Data Model: Exercise Set Logging

_Phase 1 Output - Entity definitions and relationships_

## Core Entities

### WorkoutSet

**Purpose**: Represents a single set of exercise performance data

**Fields**:
- `id`: string (UUID, primary key)
- `exercise_id`: string (foreign key to existing exercise)
- `user_id`: string (foreign key to user) 
- `session_date`: string (ISO date, YYYY-MM-DD)
- `weight`: number (float > 0, supports metric/imperial)
- `repetitions`: integer (e 1)
- `rpe`: number (1.0 to 10.0, increments of 0.5)
- `created_at`: timestamp (ISO 8601)
- `updated_at`: timestamp (ISO 8601)
- `set_order`: integer (position within session)

**Validation Rules**:
- Weight: Must be positive float, range 0.1 to 2000 (covers reasonable gym weights)
- Repetitions: Must be positive integer, range 1 to 100 (reasonable rep ranges)
- RPE: Must be between 1.0 and 10.0, increments of 0.5 only
- Session date: Must be valid date, not in future
- Set order: Auto-incremented within session

**Relationships**:
- Belongs to Exercise (exercise_id)
- Belongs to User (user_id) 
- Grouped by session_date for workout sessions

### WorkoutSession (Computed)

**Purpose**: Virtual entity representing all sets for a user on a specific date

**Fields**:
- `user_id`: string
- `session_date`: string (YYYY-MM-DD)
- `sets`: WorkoutSet[] (ordered by set_order)
- `exercise_groups`: Map<exercise_id, WorkoutSet[]>

**Computed Properties**:
- `total_sets`: Count of all sets in session
- `exercises_performed`: Unique exercise IDs
- `session_duration`: Time between first and last set (estimated)

## State Transitions

### WorkoutSet Lifecycle

1. **Draft** ’ User typing in form (not persisted)
2. **Validating** ’ Form validation running (<200ms)
3. **Saving** ’ Persisting to Legend State + Supabase
4. **Saved** ’ Successfully stored, visible in session list
5. **Editing** ’ User modifying existing set
6. **Deleting** ’ User removing set from session

### Form State Management

- **Default Values**: Auto-populate from last set in session
- **Validation**: Real-time for each field change
- **Error States**: Field-level error display
- **Success States**: Immediate visual confirmation

## Database Schema (Supabase)

```sql
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_date DATE NOT NULL,
  weight DECIMAL(6,2) NOT NULL CHECK (weight > 0),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1),
  rpe DECIMAL(2,1) NOT NULL CHECK (rpe >= 1.0 AND rpe <= 10.0),
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workout_sets_session ON workout_sets(user_id, session_date);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
```

## Local State Schema (Legend State)

```typescript
interface WorkoutSetStore {
  sets: Record<string, WorkoutSet>;
  currentSession: {
    date: string;
    exerciseId: string;
    lastSet?: WorkoutSet;
  };
  formDefaults: {
    weight: number;
    repetitions: number;
  };
  syncQueue: string[]; // IDs pending Supabase sync
}
```