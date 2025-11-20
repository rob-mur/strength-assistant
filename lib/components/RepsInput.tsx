/**
 * Exercise Set Logging: Reps Input Component
 *
 * Purpose: React Native Paper TextInput for repetition entry with React Hook Form integration
 * Features: Integer-only input, auto-focus, validation display, optimized for quick data entry
 */

import React from "react";
import { Controller, Control, FieldError } from "react-hook-form";
import { TextInput } from "react-native-paper";
import { WorkoutSetFormInput } from "../models/validation";

interface RepsInputProps {
  control: Control<WorkoutSetFormInput>;
  error?: FieldError;
}

export function RepsInput({ control, error }: RepsInputProps) {
  return (
    <Controller
      control={control}
      name="repetitions"
      render={({ field: { onChange, value } }) => (
        <TextInput
          testID="reps-input"
          mode="outlined"
          label="Reps"
          value={value?.toString() || ""}
          onChangeText={(text) => {
            const numValue = parseInt(text, 10);
            onChange(isNaN(numValue) ? 0 : numValue);
          }}
          error={!!error}
          keyboardType="number-pad"
          autoComplete="off"
          selectTextOnFocus
          style={{ marginBottom: 8 }}
        />
      )}
    />
  );
}
