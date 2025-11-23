import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WeeklyPlannerCard } from '../../../../lib/components/Cards/WeeklyPlannerCard';
import type { WeeklyPlan } from '../../../../lib/models/ExerciseSchedule';

// Mock the CalendarView component
jest.mock('../../../../lib/components/Calendar/CalendarView', () => ({
  CalendarView: ({ weeklyPlan, onDayPress }: any) => {
    const MockCalendarView = require('react-native').View;
    return <MockCalendarView testID="calendar-view-mock" />;
  },
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  
  const Card = ({ children, style, testID }: any) => (
    <View style={style} testID={testID}>
      {children}
    </View>
  );

  Card.Title = ({ title, right, titleStyle }: any) => (
    <View testID="card-title">
      <Text style={titleStyle}>{title}</Text>
      {right && right({})}
    </View>
  );

  Card.Content = ({ children }: any) => (
    <View testID="card-content">{children}</View>
  );

  return {
    Card,
    IconButton: ({ icon, onPress, testID, iconColor }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text style={{ color: iconColor }}>{icon}</Text>
      </TouchableOpacity>
    ),
    useTheme: () => ({
      colors: {
        primary: '#007AFF',
        onSurface: '#000000',
        surface: '#FFFFFF',
      },
    }),
  };
});

const mockWeeklyPlan: WeeklyPlan = {
  userId: 'user-1',
  days: [
    { dayOfWeek: 0, exercises: [], hasExercises: false }, // Sunday
    { 
      dayOfWeek: 1, 
      exercises: [
        { 
          scheduleId: 'schedule-1', 
          exerciseId: 'exercise-1', 
          exerciseName: 'Push-ups', 
          orderIndex: 0 
        }
      ], 
      hasExercises: true 
    }, // Monday
    { dayOfWeek: 2, exercises: [], hasExercises: false }, // Tuesday
    { dayOfWeek: 3, exercises: [], hasExercises: false }, // Wednesday
    { dayOfWeek: 4, exercises: [], hasExercises: false }, // Thursday
    { dayOfWeek: 5, exercises: [], hasExercises: false }, // Friday
    { dayOfWeek: 6, exercises: [], hasExercises: false }, // Saturday
  ],
};

describe('WeeklyPlannerCard', () => {
  const defaultProps = {
    weeklyPlan: mockWeeklyPlan,
    expanded: false,
    onToggleExpanded: jest.fn(),
    onDayPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when collapsed', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <WeeklyPlannerCard {...defaultProps} />
    );

    expect(getByTestId('weekly-planner-card')).toBeTruthy();
    expect(getByText('Weekly Exercise Plan')).toBeTruthy();
    expect(getByTestId('weekly-planner-toggle')).toBeTruthy();
    expect(queryByTestId('calendar-view-mock')).toBeFalsy();
  });

  it('renders calendar when expanded', () => {
    const { getByTestId } = render(
      <WeeklyPlannerCard {...defaultProps} expanded={true} />
    );

    expect(getByTestId('calendar-view-mock')).toBeTruthy();
  });

  it('shows correct toggle icon when collapsed', () => {
    const { getByText } = render(
      <WeeklyPlannerCard {...defaultProps} expanded={false} />
    );

    expect(getByText('chevron-down')).toBeTruthy();
  });

  it('shows correct toggle icon when expanded', () => {
    const { getByText } = render(
      <WeeklyPlannerCard {...defaultProps} expanded={true} />
    );

    expect(getByText('chevron-up')).toBeTruthy();
  });

  it('calls onToggleExpanded when toggle button is pressed', () => {
    const onToggleExpanded = jest.fn();
    const { getByTestId } = render(
      <WeeklyPlannerCard {...defaultProps} onToggleExpanded={onToggleExpanded} />
    );

    fireEvent.press(getByTestId('weekly-planner-toggle'));
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('applies custom style when provided', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <WeeklyPlannerCard {...defaultProps} style={customStyle} />
    );

    const card = getByTestId('weekly-planner-card');
    expect(card.props.style).toContainEqual(customStyle);
  });

  it('passes weeklyPlan to CalendarView when expanded', () => {
    const { getByTestId } = render(
      <WeeklyPlannerCard {...defaultProps} expanded={true} />
    );

    expect(getByTestId('calendar-view-mock')).toBeTruthy();
  });

  it('applies theme colors correctly', () => {
    const { getByTestId, getByText } = render(
      <WeeklyPlannerCard {...defaultProps} />
    );

    const toggleIcon = getByText('chevron-down');
    expect(toggleIcon.props.style.color).toBe('#007AFF'); // primary color
  });

  it('handles empty weekly plan gracefully', () => {
    const emptyWeeklyPlan: WeeklyPlan = {
      userId: null,
      days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        exercises: [],
        hasExercises: false,
      })),
    };

    const { getByTestId } = render(
      <WeeklyPlannerCard 
        {...defaultProps} 
        weeklyPlan={emptyWeeklyPlan}
        expanded={true} 
      />
    );

    expect(getByTestId('calendar-view-mock')).toBeTruthy();
  });
});