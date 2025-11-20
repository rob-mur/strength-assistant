/**
 * Workout Set Logging Screen
 *
 * Purpose: Dedicated screen for logging workout sets for a specific exercise
 * Navigation: Accessed from workout screen when exercise is selected
 */

import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Appbar, Surface } from "react-native-paper";
import { WorkoutSetForm } from "../../../lib/components/WorkoutSetForm";

export default function LogSetScreen() {
  const router = useRouter();
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
  }>();

  // Validate that exerciseId is provided
  if (!exerciseId) {
    Alert.alert(
      "Error",
      "Exercise information is missing. Please select an exercise first.",
      [
        {
          text: "OK",
          onPress: () => router.navigate("/(tabs)/workout"),
        },
      ],
    );
    return null;
  }

  const handleSetLogged = () => {
    // Show success feedback
    Alert.alert("Success", "Workout set logged!", [
      {
        text: "Add Another Set",
        onPress: () => {
          // Stay on the same screen to log another set
        },
      },
      {
        text: "Done",
        onPress: () => {
          // Return to workout screen with the selected exercise
          router.navigate({
            pathname: "/(tabs)/workout",
            params: { exercise: exerciseName },
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`Log Set - ${exerciseName || "Exercise"}`} />
      </Appbar.Header>

      <Surface style={styles.content}>
        <WorkoutSetForm
          exerciseId={exerciseId}
          onSetLogged={handleSetLogged}
          sessionDate={new Date().toISOString().split("T")[0]}
        />
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
