/**
 * Exercise Set Logging: Weight Input Component
 *
 * Purpose: React Native Paper TextInput for weight entry with React Hook Form integration
 * Features: Decimal input, auto-focus, validation display, optimized for quick data entry
 */

import React from "react";
import { Controller, Control, FieldError } from "react-hook-form";
import { TextInput } from "react-native-paper";
import { WorkoutSetFormInput } from "../models/validation";

interface WeightInputProps {
  control: Control<WorkoutSetFormInput>;
  error?: FieldError;
}

export function WeightInput({ control, error }: WeightInputProps) {
  return (
    <Controller
      control={control}
      name="weight"
      render={({ field: { onChange, value } }) => (
        <TextInput
          testID="weight-input"
          mode="outlined"
          label="Weight (lbs)"
          value={value?.toString() || ""}
          onChangeText={(text) => {
            const numValue = parseFloat(text);
            onChange(isNaN(numValue) ? 0 : numValue);
          }}
          error={!!error}
          keyboardType="decimal-pad"
          autoComplete="off"
          selectTextOnFocus
          style={{ marginBottom: 8 }}
        />
      )}
    />
  );
}
