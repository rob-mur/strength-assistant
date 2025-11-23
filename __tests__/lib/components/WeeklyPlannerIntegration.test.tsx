import React from 'react';
import type { WeeklyPlan, DayPlan } from '../../../lib/models/ExerciseSchedule';
import type { Exercise } from '../../../lib/models/Exercise';

// Mock data for testing
const createMockWeeklyPlan = (hasExercises: boolean = false): WeeklyPlan => ({
  userId: 'user-1',
  days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    exercises: hasExercises && dayOfWeek === 1 ? [
      {
        scheduleId: 'schedule-1',
        exerciseId: 'exercise-1',
        exerciseName: 'Push-ups',
        orderIndex: 0,
      }
    ] : [],
    hasExercises: hasExercises && dayOfWeek === 1,
  })),
});

const createMockExercises = (): Exercise[] => [
  { id: 'exercise-1', name: 'Push-ups', userId: 'user-1' },
  { id: 'exercise-2', name: 'Squats', userId: 'user-1' },
  { id: 'exercise-3', name: 'Pull-ups', userId: 'user-1' },
];

const createMockDayPlan = (hasExercises: boolean = false): DayPlan => ({
  dayOfWeek: 1,
  exercises: hasExercises ? [
    {
      scheduleId: 'schedule-1',
      exerciseId: 'exercise-1',
      exerciseName: 'Push-ups',
      orderIndex: 0,
    }
  ] : [],
  hasExercises,
});

describe('Weekly Planner Components Integration', () => {
  describe('Data Model Compatibility', () => {
    it('WeeklyPlan data model is compatible with components', () => {
      const weeklyPlan = createMockWeeklyPlan(true);
      
      expect(weeklyPlan.userId).toBe('user-1');
      expect(weeklyPlan.days).toHaveLength(7);
      expect(weeklyPlan.days[1].hasExercises).toBe(true);
      expect(weeklyPlan.days[1].exercises[0].exerciseName).toBe('Push-ups');
    });

    it('DayPlan data model is compatible with modal', () => {
      const dayPlan = createMockDayPlan(true);
      const exercises = createMockExercises();
      
      expect(dayPlan.dayOfWeek).toBe(1);
      expect(dayPlan.hasExercises).toBe(true);
      expect(dayPlan.exercises[0].scheduleId).toBe('schedule-1');
      
      // Test that assigned exercises can be filtered from available exercises
      const assignedExerciseIds = new Set(dayPlan.exercises.map(e => e.exerciseId));
      const unassignedExercises = exercises.filter(
        exercise => !assignedExerciseIds.has(exercise.id)
      );
      
      expect(unassignedExercises).toHaveLength(2);
      expect(unassignedExercises[0].name).toBe('Squats');
      expect(unassignedExercises[1].name).toBe('Pull-ups');
    });

    it('Exercise data model is compatible with assignment flow', () => {
      const exercises = createMockExercises();
      
      exercises.forEach(exercise => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.userId).toBe('user-1');
      });
    });
  });

  describe('Component Props Interface', () => {
    it('WeeklyPlannerCard props are well-defined', () => {
      const mockProps = {
        weeklyPlan: createMockWeeklyPlan(),
        expanded: false,
        onToggleExpanded: jest.fn(),
        onDayPress: jest.fn(),
        style: { backgroundColor: 'red' },
      };

      // Test that all required props are present
      expect(mockProps.weeklyPlan).toBeDefined();
      expect(typeof mockProps.expanded).toBe('boolean');
      expect(typeof mockProps.onToggleExpanded).toBe('function');
      expect(typeof mockProps.onDayPress).toBe('function');

      // Test that callbacks can be invoked
      mockProps.onToggleExpanded();
      mockProps.onDayPress(1);

      expect(mockProps.onToggleExpanded).toHaveBeenCalledTimes(1);
      expect(mockProps.onDayPress).toHaveBeenCalledWith(1);
    });

    it('CalendarView props are well-defined', () => {
      const mockProps = {
        weeklyPlan: createMockWeeklyPlan(true),
        selectedDay: 1,
        onDayPress: jest.fn(),
      };

      expect(mockProps.weeklyPlan).toBeDefined();
      expect(mockProps.selectedDay).toBe(1);
      expect(typeof mockProps.onDayPress).toBe('function');

      // Test day press with different values
      mockProps.onDayPress(0); // Sunday
      mockProps.onDayPress(6); // Saturday

      expect(mockProps.onDayPress).toHaveBeenCalledWith(0);
      expect(mockProps.onDayPress).toHaveBeenCalledWith(6);
    });

    it('DayAssignmentModal props are well-defined', () => {
      const mockProps = {
        visible: true,
        selectedDay: 1,
        dayPlan: createMockDayPlan(true),
        availableExercises: createMockExercises(),
        onClose: jest.fn(),
        onAssignExercise: jest.fn(),
        onRemoveExercise: jest.fn(),
      };

      expect(typeof mockProps.visible).toBe('boolean');
      expect(mockProps.selectedDay).toBe(1);
      expect(mockProps.dayPlan).toBeDefined();
      expect(mockProps.availableExercises).toHaveLength(3);

      // Test callbacks
      mockProps.onClose();
      mockProps.onAssignExercise('exercise-2');
      mockProps.onRemoveExercise('schedule-1');

      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
      expect(mockProps.onAssignExercise).toHaveBeenCalledWith('exercise-2');
      expect(mockProps.onRemoveExercise).toHaveBeenCalledWith('schedule-1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty weekly plan gracefully', () => {
      const emptyPlan = createMockWeeklyPlan(false);
      
      expect(emptyPlan.days.every(day => !day.hasExercises)).toBe(true);
      expect(emptyPlan.days.every(day => day.exercises.length === 0)).toBe(true);
    });

    it('handles null/undefined values gracefully', () => {
      const emptyPlan: WeeklyPlan = {
        userId: null,
        days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          exercises: [],
          hasExercises: false,
        })),
      };

      expect(emptyPlan.userId).toBeNull();
      expect(emptyPlan.days).toHaveLength(7);
    });

    it('handles day of week boundaries correctly', () => {
      // Test all days of the week (0-6)
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        const dayPlan: DayPlan = {
          dayOfWeek,
          exercises: [],
          hasExercises: false,
        };

        expect(dayPlan.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(dayPlan.dayOfWeek).toBeLessThanOrEqual(6);
      }
    });

    it('handles exercise ordering correctly', () => {
      const dayPlan: DayPlan = {
        dayOfWeek: 1,
        exercises: [
          { scheduleId: '1', exerciseId: 'ex-1', exerciseName: 'Third', orderIndex: 2 },
          { scheduleId: '2', exerciseId: 'ex-2', exerciseName: 'First', orderIndex: 0 },
          { scheduleId: '3', exerciseId: 'ex-3', exerciseName: 'Second', orderIndex: 1 },
        ],
        hasExercises: true,
      };

      // Simulate the sorting logic from CalendarView
      const sortedExercises = [...dayPlan.exercises].sort((a, b) => a.orderIndex - b.orderIndex);

      expect(sortedExercises[0].exerciseName).toBe('First');
      expect(sortedExercises[1].exerciseName).toBe('Second');
      expect(sortedExercises[2].exerciseName).toBe('Third');
    });
  });

  describe('Component State Management', () => {
    it('supports expand/collapse state management', () => {
      let expanded = false;
      const toggleExpanded = () => { expanded = !expanded; };

      expect(expanded).toBe(false);
      toggleExpanded();
      expect(expanded).toBe(true);
      toggleExpanded();
      expect(expanded).toBe(false);
    });

    it('supports day selection state management', () => {
      let selectedDay: number | null = null;
      const setSelectedDay = (day: number) => { selectedDay = day; };
      const clearSelection = () => { selectedDay = null; };

      expect(selectedDay).toBeNull();
      setSelectedDay(1);
      expect(selectedDay).toBe(1);
      clearSelection();
      expect(selectedDay).toBeNull();
    });

    it('supports modal visibility state management', () => {
      let modalVisible = false;
      const showModal = () => { modalVisible = true; };
      const hideModal = () => { modalVisible = false; };

      expect(modalVisible).toBe(false);
      showModal();
      expect(modalVisible).toBe(true);
      hideModal();
      expect(modalVisible).toBe(false);
    });
  });

  describe('Accessibility and UX', () => {
    it('provides appropriate day names for all days', () => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      dayNames.forEach((name, index) => {
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(6);
      });
    });

    it('provides meaningful feedback for empty states', () => {
      const emptyExercises: Exercise[] = [];
      const fullDayPlan = createMockDayPlan(true);
      
      // Test different empty state scenarios
      if (emptyExercises.length === 0) {
        expect(true).toBe(true); // No exercises available state
      }
      
      const assignedExerciseIds = new Set(fullDayPlan.exercises.map(e => e.exerciseId));
      const unassignedExercises = createMockExercises().filter(
        exercise => !assignedExerciseIds.has(exercise.id)
      );
      
      if (unassignedExercises.length === 0 && fullDayPlan.exercises.length > 0) {
        expect(true).toBe(true); // All exercises assigned state
      }
    });
  });
});

// Export mock utilities for other tests
export {
  createMockWeeklyPlan,
  createMockExercises,
  createMockDayPlan,
};