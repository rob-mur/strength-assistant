import HomeScreen from '@/app/(tabs)';
import { fireEvent, render } from '@testing-library/react-native';


describe('<HomeScreen />', () => {
	test('When the user decides to get started their exercise list is shown', () => {
		// Given
		let gotStarted = false;
		const { getByTestId } = render(<HomeScreen onUserReadyToStart={() => { gotStarted = true; }} />);
		// When
		fireEvent.press(getByTestId("get-started"))
		// Then
		expect(gotStarted).toBe(true);
	});
});

