import { exerciseUtils } from "../data/store";
import { ExerciseValidator } from "../models/Exercise";
import { useAuth } from "./useAuth";

export function useAddExercise(
  uid: string,
): (exercise: string) => Promise<void> {
  const { user } = useAuth();

  const addExercise = async (exercise: string) => {
    console.log(
      "🏋️ useAddExercise - Starting addExercise with syncedSupabase:",
      "exercise:",
      exercise,
    );

    // Use the same auth state as the form component to ensure consistency
    const currentUser = user;
    if (!currentUser) {
      console.error("🏋️ useAddExercise - No authenticated user");
      throw new Error("User must be authenticated to add exercises");
    }

    console.log("🏋️ useAddExercise - User authenticated:", currentUser.uid);

    // Validate exercise name
    try {
      ExerciseValidator.validateExerciseName(exercise);
    } catch (error) {
      console.error("🏋️ useAddExercise - Invalid exercise name:", error);
      throw error;
    }

    // Sanitize exercise name
    const sanitizedName = ExerciseValidator.sanitizeExerciseName(exercise);

    console.log("🏋️ useAddExercise - Adding exercise via syncedSupabase");
    const exerciseId = exerciseUtils.addExercise({
      name: sanitizedName,
      user_id: currentUser.uid,
    });

    console.log(
      "🏋️ useAddExercise - Exercise added with ID:",
      exerciseId,
      "- syncedSupabase will handle sync automatically!",
    );
  };

  return addExercise;
}
