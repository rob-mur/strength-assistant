import { StyleProp, ViewStyle } from "react-native";

/**
 * Props interface for the EmptyWorkoutState component
 */
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
   * Defaults to 'empty-workout-state'
   */
  testID?: string;
}

/**
 * Contract interface defining the required structure for EmptyWorkoutState component
 */
export interface EmptyWorkoutStateContract {
  component: React.ComponentType<EmptyWorkoutStateProps>;

  /**
   * Required testIDs for integration testing
   */
  testIds: {
    container: "empty-workout-state";
    selectButton: "select-exercise-button";
    createButton: "create-exercise-button";
  };

  /**
   * Required text content structure
   */
  content: {
    headline: string; // Primary motivational message
    body: string; // Descriptive instructions
    selectButtonText: string; // "Browse Exercises"
    createButtonText: string; // "Create New Exercise"
  };
}

/**
 * Integration contract with WorkoutScreen
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
  emptyStateProps: Omit<EmptyWorkoutStateProps, "style">;
}
