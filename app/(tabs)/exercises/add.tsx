import { useRouter, Router } from "expo-router";
import React from "react";
import { Button, TextInput, View } from "react-native";

interface AddExerciseComponentProps {
  onExerciseSubmitted: (r: Router, exercise: string) => void;
}
export default function AddExerciseComponent({
  onExerciseSubmitted: onExerciseSubmitted = (r: Router, exercise: string) =>
    r.navigate(`/workout?exercise=${exercise}`),
}: AddExerciseComponentProps) {
  const [exercise, onChangeExercise] = React.useState("");
  const router = useRouter();
  return (
    <View>
      <TextInput
        testID="name"
        value={exercise}
        onChangeText={onChangeExercise}
      ></TextInput>
      <Button
        title="Submit"
        testID="submit"
        onPress={() => onExerciseSubmitted(router, exercise)}
      />
    </View>
  );
}
