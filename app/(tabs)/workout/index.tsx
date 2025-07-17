import { useRouter, Router } from 'expo-router';
import * as React from 'react';
import { FAB } from 'react-native-paper';

interface WorkoutScreenProps {
	onAddWorkout: (r: Router) => void;
}

export default function WorkoutScreen({ onAddWorkout = (r: Router) => r.navigate("./add") }: WorkoutScreenProps) {
	const router = useRouter();
	return <FAB icon="plus" testID='add-workout' onPress={(_) => onAddWorkout(router)} />;
}
