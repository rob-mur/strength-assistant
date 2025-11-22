# Quickstart Guide: Weekly Exercise Planner

**Feature**: Weekly Exercise Planner  
**Last Updated**: 2025-11-22  
**Estimated Setup Time**: 10 minutes

## Prerequisites

- React Native/Expo development environment set up
- Supabase project configured and connected
- Existing exercises functionality working
- Legend State sync system operational

## Quick Setup

### 1. Install Dependencies

```bash
npm install react-native-calendars
```

### 2. Database Setup

Run the following SQL migration in your Supabase SQL editor:

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
  
  UNIQUE(user_id, exercise_id, day_of_week)
);

-- Enable RLS
ALTER TABLE exercise_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own exercise schedules" ON exercise_schedules
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX exercise_schedules_user_day_idx ON exercise_schedules(user_id, day_of_week);
CREATE INDEX exercise_schedules_exercise_idx ON exercise_schedules(exercise_id);

-- Update trigger
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

### 3. Test Database Setup

Verify the table was created correctly:

```sql
-- Test data insertion
INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week, order_index) 
VALUES (
  (SELECT auth.uid()), 
  (SELECT id FROM exercises LIMIT 1), 
  1, -- Monday
  0
);

-- Verify data
SELECT * FROM exercise_schedules;

-- Clean up test data
DELETE FROM exercise_schedules WHERE id IN (SELECT id FROM exercise_schedules LIMIT 1);
```

## Feature Validation

### Test Scenario 1: View Weekly Calendar

**Goal**: Verify the home screen shows a weekly calendar interface

**Steps**:
1. Open the app
2. Navigate to the home screen
3. Check if the weekly planner component is visible

**Expected Result**: 
- If user has exercises: WeeklyPlannerCard component is displayed
- If user has no exercises: GettingStartedCard is displayed
- Current day is highlighted

**Acceptance Criteria**:
```gherkin
Given user opens the home screen
When they view the weekly planner
Then they see 7 days of the week clearly labeled (Monday through Sunday)
And the current day is visually highlighted
```

### Test Scenario 2: Assign Exercise to Day

**Goal**: Verify users can assign exercises to specific days

**Steps**:
1. Ensure user has at least one exercise created
2. Tap on any day in the weekly calendar
3. Select an exercise from the list
4. Confirm the assignment

**Expected Result**:
- Exercise assignment interface opens when day is tapped
- User can select from their existing exercises
- Exercise appears on the selected day after assignment
- Assignment persists across app sessions

**Acceptance Criteria**:
```gherkin
Given user taps on Monday
When the exercise selection interface opens
Then they can choose from their existing exercises to assign to that day
And when they return to the weekly view
Then Monday shows the assigned exercises clearly
```

### Test Scenario 3: Start Workout from Plan

**Goal**: Verify users can navigate to workout recording from the weekly plan

**Steps**:
1. Assign at least one exercise to today
2. Tap on today's plan entry
3. Verify navigation to workout screen

**Expected Result**:
- Tapping on a day with exercises navigates to workout screen
- Assigned exercises are available/pre-loaded for the workout

**Acceptance Criteria**:
```gherkin
Given user has exercises assigned to today
When they tap on today's plan
Then they are taken to the workout screen to begin recording
```

## Performance Validation

### Load Time Test

**Target**: Home screen loads in under 3 seconds

**Test**:
```bash
# Run on physical device
npm run start
# Navigate to home screen and measure load time
```

**Acceptance**: First render completes within 3000ms

### Assignment Speed Test

**Target**: Exercise assignment completes in under 30 seconds

**Test**:
1. Start timer when tapping a day
2. Stop timer when exercise appears on the day
3. Measure end-to-end time

**Acceptance**: Complete workflow under 30 seconds

### Offline Test

**Target**: Feature works offline with sync when online

**Test**:
1. Turn on airplane mode
2. Assign exercises to days
3. Turn off airplane mode
4. Verify changes sync to Supabase

**Acceptance**: Changes persist and sync correctly

## Troubleshooting

### Database Issues

**Problem**: `relation "exercise_schedules" does not exist`
**Solution**: Run the SQL migration script in Supabase SQL editor

**Problem**: RLS policy errors
**Solution**: Ensure user is authenticated and RLS is enabled

### Sync Issues

**Problem**: Changes not syncing to Supabase
**Solution**: 
1. Check network connectivity
2. Verify Supabase connection
3. Check Legend State sync configuration
4. Look for console errors

### UI Issues

**Problem**: Calendar not rendering correctly
**Solution**:
1. Verify `react-native-calendars` is installed
2. Check for style conflicts with React Native Paper
3. Ensure proper theme configuration

## Success Metrics

- ✅ Database table created and accessible
- ✅ Weekly calendar displays on home screen
- ✅ Exercise assignment workflow functional
- ✅ Data persists across app sessions
- ✅ Real-time sync working (changes appear immediately)
- ✅ Performance targets met (3s load, 30s assignment)
- ✅ Offline functionality operational

## Next Steps

After completing this quickstart:

1. **Enhanced UI**: Add animations, improved styling
2. **Advanced Features**: Recurring patterns, workout templates
3. **Analytics**: Track adherence metrics and success rates
4. **Social Features**: Share weekly plans, workout accountability

## Support

- Check existing exercise functionality works first
- Verify Supabase RLS policies and authentication
- Test Legend State sync with existing exercises
- Use browser dev tools to debug sync issues
- Check console for error messages during assignment workflow