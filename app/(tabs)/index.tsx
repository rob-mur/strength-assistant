import { Button } from 'react-native';
interface HomeScreenProps {
	onUserReadyToStart: () => void;
}

export default function HomeScreen({ onUserReadyToStart }: HomeScreenProps) {

	return <Button onPress={onUserReadyToStart} title="Go!" testID='get-started' />;
}
