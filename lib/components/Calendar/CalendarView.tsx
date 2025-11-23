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
      dotColor: day.hasExercises ? theme.colors.primary : 'transparent',
      selectedColor: day.hasExercises ? theme.colors.primary : theme.colors.surface,
      textColor: day.hasExercises ? theme.colors.onPrimary : theme.colors.onSurface,
      selected: selectedDay === day.dayOfWeek,
    };
    
    return acc;
  }, {} as any);

  // Highlight today with special styling
  const todayDayOfWeek = today.getDay();
  const todayPlan = weeklyPlan.days[todayDayOfWeek];
  markedDates[currentDateString] = {
    ...markedDates[currentDateString],
    selected: selectedDay === todayDayOfWeek || selectedDay === null,
    selectedColor: todayPlan?.hasExercises ? theme.colors.primary : theme.colors.surface,
    selectedTextColor: todayPlan?.hasExercises ? theme.colors.onPrimary : theme.colors.primary,
    marked: todayPlan?.hasExercises || false,
    dotColor: todayPlan?.hasExercises ? theme.colors.onPrimary : 'transparent',
  };

  const handleDayPress = (day: any) => {
    const pressedDate = new Date(day.dateString);
    const dayOfWeek = pressedDate.getDay();
    onDayPress(dayOfWeek);
  };

  return (
    <View style={styles.container} testID="calendar-view">
      <CalendarProvider date={currentDateString}>
        <ExpandableCalendar
          firstDay={1} // Monday
          markedDates={markedDates}
          onDayPress={handleDayPress}
          testID="expandable-calendar"
          theme={{
            backgroundColor: theme.colors.surface,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.onSurface,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.onPrimary,
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.onSurface,
            textDisabledColor: theme.colors.onSurfaceVariant,
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.onSurface,
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
          }}
          markingType="dot"
        />
      </CalendarProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});