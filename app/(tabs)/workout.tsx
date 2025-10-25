import { useRouter, useLocalSearchParams } from "expo-router";
import { Card, FAB, Surface } from "react-native-paper";
import { View } from "react-native";
import EmptyWorkoutState from "../../lib/components/EmptyWorkoutState";

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

  // Navigation handlers for empty state
  const handleSelectExercise = () => {
    router.navigate("../exercises");
  };

  const handleCreateExercise = () => {
    router.navigate("./add");
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
        icon="plus"
        testID="add-workout"
        onPress={(_) => router.navigate("./add")}
      />
    </View>
  );
}
