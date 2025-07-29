import { addExercise } from "@/lib/repo/addExercise";
import { Locales } from "@/lib/locales";
import { Router, useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput } from "react-native-paper";

const submit = async (exercise: string, router: Router) => {
  await addExercise(exercise);
  router.navigate(`/workout?exercise=${exercise}`);
};

interface AddExerciseFormProps {
  handleSubmit?: (exercise: string, router: Router) => void;
}

export default function AddExerciseForm({
  handleSubmit = submit,
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
          onPress={() => handleSubmit(exercise, router)}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
