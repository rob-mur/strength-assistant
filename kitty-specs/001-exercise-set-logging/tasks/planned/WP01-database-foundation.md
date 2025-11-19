---
work_package_id: WP01
title: Database Foundation and Data Models
lane: planned
subtasks:
  - T001: Create Supabase workout_sets table schema
  - T002: Set up database indexes for performance  
  - T003: Configure Row Level Security policies
  - T004: Create TypeScript interfaces
priority: Critical
dependencies: None
history:
  - created: 2025-11-18
    author: Claude
    notes: Initial work package creation from task planning
---

# WP01: Database Foundation and Data Models

## Objective

Establish the foundational database schema and TypeScript type definitions required for workout set logging functionality. This work package creates the core data layer that all other components will depend on.

## Context

This feature implements workout set logging for a React Native app using Supabase PostgreSQL as the backend. Users need to log weight (float), repetitions (integer), and RPE (Rate of Perceived Exertion, 1-10 scale with 0.5 increments) for each exercise set.

**Key Requirements:**
- Support 0.1 to 2000 weight range (covers reasonable gym weights)
- Integer repetitions from 1 to 100
- RPE scale 1.0 to 10.0 with 0.5 increments only
- Proper indexing for query performance
- Row Level Security for data access control

## Detailed Guidance

### T001: Create Supabase workout_sets table schema
**File**: `lib/repo/supabase/schema.sql`

Create the core table with proper constraints matching the API contract:

```sql
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_date DATE NOT NULL,
  weight DECIMAL(6,2) NOT NULL CHECK (weight > 0 AND weight <= 2000),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1 AND repetitions <= 100),
  rpe DECIMAL(2,1) NOT NULL CHECK (rpe >= 1.0 AND rpe <= 10.0 AND rpe * 2 = FLOOR(rpe * 2)),
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Critical Details:**
- RPE constraint ensures only 0.5 increments (rpe * 2 = FLOOR(rpe * 2))
- Weight uses DECIMAL(6,2) for precision (allows up to 9999.99)
- Foreign key references must match existing tables

### T002: Set up database indexes for performance
**File**: `lib/repo/supabase/indexes.sql`

Create indexes to support common query patterns:

```sql
CREATE INDEX idx_workout_sets_session ON workout_sets(user_id, session_date);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX idx_workout_sets_created_at ON workout_sets(created_at);
```

**Performance Targets:**
- Session queries (<200ms for 100 sets)
- Exercise history queries (<500ms for 1000 sets)

### T003: Configure Row Level Security policies
**File**: `lib/repo/supabase/policies.sql`

Implement RLS to ensure users can only access their own workout data:

```sql
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sets"
ON workout_sets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sets"
ON workout_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sets"
ON workout_sets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sets"
ON workout_sets FOR DELETE
USING (auth.uid() = user_id);
```

### T004: Create TypeScript interfaces
**File**: `lib/models/WorkoutSet.ts`

Define TypeScript types that exactly match the database schema and API contracts:

```typescript
export interface WorkoutSet {
  id: string;
  exercise_id: string;
  user_id: string;
  session_date: string; // YYYY-MM-DD format
  weight: number;
  repetitions: number;
  rpe: number; // 1.0 to 10.0, 0.5 increments
  set_order: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface CreateWorkoutSetRequest {
  exercise_id: string;
  weight: number;
  repetitions: number;
  rpe: number;
  session_date: string;
}

export interface UpdateWorkoutSetRequest {
  weight?: number;
  repetitions?: number;
  rpe?: number;
}

export interface WorkoutSession {
  user_id: string;
  session_date: string;
  sets: WorkoutSet[];
  exercise_groups: Record<string, WorkoutSet[]>;
  total_sets: number;
  exercises_performed: string[];
}
```

## Definition of Done

- [ ] Database table created with all constraints
- [ ] Indexes created and tested for performance
- [ ] RLS policies implemented and verified
- [ ] TypeScript interfaces match OpenAPI schema exactly
- [ ] All constraints prevent invalid data entry
- [ ] Database migration can be applied to existing Supabase project
- [ ] Types exported from lib/models/index.ts

## Testing Strategy

**Database Testing:**
1. Verify table creation succeeds
2. Test all check constraints with boundary values
3. Verify foreign key constraints work
4. Test RLS policies with different user contexts

**Type Validation:**
1. Ensure TypeScript compilation succeeds
2. Verify types match OpenAPI schema exactly
3. Test type inference in IDE

## Risk Mitigation

**Risk**: Existing exercises table structure incompatible
**Mitigation**: Verify foreign key relationships before deployment

**Risk**: Performance issues with large datasets
**Mitigation**: Test indexes with 10,000+ sample records

**Risk**: RLS policy gaps allowing data leaks  
**Mitigation**: Test policies with multiple user accounts

## Reviewer Guidance

**Pre-Review:**
- Verify all SQL executes without errors
- Check TypeScript compilation
- Run basic CRUD operations

**Review Checklist:**
- [ ] Schema matches data-model.md specification
- [ ] All constraints properly implemented
- [ ] Indexes cover expected query patterns
- [ ] RLS policies prevent cross-user access
- [ ] TypeScript types are correctly exported

**Integration Testing:**
- Test with sample data covering edge cases
- Verify query performance meets targets
- Confirm RLS blocks unauthorized access

## Dependencies

None - this is foundational work that enables all other work packages.

## Follow-up Work Packages

- WP02: Validation and Form Logic (requires TypeScript types)
- WP03: Local State Management (requires data models)
- WP04: Core Set Logging (requires complete data foundation)