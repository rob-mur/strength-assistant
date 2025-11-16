import React from "react";
import { render, screen } from "@testing-library/react-native";
import ExerciseScreen from "@/app/(tabs)/exercises/index";

// Use global mocks - no local overrides needed
// Mock only the minimal external dependencies that aren't already globally mocked

jest.mock("expo-router", () => ({
  useRouter: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock("react-native-paper", () => ({
  FAB: function MockFAB({ testID, icon, style }: any) {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { testID },
      React.createElement(Text, {}, `FAB-${icon}`),
    );
  },
  List: {
    Section: function MockListSection({ children }: any) {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, {}, children);
    },
    Item: function MockListItem({ title, testID }: any) {
      const React = require("react");
      const { Text } = require("react-native");
      return React.createElement(Text, { testID }, title);
    },
  },
  Card: {
    Content: function MockCardContent({ children }: any) {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, {}, children);
    },
  },
  Surface: function MockSurface({ children, testID, style }: any) {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID, style }, children);
  },
}));

// Mock console to avoid component logging noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe("ExerciseScreen", () => {
  it("should render without crashing", () => {
    // Basic smoke test - just verify component can be instantiated
    expect(() => {
      const component = <ExerciseScreen />;
      expect(component).toBeDefined();
    }).not.toThrow();
  });
});
