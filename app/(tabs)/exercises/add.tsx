import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { useAddExercise } from "@/lib/repo/ExerciseRepo";
import { Router } from "expo-router";
import React from "react";
import { Surface } from "react-native-paper";

export default function AddExerciseScreen() {
  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddExerciseForm />
    </Surface>
  );
}
