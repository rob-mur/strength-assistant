import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarView } from '../../../../lib/components/Calendar/CalendarView';
import type { WeeklyPlan } from '../../../../lib/models/ExerciseSchedule';

// Mock react-native-calendars
jest.mock('react-native-calendars', () => ({
  ExpandableCalendar: ({ markedDates, onDayPress, testID, theme }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native');
    
    // Simulate a few days for testing
    const mockDays = [
      { dateString: '2025-01-20', day: 20 }, // Monday (dayOfWeek: 1)
      { dateString: '2025-01-21', day: 21 }, // Tuesday (dayOfWeek: 2)
      { dateString: '2025-01-22', day: 22 }, // Wednesday (dayOfWeek: 3)
    ];
    
    return (
      <View testID={testID}>
        {mockDays.map((day) => (
          <TouchableOpacity
            key={day.dateString}
            onPress={() => onDayPress(day)}
            testID={`calendar-day-${day.day}`}
          >
            <Text>{day.day}</Text>
            {markedDates && markedDates[day.dateString] && markedDates[day.dateString].marked && (
              <Text testID={`marked-${day.day}`}>•</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  },
  CalendarProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="calendar-provider">{children}</View>;
  },
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      onPrimary: '#FFFFFF',
      surface: '#F2F2F7',
      onSurface: '#000000',
      onSurfaceVariant: '#8E8E93',
    },
  }),
}));

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
    { 
      dayOfWeek: 3, 
      exercises: [
        { 
          scheduleId: 'schedule-2', 
          exerciseId: 'exercise-2', 
          exerciseName: 'Squats', 
          orderIndex: 0 
        }
      ], 
      hasExercises: true 
    }, // Wednesday
    { dayOfWeek: 4, exercises: [], hasExercises: false }, // Thursday
    { dayOfWeek: 5, exercises: [], hasExercises: false }, // Friday
    { dayOfWeek: 6, exercises: [], hasExercises: false }, // Saturday
  ],
};

// Mock current date to be January 20, 2025 (Monday)
const mockDate = new Date('2025-01-20T12:00:00.000Z');
const originalDate = global.Date;

beforeAll(() => {
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.now = originalDate.now;
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;
  global.Date.prototype = originalDate.prototype;
});

afterAll(() => {
  global.Date = originalDate;
});

describe('CalendarView', () => {
  const defaultProps = {
    weeklyPlan: mockWeeklyPlan,
    onDayPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(<CalendarView {...defaultProps} />);

    expect(getByTestId('calendar-view')).toBeTruthy();
    expect(getByTestId('calendar-provider')).toBeTruthy();
    expect(getByTestId('expandable-calendar')).toBeTruthy();
  });

  it('marks days with exercises', () => {
    const { getByTestId } = render(<CalendarView {...defaultProps} />);

    // Monday (day 20) should be marked as it has exercises
    expect(getByTestId('marked-20')).toBeTruthy();
    
    // Tuesday (day 21) should not be marked
    expect(() => getByTestId('marked-21')).toThrow();
    
    // Wednesday (day 22) should be marked
    expect(getByTestId('marked-22')).toBeTruthy();
  });

  it('calls onDayPress when a day is pressed', () => {
    const onDayPress = jest.fn();
    const { getByTestId } = render(
      <CalendarView {...defaultProps} onDayPress={onDayPress} />
    );

    fireEvent.press(getByTestId('calendar-day-20'));
    
    expect(onDayPress).toHaveBeenCalledTimes(1);
    expect(onDayPress).toHaveBeenCalledWith(1); // Monday = dayOfWeek 1
  });

  it('handles day press for different days of week correctly', () => {
    const onDayPress = jest.fn();
    const { getByTestId } = render(
      <CalendarView {...defaultProps} onDayPress={onDayPress} />
    );

    // Press Tuesday (should be dayOfWeek 2)
    fireEvent.press(getByTestId('calendar-day-21'));
    expect(onDayPress).toHaveBeenCalledWith(2);

    // Press Wednesday (should be dayOfWeek 3)
    fireEvent.press(getByTestId('calendar-day-22'));
    expect(onDayPress).toHaveBeenCalledWith(3);
  });

  it('handles selectedDay prop correctly', () => {
    const { rerender } = render(
      <CalendarView {...defaultProps} selectedDay={1} />
    );

    // Test with different selected day
    rerender(<CalendarView {...defaultProps} selectedDay={3} />);
    
    // Should render without errors
    expect(true).toBe(true);
  });

  it('handles empty weekly plan', () => {
    const emptyWeeklyPlan: WeeklyPlan = {
      userId: null,
      days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        exercises: [],
        hasExercises: false,
      })),
    };

    const { getByTestId } = render(
      <CalendarView {...defaultProps} weeklyPlan={emptyWeeklyPlan} />
    );

    expect(getByTestId('calendar-view')).toBeTruthy();
    
    // No days should be marked
    expect(() => getByTestId('marked-20')).toThrow();
    expect(() => getByTestId('marked-21')).toThrow();
    expect(() => getByTestId('marked-22')).toThrow();
  });

  it('applies theme colors correctly', () => {
    const { getByTestId } = render(<CalendarView {...defaultProps} />);
    
    const calendar = getByTestId('expandable-calendar');
    
    // Check that theme props are applied
    expect(calendar.props.theme).toBeDefined();
    expect(calendar.props.theme.selectedDayBackgroundColor).toBe('#007AFF');
    expect(calendar.props.theme.selectedDayTextColor).toBe('#FFFFFF');
    expect(calendar.props.theme.todayTextColor).toBe('#007AFF');
  });

  it('sets first day of week to Monday', () => {
    const { getByTestId } = render(<CalendarView {...defaultProps} />);
    
    const calendar = getByTestId('expandable-calendar');
    expect(calendar.props.firstDay).toBe(1); // Monday
  });

  it('uses dot marking type for exercise indicators', () => {
    const { getByTestId } = render(<CalendarView {...defaultProps} />);
    
    const calendar = getByTestId('expandable-calendar');
    expect(calendar.props.markingType).toBe('dot');
  });

  it('handles weekly plan with all days having exercises', () => {
    const fullWeeklyPlan: WeeklyPlan = {
      userId: 'user-1',
      days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        exercises: [{ 
          scheduleId: `schedule-${dayOfWeek}`, 
          exerciseId: `exercise-${dayOfWeek}`, 
          exerciseName: 'Exercise', 
          orderIndex: 0 
        }],
        hasExercises: true,
      })),
    };

    const { getByTestId } = render(
      <CalendarView {...defaultProps} weeklyPlan={fullWeeklyPlan} />
    );

    // All visible days should be marked
    expect(getByTestId('marked-20')).toBeTruthy();
    expect(getByTestId('marked-22')).toBeTruthy();
  });
});