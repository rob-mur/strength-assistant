import { ExerciseRepo } from "../repo/ExerciseRepo";

export function useAddExercise(): (exercise: string) => Promise<void> {
  const addExercise = async (exercise: string) => {
    const repo = ExerciseRepo.getInstance();
    await repo.addExercise(exercise);
  };

  return addExercise;
}
