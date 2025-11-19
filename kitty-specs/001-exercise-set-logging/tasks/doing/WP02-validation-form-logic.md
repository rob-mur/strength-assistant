---
work_package_id: WP02
title: Validation and Form Logic
lane: "doing"
subtasks:
  - T005: Create Zod validation schemas
  - T006: Write unit tests for Zod validation
  - T007: Write unit tests for form state management
  - T008: Implement form validation logic
  - T009: Set up React Hook Form with real-time validation
priority: Critical
dependencies: WP01
agent: "claude"
shell_pid: "20664"
history:
  - created: 2025-11-18
    author: Claude
    notes: Second work package for form validation infrastructure
---

# WP02: Validation and Form Logic

## Objective

Implement robust form validation using Zod schemas and React Hook Form integration with real-time feedback. This provides the foundation for user input validation with <200ms response time requirements.

## Context

Users need immediate feedback on form inputs with specific validation rules:
- Weight: float > 0, max 2000
- Reps: integer ≥ 1, max 100  
- RPE: 1.0 to 10.0, only 0.5 increments allowed

Form validation must be fast (<200ms) and provide clear error messages to maintain the <15 second set logging target.

## Detailed Guidance

### T005: Create Zod validation schemas
**File**: `lib/models/validation.ts`

Create comprehensive Zod schemas matching database constraints:

```typescript
import { z } from 'zod';

export const WorkoutSetValidation = z.object({
  weight: z.number()
    .positive('Weight must be positive')
    .min(0.1, 'Weight must be at least 0.1')
    .max(2000, 'Weight cannot exceed 2000'),
  
  repetitions: z.number()
    .int('Repetitions must be a whole number')
    .min(1, 'At least 1 repetition required')
    .max(100, 'Cannot exceed 100 repetitions'),
    
  rpe: z.number()
    .min(1.0, 'RPE must be at least 1.0')
    .max(10.0, 'RPE cannot exceed 10.0')
    .refine(
      (val) => val * 2 === Math.floor(val * 2),
      'RPE must be in 0.5 increments (e.g., 7.0, 7.5, 8.0)'
    ),
    
  exercise_id: z.string().uuid('Invalid exercise ID'),
  session_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
  )
});

export const UpdateWorkoutSetValidation = WorkoutSetValidation.partial()
  .omit({ exercise_id: true, session_date: true });

export type WorkoutSetFormData = z.infer<typeof WorkoutSetValidation>;
```

### T006: Write unit tests for Zod validation rules
**File**: `__tests__/unit/validation.test.ts`

Test all validation rules with boundary conditions:

```typescript
import { WorkoutSetValidation } from '../../lib/models/validation';

describe('WorkoutSet Validation', () => {
  describe('weight validation', () => {
    it('accepts valid weights', () => {
      expect(WorkoutSetValidation.parse({
        weight: 135.5,
        repetitions: 8,
        rpe: 7.0,
        exercise_id: '...',
        session_date: '2025-11-18'
      })).toMatchObject({ weight: 135.5 });
    });

    it('rejects negative weights', () => {
      expect(() => WorkoutSetValidation.parse({...validSet, weight: -5}))
        .toThrow('Weight must be positive');
    });
    
    // Test boundary conditions: 0.1, 2000, 2000.1
  });

  describe('RPE validation', () => {
    it('accepts valid RPE increments', () => {
      [1.0, 1.5, 2.0, 9.5, 10.0].forEach(rpe => {
        expect(() => WorkoutSetValidation.parse({...validSet, rpe}))
          .not.toThrow();
      });
    });

    it('rejects invalid increments', () => {
      [1.1, 2.3, 5.7].forEach(rpe => {
        expect(() => WorkoutSetValidation.parse({...validSet, rpe}))
          .toThrow('0.5 increments');
      });
    });
  });
});
```

### T007: Write unit tests for form state management
**File**: `__tests__/unit/form-state.test.ts`

Test form state behavior with React Hook Form:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutSetForm } from '../../lib/hooks/useWorkoutSetForm';

describe('useWorkoutSetForm', () => {
  it('provides default values from last set', () => {
    const lastSet = { weight: 135, repetitions: 8, rpe: 7.0 };
    const { result } = renderHook(() => useWorkoutSetForm({ lastSet }));
    
    expect(result.current.defaultValues).toEqual({
      weight: 135,
      repetitions: 8,
      rpe: undefined // RPE should be blank
    });
  });

  it('validates in real-time', async () => {
    const { result } = renderHook(() => useWorkoutSetForm());
    
    act(() => {
      result.current.setValue('weight', -5);
    });

    await waitFor(() => {
      expect(result.current.formState.errors.weight).toBeDefined();
    });
  });
});
```

### T008: Implement form validation logic
**File**: `lib/hooks/useWorkoutSetForm.ts`

Create custom hook combining Zod with React Hook Form:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WorkoutSetValidation, WorkoutSetFormData } from '../models/validation';

interface UseWorkoutSetFormProps {
  lastSet?: { weight: number; repetitions: number };
  onSubmit: (data: WorkoutSetFormData) => void;
}

export function useWorkoutSetForm({ lastSet, onSubmit }: UseWorkoutSetFormProps) {
  const defaultValues = {
    weight: lastSet?.weight || 0,
    repetitions: lastSet?.repetitions || 0,
    rpe: undefined, // Always start blank
    exercise_id: '', // Set from context
    session_date: new Date().toISOString().split('T')[0]
  };

  return useForm<WorkoutSetFormData>({
    resolver: zodResolver(WorkoutSetValidation),
    defaultValues,
    mode: 'onChange', // Real-time validation
    onSubmit
  });
}
```

### T009: Set up React Hook Form with real-time validation
**File**: `lib/components/WorkoutSetForm.tsx`

Integrate form validation with React Native Paper components:

```typescript
export function WorkoutSetForm({ onSubmit, lastSet }: WorkoutSetFormProps) {
  const { control, handleSubmit, formState: { errors, isValid } } = 
    useWorkoutSetForm({ lastSet, onSubmit });

  return (
    <View>
      <Controller
        control={control}
        name="weight"
        render={({ field: { onChange, value } }) => (
          <TextInput
            mode="outlined"
            label="Weight"
            value={value?.toString()}
            onChangeText={(text) => onChange(parseFloat(text) || 0)}
            error={!!errors.weight}
            helperText={errors.weight?.message}
            keyboardType="decimal-pad"
          />
        )}
      />
      
      {/* Similar for reps and RPE slider */}
      
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid}
      >
        Log Set
      </Button>
    </View>
  );
}
```

## Definition of Done

- [ ] Zod schemas validate all input rules correctly
- [ ] Unit tests cover all validation edge cases
- [ ] Form provides real-time feedback <200ms
- [ ] Error messages are user-friendly and specific
- [ ] Form integration works with React Native Paper
- [ ] TypeScript types are properly inferred
- [ ] Performance meets real-time validation requirements

## Testing Strategy

**Unit Testing:**
1. Test all Zod validation rules with edge cases
2. Test form state management with various inputs
3. Verify error message clarity and accuracy

**Integration Testing:**
1. Test form performance with rapid input changes
2. Verify React Native Paper integration
3. Test accessibility with screen readers

**Performance Testing:**
1. Measure validation response time (<200ms target)
2. Test with rapid successive inputs
3. Verify no memory leaks during validation

## Risk Mitigation

**Risk**: Validation performance bottlenecks
**Mitigation**: Use debounced validation, optimize Zod schemas

**Risk**: Complex RPE increment validation
**Mitigation**: Extensive testing with float precision edge cases

**Risk**: Poor error message UX
**Mitigation**: User testing of error message clarity

## Reviewer Guidance

**Pre-Review:**
- Run all unit tests successfully
- Test form manually with invalid inputs
- Verify performance with rapid input changes

**Review Checklist:**
- [ ] All validation rules match database constraints
- [ ] Error messages are clear and actionable
- [ ] Tests cover edge cases thoroughly
- [ ] Performance meets <200ms requirement
- [ ] TypeScript integration works correctly

**Manual Testing:**
- Try boundary values for each field
- Test rapid input changes
- Verify form accessibility

## Dependencies

**Requires**: WP01 (TypeScript interfaces)

## Follow-up Work Packages

- WP03: Local State Management (uses validation schemas)
- WP04: Core Set Logging (integrates validated forms)

## Activity Log

- 2025-11-19T16:15:06Z – claude – shell_pid=20664 – lane=doing – Started validation and form logic implementation
