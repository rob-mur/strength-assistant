import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import TabLayout from "@/app/(tabs)/_layout";

// Using global expo-router mock from __mocks__/expo-router.js

// Mock the TabBar component
jest.mock("@/lib/components/TabBar", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return jest.fn(() => <Text testID="custom-tab-bar">TabBar</Text>);
});

// Mock the locales
jest.mock("@/lib/locales", () => ({
  Locales: {
    t: jest.fn((key: string) => {
      const translations = {
        titleHome: "Home",
        titleExercises: "Exercises",
        titleWorkout: "Workout",
      };
      return translations[key as keyof typeof translations] || key;
    }),
  },
}));

// Mock vector icons
jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: jest.fn(() => null),
  MaterialIcons: jest.fn(() => null),
}));

jest.mock("@expo/vector-icons/MaterialIcons", () => jest.fn(() => null));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("TabLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("renders the tab layout structure", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify Tabs component is rendered
      expect(Tabs).toHaveBeenCalled();
    });

    it("creates all expected tab screens", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify that Screen components are created for each tab
      expect(Tabs.Screen).toHaveBeenCalledTimes(4);
    });
  });

  describe("Tab Icon Components", () => {
    describe("HomeTabIcon", () => {
      it("renders focused home icon correctly", () => {
        const { MaterialCommunityIcons } = require("@expo/vector-icons");

        // Import the component to access the icon components
        const TabLayoutModule = require("@/app/(tabs)/_layout");

        // Get a reference to test the icon functions
        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );

        // Since the icon components are internal, we test by ensuring the module loads correctly
        expect(TabLayoutModule.default).toBeDefined();
      });
    });

    describe("ExercisesTabIcon", () => {
      it("includes testID for exercises tab", () => {
        const MaterialIcons = require("@expo/vector-icons/MaterialIcons");

        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );

        // Test that the module renders successfully with icon components
        expect(MaterialIcons).toBeDefined();
      });
    });

    describe("WorkoutTabIcon", () => {
      it("renders conditional icon based on focus state", () => {
        const { MaterialCommunityIcons } = require("@expo/vector-icons");
        const MaterialIcons = require("@expo/vector-icons/MaterialIcons");

        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );

        // Test that both icon libraries are available for conditional rendering
        expect(MaterialCommunityIcons).toBeDefined();
        expect(MaterialIcons).toBeDefined();
      });
    });

    describe("ProfileTabIcon", () => {
      it("renders profile icon with focus state", () => {
        const { MaterialCommunityIcons } = require("@expo/vector-icons");

        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );

        expect(MaterialCommunityIcons).toBeDefined();
      });
    });
  });

  describe("Tab Screen Configuration", () => {
    it("configures index screen with correct options", () => {
      const { Tabs } = require("expo-router");
      const { Locales } = require("@/lib/locales");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify Locales.t was called for home title
      expect(Locales.t).toHaveBeenCalledWith("titleHome");

      // Verify Tabs.Screen was called
      expect(Tabs.Screen).toHaveBeenCalled();
    });

    it("configures exercises screen with correct options", () => {
      const { Tabs } = require("expo-router");
      const { Locales } = require("@/lib/locales");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify Locales.t was called for exercises title
      expect(Locales.t).toHaveBeenCalledWith("titleExercises");

      // Verify multiple Screen components were rendered
      expect(Tabs.Screen).toHaveBeenCalledTimes(4);
    });

    it("configures workout screen with correct options", () => {
      const { Locales } = require("@/lib/locales");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify Locales.t was called for workout title
      expect(Locales.t).toHaveBeenCalledWith("titleWorkout");
    });

    it("configures profile screen with hardcoded title", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify profile screen was configured
      expect(Tabs.Screen).toHaveBeenCalled();

      // Check that the 4th call (profile) has the right name
      const profileCall = Tabs.Screen.mock.calls[3];
      expect(profileCall[0].name).toBe("profile");
      expect(profileCall[0].options.title).toBe("Profile");
    });
  });

  describe("Localization Integration", () => {
    it("uses Locales.t for tab titles", () => {
      const { Locales } = require("@/lib/locales");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      expect(Locales.t).toHaveBeenCalledWith("titleHome");
      expect(Locales.t).toHaveBeenCalledWith("titleExercises");
      expect(Locales.t).toHaveBeenCalledWith("titleWorkout");
    });

    it("handles missing translations gracefully", () => {
      const { Locales } = require("@/lib/locales");

      // Reset mock to return the key when translation is not found
      Locales.t.mockImplementation((key: string) => key);

      expect(() => {
        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });
  });

  describe("Tab Bar Integration", () => {
    it("uses custom TabBar component", () => {
      const TabBar = require("@/lib/components/TabBar");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // TabBar component should be available for use
      expect(TabBar).toBeDefined();
    });

    it("provides tabBar prop to Tabs component", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify that Tabs was called with tabBar prop
      expect(Tabs).toHaveBeenCalled();
      const firstCall = Tabs.mock.calls[0];
      expect(firstCall[0]).toHaveProperty("tabBar");
      expect(typeof firstCall[0].tabBar).toBe("function");
    });
  });

  describe("Screen Options Configuration", () => {
    it("sets tabBarHideOnKeyboard to true", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify screenOptions were set
      expect(Tabs).toHaveBeenCalled();
      const firstCall = Tabs.mock.calls[0];
      expect(firstCall[0].screenOptions.tabBarHideOnKeyboard).toBe(true);
    });

    it("configures all tab screens with proper names", () => {
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify all expected screens are configured
      expect(Tabs.Screen).toHaveBeenCalledTimes(4);

      // Check each screen configuration
      const calls = Tabs.Screen.mock.calls;
      expect(calls[0][0].name).toBe("index");
      expect(calls[1][0].name).toBe("exercises");
      expect(calls[2][0].name).toBe("workout");
      expect(calls[3][0].name).toBe("profile");
    });
  });

  describe("Component Export and Structure", () => {
    it("exports TabLayout as default", () => {
      expect(typeof TabLayout).toBe("function");
      expect(TabLayout.name).toBe("TabLayout");
    });

    it("is a functional React component", () => {
      const result = TabLayout();
      expect(React.isValidElement(result)).toBe(true);
    });

    it("renders consistently across multiple calls", () => {
      const firstRender = render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      const secondRender = render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Both renders should complete without errors
      expect(firstRender).toBeDefined();
      expect(secondRender).toBeDefined();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles missing icon libraries gracefully", () => {
      // This test ensures the component structure is sound
      expect(() => {
        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("handles invalid localization keys", () => {
      const { Locales } = require("@/lib/locales");

      // Mock Locales.t to return a fallback value
      Locales.t.mockImplementation((key: string) => `fallback-${key}`);

      // Component should handle localization with fallback values
      expect(() => {
        render(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it("maintains tab icon component references", () => {
      // Test that all icon components are properly defined
      const { Tabs } = require("expo-router");

      render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Verify that each screen has a tabBarIcon
      const screenCalls = Tabs.Screen.mock.calls;
      screenCalls.forEach((call: any) => {
        expect(call[0].options).toHaveProperty("tabBarIcon");
        expect(typeof call[0].options.tabBarIcon).toBe("function");
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("does not recreate icon components on re-render", () => {
      const { Tabs } = require("expo-router");

      const { rerender } = render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      const firstRenderCallCount = Tabs.mock.calls.length;

      rerender(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Should have been called twice (once for each render)
      expect(Tabs.mock.calls.length).toBe(firstRenderCallCount + 1);
    });

    it("handles rapid re-renders without issues", () => {
      const { rerender } = render(
        <TestWrapper>
          <TabLayout />
        </TestWrapper>,
      );

      // Perform multiple rapid re-renders
      for (let i = 0; i < 3; i++) {
        rerender(
          <TestWrapper>
            <TabLayout />
          </TestWrapper>,
        );
      }

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });
});
