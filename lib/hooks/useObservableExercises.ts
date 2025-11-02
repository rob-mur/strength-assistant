import { exercises$, exerciseUtils } from "../data/store";
import { useObservable } from "@legendapp/state/react";
import { Exercise } from "../models/Exercise";

/**
 * Hook to use exercises with Legend State observables and syncedSupabase
 * Provides reactive updates and automatic sync with offline-first capabilities
 *
 * @returns Object with exercises array and helper functions
 */
export function useObservableExercises() {
  // Use Legend State's React hook for reactive updates
  const exercises = useObservable(exercises$);

  return {
    exercises, // ✅ Return the observable directly, no .get() needed

    // Helper to add exercise (uses syncedSupabase automatic sync)
    addExercise: (
      exercise: Omit<Exercise, "id" | "created_at" | "updated_at" | "deleted">,
    ) => {
      return exerciseUtils.addExercise(exercise);
    },

    // Helper to remove exercise (uses syncedSupabase automatic sync)
    removeExercise: (id: string) => {
      exerciseUtils.deleteExercise(id);
    },

    // Helper to update exercise (uses syncedSupabase automatic sync)
    updateExercise: (id: string, updates: Partial<Exercise>) => {
      exerciseUtils.updateExercise(id, updates);
    },
  };
}
