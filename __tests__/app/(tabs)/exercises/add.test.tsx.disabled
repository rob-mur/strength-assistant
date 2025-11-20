import React from "react";
import { render } from "@testing-library/react-native";
import AddExerciseScreen from "@/app/(tabs)/exercises/add";

// Mock the AddExerciseForm component
jest.mock("@/lib/components/Forms/AddExerciseForm", () => {
  return function MockAddExerciseForm() {
    return null;
  };
});

describe("AddExerciseScreen", () => {
  it("should render without crashing", () => {
    const { getByTestId } = render(<AddExerciseScreen />);
    // Just verify it renders without error
    expect(true).toBe(true);
  });
});
