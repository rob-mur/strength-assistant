import { useEffect, useState } from "react";
import { Exercise } from "../models/Exercise";
import { ExerciseRepo } from "../repo/ExerciseRepo";

export const useExercises = (uid: string) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!uid) {
      console.warn("useExercises: User not authenticated, exercises will be empty");
      setExercises([]);
      return;
    }

    const exerciseRepo = ExerciseRepo.getInstance();
    const unsubscribe = exerciseRepo.subscribeToExercises(uid, (exercises) => {
      setExercises(exercises);
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return { exercises };
};
