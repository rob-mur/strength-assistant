import { useRouter, Router, useLocalSearchParams } from 'expo-router';
import { FAB } from 'react-native-paper';
import { Text } from 'react-native';
interface WorkoutScreenProps {
	onAddWorkout: (r: Router) => void;
	selectedExercise: string;
}

export default function WorkoutScreen({ onAddWorkout = (r: Router) => r.navigate("./add"), selectedExercise = useLocalSearchParams().exercise }: WorkoutScreenProps) {
	const router = useRouter();
	return <div><Text>{selectedExercise}</Text><FAB icon="plus" testID='add-workout' onPress={(_) => onAddWorkout(router)} /></div>;
}
