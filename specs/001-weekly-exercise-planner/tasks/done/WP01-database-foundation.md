# WP01: Database Foundation

**work_package_id**: WP01  
**lane**: done  
**priority**: P1  
**subtasks**: [T001, T002, T003, T004, T005]
**assignee**: claude
**agent**: claude
**shell_pid**: 38494

## History
- 2025-11-22: Created during task generation phase
- 2025-11-22T12:00:00Z – claude – shell_pid=38494 – lane=doing – Started implementation
- 2025-11-22T18:30:00Z – claude – shell_pid=38494 – lane=doing – Completed implementation
- 2025-11-22T18:35:00Z – claude – shell_pid=38494 – lane=for_review – Ready for review
- 2025-11-22T18:45:00Z – claude – shell_pid=38494 – lane=done – Review completed: APPROVED

## Objective

Set up the exercise_schedules table and data infrastructure for the Weekly Exercise Planner feature. This includes creating the Supabase schema, RLS policies, indexes, and validating the setup with sample data.

## Context

This is the foundational work package that must be completed before any Legend State sync or UI development can begin. The weekly exercise planner requires a junction table to store many-to-many relationships between users, exercises, and days of the week.

**Key Requirements:**
- Exercise assignments must be isolated per user (RLS security)
- Support multiple exercises per day with ordering
- Prevent duplicate exercise assignments to the same day
- Efficient querying for weekly plan retrieval

## Detailed Implementation Guide

### T001: Create Supabase Migration for exercise_schedules Table

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_exercise_schedules.sql`

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
```

**Validation**: Run `supabase db push` and verify table creation

### T002: Set up RLS Policies and Performance Indexes

**File**: Same migration file, add after table creation:

```sql
-- Enable RLS
ALTER TABLE exercise_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own schedules
CREATE POLICY "Users can manage their own exercise schedules" ON exercise_schedules
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX exercise_schedules_user_day_idx ON exercise_schedules(user_id, day_of_week);
CREATE INDEX exercise_schedules_exercise_idx ON exercise_schedules(exercise_id);
CREATE INDEX exercise_schedules_user_idx ON exercise_schedules(user_id);
```

**Validation**: Test policies with different user contexts

### T003: Create Database Update Trigger

**File**: Same migration file, add trigger:

```sql
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

**Validation**: Test that updated_at changes on record updates

### T004: Install react-native-calendars Dependency

**Command**: `npm install react-native-calendars`

**Validation**: 
- Verify package.json includes react-native-calendars
- Check that import works: `import { Calendar } from 'react-native-calendars'`

### T005: Test Database Schema with Sample Data

**File**: `supabase/seed.sql` or manual testing

```sql
-- Test data insertion (replace with actual user/exercise IDs)
INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week, order_index) 
VALUES 
  (auth.uid(), (SELECT id FROM exercises LIMIT 1), 1, 0),  -- Monday
  (auth.uid(), (SELECT id FROM exercises LIMIT 1), 3, 0);  -- Wednesday

-- Verify data retrieval
SELECT es.*, e.name as exercise_name 
FROM exercise_schedules es 
JOIN exercises e ON es.exercise_id = e.id 
WHERE es.user_id = auth.uid();

-- Test unique constraint
-- This should fail:
INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week) 
VALUES (auth.uid(), (SELECT id FROM exercises LIMIT 1), 1);

-- Clean up test data
DELETE FROM exercise_schedules WHERE user_id = auth.uid();
```

## Test Strategy

**Unit Tests**: Database constraints and triggers
**Integration Tests**: RLS policies with multiple users  
**Contract Tests**: Table schema matches TypeScript interfaces

## Definition of Done

- [x] Supabase migration runs successfully without errors
- [x] exercise_schedules table created with correct schema
- [x] RLS policies prevent cross-user data access
- [x] Indexes improve query performance for weekly plan retrieval
- [x] Update trigger modifies updated_at field on changes
- [x] react-native-calendars dependency installed and importable
- [x] Sample data can be inserted, queried, and deleted
- [x] Unique constraint prevents duplicate assignments
- [x] Cascade deletes work when user or exercise is removed

## Risks & Dependencies

**Risks:**
- Migration conflicts if exercise table schema has changed
- Performance impact without proper indexing
- RLS policy too restrictive or too permissive

**Dependencies:**
- Existing exercises table and auth.users table
- Supabase CLI setup and database connection

## Reviewer Guidance

**Verify:**
1. Migration runs cleanly on fresh database
2. RLS policies tested with multiple user accounts
3. Performance indexes cover common query patterns
4. Constraint violations handled gracefully
5. react-native-calendars imports without errors