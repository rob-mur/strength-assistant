import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput, HelperText } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { Locales } from "@/lib/locales";

interface ValidationError {
  isEmpty: boolean;
  tooLong: boolean;
}

function validateExerciseName(name: string): ValidationError {
  const trimmedName = name.trim();
  return {
    isEmpty: trimmedName.length === 0,
    tooLong: trimmedName.length > 100
  };
}

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const [validationError, setValidationError] = React.useState<ValidationError>({ isEmpty: true, tooLong: false });
  const router = useRouter();
  const addExercise = useAddExercise();

  const handleExerciseChange = (text: string) => {
    onChangeExercise(text);
    setValidationError(validateExerciseName(text));
  };

  const hasError = validationError.isEmpty || validationError.tooLong;
  const getErrorMessage = (): string => {
    if (validationError.isEmpty) {
      return "Exercise name cannot be empty";
    }
    if (validationError.tooLong) {
      return "Exercise name must be 100 characters or less";
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
          maxLength={100}
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
            const trimmedExercise = exercise.trim();
            await addExercise(trimmedExercise);
            router.back();
            router.navigate(`/workout?exercise=${encodeURIComponent(trimmedExercise)}`);
          }}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}
