# Quickstart: Exercise Set Logging

_Phase 1 Output - User story validation steps_

## Prerequisites

1. React Native development environment setup
2. Supabase project configured with workout_sets table
3. Legend State installed and configured
4. React Native Paper components available
5. User authenticated and exercise already selected

## User Story Validation

### Story 1: Log a Complete Set

**Goal**: User can log weight, reps, and RPE in under 15 seconds

**Steps**:

1. Navigate to workout screen with "Bench Press" selected
2. Enter weight: 135
3. Enter reps: 8
4. Move RPE slider to 7.0
5. Tap "Log Set" button
6. Verify set appears in session history immediately
7. Confirm form resets with weight/reps pre-filled

**Success Criteria**:

- Total time < 15 seconds
- Set visible in session history
- Form shows 135 lbs and 8 reps as defaults
- RPE field is blank/neutral

### Story 2: View Today's Session

**Goal**: User sees all logged sets by default

**Steps**:

1. From previous story, verify 1 set is visible
2. Log another set: 135 lbs, 6 reps, RPE 8.0
3. Verify both sets appear in chronological order
4. Check set numbering (Set 1, Set 2)

**Success Criteria**:

- Both sets visible without navigation
- Proper ordering (newest at top)
- Clear set identification

### Story 3: Edit Recent Set

**Goal**: User can edit logged set within 30 seconds

**Steps**:

1. Immediately after logging set, tap "Edit" on most recent set
2. Change weight from 135 to 140
3. Change RPE from 8.0 to 8.5
4. Save changes
5. Verify updated values in session history

**Success Criteria**:

- Edit action available within 30 seconds
- Changes persist correctly
- No data corruption

### Story 4: View Historical Data

**Goal**: User can access previous workout sessions

**Steps**:

1. Tap "View Previous Sessions" button
2. Navigate to previous date with workout data
3. Verify sets from that session display correctly
4. Return to current session
5. Confirm today's data still visible

**Success Criteria**:

- Historical data accessible
- Navigation works smoothly
- Current session preserved

### Story 5: Delete Accidental Set

**Goal**: User can remove incorrect sets immediately

**Steps**:

1. Log a set with wrong data
2. Tap "Delete" on that set
3. Confirm deletion in modal
4. Verify set removed from session history
5. Check set numbering updates correctly

**Success Criteria**:

- Delete action available immediately
- Confirmation prevents accidents
- Set numbering recalculates

## Validation Tests

### Form Validation

**Test Invalid Inputs**:

- Weight: 0, -5, 3000 → Should show error
- Reps: 0, -1, 150 → Should show error
- RPE: 0, 11, 5.3 → Should show error
- Valid submission only with: weight > 0, reps ≥ 1, RPE 1.0-10.0 (0.5 increments)

**Test Response Time**:

- Validation feedback < 200ms
- Form submission < 1 second
- Session history update immediately

### Offline Capability

**Test Network Issues**:

1. Disconnect network
2. Log multiple sets
3. Verify sets saved locally
4. Reconnect network
5. Confirm automatic sync to Supabase

### Performance

**Test Rapid Entry**:

- Log 10 sets in succession rapidly
- Verify no data loss
- Confirm proper ordering
- Check UI remains responsive

## Integration Points

### Required Services

1. **Supabase Connection**: workout_sets table with RLS policies
2. **Legend State Store**: Local persistence and sync queue
3. **User Authentication**: Valid user session
4. **Exercise Context**: Selected exercise ID available
5. **React Native Paper**: Form components and theming

### Data Flow Validation

1. **Form Input** → Validation → Legend State → UI Update
2. **Legend State** → Sync Queue → Supabase → Confirmation
3. **Session Query** → Legend State + Supabase → Merged Results
4. **Historical Data** → Supabase → Cached in Legend State

## Success Metrics

- **Speed**: Complete set logging in < 15 seconds
- **Reliability**: 95% save success rate
- **Performance**: < 200ms validation feedback
- **Usability**: 50% reduction in input time with defaults
- **Retention**: Target >40% new user completion (3 workouts in 14 days)
