import { ExerciseRepo } from "../repo/ExerciseRepo";

export function useAddExercise(uid: string): (exercise: string) => Promise<void> {
  const addExercise = async (exercise: string) => {
    if (!uid) {
      throw new Error("User must be authenticated to add exercises");
    }
    const repo = ExerciseRepo.getInstance();
    await repo.addExercise(uid, { name: exercise });
  };

  return addExercise;
}
