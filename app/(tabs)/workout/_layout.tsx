/**
 * Workout Section Layout
 *
 * Purpose: Layout for workout-related screens including main workout and log-set screens
 */

import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="log-set" />
    </Stack>
  );
}
