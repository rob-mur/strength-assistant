import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { Card, IconButton, useTheme, Text } from 'react-native-paper';
import { CalendarView } from '../Calendar/CalendarView';
import type { WeeklyPlan } from '../../models/ExerciseSchedule';

interface WeeklyPlannerCardProps {
  weeklyPlan: WeeklyPlan;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDayPress: (dayOfWeek: number) => void;
  onStartWorkout?: (dayOfWeek: number) => void;
  style?: ViewStyle;
}

export const WeeklyPlannerCard: React.FC<WeeklyPlannerCardProps> = ({
  weeklyPlan,
  expanded,
  onToggleExpanded,
  onDayPress,
  onStartWorkout,
  style,
}) => {
  const theme = useTheme();

  const handleDayPress = (dayOfWeek: number) => {
    // Always open assignment modal for now
    onDayPress(dayOfWeek);
  };

  const handleStartWorkout = (dayOfWeek: number) => {
    const dayPlan = weeklyPlan.days[dayOfWeek];
    if (dayPlan.hasExercises && onStartWorkout) {
      onStartWorkout(dayOfWeek);
    }
  };

  return (
    <Card style={[styles.card, style]} testID="weekly-planner-card">
      <Card.Title 
        title="Weekly Exercise Plan"
        titleStyle={{ color: theme.colors.onSurface }}
        right={(props) => (
          <IconButton
            {...props}
            icon={expanded ? "chevron-up" : "chevron-down"}
            iconColor={theme.colors.primary}
            onPress={onToggleExpanded}
            testID="weekly-planner-toggle"
          />
        )}
      />
      <Card.Content>
        {expanded ? (
          <CalendarView
            weeklyPlan={weeklyPlan}
            onDayPress={handleDayPress}
            onStartWorkout={handleStartWorkout}
          />
        ) : (
          <WeeklyPlanSummary weeklyPlan={weeklyPlan} />
        )}
      </Card.Content>
    </Card>
  );
};

const WeeklyPlanSummary: React.FC<{ weeklyPlan: WeeklyPlan }> = ({ weeklyPlan }) => {
  const theme = useTheme();
  const workoutDays = weeklyPlan.days.filter(day => day.hasExercises).length;
  const totalExercises = weeklyPlan.days.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <View style={styles.summaryContainer}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
        {workoutDays} workout days • {totalExercises} exercises planned
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  summaryContainer: {
    padding: 8,
  },
});