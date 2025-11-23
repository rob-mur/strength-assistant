import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card, IconButton, useTheme } from 'react-native-paper';
import { CalendarView } from '../Calendar/CalendarView';
import type { WeeklyPlan } from '../../models/ExerciseSchedule';

interface WeeklyPlannerCardProps {
  weeklyPlan: WeeklyPlan;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDayPress: (dayOfWeek: number) => void;
  style?: ViewStyle;
}

export const WeeklyPlannerCard: React.FC<WeeklyPlannerCardProps> = ({
  weeklyPlan,
  expanded,
  onToggleExpanded,
  onDayPress,
  style,
}) => {
  const theme = useTheme();

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