import { ExerciseRepo } from "../repo/ExerciseRepo";

export function useAddExercise(
  uid: string,
): (exercise: string) => Promise<void> {
  const addExercise = async (exercise: string) => {
    console.log("🏋️ useAddExercise - Starting addExercise with uid:", uid, "exercise:", exercise);

    if (!uid) {
      console.error("🏋️ useAddExercise - No uid provided, throwing error");
      throw new Error("User must be authenticated to add exercises");
    }

    console.log("🏋️ useAddExercise - Getting ExerciseRepo instance");
    const repo = ExerciseRepo.getInstance();

    console.log("🏋️ useAddExercise - Calling repo.addExercise");
    await repo.addExercise(uid, { name: exercise });

    console.log("🏋️ useAddExercise - repo.addExercise completed successfully");
    console.log("🏋️ useAddExercise - Exercise addition flow completed, returning...");
  };

  return addExercise;
}
