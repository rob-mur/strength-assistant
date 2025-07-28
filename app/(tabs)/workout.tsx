import { useRouter, Router, useLocalSearchParams } from "expo-router";
import { Card, FAB, Surface } from "react-native-paper";
import { View } from "react-native";
import { Text } from "react-native-paper";
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
    <View style={{ flex: 1, position: "relative" }}>
      <Surface elevation={0} style={{ padding: 16 }}>
        <Card>
          {" "}
          <Card.Title title={exercise} />
        </Card>
      </Surface>
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon="plus"
        testID="add-workout"
        onPress={(_) => onAddWorkout(router)}
      />
    </View>
  );
}
