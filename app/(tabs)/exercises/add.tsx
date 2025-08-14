import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { useRouter } from "expo-router";
import React from "react";
import { Surface } from "react-native-paper";

export default function AddExerciseScreen() {
  const router = useRouter();

  const handleSubmit = (exerciseName: string) => {
    router.back();
    router.navigate(`/workout?exercise=${exerciseName}`);
  };

  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddExerciseForm onSubmit={handleSubmit} />
    </Surface>
  );
}
