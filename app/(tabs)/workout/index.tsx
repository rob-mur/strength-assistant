import { useRouter, useLocalSearchParams } from "expo-router";
import { Card, FAB, Surface } from "react-native-paper";
import { View } from "react-native";
import EmptyWorkoutState from "../../../lib/components/EmptyWorkoutState";

// Route constants for better navigation management
const ROUTES = {
  EXERCISES: "/(tabs)/exercises",
  ADD_EXERCISE: "/(tabs)/exercises/add",
  LOG_SET: "/(tabs)/workout/log-set",
} as const;

interface WorkoutScreenProps {
  selectedExercise?: string | null;
}

export default function WorkoutScreen({
  selectedExercise = null,
}: WorkoutScreenProps) {
  const router = useRouter();
  const exerciseSearchParam = useLocalSearchParams().exercise;

  const exercise = selectedExercise ?? exerciseSearchParam;
  const showEmptyState = !exercise;

  // Navigation handlers for empty state with error handling
  const handleSelectExercise = () => {
    try {
      router.navigate(ROUTES.EXERCISES);
    } catch (error) {
      console.error("Failed to navigate to exercises screen:", error);
      // Fallback navigation attempt
      router.navigate("../exercises");
    }
  };

  const handleCreateExercise = () => {
    try {
      router.navigate(ROUTES.ADD_EXERCISE);
    } catch (error) {
      console.error("Failed to navigate to add exercise screen:", error);
      // Fallback navigation attempt
      router.navigate("./add");
    }
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Surface elevation={0} style={{ padding: 16 }}>
        {showEmptyState ? (
          <EmptyWorkoutState
            onSelectExercise={handleSelectExercise}
            onCreateExercise={handleCreateExercise}
            testID="empty-workout-state"
          />
        ) : (
          <Card testID="workout-exercise-card">
            <Card.Title title={exercise} />
          </Card>
        )}
      </Surface>
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon={exercise ? "dumbbell" : "plus"}
        label={exercise ? "Log Set" : "Add Exercise"}
        testID={exercise ? "log-set-fab" : "add-exercise-fab"}
        onPress={() => {
          if (exercise) {
            // Exercise is selected - navigate to log workout set
            try {
              router.navigate({
                pathname: ROUTES.LOG_SET,
                params: {
                  exerciseId: exercise, // In real app this should be an ID
                  exerciseName: exercise,
                },
              });
            } catch (error) {
              console.error("Failed to navigate to log set screen:", error);
              router.navigate("./log-set");
            }
          } else {
            // No exercise selected - navigate to add exercise
            try {
              router.navigate(ROUTES.ADD_EXERCISE);
            } catch (error) {
              console.error(
                "Failed to navigate to add exercise screen:",
                error,
              );
              router.navigate("../exercises/add");
            }
          }
        }}
      />
    </View>
  );
}
