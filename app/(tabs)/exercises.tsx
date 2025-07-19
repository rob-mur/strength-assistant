import { useRouter, Router } from 'expo-router';
import * as React from 'react';
import { FAB } from 'react-native-paper';

interface ExerciseScreenProps {
	onAddExercise: () => void;
}

export default function ExerciseScreen({ onAddExercise = () => useRouter().navigate("./add") }: ExerciseScreenProps) {
	return <FAB icon="plus" testID='add-exercise' onPress={(_) => onAddExercise()} />;
}
