/**
 * Unit Tests: Zod Validation Schemas
 *
 * Purpose: Test all validation rules with boundary conditions and edge cases
 * Coverage: Weight, repetitions, RPE validation with user-friendly error messages
 */

import {
  WorkoutSetValidation,
  UpdateWorkoutSetValidation,
  WorkoutSetFormValidation,
  validateWorkoutSet,
  validateWorkoutSetUpdate,
  isValidWorkoutSetData,
  isValidUpdateData,
  ValidationPatterns
} from '../../lib/models/validation';
import { WORKOUT_SET_CONSTRAINTS } from '../../lib/models/WorkoutSet';

describe('WorkoutSet Validation', () => {
  // Valid test data for reference
  const validWorkoutSet = {
    weight: 135.5,
    repetitions: 8,
    rpe: 7.0,
    exercise_id: '550e8400-e29b-41d4-a716-446655440000',
    session_date: '2025-11-19'
  };

  describe('weight validation', () => {
    it('accepts valid weights', () => {
      const result = WorkoutSetValidation.safeParse(validWorkoutSet);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weight).toBe(135.5);
      }
    });

    it('accepts minimum weight boundary', () => {
      const data = { ...validWorkoutSet, weight: WORKOUT_SET_CONSTRAINTS.weight.min };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts maximum weight boundary', () => {
      const data = { ...validWorkoutSet, weight: WORKOUT_SET_CONSTRAINTS.weight.max };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects negative weights', () => {
      const data = { ...validWorkoutSet, weight: -5 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('rejects zero weight', () => {
      const data = { ...validWorkoutSet, weight: 0 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('rejects weight below minimum', () => {
      const data = { ...validWorkoutSet, weight: 0.05 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least');
      }
    });

    it('rejects weight above maximum', () => {
      const data = { ...validWorkoutSet, weight: 2001 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exceed');
      }
    });

    it('rounds weight to 2 decimal places', () => {
      const data = { ...validWorkoutSet, weight: 135.567 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weight).toBe(135.57);
      }
    });

    it('rejects non-numeric weight', () => {
      const data = { ...validWorkoutSet, weight: 'heavy' };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('expected number');
      }
    });

    it('rejects missing weight', () => {
      const { weight, ...dataWithoutWeight } = validWorkoutSet;
      const result = WorkoutSetValidation.safeParse(dataWithoutWeight);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('undefined');
      }
    });
  });

  describe('repetitions validation', () => {
    it('accepts valid repetitions', () => {
      const data = { ...validWorkoutSet, repetitions: 12 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repetitions).toBe(12);
      }
    });

    it('accepts minimum repetitions boundary', () => {
      const data = { ...validWorkoutSet, repetitions: WORKOUT_SET_CONSTRAINTS.repetitions.min };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts maximum repetitions boundary', () => {
      const data = { ...validWorkoutSet, repetitions: WORKOUT_SET_CONSTRAINTS.repetitions.max };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects zero repetitions', () => {
      const data = { ...validWorkoutSet, repetitions: 0 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least');
      }
    });

    it('rejects negative repetitions', () => {
      const data = { ...validWorkoutSet, repetitions: -1 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least');
      }
    });

    it('rejects repetitions above maximum', () => {
      const data = { ...validWorkoutSet, repetitions: 101 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exceed');
      }
    });

    it('rejects decimal repetitions', () => {
      const data = { ...validWorkoutSet, repetitions: 8.5 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('whole number');
      }
    });

    it('rejects non-numeric repetitions', () => {
      const data = { ...validWorkoutSet, repetitions: 'eight' };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('expected number');
      }
    });
  });

  describe('RPE validation', () => {
    it('accepts valid RPE values', () => {
      const validRPEs = [1.0, 1.5, 2.0, 5.5, 7.0, 9.5, 10.0];
      
      validRPEs.forEach(rpe => {
        const data = { ...validWorkoutSet, rpe };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('accepts minimum RPE boundary', () => {
      const data = { ...validWorkoutSet, rpe: WORKOUT_SET_CONSTRAINTS.rpe.min };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts maximum RPE boundary', () => {
      const data = { ...validWorkoutSet, rpe: WORKOUT_SET_CONSTRAINTS.rpe.max };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects RPE below minimum', () => {
      const data = { ...validWorkoutSet, rpe: 0.5 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least');
      }
    });

    it('rejects RPE above maximum', () => {
      const data = { ...validWorkoutSet, rpe: 10.5 };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exceed');
      }
    });

    it('rejects invalid RPE increments', () => {
      const invalidRPEs = [1.1, 2.3, 5.7, 8.4, 9.9];
      
      invalidRPEs.forEach(rpe => {
        const data = { ...validWorkoutSet, rpe };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('0.5 increments');
        }
      });
    });

    it('handles floating point precision edge cases', () => {
      // Test values that might have floating point precision issues
      const precisionTestValues = [
        { value: 7.5, expected: true },
        { value: 0.1 + 0.2, expected: false }, // 0.30000000000000004
        { value: parseFloat('7.5'), expected: true },
        { value: 7.0 + 0.5, expected: true }
      ];

      precisionTestValues.forEach(({ value, expected }) => {
        const data = { ...validWorkoutSet, rpe: value };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(expected);
      });
    });

    it('rejects non-numeric RPE', () => {
      const data = { ...validWorkoutSet, rpe: 'hard' };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('expected number');
      }
    });
  });

  describe('exercise_id validation', () => {
    it('accepts valid UUID format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '12345678-1234-5678-9012-123456789012'
      ];

      validUUIDs.forEach(exercise_id => {
        const data = { ...validWorkoutSet, exercise_id };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000',
        'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
      ];

      invalidUUIDs.forEach(exercise_id => {
        const data = { ...validWorkoutSet, exercise_id };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid');
        }
      });
    });

    it('rejects missing exercise_id', () => {
      const { exercise_id, ...dataWithoutExerciseId } = validWorkoutSet;
      const result = WorkoutSetValidation.safeParse(dataWithoutExerciseId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('undefined');
      }
    });
  });

  describe('session_date validation', () => {
    it('accepts valid date format', () => {
      const data = { ...validWorkoutSet, session_date: '2025-11-19' };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = { ...validWorkoutSet, session_date: today };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      
      const data = { ...validWorkoutSet, session_date: futureDate };
      const result = WorkoutSetValidation.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('future');
      }
    });

    it('rejects invalid date formats', () => {
      const invalidFormats = [
        '11-19-2025',
        '2025/11/19',
        '19-11-2025',
        'Nov 19, 2025',
        '2025-13-01', // Invalid month
        '2025-11-32'  // Invalid day
      ];

      invalidFormats.forEach(session_date => {
        const data = { ...validWorkoutSet, session_date };
        const result = WorkoutSetValidation.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('rejects missing session_date', () => {
      const { session_date, ...dataWithoutDate } = validWorkoutSet;
      const result = WorkoutSetValidation.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('undefined');
      }
    });
  });

  describe('UpdateWorkoutSetValidation', () => {
    it('accepts partial updates with valid fields', () => {
      const updateData = {
        weight: 140,
        rpe: 8.5
      };
      const result = UpdateWorkoutSetValidation.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('accepts empty updates', () => {
      const result = UpdateWorkoutSetValidation.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid field values', () => {
      const updateData = {
        weight: -5,
        repetitions: 150
      };
      const result = UpdateWorkoutSetValidation.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it('excludes exercise_id and session_date', () => {
      const updateData = {
        weight: 140,
        exercise_id: '550e8400-e29b-41d4-a716-446655440000',
        session_date: '2025-11-19'
      };
      const result = UpdateWorkoutSetValidation.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('exercise_id');
        expect(result.data).not.toHaveProperty('session_date');
      }
    });
  });

  describe('WorkoutSetFormValidation', () => {
    it('handles string to number conversion', () => {
      const formData = {
        weight: '135.5',
        repetitions: '8',
        rpe: 7.0,
        exercise_id: '550e8400-e29b-41d4-a716-446655440000',
        session_date: '2025-11-19'
      };
      const result = WorkoutSetFormValidation.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weight).toBe(135.5);
        expect(result.data.repetitions).toBe(8);
      }
    });

    it('handles invalid string conversions', () => {
      const formData = {
        weight: 'invalid',
        repetitions: 'also invalid',
        rpe: 7.0,
        exercise_id: '550e8400-e29b-41d4-a716-446655440000',
        session_date: '2025-11-19'
      };
      const result = WorkoutSetFormValidation.safeParse(formData);
      expect(result.success).toBe(false);
    });
  });

  describe('validation helper functions', () => {
    describe('validateWorkoutSet', () => {
      it('returns success for valid data', () => {
        const result = validateWorkoutSet(validWorkoutSet);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(expect.objectContaining(validWorkoutSet));
        expect(result.errors).toBeUndefined();
      });

      it('returns field-specific errors for invalid data', () => {
        const invalidData = {
          weight: -5,
          repetitions: 0,
          rpe: 11,
          exercise_id: 'invalid',
          session_date: 'invalid'
        };
        
        const result = validateWorkoutSet(invalidData);
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.errors).toBeDefined();
        expect(Object.keys(result.errors!)).toEqual(
          expect.arrayContaining(['weight', 'repetitions', 'rpe', 'exercise_id', 'session_date'])
        );
      });

      it('handles unexpected validation errors gracefully', () => {
        const result = validateWorkoutSet(null);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('validateWorkoutSetUpdate', () => {
      it('returns success for valid partial update', () => {
        const updateData = { weight: 140 };
        const result = validateWorkoutSetUpdate(updateData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(updateData);
      });

      it('returns errors for invalid update data', () => {
        const invalidUpdate = { weight: -5 };
        const result = validateWorkoutSetUpdate(invalidUpdate);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.weight).toContain('at least');
      });
    });

    describe('type guards', () => {
      it('isValidWorkoutSetData returns true for valid data', () => {
        expect(isValidWorkoutSetData(validWorkoutSet)).toBe(true);
      });

      it('isValidWorkoutSetData returns false for invalid data', () => {
        expect(isValidWorkoutSetData({ weight: -5 })).toBe(false);
      });

      it('isValidUpdateData returns true for valid updates', () => {
        expect(isValidUpdateData({ weight: 140 })).toBe(true);
        expect(isValidUpdateData({})).toBe(true);
      });

      it('isValidUpdateData returns false for invalid updates', () => {
        expect(isValidUpdateData({ weight: -5 })).toBe(false);
      });
    });
  });

  describe('ValidationPatterns', () => {
    it('positiveDecimal validates correctly', () => {
      expect(ValidationPatterns.positiveDecimal.safeParse(135.5).success).toBe(true);
      expect(ValidationPatterns.positiveDecimal.safeParse(-5).success).toBe(false);
    });

    it('positiveInteger validates correctly', () => {
      expect(ValidationPatterns.positiveInteger.safeParse(8).success).toBe(true);
      expect(ValidationPatterns.positiveInteger.safeParse(8.5).success).toBe(false);
      expect(ValidationPatterns.positiveInteger.safeParse(-8).success).toBe(false);
    });

    it('uuid validates correctly', () => {
      expect(ValidationPatterns.uuid.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      expect(ValidationPatterns.uuid.safeParse('invalid').success).toBe(false);
    });

    it('rpeIncrement validates correctly', () => {
      expect(ValidationPatterns.rpeIncrement.safeParse(7.5).success).toBe(true);
      expect(ValidationPatterns.rpeIncrement.safeParse(7.3).success).toBe(false);
    });
  });
});