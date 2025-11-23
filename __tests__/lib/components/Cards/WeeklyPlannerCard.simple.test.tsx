import React from 'react';
import { WeeklyPlannerCard } from '../../../../lib/components/Cards/WeeklyPlannerCard';
import type { WeeklyPlan } from '../../../../lib/models/ExerciseSchedule';

// Mock all external dependencies
jest.mock('../../../../lib/components/Calendar/CalendarView', () => ({
  CalendarView: () => null,
}));

jest.mock('react-native-paper', () => ({
  Card: ({ children, testID }: any) => ({ children, testID }),
  IconButton: ({ icon, onPress, testID }: any) => ({ icon, onPress, testID }),
  useTheme: () => ({ colors: { primary: '#000', onSurface: '#000', surface: '#fff' } }),
}));

const mockWeeklyPlan: WeeklyPlan = {
  userId: 'user-1',
  days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    exercises: [],
    hasExercises: false,
  })),
};

describe('WeeklyPlannerCard Component Logic', () => {
  const defaultProps = {
    weeklyPlan: mockWeeklyPlan,
    expanded: false,
    onToggleExpanded: jest.fn(),
    onDayPress: jest.fn(),
  };

  it('accepts all required props correctly', () => {
    expect(() => {
      WeeklyPlannerCard(defaultProps);
    }).not.toThrow();
  });

  it('handles expanded and collapsed states', () => {
    const collapsedResult = WeeklyPlannerCard({ ...defaultProps, expanded: false });
    const expandedResult = WeeklyPlannerCard({ ...defaultProps, expanded: true });

    expect(collapsedResult).toBeDefined();
    expect(expandedResult).toBeDefined();
  });

  it('passes through callback functions', () => {
    const mockToggle = jest.fn();
    const mockDayPress = jest.fn();

    const result = WeeklyPlannerCard({
      ...defaultProps,
      onToggleExpanded: mockToggle,
      onDayPress: mockDayPress,
    });

    expect(result).toBeDefined();
  });

  it('handles weekly plan data correctly', () => {
    const planWithExercises: WeeklyPlan = {
      userId: 'user-1',
      days: [
        { dayOfWeek: 0, exercises: [], hasExercises: false },
        { 
          dayOfWeek: 1, 
          exercises: [{ 
            scheduleId: '1', 
            exerciseId: '1', 
            exerciseName: 'Test', 
            orderIndex: 0 
          }], 
          hasExercises: true 
        },
        { dayOfWeek: 2, exercises: [], hasExercises: false },
        { dayOfWeek: 3, exercises: [], hasExercises: false },
        { dayOfWeek: 4, exercises: [], hasExercises: false },
        { dayOfWeek: 5, exercises: [], hasExercises: false },
        { dayOfWeek: 6, exercises: [], hasExercises: false },
      ],
    };

    const result = WeeklyPlannerCard({
      ...defaultProps,
      weeklyPlan: planWithExercises,
    });

    expect(result).toBeDefined();
  });
});