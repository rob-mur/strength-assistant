/**
 * Contract: EmptyWorkoutState Component
 * 
 * Defines the interface for the empty state component used when
 * no exercise is selected on the workout screen.
 */

import { StyleProp, ViewStyle } from 'react-native';

export interface EmptyWorkoutStateProps {
  /**
   * Callback function triggered when user wants to select an existing exercise
   * Should navigate to exercise selection screen
   */
  onSelectExercise: () => void;

  /**
   * Callback function triggered when user wants to create a new exercise
   * Should navigate to exercise creation screen
   */
  onCreateExercise: () => void;

  /**
   * Optional custom styling for the empty state container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Optional test identifier for integration testing
   */
  testID?: string;
}

/**
 * Component Requirements:
 * - Must render motivational headline text
 * - Must render descriptive body text explaining next steps
 * - Must include two action buttons (Browse/Create)
 * - Must be responsive across device sizes
 * - Must integrate with app theme (light/dark mode)
 * - Must include proper accessibility labels
 * - Must include testID props for Maestro testing
 */
export interface EmptyWorkoutStateContract {
  component: React.ComponentType<EmptyWorkoutStateProps>;
  
  /**
   * Required testIDs for integration testing
   */
  testIds: {
    container: 'empty-workout-state';
    selectButton: 'select-exercise-button'; 
    createButton: 'create-exercise-button';
  };

  /**
   * Required text content structure
   */
  content: {
    headline: string; // Primary motivational message
    body: string;     // Descriptive instructions
    selectButtonText: string;  // "Browse Exercises"
    createButtonText: string;  // "Create New Exercise"
  };
}

/**
 * Integration Contract with WorkoutScreen
 */
export interface WorkoutScreenEmptyStateIntegration {
  /**
   * Condition for showing empty state
   */
  showEmptyState: (exercise: string | null | undefined) => boolean;

  /**
   * Navigation handlers
   */
  handlers: {
    navigateToExercises: () => void;
    navigateToAddExercise: () => void;
  };

  /**
   * Props passed to EmptyWorkoutState component
   */
  emptyStateProps: Omit<EmptyWorkoutStateProps, 'style'>;
}