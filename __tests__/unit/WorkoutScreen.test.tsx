import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import WorkoutScreen from "../../app/(tabs)/workout";

// Use the existing expo-router mock
jest.mock("expo-router");

import { useRouter, useLocalSearchParams } from "expo-router";

// Cast to jest mocks to access mockImplementation
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;

const mockNavigate = jest.fn();

// Setup the mocks
mockUseRouter.mockReturnValue({
  navigate: mockNavigate,
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canDismiss: jest.fn(),
  canGoBack: jest.fn(),
  setParams: jest.fn(),
});

mockUseLocalSearchParams.mockReturnValue({});

// Mock MaterialIcons
jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

// Mock useWindowDimensions directly without overriding React Native mock
const RN = require("react-native");
RN.useWindowDimensions = jest.fn(() => ({ width: 375, height: 812 }));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe("WorkoutScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseRouter.mockReturnValue({
      navigate: mockNavigate,
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      dismiss: jest.fn(),
      canDismiss: jest.fn(),
      canGoBack: jest.fn(),
      setParams: jest.fn(),
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no exercise is selected", () => {
      const { getByTestId, getByText } = renderWithTheme(<WorkoutScreen />);

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      expect(getByText("Ready to start your workout?")).toBeTruthy();
    });

    it("navigates to exercises screen when Browse Exercises is tapped", () => {
      const { getByTestId } = renderWithTheme(<WorkoutScreen />);

      fireEvent.press(getByTestId("select-exercise-button"));
      expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/exercises");
    });

    it("navigates to add exercise screen when Create New Exercise is tapped", () => {
      const { getByTestId } = renderWithTheme(<WorkoutScreen />);

      fireEvent.press(getByTestId("create-exercise-button"));
      expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/exercises/add");
    });
  });

  describe("Exercise Selected State", () => {
    it("shows exercise card when exercise is provided via props", () => {
      const { getByTestId, queryByTestId } = renderWithTheme(
        <WorkoutScreen selectedExercise="Push-ups" />,
      );

      expect(queryByTestId("empty-workout-state")).toBeNull();
      expect(getByTestId("workout-exercise-card")).toBeTruthy();
    });

    it("shows exercise card when exercise is provided via search params", () => {
      mockUseLocalSearchParams.mockReturnValue({ exercise: "Squats" });

      const { getByTestId, queryByTestId } = renderWithTheme(<WorkoutScreen />);

      expect(queryByTestId("empty-workout-state")).toBeNull();
      expect(getByTestId("workout-exercise-card")).toBeTruthy();
    });

    it("prioritizes props over search params", () => {
      mockUseLocalSearchParams.mockReturnValue({ exercise: "Squats" });

      const { getByTestId, queryByTestId } = renderWithTheme(
        <WorkoutScreen selectedExercise="Push-ups" />,
      );

      expect(queryByTestId("empty-workout-state")).toBeNull();
      expect(getByTestId("workout-exercise-card")).toBeTruthy();
    });
  });

  describe("FAB functionality", () => {
    it("preserves FAB functionality in empty state", () => {
      const { getByTestId } = renderWithTheme(<WorkoutScreen />);

      expect(getByTestId("add-workout")).toBeTruthy();
      fireEvent.press(getByTestId("add-workout"));
      expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/exercises/add");
    });

    it("preserves FAB functionality with exercise selected", () => {
      const { getByTestId } = renderWithTheme(
        <WorkoutScreen selectedExercise="Push-ups" />,
      );

      expect(getByTestId("add-workout")).toBeTruthy();
      fireEvent.press(getByTestId("add-workout"));
      expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/exercises/add");
    });
  });
});
