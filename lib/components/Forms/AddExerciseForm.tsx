import { Locales } from "@/lib/locales";
import { useRouter, Router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Button, Card, TextInput } from "react-native-paper";

interface AddExerciseFormProps {
  onExerciseSubmitted: (r: Router, exercise: string) => void;
}
export default function AddExerciseForm({
  onExerciseSubmitted: onExerciseSubmitted,
}: AddExerciseFormProps) {
  const [exercise, onChangeExercise] = React.useState("");
  const router = useRouter();
  return (
    <Card>
      <Card.Title title={Locales.t("addExerciseTitle")}></Card.Title>
      <Card.Content>
        <TextInput
          testID="name"
          label={Locales.t("name")}
          value={exercise}
          onChangeText={onChangeExercise}
        ></TextInput>
      </Card.Content>
      <Card.Actions>
        <Button
          testID="submit"
          mode="contained"
          onPress={() => onExerciseSubmitted(router, exercise)}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
