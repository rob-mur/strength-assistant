import ExarciseScreen from '@/app/(tabs)/exercises';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { act } from 'react';
import { CommonTestState } from '../../__test_utils__/utils';
import ExerciseScreen from '@/app/(tabs)/exercises';


describe('<ExerciseScreen/>', () => {

	let state: CommonTestState;
	beforeEach(() => {
		state = new CommonTestState();
	});
	test('When the user request to add an exercise their request is accepted', async () => {
		// Given
		const mockOnAddExercise = jest.fn();
		const { getByTestId } = render(<ExerciseScreen onAddExercise={mockOnAddExercise} />);
		// When
		await state.user.press(getByTestId("add-exercise"))
		// Then
		expect(mockOnAddExercise.mock.lastCall).not.toBeNull();
	});
});

