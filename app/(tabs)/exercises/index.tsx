import ExerciseList from "@/lib/components/ExerciseList";
import { useExercises } from "@/lib/hooks/useExercises";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import { FAB } from "react-native-paper";

export default function ExerciseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { exercises } = useExercises(user?.uid || "");

  return (
    <View style={{ flex: 1, position: "relative" }} testID="exercise-screen">
      <ExerciseList exercises={exercises} />
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon="plus"
        testID="add-exercise"
        // @ts-ignore - Web compatibility for Maestro tests
        id="add-exercise"
        onPress={(_) => {
          router.navigate("/exercises/add");
        }}
      />
    </View>
  );
}
