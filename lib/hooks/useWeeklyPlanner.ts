import { useState } from 'react';
import { useObservable } from '@legendapp/state/react';
import { weeklyPlan$ } from '../data/legend-state/WeeklyPlanStore';
import { weeklyPlanActions } from '../data/legend-state/WeeklyPlanActions';
import { useAuth } from './useAuth';
import { useExercises } from './useExercises';
import type { WeeklyPlan, DayPlan } from '../models/ExerciseSchedule';

export interface UseWeeklyPlannerReturn {
  // State
  weeklyPlan: WeeklyPlan;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  selectedDay: number | null;
  calendarExpanded: boolean;
  
  // Actions
  assignExerciseToDay: (exerciseId: string, dayOfWeek: number) => Promise<void>;
  removeExerciseFromDay: (scheduleId: string) => Promise<void>;
  clearDay: (dayOfWeek: number) => Promise<void>;
  
  // UI Actions
  selectDay: (dayOfWeek: number | null) => void;
  toggleCalendar: () => void;
  
  // Helpers
  getDayPlan: (dayOfWeek: number) => DayPlan;
  hasAnyExercises: boolean;
}

export const useWeeklyPlanner = (): UseWeeklyPlannerReturn => {
  const { user } = useAuth();
  const { exercises } = useExercises(user?.uid || '');
  
  // Observable state
  const weeklyPlan = useObservable(weeklyPlan$).get();
  
  // Local UI state  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has any exercises created
  const hasAnyExercises = exercises.length > 0;

  const handleError = (error: Error | unknown, context: string) => {
    console.error(`Weekly planner error (${context}):`, error);
    setError(error instanceof Error ? error.message : 'An error occurred');
  };

  const assignExerciseToDay = async (exerciseId: string, dayOfWeek: number) => {
    try {
      setError(null);
      await weeklyPlanActions.assignExerciseToDay(exerciseId, dayOfWeek);
    } catch (err) {
      handleError(err, 'assign exercise');
      throw err; // Re-throw for UI handling
    }
  };

  const removeExerciseFromDay = async (scheduleId: string) => {
    try {
      setError(null);  
      await weeklyPlanActions.removeExerciseFromDay(scheduleId);
    } catch (err) {
      handleError(err, 'remove exercise');
      throw err;
    }
  };

  const clearDay = async (dayOfWeek: number) => {
    try {
      setError(null);
      await weeklyPlanActions.clearDay(dayOfWeek);
    } catch (err) {
      handleError(err, 'clear day');
      throw err;
    }
  };

  const getDayPlan = (dayOfWeek: number): DayPlan => {
    return weeklyPlan.days[dayOfWeek] || { 
      dayOfWeek, 
      exercises: [], 
      hasExercises: false 
    };
  };

  return {
    // State
    weeklyPlan,
    isLoading,
    error,
    
    // UI State
    selectedDay,
    calendarExpanded,
    
    // Actions
    assignExerciseToDay,
    removeExerciseFromDay, 
    clearDay,
    
    // UI Actions
    selectDay: setSelectedDay,
    toggleCalendar: () => setCalendarExpanded(!calendarExpanded),
    
    // Helpers
    getDayPlan,
    hasAnyExercises,
  };
};