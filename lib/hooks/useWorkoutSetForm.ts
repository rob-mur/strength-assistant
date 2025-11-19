/**
 * Exercise Set Logging: Form Validation Hook
 *
 * Purpose: React Hook Form integration with Zod validation for workout sets
 * Features: Real-time validation, smart defaults, performance optimization
 */

import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { 
  WorkoutSetValidation, 
  WorkoutSetFormInput,
  validateWorkoutSet 
} from '../models/validation';
import { WorkoutSet } from '../models/WorkoutSet';

/**
 * Props for the workout set form hook
 */
interface UseWorkoutSetFormProps {
  /** Previous set data for smart defaults (weight and reps only) */
  lastSet?: Pick<WorkoutSet, 'weight' | 'repetitions'>;
  
  /** Exercise ID for the current workout session */
  exerciseId: string;
  
  /** Callback fired when form is successfully submitted */
  onSubmit: (data: WorkoutSetFormInput) => void;
  
  /** Callback fired when validation fails */
  onError?: (errors: Record<string, string>) => void;
  
  /** Custom session date override (defaults to today) */
  sessionDate?: string;
  
  /** Whether to enable real-time validation (default: true) */
  realtimeValidation?: boolean;
}

/**
 * Return type for the workout set form hook
 */
interface UseWorkoutSetFormReturn {
  /** React Hook Form methods and state */
  form: UseFormReturn<WorkoutSetFormInput>;
  
  /** Submit handler with validation */
  handleSubmit: () => Promise<void>;
  
  /** Quick validation check without full form submission */
  validateForm: () => Promise<boolean>;
  
  /** Reset form to default values */
  resetToDefaults: () => void;
  
  /** Check if form has any errors */
  hasErrors: boolean;
  
  /** Get error message for a specific field */
  getFieldError: (field: keyof WorkoutSetFormInput) => string | undefined;
  
  /** Check if form is ready for submission */
  isSubmittable: boolean;
  
  /** Get form values */
  getValues: () => WorkoutSetFormInput;
  
  /** Set form field value */
  setValue: (field: keyof WorkoutSetFormInput, value: number | string) => void;
  
  /** Get form state */
  formState: UseFormReturn<WorkoutSetFormInput>['formState'];
}

/**
 * Custom hook for managing workout set form state with validation
 * 
 * Provides real-time validation, smart defaults, and optimized performance
 * for the <15 second set logging requirement.
 */
export function useWorkoutSetForm({
  lastSet,
  exerciseId,
  onSubmit,
  onError,
  sessionDate,
  realtimeValidation = true
}: UseWorkoutSetFormProps): UseWorkoutSetFormReturn {
  
  /**
   * Generate smart default values from previous set
   * RPE always starts blank for user input
   */
  const defaultValues = useMemo((): WorkoutSetFormInput => {
    const today = sessionDate || new Date().toISOString().split('T')[0];
    
    return {
      weight: lastSet?.weight || 0,
      repetitions: lastSet?.repetitions || 0,
      rpe: 0, // Start with minimum RPE, user must adjust
      exercise_id: exerciseId,
      session_date: today
    };
  }, [lastSet?.weight, lastSet?.repetitions, exerciseId, sessionDate]);
  
  /**
   * Configure React Hook Form with Zod validation
   */
  const form = useForm<WorkoutSetFormInput>({
    resolver: zodResolver(WorkoutSetValidation),
    defaultValues,
    mode: realtimeValidation ? 'onChange' : 'onSubmit',
    criteriaMode: 'firstError', // Show first error only for performance
    shouldFocusError: true,
    shouldUseNativeValidation: false
  });
  
  const { 
    handleSubmit: rhfHandleSubmit, 
    formState: { errors, isValid, isDirty },
    reset,
    trigger,
    setError,
    clearErrors
  } = form;
  
  /**
   * Enhanced submit handler with custom validation feedback
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    try {
      // Clear any previous errors
      clearErrors();
      
      // Use React Hook Form's built-in submit handler
      await rhfHandleSubmit(
        (data: WorkoutSetFormInput) => {
          // Double-check with our validation helper for consistency
          const validationResult = validateWorkoutSet(data);
          
          if (validationResult.success) {
            onSubmit(data);
          } else {
            // Set field-specific errors if validation fails
            Object.entries(validationResult.errors || {}).forEach(([field, message]) => {
              setError(field as keyof WorkoutSetFormInput, {
                type: 'validation',
                message
              });
            });
            
            onError?.(validationResult.errors || {});
          }
        },
        (formErrors) => {
          // Handle React Hook Form validation errors
          const errorMessages: Record<string, string> = {};
          Object.entries(formErrors).forEach(([field, error]) => {
            if (error?.message) {
              errorMessages[field] = error.message;
            }
          });
          
          onError?.(errorMessages);
        }
      )();
    } catch (error) {
      // Handle unexpected submission errors
      console.error('Form submission error:', error);
      onError?.({ general: 'An unexpected error occurred during submission' });
    }
  }, [rhfHandleSubmit, onSubmit, onError, setError, clearErrors]);
  
  /**
   * Validate form without submitting
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    try {
      return await trigger();
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  }, [trigger]);
  
  /**
   * Reset form to smart default values
   */
  const resetToDefaults = useCallback(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);
  
  /**
   * Check if form has any validation errors
   */
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);
  
  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback((field: keyof WorkoutSetFormInput): string | undefined => {
    return errors[field]?.message;
  }, [errors]);
  
  /**
   * Check if form is ready for submission
   * Must be valid, have required data, and be different from defaults
   */
  const isSubmittable = useMemo(() => {
    return isValid && isDirty && !hasErrors;
  }, [isValid, isDirty, hasErrors]);
  
  return {
    form,
    handleSubmit,
    validateForm,
    resetToDefaults,
    hasErrors,
    getFieldError,
    isSubmittable,
    getValues: form.getValues,
    setValue: form.setValue,
    formState: form.formState
  };
}

/**
 * Helper hook for workout set form validation only
 * Useful for components that need validation without full form management
 */
export function useWorkoutSetValidation() {
  return useMemo(() => ({
    validateWorkoutSet,
    schema: WorkoutSetValidation
  }), []);
}

/**
 * Type exports for component usage
 */
export type { UseWorkoutSetFormProps, UseWorkoutSetFormReturn };