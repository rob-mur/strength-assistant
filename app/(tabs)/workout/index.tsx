import { useRouter, Router, useLocalSearchParams } from "expo-router";
import { FAB } from "react-native-paper";
import { Text } from "react-native";
interface WorkoutScreenProps {
  onAddWorkout: (r: Router) => void;
  selectedExercise: string | null;
}

export default function WorkoutScreen({
  onAddWorkout = (r: Router) => r.navigate("./add"),
  selectedExercise,
}: WorkoutScreenProps) {
  const router = useRouter();
  const exerciseSearchParam = useLocalSearchParams().exercise;

  const exercise = selectedExercise ?? exerciseSearchParam;

  return (
    <div>
      <Text>{exercise}</Text>
      <FAB
        icon="plus"
        testID="add-workout"
        onPress={(_) => onAddWorkout(router)}
      />
    </div>
  );
}
