import { ExerciseRepo } from "../repo/ExerciseRepo";

export function useAddExercise(
  uid: string,
): (exercise: string) => Promise<void> {
  const addExercise = async (exercise: string) => {
    console.log(
      "🏋️ useAddExercise - Starting addExercise with uid:",
      uid || "(empty)",
      "exercise:",
      exercise,
    );

    // CRITICAL FIX: Immediate validation to prevent database hangs
    if (!uid || uid.trim() === "") {
      console.error(
        "🏋️ useAddExercise - No valid uid provided (empty or null), failing immediately",
      );
      const error = new Error("User must be authenticated to add exercises");
      console.error(
        "🏋️ useAddExercise - Throwing authentication error:",
        error.message,
      );
      throw error;
    }

    // CRITICAL FIX: Additional validation for uid format
    if (uid.length < 3) {
      console.error("🏋️ useAddExercise - uid too short (likely invalid):", uid);
      const error = new Error("Invalid user authentication state");
      console.error(
        "🏋️ useAddExercise - Throwing invalid uid error:",
        error.message,
      );
      throw error;
    }

    console.log(
      "🏋️ useAddExercise - ✅ uid validation passed, proceeding with database operation",
    );

    console.log("🏋️ useAddExercise - Getting ExerciseRepo instance");
    const repo = ExerciseRepo.getInstance();

    console.log("🏋️ useAddExercise - Calling repo.addExercise");
    await repo.addExercise(uid, { name: exercise });

    console.log("🏋️ useAddExercise - repo.addExercise completed successfully");
    console.log(
      "🏋️ useAddExercise - Exercise addition flow completed, returning...",
    );
  };

  return addExercise;
}
