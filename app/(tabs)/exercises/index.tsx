import ExerciseList from "@/lib/components/ExerciseList";
import { useExercises } from "@/lib/hooks/useExercises";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import { FAB } from "react-native-paper";

export default function ExerciseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { exercises } = useExercises(user?.uid || "");

  // Debug logging for Chrome tests
  React.useEffect(() => {
    const isChromeTest = process.env.CHROME_TEST === "true" || process.env.EXPO_PUBLIC_CHROME_TEST === "true";
    const isCITest = process.env.CI === "true" && process.env.CI !== "false" && process.env.CHROME_TEST !== "true" && process.env.EXPO_PUBLIC_CHROME_TEST !== "true";
    if (isChromeTest || isCITest) {
      console.log("🔍 ExerciseScreen: Component rendered", {
        userId: user?.uid,
        exerciseCount: exercises.length,
      });
    }
  }, [user, exercises]);

  return (
    <View style={{ flex: 1, position: "relative" }} testID="exercise-screen">
      <ExerciseList exercises={exercises} />
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon="plus"
        testID="add-exercise"
        onPress={(_) => {
          // Debug logging for Chrome tests
          const isChromeTest = process.env.CHROME_TEST === "true" || process.env.EXPO_PUBLIC_CHROME_TEST === "true";
          const isCITest = process.env.CI === "true" && process.env.CI !== "false" && process.env.CHROME_TEST !== "true" && process.env.EXPO_PUBLIC_CHROME_TEST !== "true";
          if (isChromeTest || isCITest) {
            console.log("🔍 ExerciseScreen: Add exercise button tapped");
          }
          router.navigate("/exercises/add");
        }}
      />
    </View>
  );
}
