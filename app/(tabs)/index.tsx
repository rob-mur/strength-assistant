import { Router, useRouter } from 'expo-router';
import { Button } from 'react-native';
interface HomeScreenProps {
	onUserReadyToStart: () => void;

}

export default function HomeScreen({ onUserReadyToStart = () => useRouter().navigate("/exercises") }: HomeScreenProps) {
	return <Button onPress={(_) => onUserReadyToStart()} title="Go!" testID='get-started' />;
}
