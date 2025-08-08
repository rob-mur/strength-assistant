import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { ExerciseRepo, ExerciseRepoContext } from "@/lib/repo/ExerciseRepo";
import React from "react";
import { Surface } from "react-native-paper";

export default function AddExerciseScreen() {
  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <ExerciseRepoContext.Provider value={new ExerciseRepo()}>
        <AddExerciseForm />
      </ExerciseRepoContext.Provider>
    </Surface>
  );
}
