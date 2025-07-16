import HomeScreen from '@/app/(tabs)';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CommonTestState } from '@/__test_utils__/utils';

describe('<HomeScreen />', () => {
	let state: CommonTestState;
	beforeEach(() => {
		state = new CommonTestState();
	});

	test('When the user decides to get started their exercise list is shown', async () => {
		// Given
		let gotStarted = false;
		const { getByTestId } = render(<HomeScreen onUserReadyToStart={() => { gotStarted = true; }} />);
		// When
		await state.user.press(getByTestId("get-started"))
		// Then
		expect(gotStarted).toBe(true);
	});
});

