---
work_package_id: WP04
title: Core Set Logging - User Story 1
lane: "doing"
subtasks:
  - T014: Write Maestro test for complete set logging flow
  - T015: Create weight input component
  - T016: Create reps input component
  - T017: Create RPE slider component
  - T018: Create set logging form container
  - T019: Implement Supabase create workout set function
  - T020: Implement form default values from Legend State
priority: High
dependencies: WP02, WP03
agent: "claude"
shell_pid: "11132"
history:
  - created: 2025-11-18
    author: Claude
    notes: Core user story for set logging in under 15 seconds
---

# WP04: Core Set Logging - User Story 1

## Objective

Enable complete workout set logging (weight, reps, RPE) in under 15 seconds with smart defaults and immediate persistence. This is the primary user-facing feature.

## Context

**User Story**: "Sarah logs a bench press set: 135 lbs, 8 reps, RPE 7.0. The form pre-fills with her last set's weight/reps, she adjusts RPE, taps Log Set, and immediately sees it in her session history with the form reset and ready for the next set."

**Performance Target**: Complete logging flow in <15 seconds

## Detailed Guidance

### T014: Write Maestro test for complete set logging flow
**File**: `.maestro/workout/log-set.yaml`

```yaml
appId: com.strengthassistant.app
---
- launchApp
- assertVisible: "Workout"

# Navigate to workout screen with exercise selected  
- tapOn: "Bench Press"
- assertVisible: "Log Set"

# Test complete set logging flow
- tapOn:
    id: "weight-input"
- inputText: "135"

- tapOn:
    id: "reps-input"  
- inputText: "8"

- tapOn:
    id: "rpe-slider"
- dragFromTo:
    from:
      id: "rpe-slider-handle"
    to:
      x: 70% # Approximate RPE 7.0 position
      
- tapOn: "Log Set"

# Verify set appears in history
- assertVisible: "Set 1: 135 lbs x 8 reps @ 7.0 RPE"

# Verify form resets with smart defaults  
- assertVisible:
    id: "weight-input"
    text: "135"
- assertVisible:
    id: "reps-input" 
    text: "8"
- assertVisible:
    id: "rpe-slider"
    text: ""
```

### T015: Create weight input component
**File**: `lib/components/WeightInput.tsx`

```typescript
import { Controller } from 'react-hook-form';
import { TextInput } from 'react-native-paper';

interface WeightInputProps {
  control: Control<WorkoutSetFormData>;
  error?: FieldError;
}

export function WeightInput({ control, error }: WeightInputProps) {
  return (
    <Controller
      control={control}
      name="weight"
      render={({ field: { onChange, value } }) => (
        <TextInput
          testID="weight-input"
          mode="outlined"
          label="Weight (lbs)"
          value={value?.toString() || ''}
          onChangeText={(text) => {
            const numValue = parseFloat(text);
            onChange(isNaN(numValue) ? 0 : numValue);
          }}
          error={!!error}
          keyboardType="decimal-pad"
          autoComplete="off"
          selectTextOnFocus
          style={{ marginBottom: 8 }}
        />
      )}
    />
  );
}
```

### T016: Create reps input component
**File**: `lib/components/RepsInput.tsx`

Similar to WeightInput but integer-only with appropriate validation.

### T017: Create RPE slider component  
**File**: `lib/components/RPESlider.tsx`

```typescript
import { Controller } from 'react-hook-form';
import { Text } from 'react-native-paper';
import { Slider } from '@react-native-community/slider';

export function RPESlider({ control, error }: RPESliderProps) {
  return (
    <Controller
      control={control}
      name="rpe"
      render={({ field: { onChange, value } }) => (
        <View>
          <Text>RPE: {value || '—'}</Text>
          <Slider
            testID="rpe-slider"
            minimumValue={1.0}
            maximumValue={10.0}
            step={0.5}
            value={value || 5.0}
            onValueChange={onChange}
            thumbStyle={{ backgroundColor: '#6200ee' }}
            trackStyle={{ backgroundColor: '#6200ee20' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>1</Text>
            <Text>10</Text>
          </View>
        </View>
      )}
    />
  );
}
```

### T018: Create set logging form container
**File**: `lib/components/WorkoutSetForm.tsx`

Integrate all components with form submission:

```typescript
export function WorkoutSetForm({ exerciseId, onSetLogged }: Props) {
  const lastSet = useWorkoutSetStore(s => s.currentSession.lastSet);
  const { control, handleSubmit, reset, formState } = useWorkoutSetForm({
    lastSet: lastSet ? { weight: lastSet.weight, repetitions: lastSet.repetitions } : undefined,
    onSubmit: async (data) => {
      await createWorkoutSet({ ...data, exercise_id: exerciseId });
      onSetLogged();
      reset(getDefaultValues(lastSet)); // Reset with new defaults
    }
  });

  return (
    <Card style={{ padding: 16 }}>
      <WeightInput control={control} error={formState.errors.weight} />
      <RepsInput control={control} error={formState.errors.repetitions} />  
      <RPESlider control={control} error={formState.errors.rpe} />
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={!formState.isValid || formState.isSubmitting}
        loading={formState.isSubmitting}
        style={{ marginTop: 16 }}
      >
        Log Set
      </Button>
    </Card>
  );
}
```

### T019: Implement Supabase create workout set function
**File**: `lib/repo/supabase/workoutSets.ts`

```typescript
export async function createWorkoutSet(data: CreateWorkoutSetRequest): Promise<WorkoutSet> {
  const setOrder = await getNextSetOrder(data.exercise_id, data.session_date);
  
  const { data: newSet, error } = await supabase
    .from('workout_sets')
    .insert({
      ...data,
      set_order: setOrder,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create workout set: ${error.message}`);
  
  // Update local store
  workoutSetActions.addSet(newSet);
  
  return newSet;
}
```

### T020: Implement form default values from Legend State
Connect form defaults to reactive store values for 50% input time reduction.

## Definition of Done

- [ ] User can log complete set in <15 seconds
- [ ] Maestro test passes for full user flow
- [ ] Form components work with React Native Paper
- [ ] Smart defaults reduce input time by 50%
- [ ] Sets persist to Supabase immediately
- [ ] Form resets with new defaults after submission

## Testing Strategy

**Integration Testing**: Maestro test covers complete user journey
**Performance Testing**: Measure total time from form focus to set visible in history
**Usability Testing**: Verify form feels responsive and intuitive

## Risk Mitigation

**Risk**: Performance below 15-second target
**Mitigation**: Profile form operations, optimize validation and submission

**Risk**: RPE slider difficult to use accurately  
**Mitigation**: User testing of slider sensitivity and visual feedback

## Dependencies

**Requires**: WP02 (validation), WP03 (state management)

## Activity Log

- 2025-11-19T21:20:25Z – claude – shell_pid=11132 – lane=doing – Started implementation of core set logging with React Native Paper components
