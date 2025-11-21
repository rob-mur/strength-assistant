/**
 * Exercise Set Logging: RPE Slider Component
 *
 * Purpose: React Native Paper slider for Rate of Perceived Exertion (RPE) with React Hook Form integration
 * Features: 1.0-10.0 range with 0.5 step increments, visual feedback, testID for Maestro
 */

import React from "react";
import { View } from "react-native";
import { Controller, Control, FieldError } from "react-hook-form";
import { Text } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { WorkoutSetFormInput } from "../models/validation";

interface RPESliderProps {
  control: Control<WorkoutSetFormInput>;
  error?: FieldError;
}

export function RPESlider({ control, error }: RPESliderProps) {
  return (
    <Controller
      control={control}
      name="rpe"
      render={({ field: { onChange, value } }) => (
        <View style={{ marginBottom: 16 }}>
          <Text variant="labelMedium" style={{ marginBottom: 8 }}>
            RPE: {value ? value.toFixed(1) : "—"}
          </Text>
          <Slider
            testID="rpe-slider"
            minimumValue={1.0}
            maximumValue={10.0}
            step={0.5}
            value={value || 5.0}
            onValueChange={onChange}
            minimumTrackTintColor="#6200ee"
            maximumTrackTintColor="#6200ee20"
            style={{ height: 40 }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text variant="bodySmall" style={{ color: "#666" }}>
              1
            </Text>
            <Text variant="bodySmall" style={{ color: "#666" }}>
              10
            </Text>
          </View>
          {error && (
            <Text
              variant="bodySmall"
              style={{ color: "#B00020", marginTop: 4 }}
            >
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
