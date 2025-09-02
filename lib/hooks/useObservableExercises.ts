import { exercises$ } from '../data/sync';
import { useObservable } from '@legendapp/state/react';
import { Exercise } from '../models/Exercise';

/**
 * Hook to use exercises with Legend State observables
 * Provides reactive updates and works offline-first
 * 
 * @returns Object with exercises array and helper functions
 */
export function useObservableExercises() {
  // Use Legend State's React hook for reactive updates
  const exercises = useObservable(exercises$);

  return {
    exercises: exercises as Exercise[],
    
    // Helper to add exercise optimistically 
    addExercise: (exercise: Exercise) => {
      const current = exercises$.get();
      exercises$.set([...current, exercise]);
    },
    
    // Helper to remove exercise optimistically
    removeExercise: (id: string) => {
      const current = exercises$.get();
      exercises$.set(current.filter(ex => ex.id !== id));
    },
    
    // Helper to update exercise optimistically
    updateExercise: (id: string, updates: Partial<Exercise>) => {
      const current = exercises$.get();
      exercises$.set(current.map(ex => 
        ex.id === id ? { ...ex, ...updates } : ex
      ));
    },
  };
}