/**
 * Exercise Set Logging: Workout Set Form Component
 *
 * Purpose: React Native Paper form with real-time validation for workout set logging
 * Features: Smart defaults, <15 second target logging time, optimized user experience
 */

import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Button, Card } from "react-native-paper";
import { useWorkoutSetForm } from "../hooks/useWorkoutSetForm";
import { WeightInput } from "./WeightInput";
import { RepsInput } from "./RepsInput";
import { RPESlider } from "./RPESlider";
import { createWorkoutSet } from "../repo/supabase/workoutSets";

/**
 * Props for the WorkoutSetForm component
 */
interface WorkoutSetFormProps {
  /** Exercise ID for the current workout session */
  exerciseId: string;

  /** Callback fired when form is successfully submitted and set is logged */
  onSetLogged: () => void;

  /** Custom session date override */
  sessionDate?: string;
}

/**
 * Workout Set Form Component
 *
 * Provides a complete form for logging workout sets with:
 * - Weight input with decimal support
 * - Repetitions input (integer only)
 * - RPE slider with 0.5 increments
 * - Real-time validation feedback
 * - Smart default values from previous set
 * - Optimized for <15 second logging target
 */
export function WorkoutSetForm({
  exerciseId,
  onSetLogged,
  sessionDate,
}: WorkoutSetFormProps) {
  /**
   * Initialize form with validation and smart defaults
   */
  const {
    form: { control, reset, formState },
    getDefaultValues,
    submitForm,
  } = useWorkoutSetForm({
    exerciseId,
    sessionDate,
    onSubmit: async (data) => {
      await createWorkoutSet({
        ...data,
        exercise_id: exerciseId,
        session_date: sessionDate || new Date().toISOString().split("T")[0],
      });
      onSetLogged();
      reset(getDefaultValues()); // Reset with new defaults after successful submission
    },
  });

  const handleFormSubmit = useCallback(() => {
    submitForm();
  }, [submitForm]);

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.formContent}>
        <WeightInput control={control} error={formState.errors.weight} />
        <RepsInput control={control} error={formState.errors.repetitions} />
        <RPESlider control={control} error={formState.errors.rpe} />

        <Button
          mode="contained"
          onPress={handleFormSubmit}
          disabled={!formState.isValid || formState.isSubmitting}
          loading={formState.isSubmitting}
          style={styles.submitButton}
        >
          Log Set
        </Button>
      </Card.Content>
    </Card>
  );
}

/**
 * Styles for the WorkoutSetForm component
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  formContent: {
    gap: 8,
  },
  submitButton: {
    marginTop: 16,
  },
});

/**
 * Default export
 */
export default WorkoutSetForm;
