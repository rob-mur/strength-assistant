import * as React from 'react';
import { FAB } from 'react-native-paper';

interface ExerciseScreenProps {
	onAddExercise: () => void;
}


export default function ExerciseScreen({ onAddExercise }: ExerciseScreenProps) {
	return <FAB icon="plus" testID='add-exercise' onPress={onAddExercise} />;
}
