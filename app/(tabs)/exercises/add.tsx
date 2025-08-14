import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import React from "react";
import { Surface } from "react-native-paper";

export default function AddExerciseScreen() {
  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddExerciseForm />
    </Surface>
  );
}
