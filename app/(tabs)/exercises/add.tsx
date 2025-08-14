import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import { useRouter } from "expo-router";
import React from "react";
import { Surface } from "react-native-paper";

interface AddExerciseScreenProps {
  onSubmit?: (exerciseName: string) => void;
}

export default function AddExerciseScreen({ onSubmit }: AddExerciseScreenProps = {}) {
  const router = useRouter();

  const handleSubmit = onSubmit || ((exerciseName: string) => {
    router.back();
    router.navigate(`/workout?exercise=${exerciseName}`);
  });

  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddExerciseForm onSubmit={handleSubmit} />
    </Surface>
  );
}
