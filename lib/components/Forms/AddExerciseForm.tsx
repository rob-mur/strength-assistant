import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { Locales } from "@/lib/locales";

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const addExercise = useAddExercise(user?.uid || "");

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
          loading={isLoading}
          disabled={isLoading}
          onPress={async () => {
            setIsLoading(true);
            try {
              await addExercise(exercise);
              router.back();
              router.navigate(`/workout?exercise=${exercise}`);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? Locales.t("submitting") : Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
