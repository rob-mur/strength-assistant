# Data Model: Workout Empty State

**Feature**: Workout Empty State Message  
**Date**: 2025-10-25

## Overview

This feature involves UI state management only - no new data entities or persistence requirements.

## State Entities

### WorkoutScreenState

**Purpose**: Represents the current state of the workout screen for empty state handling

**Properties**:
- `selectedExercise`: string | null - Currently selected exercise identifier
- `hasExerciseParam`: boolean - Whether exercise parameter exists in URL/navigation
- `showEmptyState`: boolean - Computed property determining empty state visibility

**State Transitions**:
```
Initial → Empty State (no exercise selected/provided)
Empty State → Exercise Selected (user chooses exercise)
Exercise Selected → Empty State (exercise deselected/cleared)
```

**Validation Rules**:
- `selectedExercise` must be valid exercise identifier when not null
- `showEmptyState` is true when both `selectedExercise` and `hasExerciseParam` are falsy

## Component Props

### EmptyWorkoutStateProps

**Purpose**: Interface for the empty state component

**Properties**:
- `onSelectExercise`: () => void - Callback for navigating to exercise selection
- `onCreateExercise`: () => void - Callback for navigating to exercise creation  
- `style?`: StyleProp<ViewStyle> - Optional custom styling

**Relationships**:
- Consumed by WorkoutScreen component
- Triggers navigation to exercises screen or add screen

## UI State Management

**Current State Source**: 
- Props: `selectedExercise` parameter
- Navigation: `useLocalSearchParams().exercise`

**State Resolution Logic**:
```typescript
const exercise = selectedExercise ?? exerciseSearchParam;
const showEmptyState = !exercise;
```

**No Backend Changes**: This feature only affects frontend UI rendering - no API modifications or database schema changes required.