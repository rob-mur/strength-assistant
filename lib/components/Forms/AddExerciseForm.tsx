import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { Locales } from "@/lib/locales";

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const router = useRouter();
  const addExercise = useAddExercise();

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
          onPress={async () => {
            await addExercise(exercise);
            router.back();
            router.navigate(`/workout?exercise=${exercise}`);
          }}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
