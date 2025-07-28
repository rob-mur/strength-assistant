import { useRouter, Router } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import { FAB } from "react-native-paper";

interface ExerciseScreenProps {
  onAddExercise: (r: Router) => void;
}

export default function ExerciseScreen({
  onAddExercise = (r: Router) => r.navigate("/exercises/add"),
}: ExerciseScreenProps) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon="plus"
        testID="add-exercise"
        onPress={(_) => onAddExercise(router)}
      />
    </View>
  );
}
