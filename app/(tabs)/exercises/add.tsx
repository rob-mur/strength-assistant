import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { useRouter } from "expo-router";
import React from "react";
import { Surface } from "react-native-paper";

interface AddExerciseScreenProps {
  onSubmit?: (exerciseName: string) => void;
}

export default function AddExerciseScreen({ onSubmit }: AddExerciseScreenProps = {}) {
  const router = useRouter();
  const addExercise = useAddExercise();

  const handleSubmit = onSubmit || (async (exerciseName: string) => {
    await addExercise(exerciseName);
    router.back();
    router.navigate(`/workout?exercise=${exerciseName}`);
  });

  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddExerciseForm onSubmit={handleSubmit} />
    </Surface>
  );
}
