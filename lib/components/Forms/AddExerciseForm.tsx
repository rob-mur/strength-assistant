import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput, Snackbar } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { Locales } from "@/lib/locales";

export default function AddExerciseForm() {
  const [exercise, onChangeExercise] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showError, setShowError] = React.useState(false);
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
            setShowError(false);
            try {
              await addExercise(exercise);
              router.back();
              router.navigate(`/workout?exercise=${exercise}`);
            } catch (error) {
              console.error("Failed to add exercise:", error);
              const errorText = error instanceof Error ? error.message : "Failed to add exercise. Please try again.";
              setErrorMessage(errorText);
              setShowError(true);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? Locales.t("submitting") : Locales.t("submit")}
        </Button>
      </Card.Actions>
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
    </Card>
  );
}
