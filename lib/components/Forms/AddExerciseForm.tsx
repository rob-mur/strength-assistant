import React from "react";
import { Button, Card, TextInput } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { Locales } from "@/lib/locales";

interface AddExerciseFormProps {
  onSubmit?: (exerciseName: string) => void;
}

export default function AddExerciseForm({ onSubmit }: AddExerciseFormProps) {
  const [exercise, onChangeExercise] = React.useState("");
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
            if (onSubmit) {
              onSubmit(exercise);
            }
          }}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
