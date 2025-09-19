import React from "react";
import { render } from "@testing-library/react-native";
import ExerciseScreen from "@/app/(tabs)/exercises/index";

// Mock dependencies
jest.mock("@/lib/components/ExerciseList", () => {
  return function MockExerciseList() {
    return null;
  };
});

jest.mock("@/lib/hooks/useExercises", () => ({
  useExercises: () => ({
    exercises: [],
  }),
}));

jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { uid: "test-user" },
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock("react-native-paper", () => ({
  FAB: function MockFAB() {
    return null;
  },
}));

describe("ExerciseScreen", () => {
  it("should render without crashing", () => {
    render(<ExerciseScreen />);
    expect(true).toBe(true);
  });
});
