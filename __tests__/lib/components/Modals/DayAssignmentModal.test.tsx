import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayAssignmentModal } from '../../../../lib/components/Modals/DayAssignmentModal';
import type { Exercise } from '../../../../lib/models/Exercise';
import type { DayPlan } from '../../../../lib/models/ExerciseSchedule';

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  Modal: ({ visible, onDismiss, contentContainerStyle, children, testID }: any) => {
    const { View } = require('react-native');
    return visible ? (
      <View testID={testID} style={contentContainerStyle}>
        {children}
      </View>
    ) : null;
  },
  Portal: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="portal">{children}</View>;
  },
  Title: ({ children, style }: any) => {
    const { Text } = require('react-native');
    return <Text style={style} testID="modal-title">{children}</Text>;
  },
  List: {
    Subheader: ({ children, style }: any) => {
      const { Text } = require('react-native');
      return <Text style={style} testID="list-subheader">{children}</Text>;
    },
    Item: ({ 
      title, 
      description, 
      right, 
      left,
      titleStyle, 
      descriptionStyle, 
      testID 
    }: any) => {
      const { View, Text, TouchableOpacity } = require('react-native');
      return (
        <View testID={testID}>
          {left && left({})}
          <Text style={titleStyle}>{title}</Text>
          {description && <Text style={descriptionStyle}>{description}</Text>}
          {right && right({})}
        </View>
      );
    },
    Icon: ({ icon, color, onPress, testID }: any) => {
      const { TouchableOpacity, Text } = require('react-native');
      return (
        <TouchableOpacity onPress={onPress} testID={testID}>
          <Text style={{ color }}>{icon}</Text>
        </TouchableOpacity>
      );
    },
  },
  Divider: ({ style }: any) => {
    const { View } = require('react-native');
    return <View style={style} testID="divider" />;
  },
  Button: ({ mode, onPress, children, style, textColor, testID }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} style={style} testID={testID}>
        <Text style={{ color: textColor }}>{children}</Text>
      </TouchableOpacity>
    );
  },
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      surface: '#FFFFFF',
      onSurface: '#000000',
      onSurfaceVariant: '#8E8E93',
      error: '#FF3B30',
      outline: '#C6C6C8',
    },
  }),
  Text: ({ children, style }: any) => {
    const { Text: RNText } = require('react-native');
    return <RNText style={style}>{children}</RNText>;
  },
}));

const mockAvailableExercises: Exercise[] = [
  { id: 'exercise-1', name: 'Push-ups', userId: 'user-1' },
  { id: 'exercise-2', name: 'Squats', userId: 'user-1' },
  { id: 'exercise-3', name: 'Pull-ups', userId: 'user-1' },
];

const mockDayPlan: DayPlan = {
  dayOfWeek: 1, // Monday
  exercises: [
    {
      scheduleId: 'schedule-1',
      exerciseId: 'exercise-1',
      exerciseName: 'Push-ups',
      orderIndex: 0,
    },
  ],
  hasExercises: true,
};

const mockEmptyDayPlan: DayPlan = {
  dayOfWeek: 2, // Tuesday
  exercises: [],
  hasExercises: false,
};

describe('DayAssignmentModal', () => {
  const defaultProps = {
    visible: true,
    selectedDay: 1,
    dayPlan: mockDayPlan,
    availableExercises: mockAvailableExercises,
    onClose: jest.fn(),
    onAssignExercise: jest.fn(),
    onRemoveExercise: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByTestId, getByText } = render(
      <DayAssignmentModal {...defaultProps} />
    );

    expect(getByTestId('day-assignment-modal')).toBeTruthy();
    expect(getByText('Monday Exercises')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <DayAssignmentModal {...defaultProps} visible={false} />
    );

    expect(queryByTestId('day-assignment-modal')).toBeFalsy();
  });

  it('returns null when selectedDay is null', () => {
    const { queryByTestId } = render(
      <DayAssignmentModal {...defaultProps} selectedDay={null} />
    );

    expect(queryByTestId('day-assignment-modal')).toBeFalsy();
  });

  it('returns null when dayPlan is null', () => {
    const { queryByTestId } = render(
      <DayAssignmentModal {...defaultProps} dayPlan={null} />
    );

    expect(queryByTestId('day-assignment-modal')).toBeFalsy();
  });

  it('displays correct day name', () => {
    const { getByText, rerender } = render(
      <DayAssignmentModal {...defaultProps} selectedDay={0} />
    );
    expect(getByText('Sunday Exercises')).toBeTruthy();

    rerender(<DayAssignmentModal {...defaultProps} selectedDay={6} />);
    expect(getByText('Saturday Exercises')).toBeTruthy();
  });

  it('shows assigned exercises section when exercises exist', () => {
    const { getByText, getByTestId } = render(
      <DayAssignmentModal {...defaultProps} />
    );

    expect(getByText('Assigned Exercises')).toBeTruthy();
    expect(getByText('Push-ups')).toBeTruthy();
    expect(getByTestId('assigned-exercise-schedule-1')).toBeTruthy();
  });

  it('shows available exercises section', () => {
    const { getByText, getByTestId } = render(
      <DayAssignmentModal {...defaultProps} />
    );

    expect(getByText('Available Exercises')).toBeTruthy();
    expect(getByText('Squats')).toBeTruthy(); // Not assigned
    expect(getByText('Pull-ups')).toBeTruthy(); // Not assigned
    expect(getByTestId('available-exercise-exercise-2')).toBeTruthy();
    expect(getByTestId('available-exercise-exercise-3')).toBeTruthy();
  });

  it('excludes already assigned exercises from available list', () => {
    const { queryByTestId } = render(
      <DayAssignmentModal {...defaultProps} />
    );

    // Push-ups is already assigned, so should not appear in available exercises
    expect(queryByTestId('available-exercise-exercise-1')).toBeFalsy();
  });

  it('calls onAssignExercise when plus icon is pressed', () => {
    const onAssignExercise = jest.fn();
    const { getByTestId } = render(
      <DayAssignmentModal 
        {...defaultProps} 
        onAssignExercise={onAssignExercise} 
      />
    );

    // Find and press the plus button for Squats (exercise-2)
    const availableExercise = getByTestId('available-exercise-exercise-2');
    const plusButton = availableExercise.parent?.parent?.findByProps({ 
      children: 'plus' 
    });
    
    if (plusButton) {
      fireEvent.press(plusButton);
      expect(onAssignExercise).toHaveBeenCalledWith('exercise-2');
    }
  });

  it('calls onRemoveExercise when delete icon is pressed', () => {
    const onRemoveExercise = jest.fn();
    const { getByTestId } = render(
      <DayAssignmentModal 
        {...defaultProps} 
        onRemoveExercise={onRemoveExercise} 
      />
    );

    // Find and press the delete button for assigned exercise
    const assignedExercise = getByTestId('assigned-exercise-schedule-1');
    const deleteButton = assignedExercise.parent?.parent?.findByProps({ 
      children: 'delete' 
    });
    
    if (deleteButton) {
      fireEvent.press(deleteButton);
      expect(onRemoveExercise).toHaveBeenCalledWith('schedule-1');
    }
  });

  it('calls onClose when Done button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <DayAssignmentModal {...defaultProps} onClose={onClose} />
    );

    fireEvent.press(getByTestId('close-modal-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows order index for assigned exercises', () => {
    const dayPlanWithMultiple: DayPlan = {
      dayOfWeek: 1,
      exercises: [
        {
          scheduleId: 'schedule-1',
          exerciseId: 'exercise-1',
          exerciseName: 'Push-ups',
          orderIndex: 0,
        },
        {
          scheduleId: 'schedule-2',
          exerciseId: 'exercise-2',
          exerciseName: 'Squats',
          orderIndex: 1,
        },
      ],
      hasExercises: true,
    };

    const { getByText } = render(
      <DayAssignmentModal {...defaultProps} dayPlan={dayPlanWithMultiple} />
    );

    expect(getByText('Order: 1')).toBeTruthy(); // First exercise
    expect(getByText('Order: 2')).toBeTruthy(); // Second exercise
  });

  it('shows no exercises message when no exercises available', () => {
    const { getByText, getByTestId } = render(
      <DayAssignmentModal 
        {...defaultProps} 
        availableExercises={[]}
        dayPlan={mockEmptyDayPlan}
      />
    );

    expect(getByText('No exercises available')).toBeTruthy();
    expect(getByText('Create new exercises to add to this day')).toBeTruthy();
    expect(getByTestId('no-exercises-message')).toBeTruthy();
  });

  it('shows all assigned message when all exercises are assigned', () => {
    const fullDayPlan: DayPlan = {
      dayOfWeek: 1,
      exercises: [
        {
          scheduleId: 'schedule-1',
          exerciseId: 'exercise-1',
          exerciseName: 'Push-ups',
          orderIndex: 0,
        },
        {
          scheduleId: 'schedule-2',
          exerciseId: 'exercise-2',
          exerciseName: 'Squats',
          orderIndex: 1,
        },
        {
          scheduleId: 'schedule-3',
          exerciseId: 'exercise-3',
          exerciseName: 'Pull-ups',
          orderIndex: 2,
        },
      ],
      hasExercises: true,
    };

    const { getByText, getByTestId } = render(
      <DayAssignmentModal 
        {...defaultProps} 
        dayPlan={fullDayPlan}
      />
    );

    expect(getByText('All exercises assigned')).toBeTruthy();
    expect(getByText('Create new exercises to add more to this day')).toBeTruthy();
    expect(getByTestId('all-assigned-message')).toBeTruthy();
  });

  it('applies theme colors correctly', () => {
    const { getByTestId } = render(
      <DayAssignmentModal {...defaultProps} />
    );

    const modal = getByTestId('day-assignment-modal');
    expect(modal.props.style).toContainEqual({ backgroundColor: '#FFFFFF' });
  });

  it('handles empty day plan correctly', () => {
    const { getByText, queryByText } = render(
      <DayAssignmentModal 
        {...defaultProps} 
        selectedDay={2}
        dayPlan={mockEmptyDayPlan}
      />
    );

    expect(getByText('Tuesday Exercises')).toBeTruthy();
    expect(queryByText('Assigned Exercises')).toBeFalsy();
    expect(getByText('Available Exercises')).toBeTruthy();
  });
});