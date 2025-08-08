import { useContext } from "react";
import { ExerciseRepoContext } from "../repo/ExerciseRepo";

export function useAddExercise(): (exercise: string) => Promise<void> {
  const repo = useContext(ExerciseRepoContext);
  const addExercise = async (exercise: string) => {
    if (!repo) {
      throw new Error("ExerciseRepo not found in context");
    }
    repo.addExercise(exercise);
  };

  return addExercise;
}

