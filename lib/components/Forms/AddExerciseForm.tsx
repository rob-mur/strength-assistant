import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, Snackbar, TextInput } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { Locales } from "@/lib/locales";

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const router = useRouter();
  const addExercise = useAddExercise();

  return (
    <>
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
              try {
                await addExercise(exercise);
                // Only navigate on successful operation
                router.back();
                router.navigate(`/workout?exercise=${exercise}`);
              } catch (error) {
                console.error('Failed to add exercise:', error);
                const message = error instanceof Error ? error.message : 'Failed to add exercise. Please try again.';
                setErrorMessage(message);
                setShowError(true);
              }
            }}
          >
            {Locales.t("submit")}
          </Button>
        </Card.Actions>
      </Card>
      <Snackbar
        testID="error-snackbar"
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setShowError(false),
        }}
      >
        {errorMessage}
      </Snackbar>
    </>
  );
}
