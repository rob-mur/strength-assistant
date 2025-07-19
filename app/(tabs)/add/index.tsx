import { useRouter, Router } from "expo-router";
import React from "react";
import { Button, TextInput } from "react-native";

interface AddExerciseComponentProps {
	onExerciseSubmitted: (exercise: string) => void;
}
export default function AddExerciseComponent({ onExerciseSubmitted = (exercise: string) => useRouter().navigate(`/workout?exercise=${exercise}`) }: AddExerciseComponentProps) {
	const [exercise, onChangeExercise] = React.useState('')


	return <div><TextInput testID="name" value={exercise} onChangeText={onChangeExercise}></TextInput><Button title="Submit" testID="submit" onPress={() => onExerciseSubmitted(exercise)} /></div>;
}
