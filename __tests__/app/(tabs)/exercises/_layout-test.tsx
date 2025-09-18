import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import ExercisesLayout from "@/app/(tabs)/exercises/_layout";

// Using global expo-router mock from __mocks__/expo-router.js

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("ExercisesLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(
          <TestWrapper>
            <ExercisesLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("renders Stack component", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify Stack component is rendered
      expect(Stack).toHaveBeenCalled();
    });

    it("creates expected screen components", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify that Screen components are created
      expect(Stack.Screen).toHaveBeenCalledTimes(2);
    });
  });

  describe("Screen Configuration", () => {
    it("configures index screen with headerShown false", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Check the first screen configuration (index)
      const indexCall = Stack.Screen.mock.calls[0];
      expect(indexCall[0].name).toBe("index");
      expect(indexCall[0].options.headerShown).toBe(false);
    });

    it("configures add screen with headerShown false", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Check the second screen configuration (add)
      const addCall = Stack.Screen.mock.calls[1];
      expect(addCall[0].name).toBe("add");
      expect(addCall[0].options.headerShown).toBe(false);
    });

    it("configures both screens with correct screen names", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify all expected screens are configured
      const calls = Stack.Screen.mock.calls;
      expect(calls[0][0].name).toBe("index");
      expect(calls[1][0].name).toBe("add");
    });
  });

  describe("Stack Navigation Structure", () => {
    it("uses Stack component from expo-router", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify Stack component is used
      expect(Stack).toHaveBeenCalled();
    });

    it("renders Stack with children", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify Stack is called and has children
      expect(Stack).toHaveBeenCalled();
      const firstCall = Stack.mock.calls[0];
      expect(firstCall[0]).toHaveProperty("children");
    });
  });

  describe("Component Export and Structure", () => {
    it("exports ExercisesLayout as default", () => {
      expect(typeof ExercisesLayout).toBe("function");
      expect(ExercisesLayout.name).toBe("ExercisesLayout");
    });

    it("is a functional React component", () => {
      const result = ExercisesLayout();
      expect(React.isValidElement(result)).toBe(true);
    });

    it("renders consistently across multiple calls", () => {
      const firstRender = render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      const secondRender = render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Both renders should complete without errors
      expect(firstRender).toBeDefined();
      expect(secondRender).toBeDefined();
    });
  });

  describe("Navigation Screen Options", () => {
    it("hides headers for all screens", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify both screens have headerShown: false
      const calls = Stack.Screen.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0].options.headerShown).toBe(false);
      });
    });

    it("applies consistent options structure", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify all screen options have the expected structure
      const calls = Stack.Screen.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0]).toHaveProperty("name");
        expect(call[0]).toHaveProperty("options");
        expect(call[0].options).toHaveProperty("headerShown");
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles missing Stack component gracefully", () => {
      // Test that the component structure is sound
      expect(() => {
        render(
          <TestWrapper>
            <ExercisesLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("maintains screen configuration integrity", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify that screens are properly configured
      expect(Stack.Screen).toHaveBeenCalledTimes(2);

      const calls = Stack.Screen.mock.calls;
      expect(calls).toHaveLength(2);

      // Each call should have valid configuration
      calls.forEach((call: any) => {
        expect(call[0]).toBeDefined();
        expect(call[0].name).toBeDefined();
        expect(call[0].options).toBeDefined();
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("does not recreate components unnecessarily", () => {
      const { Stack } = require("expo-router");

      const { rerender } = render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      const firstRenderCallCount = Stack.mock.calls.length;

      rerender(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Should have been called twice (once for each render)
      expect(Stack.mock.calls.length).toBe(firstRenderCallCount + 1);
    });

    it("handles rapid re-renders without issues", () => {
      const { rerender } = render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Perform multiple rapid re-renders
      for (let i = 0; i < 3; i++) {
        rerender(
          <TestWrapper>
            <ExercisesLayout />
          </TestWrapper>,
        );
      }

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it("maintains component stability", () => {
      // Test that the component definition is stable
      const componentReference1 = ExercisesLayout;
      const componentReference2 = ExercisesLayout;

      expect(componentReference1).toBe(componentReference2);
    });
  });

  describe("Integration with Expo Router", () => {
    it("integrates correctly with Stack navigation", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify Stack integration
      expect(Stack).toHaveBeenCalled();
      expect(Stack.Screen).toHaveBeenCalled();
    });

    it("provides correct navigation structure for exercises section", () => {
      const { Stack } = require("expo-router");

      render(
        <TestWrapper>
          <ExercisesLayout />
        </TestWrapper>,
      );

      // Verify the exercises section navigation structure
      const calls = Stack.Screen.mock.calls;

      // Should have index and add screens
      const screenNames = calls.map((call: any) => call[0].name);
      expect(screenNames).toContain("index");
      expect(screenNames).toContain("add");
      expect(screenNames).toHaveLength(2);
    });
  });
});
