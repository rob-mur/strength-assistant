import { useContext } from "react";
import { ExerciseRepo } from "../repo/ExerciseRepo";

export function useAddExercise(): (exercise: string) => Promise<void> {
	const addExercise = async (exercise: string) => {
		const repo = new ExerciseRepo();
		repo.addExercise(exercise);
	};

	return addExercise;
}

