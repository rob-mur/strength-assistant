import { useRouter, Router } from "expo-router";
import { Button, TextInput } from "react-native";

interface AddExerciseComponentProps {
	onExerciseSubmitted: (r: Router) => void;
}
export default function AddExerciseComponent({ onExerciseSubmitted = (r: Router) => r.navigate("/workout") }: AddExerciseComponentProps) {
	const router = useRouter();
	return <div><TextInput testID="name"></TextInput><Button title="Submit" testID="submit" onPress={() => onExerciseSubmitted(router)} /></div>;
}
