import { useRouter, Router } from 'expo-router';
import * as React from 'react';
import { FAB } from 'react-native-paper';

interface ExerciseScreenProps {
	onAddExercise: (r: Router) => void;
}

export default function ExerciseScreen({ onAddExercise = (r: Router) => r.navigate("./add") }: ExerciseScreenProps) {
	const router = useRouter();
	return <FAB icon="plus" testID='add-exercise' onPress={(_) => onAddExercise(router)} />;
}
