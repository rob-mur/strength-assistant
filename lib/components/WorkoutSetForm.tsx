/**
 * Exercise Set Logging: Workout Set Form Component
 *
 * Purpose: React Native Paper form with real-time validation for workout set logging
 * Features: Smart defaults, <15 second target logging time, optimized user experience
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  TextInput, 
  Button, 
  HelperText, 
  Card,
  Title,
  Paragraph,
  useTheme 
} from 'react-native-paper';
import { Controller } from 'react-hook-form';
import { useWorkoutSetForm } from '../hooks/useWorkoutSetForm';
import { WorkoutSetFormInput } from '../models/validation';
import { WorkoutSet } from '../models/WorkoutSet';

/**
 * Props for the WorkoutSetForm component
 */
interface WorkoutSetFormProps {
  /** Exercise ID for the current workout session */
  exerciseId: string;
  
  /** Previous set data for smart defaults */
  lastSet?: Pick<WorkoutSet, 'weight' | 'repetitions'>;
  
  /** Callback fired when form is successfully submitted */
  onSubmit: (data: WorkoutSetFormInput) => void;
  
  /** Callback fired when validation or submission fails */
  onError?: (errors: Record<string, string>) => void;
  
  /** Custom session date override */
  sessionDate?: string;
  
  /** Whether to show form header with set count */
  showHeader?: boolean;
  
  /** Current set number for display */
  setNumber?: number;
  
  /** Whether the form is submitting */
  isSubmitting?: boolean;
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
  lastSet,
  onSubmit,
  onError,
  sessionDate,
  showHeader = true,
  setNumber,
  isSubmitting = false
}: WorkoutSetFormProps) {
  const theme = useTheme();
  
  /**
   * Initialize form with validation and smart defaults
   */
  const {
    form: { control, formState: { errors, isDirty } },
    handleSubmit,
    resetToDefaults,
    isSubmittable,
    hasErrors
  } = useWorkoutSetForm({
    exerciseId,
    lastSet,
    onSubmit,
    onError,
    sessionDate,
    realtimeValidation: true // Enable real-time validation for immediate feedback
  });
  
  /**
   * Handle form submission with loading state
   */
  const handleFormSubmit = useCallback(async () => {
    if (!isSubmittable || isSubmitting) return;
    await handleSubmit();
  }, [isSubmittable, isSubmitting, handleSubmit]);
  
  /**
   * Handle form reset to defaults
   */
  const handleReset = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  return (
    <Card style={styles.container} mode="outlined">
      {showHeader && (
        <Card.Content style={styles.header}>
          <Title style={[styles.title, { color: theme.colors.primary }]}>
            {setNumber ? `Set ${setNumber}` : 'Log Set'}
          </Title>
          {lastSet && (
            <Paragraph style={styles.subtitle}>
              Last: {lastSet.weight}kg × {lastSet.repetitions} reps
            </Paragraph>
          )}
        </Card.Content>
      )}
      
      <Card.Content style={styles.formContent}>
        {/* Weight Input */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  mode="outlined"
                  label="Weight (kg)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => {
                    const numericValue = parseFloat(text) || 0;
                    onChange(numericValue);
                  }}
                  onBlur={onBlur}
                  error={!!errors.weight}
                  keyboardType="decimal-pad"
                  autoComplete="off"
                  returnKeyType="next"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  right={<TextInput.Affix text="kg" />}
                />
                {errors.weight && (
                  <HelperText type="error" visible={!!errors.weight}>
                    {errors.weight.message}
                  </HelperText>
                )}
              </>
            )}
          />
        </View>

        {/* Repetitions Input */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="repetitions"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  mode="outlined"
                  label="Repetitions"
                  value={value?.toString() || ''}
                  onChangeText={(text) => {
                    const numericValue = parseInt(text, 10) || 0;
                    onChange(numericValue);
                  }}
                  onBlur={onBlur}
                  error={!!errors.repetitions}
                  keyboardType="number-pad"
                  autoComplete="off"
                  returnKeyType="next"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  right={<TextInput.Affix text="reps" />}
                />
                {errors.repetitions && (
                  <HelperText type="error" visible={!!errors.repetitions}>
                    {errors.repetitions.message}
                  </HelperText>
                )}
              </>
            )}
          />
        </View>

        {/* RPE Input */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="rpe"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  mode="outlined"
                  label="RPE (1.0 - 10.0)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => {
                    const numericValue = parseFloat(text) || 0;
                    // Round to nearest 0.5 for RPE validation
                    const rounded = Math.round(numericValue * 2) / 2;
                    onChange(rounded);
                  }}
                  onBlur={onBlur}
                  error={!!errors.rpe}
                  keyboardType="decimal-pad"
                  autoComplete="off"
                  returnKeyType="done"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  right={<TextInput.Affix text="RPE" />}
                  placeholder="e.g., 7.5"
                />
                {errors.rpe ? (
                  <HelperText type="error" visible={!!errors.rpe}>
                    {errors.rpe.message}
                  </HelperText>
                ) : (
                  <HelperText type="info" visible>
                    Rate of Perceived Exertion (1.0 = very easy, 10.0 = maximum effort)
                  </HelperText>
                )}
              </>
            )}
          />
        </View>
      </Card.Content>

      <Card.Actions style={styles.actions}>
        {/* Reset Button */}
        <Button
          mode="outlined"
          onPress={handleReset}
          disabled={!isDirty || isSubmitting}
          style={styles.resetButton}
        >
          Reset
        </Button>
        
        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleFormSubmit}
          disabled={!isSubmittable || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {isSubmitting ? 'Logging...' : 'Log Set'}
        </Button>
      </Card.Actions>

      {/* Form Status Indicator */}
      {hasErrors && (
        <Card.Content style={styles.statusContainer}>
          <HelperText type="error" visible>
            Please fix the errors above before submitting
          </HelperText>
        </Card.Content>
      )}
    </Card>
  );
}

/**
 * Styles for the WorkoutSetForm component
 */
const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2
  },
  header: {
    paddingBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7
  },
  formContent: {
    paddingTop: 8
  },
  inputContainer: {
    marginBottom: 16
  },
  input: {
    marginBottom: 4
  },
  inputContent: {
    fontSize: 16
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  resetButton: {
    flex: 0.4
  },
  submitButton: {
    flex: 0.55
  },
  submitButtonContent: {
    height: 48,
    justifyContent: 'center'
  },
  statusContainer: {
    paddingTop: 0,
    paddingBottom: 16
  }
});

/**
 * Default export
 */
export default WorkoutSetForm;