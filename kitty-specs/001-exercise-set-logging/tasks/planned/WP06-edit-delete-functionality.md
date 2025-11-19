---
work_package_id: WP06
title: Edit and Delete Functionality - User Stories 3 & 5
lane: planned
subtasks:
  - T024: Write Maestro test for edit/delete functionality
  - T025: Create set edit/delete action components
  - T026: Implement Supabase update workout set function
  - T027: Implement Supabase delete workout set function
priority: Medium
dependencies: WP05
history:
  - created: 2025-11-18
    author: Claude
    notes: Enable editing and deleting recently logged sets
---

# WP06: Edit and Delete Functionality

## Objective

Allow users to edit or delete recently logged sets within the current session with optimistic updates for responsive UX.

## Context

**User Stories**: 
- Edit: "User taps edit on recent set, changes weight from 135 to 140, saves successfully"
- Delete: "User accidentally logs wrong set, taps delete, confirms, set removed immediately"

**Constraint**: Edit/delete available within 30 seconds of logging (per requirements)

## Detailed Guidance

### T024: Write Maestro test for edit/delete functionality
**File**: `.maestro/workout/edit-delete-sets.yaml`

```yaml
# Test edit functionality
- tapOn: "Set 1: 135 lbs × 8 reps @ 7.0 RPE"
- tapOn:
    id: "edit-set-button"
- tapOn:
    id: "weight-input"
- clearText
- inputText: "140"
- tapOn: "Save Changes"
- assertVisible: "Set 1: 140 lbs × 8 reps @ 7.0 RPE"

# Test delete functionality  
- tapOn:
    id: "delete-set-button"
- tapOn: "Confirm Delete"
- assertNotVisible: "Set 1: 140 lbs × 8 reps"
```

### T025: Create set edit/delete action components
**File**: `lib/components/SetActions.tsx`

```typescript
export function SetActions({ set, onEdit, onDelete }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (editMode) {
    return (
      <SetEditForm
        set={set}
        onSave={(updatedSet) => {
          onEdit(updatedSet);
          setEditMode(false);
        }}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Set {set.set_order}: {set.weight} lbs × {set.repetitions} reps @ {set.rpe} RPE</Text>
      
      <View style={{ flexDirection: 'row' }}>
        <IconButton
          testID="edit-set-button"
          icon="pencil"
          size={16}
          onPress={() => setEditMode(true)}
        />
        <IconButton
          testID="delete-set-button"  
          icon="delete"
          size={16}
          onPress={() => setShowDeleteDialog(true)}
        />
      </View>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Set</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this set?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={() => {
              onDelete(set.id);
              setShowDeleteDialog(false);
            }}>Confirm Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
```

### T026: Implement Supabase update workout set function
**File**: `lib/repo/supabase/workoutSets.ts`

```typescript
export async function updateWorkoutSet(
  id: string, 
  updates: UpdateWorkoutSetRequest
): Promise<WorkoutSet> {
  // Optimistic update in local store first
  const currentSet = workoutSetStore.sets[id].get();
  const optimisticSet = { ...currentSet, ...updates, updated_at: new Date().toISOString() };
  workoutSetStore.sets[id].set(optimisticSet);

  try {
    const { data, error } = await supabase
      .from('workout_sets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update with server response
    workoutSetStore.sets[id].set(data);
    return data;
  } catch (error) {
    // Revert optimistic update on error
    workoutSetStore.sets[id].set(currentSet);
    throw new Error(`Failed to update workout set: ${error.message}`);
  }
}
```

### T027: Implement Supabase delete workout set function
Similar pattern with optimistic deletion and error handling.

## Definition of Done

- [ ] Users can edit sets within current session
- [ ] Users can delete sets with confirmation dialog
- [ ] Optimistic updates provide immediate feedback
- [ ] Changes persist to Supabase correctly
- [ ] Error handling reverts optimistic changes
- [ ] Set numbering updates after deletion

## Dependencies

**Requires**: WP05 (Session History Display)