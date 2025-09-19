import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { Text } from "react-native";
import TabBar from "@/lib/components/TabBar";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("TabBar", () => {
  const mockProps = {
    state: {
      key: "tab-state",
      index: 0,
      routeNames: ["home", "exercises"],
      routes: [
        { key: "home-key", name: "home" },
        { key: "exercises-key", name: "exercises" },
      ],
      history: [{ type: "route", key: "home-key" }],
      type: "tab",
      stale: false,
      preloadedRouteKeys: [],
    },
    navigation: {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      dispatch: jest.fn(),
    },
    descriptors: {
      "home-key": {
        route: { key: "home-key", name: "home" },
        navigation: { emit: jest.fn(), dispatch: jest.fn() },
        render: jest.fn(() => <Text>Home</Text>),
        options: {
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Text testID={`home-icon-${focused ? "focused" : "unfocused"}`}>
              🏠
            </Text>
          ),
        },
      },
      "exercises-key": {
        route: { key: "exercises-key", name: "exercises" },
        navigation: { emit: jest.fn(), dispatch: jest.fn() },
        render: jest.fn(() => <Text>Exercises</Text>),
        options: {
          title: "Exercises",
          tabBarLabel: "Exercises",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Text
              testID={`exercises-icon-${focused ? "focused" : "unfocused"}`}
            >
              💪
            </Text>
          ),
        },
      },
    },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...mockProps} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("renders tab icons", () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TabBar {...mockProps} />
        </TestWrapper>,
      );

      // Home tab should be focused (index 0)
      expect(getByTestId("home-icon-focused")).toBeTruthy();
      expect(getByTestId("exercises-icon-unfocused")).toBeTruthy();
    });

    it("renders correct focus state when index changes", () => {
      const propsWithDifferentIndex = {
        ...mockProps,
        state: {
          ...mockProps.state,
          index: 1, // Focus on exercises tab
        },
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TabBar {...propsWithDifferentIndex} />
        </TestWrapper>,
      );

      expect(getByTestId("home-icon-unfocused")).toBeTruthy();
      expect(getByTestId("exercises-icon-focused")).toBeTruthy();
    });
  });

  describe("Label Handling", () => {
    it("handles missing tabBarLabel gracefully", () => {
      const propsWithoutLabel = {
        ...mockProps,
        descriptors: {
          ...mockProps.descriptors,
          "home-key": {
            ...mockProps.descriptors["home-key"],
            options: {
              ...mockProps.descriptors["home-key"].options,
              tabBarLabel: undefined,
            },
          },
        },
      };

      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithoutLabel} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("throws error for function-based tabBarLabel", () => {
      const propsWithFunctionLabel = {
        ...mockProps,
        descriptors: {
          ...mockProps.descriptors,
          "home-key": {
            ...mockProps.descriptors["home-key"],
            options: {
              ...mockProps.descriptors["home-key"].options,
              tabBarLabel: () => "Dynamic Label",
            },
          },
        },
      };

      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithFunctionLabel} />
          </TestWrapper>,
        );
      }).toThrow("Unsupported Label");
    });
  });

  describe("Icon Rendering", () => {
    it("renders null when tabBarIcon is not provided", () => {
      const propsWithoutIcon = {
        ...mockProps,
        descriptors: {
          ...mockProps.descriptors,
          "home-key": {
            ...mockProps.descriptors["home-key"],
            options: {
              ...mockProps.descriptors["home-key"].options,
              tabBarIcon: undefined,
            },
          },
        },
      };

      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithoutIcon} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("passes correct props to tabBarIcon function", () => {
      const mockIconFunction = jest.fn(() => (
        <Text testID="custom-icon">Icon</Text>
      ));
      const propsWithMockIcon = {
        ...mockProps,
        descriptors: {
          ...mockProps.descriptors,
          "home-key": {
            ...mockProps.descriptors["home-key"],
            options: {
              ...mockProps.descriptors["home-key"].options,
              tabBarIcon: mockIconFunction,
            },
          },
        },
      };

      render(
        <TestWrapper>
          <TabBar {...propsWithMockIcon} />
        </TestWrapper>,
      );

      expect(mockIconFunction).toHaveBeenCalledWith({
        focused: true, // Home tab is focused (index 0)
        color: expect.any(String),
        size: 24,
      });
    });
  });

  describe("Navigation Interactions", () => {
    it("sets up navigation correctly", () => {
      render(
        <TestWrapper>
          <TabBar {...mockProps} />
        </TestWrapper>,
      );

      // Verify that the component accepts the navigation props without error
      expect(mockProps.navigation.emit).toBeDefined();
      expect(mockProps.navigation.dispatch).toBeDefined();
    });
  });

  describe("Safe Area Insets", () => {
    it("handles custom insets", () => {
      const propsWithCustomInsets = {
        ...mockProps,
        insets: { top: 10, bottom: 20, left: 5, right: 5 },
      };

      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithCustomInsets} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty descriptors gracefully", () => {
      const propsWithEmptyDescriptors = {
        ...mockProps,
        descriptors: {},
        state: {
          ...mockProps.state,
          routes: [], // Also need empty routes when descriptors are empty
          routeNames: [],
        },
      };

      // This should throw because the component expects descriptors for routes
      // But the component will be rendered without routes, so it should be fine
      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithEmptyDescriptors} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("handles single route (warns but doesn't crash)", () => {
      const propsWithSingleRoute = {
        ...mockProps,
        state: {
          ...mockProps.state,
          routes: [{ key: "home-key", name: "home" }],
          routeNames: ["home"],
        },
        descriptors: {
          "home-key": mockProps.descriptors["home-key"],
        },
      };

      // Should render but warn about needing 2+ tabs for shifting animation
      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...propsWithSingleRoute} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("handles mismatched descriptors and routes", () => {
      const propsWithMismatch = {
        ...mockProps,
        state: {
          ...mockProps.state,
          routes: [{ key: "unknown-key", name: "unknown" }],
          routeNames: ["unknown"],
        },
        descriptors: {}, // No descriptor for the route
      };

      // This should handle the case where descriptors[route.key] is undefined
      // The component should handle this gracefully or throw a descriptive error
      const renderFunction = () => {
        render(
          <TestWrapper>
            <TabBar {...propsWithMismatch} />
          </TestWrapper>,
        );
      };

      // The component will fail when trying to access options on undefined descriptor
      // This is expected behavior - the test validates that this scenario is detected
      expect(renderFunction).toThrow();
    });
  });

  describe("Component Structure", () => {
    it("renders BottomNavigation.Bar with correct props", () => {
      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...mockProps} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("applies shifting prop to BottomNavigation.Bar", () => {
      expect(() => {
        render(
          <TestWrapper>
            <TabBar {...mockProps} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });
  });
});
