import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
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
    getEmptyStateMessage,
    canAssignExercise,
    error,
  } = useWeeklyPlanner();

  const handleDayPress = (dayOfWeek: number) => {
    selectDay(dayOfWeek);
  };

  const emptyStateMessage = getEmptyStateMessage();

  const handleAssignExercise = async (exerciseId: string) => {
    if (selectedDay === null) return;
    
    // Check if exercise can be assigned
    if (!canAssignExercise(exerciseId, selectedDay)) {
      // Exercise is already assigned, but we don't need to show error
      // as the UI should prevent this
      return;
    }
    
    try {
      await assignExerciseToDay(exerciseId, selectedDay);
    } catch {
      // Error already handled in hook
    }
  };

  const handleRemoveExercise = async (scheduleId: string) => {
    try {
      await removeExerciseFromDay(scheduleId);
    } catch {
      // Error already handled in hook
    }
  };

  const handleStartWorkout = (dayOfWeek: number) => {
    const dayPlan = getDayPlan(dayOfWeek);
    
    if (!dayPlan.hasExercises) return;
    
    // Navigate to workout screen with pre-loaded exercises
    router.push({
      pathname: '/workout',
      params: {
        plannedExercises: JSON.stringify(dayPlan.exercises.map(ex => ex.exerciseId)),
        source: 'weekly-planner',
        day: dayOfWeek.toString(),
      }
    });
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
          onStartWorkout={handleStartWorkout}
          style={styles.plannerCard}
        />
      ) : (
        <GettingStartedCard
          content={emptyStateMessage || Locales.t("getStartedMessage")}
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
        onStartWorkout={handleStartWorkout}
      />
      
      {/* Error display */}
      {error && (
        <Snackbar
          visible={!!error}
          onDismiss={() => {/* Error auto-clears */}}
          duration={5000}
          action={{
            label: 'Dismiss',
            onPress: () => {/* Error auto-clears */},
          }}
        >
          {error}
        </Snackbar>
      )}
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
