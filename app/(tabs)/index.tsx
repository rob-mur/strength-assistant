import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { WeeklyPlannerCard } from '@/lib/components/Cards/WeeklyPlannerCard';
import { DayAssignmentModal } from '@/lib/components/Modals/DayAssignmentModal';
import { useWeeklyPlanner } from '@/lib/hooks/useWeeklyPlanner';
import { useExercises } from '@/lib/hooks/useExercises';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Locales } from '@/lib/locales';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { exercises } = useExercises(user?.uid || '');
  const {
    weeklyPlan,
    selectedDay,
    calendarExpanded,
    assignExerciseToDay,
    removeExerciseFromDay,
    selectDay,
    toggleCalendar,
    getDayPlan,
    hasAnyExercises,
    // error,
  } = useWeeklyPlanner();

  const handleDayPress = (dayOfWeek: number) => {
    selectDay(dayOfWeek);
  };

  const handleAssignExercise = async (exerciseId: string) => {
    if (selectedDay === null) return;
    
    try {
      await assignExerciseToDay(exerciseId, selectedDay);
    } catch {
      // Error already handled in hook, could show toast here
    }
  };

  const handleRemoveExercise = async (scheduleId: string) => {
    try {
      await removeExerciseFromDay(scheduleId);
    } catch {
      // Error already handled in hook
    }
  };

  const selectedDayPlan = selectedDay !== null ? getDayPlan(selectedDay) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {hasAnyExercises ? (
        <WeeklyPlannerCard
          weeklyPlan={weeklyPlan}
          expanded={calendarExpanded}
          onToggleExpanded={toggleCalendar}
          onDayPress={handleDayPress}
          style={styles.plannerCard}
        />
      ) : (
        <GettingStartedCard
          content={Locales.t("getStartedMessage")}
          call_to_action={Locales.t("getStartedCallToAction")}
          on_get_started={() => router.navigate("./exercises")}
        />
      )}

      <DayAssignmentModal
        visible={selectedDay !== null}
        selectedDay={selectedDay}
        dayPlan={selectedDayPlan}
        availableExercises={exercises}
        onClose={() => selectDay(null)}
        onAssignExercise={handleAssignExercise}
        onRemoveExercise={handleRemoveExercise}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  plannerCard: {
    marginBottom: 16,
  },
});
