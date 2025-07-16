import ExarciseScreen from '@/app/(tabs)/ExerciseScreen';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { act } from 'react';
import { CommonTestState } from '../../__test_utils__/utils';
import ExerciseScreen from '@/app/(tabs)/ExerciseScreen';


describe('<ExerciseScreen/>', () => {

	let state: CommonTestState;
	beforeEach(() => {
		state = new CommonTestState();
	});
	test('When the user request to add an exercise their request is accepted', async () => {
		// Given
		let gotStarted = false;
		const { getByTestId } = render(<ExerciseScreen onAddExercise={() => { gotStarted = true; }} />);
		// When
		await state.user.press(getByTestId("add-exercise"))
		// Then
		expect(gotStarted).toBe(true);
	});
});

