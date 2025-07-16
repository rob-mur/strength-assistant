import HomeScreen from '@/app/(tabs)';
import { fireEvent, render, userEvent } from '@testing-library/react-native';


describe('<HomeScreen />', () => {
	test('When the user decides to get started their exercise list is shown', async () => {
		// Given
		let gotStarted = false;
		const { getByTestId } = render(<HomeScreen onUserReadyToStart={() => { gotStarted = true; }} />);
		const user = userEvent.setup();
		// When
		await user.press(getByTestId("get-started"))
		// Then
		expect(gotStarted).toBe(true);
	});
});

