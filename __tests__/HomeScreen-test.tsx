import HomeScreen from '@/app/(tabs)';
import { render } from '@testing-library/react-native';


describe('<HomeScreen />', () => {
	test('When the user decides to get started their exercise list is shown', () => {
		let gotStarted = false;

		render(<HomeScreen onUserReadyToStart={() => { gotStarted = true; }} />);

		expect(gotStarted).toBe(true);
	});
});

