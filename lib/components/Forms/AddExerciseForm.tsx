import { useRouter } from "expo-router";
import React from "react";
import { Button, Card, TextInput } from "react-native-paper";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useAuth } from "@/lib/hooks/useAuth";
import { Locales } from "@/lib/locales";

export default function AddExerciseForm() {
  const [exercise, setExercise] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // CRITICAL FIX: Always pass current user.uid to useAddExercise, update when user changes
  const currentUid = user?.uid || "";
  const addExercise = useAddExercise(currentUid);

  console.log(
    "💪 AddExerciseForm - Current user state:",
    user ? `authenticated (${user.uid})` : "not authenticated",
  );

  return (
    <Card>
      <Card.Title title={Locales.t("addExerciseTitle")}></Card.Title>
      <Card.Content>
        <TextInput
          testID="name"
          // @ts-ignore - Web compatibility for Maestro tests
          id="name"
          label={Locales.t("name")}
          value={exercise}
          onChangeText={setExercise}
        ></TextInput>
      </Card.Content>
      <Card.Actions>
        <Button
          testID="submit"
          // @ts-ignore - Web compatibility for Maestro tests
          id="submit"
          mode="contained"
          loading={isLoading}
          disabled={isLoading}
          onPress={async () => {
            console.log(
              "💪 AddExerciseForm - Submit clicked, user:",
              user ? `authenticated (${user.uid})` : "not authenticated",
              "exercise:",
              exercise,
            );

            // CRITICAL FIX: Double-check authentication state at submission time
            if (!user?.uid) {
              console.error(
                "💪 AddExerciseForm - User not authenticated at submit time, aborting",
              );
              console.error("💪 AddExerciseForm - Auth state:", {
                userExists: !!user,
                uid: user?.uid || "(empty)",
                currentUid: currentUid || "(empty)",
              });
              return;
            }

            setIsLoading(true);
            try {
              console.log(
                "💪 AddExerciseForm - ✅ User authenticated, calling addExercise with userId:",
                user.uid,
                "currentUid:",
                currentUid,
              );

              await addExercise(exercise);

              console.log("💪 AddExerciseForm - Exercise added successfully");
              router.back();
              router.navigate(`/workout?exercise=${exercise}`);
            } catch (error) {
              console.error(
                "💪 AddExerciseForm - Error adding exercise:",
                error,
              );
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
