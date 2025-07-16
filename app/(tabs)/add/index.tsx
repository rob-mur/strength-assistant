import { Button, TextInput } from "react-native";

interface AddExerciseComponentProps {
	onExerciseSubmitted: () => void;
}
export default function AddExerciseComponent({ onExerciseSubmitted }: AddExerciseComponentProps) {

	return <div><TextInput testID="name"></TextInput><Button title="Submit" testID="submit" onPress={onExerciseSubmitted} /></div>;
}
