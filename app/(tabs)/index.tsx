import { Text } from 'react-native';
interface HomeScreenProps {
	onUserReadyToStart: () => void;
}

export default function HomeScreen({ onUserReadyToStart }: HomeScreenProps) {

	return (<Text>{'Are you ready to workout? Pick an exercise to get started'}</Text>);
}
