import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput, HelperText } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { Locales } from "@/lib/locales";
import { parseExercise, ParseExerciseError } from "@/lib/models/Exercise";

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const [parseError, setParseError] = React.useState<ParseExerciseError | null>("EMPTY_NAME");
  const router = useRouter();
  const addExercise = useAddExercise();

  const handleExerciseChange = (text: string) => {
    onChangeExercise(text);
    const result = parseExercise(text);
    setParseError(result.success ? null : result.error);
  };

  const hasError = parseError !== null;
  const getErrorMessage = (): string => {
    if (parseError === "EMPTY_NAME") {
      return "Exercise name cannot be empty";
    }
    return "";
  };

  return (
    <Card>
      <Card.Title title={Locales.t("addExerciseTitle")}></Card.Title>
      <Card.Content>
        <TextInput
          testID="name"
          label={Locales.t("name")}
          value={exercise}
          onChangeText={handleExerciseChange}
          error={hasError && exercise.length > 0}
        />
        <HelperText type="error" visible={hasError && exercise.length > 0}>
          {getErrorMessage()}
        </HelperText>
      </Card.Content>
      <Card.Actions>
        <Button
          testID="submit"
          mode="contained"
          disabled={hasError}
          onPress={async () => {
            const result = parseExercise(exercise);
            if (result.success) {
              await addExercise(result.exercise.name);
              router.back();
              router.navigate(`/workout?exercise=${encodeURIComponent(result.exercise.name)}`);
            }
          }}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
