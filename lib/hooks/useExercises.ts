import { useEffect, useState } from "react";
import { Exercise } from "../models/Exercise";
import { ExerciseRepo } from "../repo/ExerciseRepo";
import { logger } from "../data/firebase/logger";

export const useExercises = (uid: string) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!uid) {
      logger.warn(
        "useExercises: User not authenticated, exercises will be empty",
        {
          service: "useExercises",
          platform: "React Native",
          operation: "fetch_exercises",
        },
      );
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
