import AddWorkoutForm from "@/lib/components/Forms/AddWorkoutForm";
import React from "react";
import { Surface } from "react-native-paper";

export default function AddWorkoutScreen() {
  return (
    <Surface elevation={0} style={{ padding: 16 }}>
      <AddWorkoutForm />
    </Surface>
  );
}