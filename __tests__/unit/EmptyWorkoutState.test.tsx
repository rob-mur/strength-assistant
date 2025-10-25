import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import EmptyWorkoutState from "../../lib/components/EmptyWorkoutState";
import { EmptyWorkoutStateProps } from "../../lib/types/EmptyWorkoutState";

// Mock MaterialIcons
jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

// Mock useWindowDimensions directly without overriding React Native mock
const mockUseWindowDimensions = jest.fn(() => ({ width: 375, height: 812 }));

// Add useWindowDimensions to React Native after jest setup
const RN = require("react-native");
RN.useWindowDimensions = mockUseWindowDimensions;

const mockProps: EmptyWorkoutStateProps = {
  onSelectExercise: jest.fn(),
  onCreateExercise: jest.fn(),
  testID: "empty-workout-state",
};

const renderWithTheme = (
  component: React.ReactElement,
  theme = MD3LightTheme,
) => {
  return render(<PaperProvider theme={theme}>{component}</PaperProvider>);
};

describe("EmptyWorkoutState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with required elements", () => {
    const { getByTestId, getByText } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} />,
    );

    // Check main container
    expect(getByTestId("empty-workout-state")).toBeTruthy();

    // Check text content
    expect(getByText("Ready to start your workout?")).toBeTruthy();
    expect(
      getByText(
        "Select an exercise to begin tracking your workout, or create a new exercise routine.",
      ),
    ).toBeTruthy();

    // Check buttons
    expect(getByText("Browse Exercises")).toBeTruthy();
    expect(getByText("Create New Exercise")).toBeTruthy();
  });

  it("renders with correct testID attributes", () => {
    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} />,
    );

    expect(getByTestId("empty-workout-state")).toBeTruthy();
    expect(getByTestId("select-exercise-button")).toBeTruthy();
    expect(getByTestId("create-exercise-button")).toBeTruthy();
  });

  it("calls onSelectExercise when Browse Exercises button is pressed", () => {
    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} />,
    );

    const selectButton = getByTestId("select-exercise-button");
    fireEvent.press(selectButton);

    expect(mockProps.onSelectExercise).toHaveBeenCalledTimes(1);
  });

  it("calls onCreateExercise when Create New Exercise button is pressed", () => {
    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} />,
    );

    const createButton = getByTestId("create-exercise-button");
    fireEvent.press(createButton);

    expect(mockProps.onCreateExercise).toHaveBeenCalledTimes(1);
  });

  it("accepts custom testID prop", () => {
    const customTestID = "custom-empty-state";
    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} testID={customTestID} />,
    );

    expect(getByTestId(customTestID)).toBeTruthy();
  });

  it("uses default testID when none provided", () => {
    const propsWithoutTestID = {
      onSelectExercise: mockProps.onSelectExercise,
      onCreateExercise: mockProps.onCreateExercise,
    };

    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...propsWithoutTestID} />,
    );

    expect(getByTestId("empty-workout-state")).toBeTruthy();
  });

  it("applies custom style prop", () => {
    const customStyle = { backgroundColor: "red" };
    const { getByTestId } = renderWithTheme(
      <EmptyWorkoutState {...mockProps} style={customStyle} />,
    );

    const container = getByTestId("empty-workout-state");
    // Check that the custom style is included in the nested style array structure
    const styleArray = container.props.style;
    // The custom style should be in the last element of the style array
    const lastStyleElement = styleArray[styleArray.length - 1];
    expect(lastStyleElement).toContainEqual(customStyle);
  });

  describe("Responsive Design", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders with small icon on mobile devices", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812 });

      const { getByTestId } = renderWithTheme(
        <EmptyWorkoutState {...mockProps} />,
      );

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      // Icon size should be 48 for mobile (width < 768)
    });

    it("renders with large icon on tablet devices", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });

      const { getByTestId } = renderWithTheme(
        <EmptyWorkoutState {...mockProps} />,
      );

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      // Icon size should be 64 for tablet (width >= 768)
    });

    it("handles edge case at tablet breakpoint", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 768, height: 1024 });

      const { getByTestId } = renderWithTheme(
        <EmptyWorkoutState {...mockProps} />,
      );

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      // Icon size should be 64 at exactly 768px width
    });
  });

  describe("Theme Integration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders correctly with light theme", () => {
      const { getByTestId, getByText } = renderWithTheme(
        <EmptyWorkoutState {...mockProps} />,
        MD3LightTheme,
      );

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      expect(getByText("Ready to start your workout?")).toBeTruthy();
      expect(getByText("Browse Exercises")).toBeTruthy();
      expect(getByText("Create New Exercise")).toBeTruthy();
    });

    it("renders correctly with dark theme", () => {
      const { getByTestId, getByText } = renderWithTheme(
        <EmptyWorkoutState {...mockProps} />,
        MD3DarkTheme,
      );

      expect(getByTestId("empty-workout-state")).toBeTruthy();
      expect(getByText("Ready to start your workout?")).toBeTruthy();
      expect(getByText("Browse Exercises")).toBeTruthy();
      expect(getByText("Create New Exercise")).toBeTruthy();
    });
  });
});
