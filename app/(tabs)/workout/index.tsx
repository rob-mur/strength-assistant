import { useRouter, Router, useLocalSearchParams } from 'expo-router';
import { FAB } from 'react-native-paper';
import { Text } from 'react-native';
interface WorkoutScreenProps {
	onAddWorkout: () => void;
	selectedExercise: string;
}

export default function WorkoutScreen({ onAddWorkout = () => useRouter().navigate("./add"), selectedExercise = useLocalSearchParams().exercise }: WorkoutScreenProps) {
	return <div><Text>{selectedExercise}</Text><FAB icon="plus" testID='add-workout' onPress={(_) => onAddWorkout()} /></div>;
}
