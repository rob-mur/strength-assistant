import { useEffect, useState } from "react";
import { Exercise } from "../models/Exercise";
import { ExerciseRepo } from "../repo/ExerciseRepo";

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const exerciseRepo = ExerciseRepo.getInstance();
    const unsubscribe = exerciseRepo.subscribeToExercises((exercises) => {
      setExercises(exercises);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { exercises };
};
