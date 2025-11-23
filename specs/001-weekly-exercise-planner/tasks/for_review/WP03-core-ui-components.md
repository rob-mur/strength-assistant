# WP03: Core UI Components

**work_package_id**: WP03  
**lane**: for_review  
**priority**: P2  
**subtasks**: [T011, T012, T013, T014, T015, T016, T017, T018]

## History
- 2025-11-22: Created during task generation phase
- 2025-11-22T22:00:00Z – claude – shell_pid=52950 – lane=doing – Started implementation
- 2025-11-22T22:45:00Z – claude – shell_pid=52950 – lane=doing – Completed implementation and testing

## Objective

Build the calendar and exercise assignment interface components using react-native-calendars and React Native Paper design system. These components should work independently with mock data for parallel development.

## Context

Create reusable UI components that will be integrated into the home screen. Components must follow React Native Paper theming and work smoothly on both iOS and Android. Focus on user experience with clear visual distinctions and intuitive interactions.

**Key Requirements:**
- Use react-native-calendars ExpandableCalendar
- Match React Native Paper design system
- Visual distinction between workout/rest days
- Current day highlighting
- Smooth interactions and animations
- Accessibility support

## Detailed Implementation Guide

### T011: Create WeeklyPlannerCard Component

**File**: `lib/components/Cards/WeeklyPlannerCard.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, IconButton } from 'react-native-paper';
import { CalendarView } from '../Calendar/CalendarView';
import type { WeeklyPlan } from '../../models/ExerciseSchedule';

interface WeeklyPlannerCardProps {
  weeklyPlan: WeeklyPlan;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDayPress: (dayOfWeek: number) => void;
  style?: any;
}

export const WeeklyPlannerCard: React.FC<WeeklyPlannerCardProps> = ({
  weeklyPlan,
  expanded,
  onToggleExpanded,
  onDayPress,
  style,
}) => {
  return (
    <Card style={[styles.card, style]}>
      <Card.Title 
        title="Weekly Exercise Plan"
        right={(props) => (
          <IconButton
            {...props}
            icon={expanded ? "chevron-up" : "chevron-down"}
            onPress={onToggleExpanded}
          />
        )}
      />
      <Card.Content>
        {expanded && (
          <CalendarView
            weeklyPlan={weeklyPlan}
            onDayPress={onDayPress}
          />
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
});
```

### T012: Implement CalendarView with react-native-calendars

**File**: `lib/components/Calendar/CalendarView.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ExpandableCalendar, CalendarProvider } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';
import type { WeeklyPlan } from '../../models/ExerciseSchedule';

interface CalendarViewProps {
  weeklyPlan: WeeklyPlan;
  selectedDay?: number | null;
  onDayPress: (dayOfWeek: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  weeklyPlan,
  selectedDay,
  onDayPress,
}) => {
  const theme = useTheme();
  const today = new Date();
  const currentDateString = today.toISOString().split('T')[0];

  // Convert dayOfWeek (0-6) to date strings for current week
  const getDateStringForDay = (dayOfWeek: number) => {
    const date = new Date(today);
    const currentDay = date.getDay(); // 0=Sunday
    const difference = dayOfWeek - currentDay;
    date.setDate(date.getDate() + difference);
    return date.toISOString().split('T')[0];
  };

  // Create marked dates for days with exercises
  const markedDates = weeklyPlan.days.reduce((acc, day) => {
    const dateString = getDateStringForDay(day.dayOfWeek);
    
    acc[dateString] = {
      marked: day.hasExercises,
      selectedColor: day.hasExercises ? theme.colors.primary : undefined,
      selected: selectedDay === day.dayOfWeek,
    };
    
    return acc;
  }, {} as any);

  // Highlight today
  markedDates[currentDateString] = {
    ...markedDates[currentDateString],
    selected: true,
    selectedColor: theme.colors.surface,
    selectedTextColor: theme.colors.primary,
  };

  const handleDayPress = (day: any) => {
    const pressedDate = new Date(day.dateString);
    const dayOfWeek = pressedDate.getDay();
    onDayPress(dayOfWeek);
  };

  return (
    <CalendarProvider date={currentDateString}>
      <ExpandableCalendar
        firstDay={1} // Monday
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: theme.colors.surface,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurface,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.disabled,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />
    </CalendarProvider>
  );
};
```

### T013: Create DayAssignmentModal

**File**: `lib/components/Modals/DayAssignmentModal.tsx`

```typescript
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { 
  Modal, 
  Portal, 
  Title, 
  List, 
  FAB, 
  Divider,
  Button 
} from 'react-native-paper';
import type { Exercise } from '../../models/Exercise';
import type { DayPlan } from '../../models/ExerciseSchedule';

interface DayAssignmentModalProps {
  visible: boolean;
  selectedDay: number | null;
  dayPlan: DayPlan | null;
  availableExercises: Exercise[];
  onClose: () => void;
  onAssignExercise: (exerciseId: string) => void;
  onRemoveExercise: (scheduleId: string) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DayAssignmentModal: React.FC<DayAssignmentModalProps> = ({
  visible,
  selectedDay,
  dayPlan,
  availableExercises,
  onClose,
  onAssignExercise,
  onRemoveExercise,
}) => {
  if (selectedDay === null || !dayPlan) return null;

  const dayName = DAY_NAMES[selectedDay];
  const assignedExerciseIds = new Set(dayPlan.exercises.map(e => e.exerciseId));
  const unassignedExercises = availableExercises.filter(
    exercise => !assignedExerciseIds.has(exercise.id)
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        <Title>{dayName} Exercises</Title>
        
        <ScrollView style={styles.scrollView}>
          {/* Currently assigned exercises */}
          {dayPlan.exercises.length > 0 && (
            <>
              <List.Subheader>Assigned Exercises</List.Subheader>
              {dayPlan.exercises.map((exercise) => (
                <List.Item
                  key={exercise.scheduleId}
                  title={exercise.exerciseName}
                  right={(props) => (
                    <List.Icon 
                      {...props} 
                      icon="delete" 
                      onPress={() => onRemoveExercise(exercise.scheduleId)}
                    />
                  )}
                />
              ))}
              <Divider />
            </>
          )}

          {/* Available exercises to assign */}
          {unassignedExercises.length > 0 && (
            <>
              <List.Subheader>Available Exercises</List.Subheader>
              {unassignedExercises.map((exercise) => (
                <List.Item
                  key={exercise.id}
                  title={exercise.name}
                  right={(props) => (
                    <List.Icon 
                      {...props} 
                      icon="plus" 
                      onPress={() => onAssignExercise(exercise.id)}
                    />
                  )}
                />
              ))}
            </>
          )}

          {unassignedExercises.length === 0 && (
            <List.Item
              title="All exercises assigned"
              description="Create new exercises to add more to this day"
            />
          )}
        </ScrollView>

        <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
          Done
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  scrollView: {
    marginVertical: 16,
  },
  closeButton: {
    marginTop: 16,
  },
});
```

### T014: Add Current Day Highlighting Logic

**Implementation**: Already included in T012 CalendarView component

**Validation**: 
- Verify today's date is highlighted differently
- Test across day boundaries (midnight transitions)
- Check highlighting persists when calendar is expanded/collapsed

### T015: Implement Visual Distinction for Workout/Rest Days

**Implementation**: Already included in T012 with marked dates

**Enhancement in CalendarView**:
```typescript
// Add to markedDates logic
acc[dateString] = {
  marked: day.hasExercises,
  dotColor: day.hasExercises ? theme.colors.primary : 'transparent',
  selectedColor: day.hasExercises ? theme.colors.primary : theme.colors.surface,
  // Add custom styling for rest days
  textColor: day.hasExercises ? theme.colors.onPrimary : theme.colors.onSurface,
};
```

### T016-T017: Exercise Assignment UI (Already in T013)

The DayAssignmentModal handles both assignment (T016) and removal/reordering (T017).

### T018: Apply React Native Paper Theming

**File**: Update all components to use theme

```typescript
// In each component, add:
import { useTheme } from 'react-native-paper';

const MyComponent = () => {
  const theme = useTheme();
  
  // Use theme colors:
  // theme.colors.primary
  // theme.colors.surface  
  // theme.colors.onSurface
  // theme.colors.background
};
```

**Create theme extensions if needed**:

**File**: `lib/theme/weeklyPlannerTheme.ts`

```typescript
export const weeklyPlannerTheme = {
  colors: {
    workoutDay: '#4CAF50',
    restDay: '#9E9E9E', 
    currentDay: '#2196F3',
  }
};
```

## Testing Strategy

**Component Tests**: Each component renders correctly with mock data
**Interaction Tests**: Buttons and gestures work as expected  
**Theme Tests**: Components adapt to different themes
**Accessibility Tests**: Screen reader compatibility

**Mock Data for Testing**:

```typescript
export const mockWeeklyPlan: WeeklyPlan = {
  userId: 'user-1',
  days: [
    { dayOfWeek: 0, exercises: [], hasExercises: false }, // Sunday
    { dayOfWeek: 1, exercises: [{ scheduleId: '1', exerciseId: 'ex-1', exerciseName: 'Push-ups', orderIndex: 0 }], hasExercises: true }, // Monday
    // ... rest of week
  ]
};

export const mockExercises: Exercise[] = [
  { id: 'ex-1', name: 'Push-ups', userId: 'user-1' },
  { id: 'ex-2', name: 'Squats', userId: 'user-1' },
];
```

## Definition of Done

- [x] WeeklyPlannerCard component renders with expand/collapse
- [x] CalendarView shows 7 days with current day highlighted  
- [x] Days with exercises visually distinct from rest days
- [x] DayAssignmentModal allows exercise assignment and removal
- [x] All components follow React Native Paper design system
- [x] Components work with mock data (no Legend State dependency)
- [x] Responsive design works on different screen sizes
- [x] Accessibility labels and hints added
- [x] Smooth animations for expand/collapse and modal transitions

## Risks & Dependencies

**Dependencies:**
- react-native-calendars library installed and working
- React Native Paper theme configured in app
- Exercise model types defined

**Risks:**
- Calendar library compatibility with Expo/React Native version
- Performance with large exercise lists
- Modal behavior on different platforms

## Reviewer Guidance

**Verify:**
1. Components render correctly in isolation with mock data
2. Calendar interactions feel responsive and intuitive
3. Modal flows work smoothly (open, assign, remove, close)
4. Visual design matches app's existing style
5. Current day highlighting is accurate
6. Accessibility features work with screen readers
7. No Legend State dependencies (uses props only)