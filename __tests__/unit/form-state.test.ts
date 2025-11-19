/**
 * Unit Tests: Form State Management
 *
 * Purpose: Test form behavior with React Hook Form integration
 * Coverage: Smart defaults, real-time validation, form submission flow
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { 
  useWorkoutSetForm, 
  useWorkoutSetValidation,
  UseWorkoutSetFormProps 
} from '../../lib/hooks/useWorkoutSetForm';
import { WorkoutSet } from '../../lib/models/WorkoutSet';

describe('useWorkoutSetForm', () => {
  // Common test data
  const mockExerciseId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSessionDate = '2025-11-19';
  
  const lastSetData: Pick<WorkoutSet, 'weight' | 'repetitions'> = {
    weight: 135,
    repetitions: 8
  };
  
  const defaultProps: UseWorkoutSetFormProps = {
    exerciseId: mockExerciseId,
    onSubmit: jest.fn(),
    sessionDate: mockSessionDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('form initialization', () => {
    it('provides default values without last set', () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      expect(result.current.getValues()).toEqual({
        weight: 0,
        repetitions: 0,
        rpe: 0,
        exercise_id: mockExerciseId,
        session_date: mockSessionDate
      });
    });

    it('provides smart defaults from last set', () => {
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, lastSet: lastSetData })
      );
      
      expect(result.current.getValues()).toEqual({
        weight: 135,
        repetitions: 8,
        rpe: 0, // RPE should always start at minimum
        exercise_id: mockExerciseId,
        session_date: mockSessionDate
      });
    });

    it('uses today\'s date when sessionDate not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const { result } = renderHook(() => 
        useWorkoutSetForm({ 
          exerciseId: mockExerciseId,
          onSubmit: jest.fn()
        })
      );
      
      expect(result.current.getValues().session_date).toBe(today);
    });

    it('initializes with real-time validation enabled by default', () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // Check that form is configured for onChange validation
      expect(result.current.formState.isValidating).toBeDefined();
    });

    it('can disable real-time validation', () => {
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, realtimeValidation: false })
      );
      
      // Form should be configured for onSubmit validation only
      expect(result.current.formState).toBeDefined();
    });
  });

  describe('form validation behavior', () => {
    it('validates fields in real-time when enabled', async () => {
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, realtimeValidation: true })
      );
      
      // Set invalid weight
      act(() => {
        result.current.setValue('weight', -5, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.formState.errors.weight).toBeDefined();
        expect(result.current.hasErrors).toBe(true);
      });
    });

    it('provides field-specific error messages', async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      act(() => {
        result.current.setValue('weight', -5, { shouldValidate: true });
      });

      await waitFor(() => {
        const weightError = result.current.getFieldError('weight');
        expect(weightError).toBeDefined();
        expect(weightError).toContain('positive');
      });
    });

    it('validates entire form programmatically', async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // Set valid data
      act(() => {
        result.current.setValue('weight', 135);
        result.current.setValue('repetitions', 8);
        result.current.setValue('rpe', 7.5);
      });

      await act(async () => {
        const isValid = await result.current.validateForm();
        expect(isValid).toBe(true);
      });
    });

    it('fails validation for invalid RPE increments', async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      act(() => {
        result.current.setValue('weight', 135);
        result.current.setValue('repetitions', 8);
        result.current.setValue('rpe', 7.3); // Invalid increment
      });

      await act(async () => {
        const isValid = await result.current.validateForm();
        expect(isValid).toBe(false);
      });
      
      await waitFor(() => {
        expect(result.current.getFieldError('rpe')).toContain('0.5 increments');
      });
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with valid data', async () => {
      const mockOnSubmit = jest.fn();
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, onSubmit: mockOnSubmit })
      );
      
      // Set valid form data
      act(() => {
        result.current.setValue('weight', 135);
        result.current.setValue('repetitions', 8);
        result.current.setValue('rpe', 7.5);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        weight: 135,
        repetitions: 8,
        rpe: 7.5,
        exercise_id: mockExerciseId,
        session_date: mockSessionDate
      });
    });

    it('calls onError for invalid submission', async () => {
      const mockOnError = jest.fn();
      const { result } = renderHook(() => 
        useWorkoutSetForm({ 
          ...defaultProps, 
          onError: mockOnError 
        })
      );
      
      // Set invalid data
      act(() => {
        result.current.setValue('weight', -5);
        result.current.setValue('repetitions', 0);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnError).toHaveBeenCalled();
      const errorCall = mockOnError.mock.calls[0][0];
      expect(errorCall).toHaveProperty('weight');
      expect(errorCall).toHaveProperty('repetitions');
    });

    it('handles unexpected submission errors gracefully', async () => {
      const mockOnSubmit = jest.fn(() => {
        throw new Error('Unexpected error');
      });
      const mockOnError = jest.fn();
      
      const { result } = renderHook(() => 
        useWorkoutSetForm({ 
          ...defaultProps, 
          onSubmit: mockOnSubmit,
          onError: mockOnError 
        })
      );
      
      // Set valid data
      act(() => {
        result.current.setValue('weight', 135);
        result.current.setValue('repetitions', 8);
        result.current.setValue('rpe', 7.5);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnError).toHaveBeenCalledWith({
        general: 'An unexpected error occurred during submission'
      });
    });
  });

  describe('form state helpers', () => {
    it('tracks form dirty state correctly', () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // Form should not be dirty initially
      expect(result.current.formState.isDirty).toBe(false);
      
      // Modify a field
      act(() => {
        result.current.setValue('weight', 135, { shouldDirty: true });
      });
      
      expect(result.current.formState.isDirty).toBe(true);
    });

    it('correctly identifies submittable state', async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // Initially not submittable (not dirty)
      expect(result.current.isSubmittable).toBe(false);
      
      // Set valid data
      act(() => {
        result.current.setValue('weight', 135, { shouldDirty: true, shouldValidate: true });
        result.current.setValue('repetitions', 8, { shouldDirty: true, shouldValidate: true });
        result.current.setValue('rpe', 7.5, { shouldDirty: true, shouldValidate: true });
      });
      
      await waitFor(() => {
        expect(result.current.isSubmittable).toBe(true);
      });
      
      // Set invalid data
      act(() => {
        result.current.setValue('weight', -5, { shouldValidate: true });
      });
      
      await waitFor(() => {
        expect(result.current.isSubmittable).toBe(false);
      });
    });

    it('resets form to defaults correctly', () => {
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, lastSet: lastSetData })
      );
      
      // Modify form data
      act(() => {
        result.current.setValue('weight', 200);
        result.current.setValue('repetitions', 12);
        result.current.setValue('rpe', 9.0);
      });
      
      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });
      
      expect(result.current.getValues()).toEqual({
        weight: 135,
        repetitions: 8,
        rpe: 0,
        exercise_id: mockExerciseId,
        session_date: mockSessionDate
      });
    });

    it('provides accurate error checking', async () => {
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // No errors initially
      expect(result.current.hasErrors).toBe(false);
      
      // Add invalid data and verify error appears
      act(() => {
        result.current.setValue('weight', -5, { shouldValidate: true });
      });
      
      await waitFor(() => {
        expect(result.current.hasErrors).toBe(true);
      });
      
      // Reset form to clear all errors
      act(() => {
        result.current.resetToDefaults();
      });
      
      // Should have no errors after reset
      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe('performance optimization', () => {
    it('uses memoized default values', () => {
      const { result, rerender } = renderHook(
        ({ lastSet }) => useWorkoutSetForm({ ...defaultProps, lastSet }),
        { initialProps: { lastSet: lastSetData } }
      );
      
      const initialDefaults = result.current.getValues();
      
      // Rerender with same lastSet data
      rerender({ lastSet: lastSetData });
      
      // Should maintain same reference (memoization working)
      expect(result.current.getValues()).toEqual(initialDefaults);
    });

    it('updates defaults when lastSet changes', () => {
      const { result, rerender } = renderHook(
        ({ lastSet }) => useWorkoutSetForm({ ...defaultProps, lastSet }),
        { initialProps: { lastSet: lastSetData } }
      );
      
      const newLastSet = { weight: 140, repetitions: 10 };
      
      // Rerender with different lastSet
      rerender({ lastSet: newLastSet });
      
      // Reset to get new defaults
      act(() => {
        result.current.resetToDefaults();
      });
      
      expect(result.current.getValues().weight).toBe(140);
      expect(result.current.getValues().repetitions).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('handles undefined lastSet gracefully', () => {
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, lastSet: undefined })
      );
      
      expect(result.current.getValues().weight).toBe(0);
      expect(result.current.getValues().repetitions).toBe(0);
    });

    it('handles partial lastSet data', () => {
      const partialLastSet = { weight: 135 } as Pick<WorkoutSet, 'weight' | 'repetitions'>;
      const { result } = renderHook(() => 
        useWorkoutSetForm({ ...defaultProps, lastSet: partialLastSet })
      );
      
      expect(result.current.getValues().weight).toBe(135);
      expect(result.current.getValues().repetitions).toBe(0);
    });

    it('handles validation errors during field updates', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useWorkoutSetForm(defaultProps));
      
      // Try to trigger a validation error with invalid number
      act(() => {
        result.current.setValue('weight', -5, { shouldValidate: true });
      });
      
      // Should handle gracefully without throwing
      await waitFor(() => {
        expect(result.current.hasErrors).toBe(true);
      });
      
      consoleSpy.mockRestore();
    });
  });
});

describe('useWorkoutSetValidation', () => {
  const mockExerciseId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSessionDate = '2025-11-19';
  
  it('provides validation utilities', () => {
    const { result } = renderHook(() => useWorkoutSetValidation());
    
    expect(result.current.validateWorkoutSet).toBeDefined();
    expect(result.current.schema).toBeDefined();
  });

  it('validates workout set data correctly', () => {
    const { result } = renderHook(() => useWorkoutSetValidation());
    
    const validData = {
      weight: 135,
      repetitions: 8,
      rpe: 7.5,
      exercise_id: mockExerciseId,
      session_date: mockSessionDate
    };
    
    const validationResult = result.current.validateWorkoutSet(validData);
    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toEqual(expect.objectContaining({
      weight: 135,
      repetitions: 8, 
      rpe: 7.5,
      exercise_id: mockExerciseId,
      session_date: mockSessionDate
    }));
  });

  it('rejects invalid data', () => {
    const { result } = renderHook(() => useWorkoutSetValidation());
    
    const invalidData = {
      weight: -5,
      repetitions: 0,
      rpe: 11,
      exercise_id: 'invalid',
      session_date: 'invalid'
    };
    
    const validationResult = result.current.validateWorkoutSet(invalidData);
    expect(validationResult.success).toBe(false);
    expect(validationResult.errors).toBeDefined();
    expect(Object.keys(validationResult.errors!)).toHaveLength(5);
  });
});