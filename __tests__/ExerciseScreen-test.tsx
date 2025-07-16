import ExerciseScreen from '@/app/(tabs)/ExerciseScreen';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { act } from 'react';


describe('<ExerciseScreen/>', () => {
	test('When the user request to add an exercise their request is accepted', async () => {
		// Given
		let gotStarted = false;
		const { getByTestId } = render(<ExerciseScreen onAddExercise={() => { gotStarted = true; }} />);
		const user = userEvent.setup();
		// When
		await user.press(getByTestId("add-exercise"))
		// Then
		expect(gotStarted).toBe(true);
	});
});

