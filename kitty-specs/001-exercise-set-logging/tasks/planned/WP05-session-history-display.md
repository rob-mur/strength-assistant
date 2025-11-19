---
work_package_id: WP05
title: Session History and Display - User Story 2
lane: planned
subtasks:
  - T021: Create session history list component
  - T022: Implement Supabase get workout sets with filters
  - T023: Integrate form and history components into workout screen
priority: High
dependencies: WP04
history:
  - created: 2025-11-18
    author: Claude
    notes: Display today's workout sets by default with proper ordering
---

# WP05: Session History and Display - User Story 2

## Objective

Display all logged sets for today's session by default with chronological ordering. Users should see their progress immediately without navigation.

## Context

**User Story**: "After logging 2 sets, user sees both sets listed chronologically with clear identification (Set 1, Set 2) without needing to navigate elsewhere."

## Detailed Guidance

### T021: Create session history list component
**File**: `lib/components/SessionHistoryList.tsx`

```typescript
export function SessionHistoryList({ exerciseId, sessionDate }: Props) {
  const sets = useWorkoutSetStore(s => 
    Object.values(s.sets).filter(set => 
      set.exercise_id === exerciseId && 
      set.session_date === sessionDate
    ).sort((a, b) => b.created_at.localeCompare(a.created_at)) // Newest first
  );

  return (
    <View>
      <Text variant="titleMedium">Today's Sets</Text>
      {sets.map((set, index) => (
        <Card key={set.id} style={{ marginVertical: 4 }}>
          <Card.Content>
            <Text variant="bodyLarge">
              Set {sets.length - index}: {set.weight} lbs × {set.repetitions} reps @ {set.rpe} RPE
            </Text>
            <Text variant="bodySmall" style={{ color: 'gray' }}>
              {formatTime(set.created_at)}
            </Text>
          </Card.Content>
        </Card>
      ))}
      
      {sets.length === 0 && (
        <Text style={{ textAlign: 'center', color: 'gray', marginTop: 20 }}>
          No sets logged yet. Start your first set above!
        </Text>
      )}
    </View>
  );
}
```

### T022: Implement Supabase get workout sets with filters
**File**: `lib/repo/supabase/workoutSets.ts`

```typescript
export async function getWorkoutSets(filters: {
  exerciseId?: string;
  sessionDate?: string;
  userId?: string;
}): Promise<WorkoutSet[]> {
  let query = supabase
    .from('workout_sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.exerciseId) {
    query = query.eq('exercise_id', filters.exerciseId);
  }
  
  if (filters.sessionDate) {
    query = query.eq('session_date', filters.sessionDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch workout sets: ${error.message}`);
  
  return data || [];
}
```

### T023: Integrate components into workout screen
**File**: `app/(tabs)/workout.tsx`

Combine form and history for complete workout interface:

```typescript
export default function WorkoutScreen() {
  const exerciseId = useCurrentExercise(); // Assume exercise already selected
  const today = new Date().toISOString().split('T')[0];
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text variant="headlineMedium">Bench Press</Text>
      
      <WorkoutSetForm
        exerciseId={exerciseId}
        onSetLogged={() => setRefreshKey(k => k + 1)} // Refresh history
      />
      
      <Divider style={{ marginVertical: 20 }} />
      
      <SessionHistoryList
        key={refreshKey} // Force refresh after new set
        exerciseId={exerciseId}
        sessionDate={today}
      />
    </ScrollView>
  );
}
```

## Definition of Done

- [ ] Today's sets display by default without navigation
- [ ] Sets show in chronological order (newest first)  
- [ ] Clear set identification (Set 1, Set 2, etc.)
- [ ] History updates immediately after logging new set
- [ ] Empty state shows helpful message
- [ ] Performance good with 20+ sets in session

## Risk Mitigation

**Risk**: Performance issues with large set counts
**Mitigation**: Pagination and virtualization for 50+ sets

**Risk**: State sync issues between form and history
**Mitigation**: Proper reactive state management with Legend State

## Dependencies

**Requires**: WP04 (Core Set Logging)