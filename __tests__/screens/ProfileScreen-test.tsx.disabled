/**
 * ProfileScreen Tests - Comprehensive Coverage
 *
 * Essential test coverage for the profile screen focusing on:
 * - Screen rendering and component structure
 * - User authentication states (anonymous vs registered)
 * - Sign out functionality
 * - User information display
 * - Icon component behavior
 * - Accessibility and styling
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProfileScreen from "@/app/(tabs)/profile";

// Mock AuthProvider context
const mockSignOut = jest.fn();
const mockUseAuthContext = jest.fn();

jest.mock("@/lib/components/AuthProvider", () => ({
  useAuthContext: () => mockUseAuthContext(),
}));

// Mock react-native-paper components
jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = jest.requireActual("react-native");

  const Card = ({ children, style }: any) => (
    <View testID="profile-card" style={style}>
      {children}
    </View>
  );
  Card.Content = ({ children }: any) => (
    <View testID="card-content">{children}</View>
  );

  const List = {
    Item: ({ title, description, left, testID }: any) => (
      <View
        testID={testID || `list-item-${title.toLowerCase().replace(" ", "-")}`}
      >
        {left && <View testID="list-item-icon">{left({ color: "#000" })}</View>}
        <View testID="list-item-content">
          <Text testID="list-item-title">{title}</Text>
          <Text testID="list-item-description">{description}</Text>
        </View>
      </View>
    ),
    Icon: ({ icon, color, style, testID }: any) => (
      <View
        testID={testID || `icon-${icon}`}
        style={style}
        data-color={color}
        data-icon={icon}
      />
    ),
  };

  return {
    Card,
    Text: ({ children, variant, style, testID, ...props }: any) => (
      <Text testID={testID || `text-${variant}`} style={style} {...props}>
        {children}
      </Text>
    ),
    Button: ({
      children,
      onPress,
      mode,
      style,
      buttonColor,
      testID,
      ...props
    }: any) => (
      <TouchableOpacity
        testID={testID || "sign-out-button"}
        onPress={onPress}
        style={style}
        {...props}
      >
        <Text
          testID="button-text"
          data-mode={mode}
          data-button-color={buttonColor}
        >
          {children}
        </Text>
      </TouchableOpacity>
    ),
    List,
    Divider: ({ style, testID }: any) => (
      <View testID={testID || "divider"} style={style} />
    ),
  };
});

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering with Registered User", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should render the profile screen structure", () => {
      const { getByTestId } = render(<ProfileScreen />);

      expect(getByTestId("profile-card")).toBeTruthy();
      expect(getByTestId("card-content")).toBeTruthy();
      expect(getByTestId("text-headlineMedium")).toBeTruthy();
    });

    it("should display profile title", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const title = getByTestId("text-headlineMedium");
      expect(title.props.children).toBe("Profile");
    });

    it("should display user ID correctly", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const userIdItem = getByTestId("list-item-user-id");
      const titleElement = userIdItem.findByProps({
        testID: "list-item-title",
      });
      const descriptionElement = userIdItem.findByProps({
        testID: "list-item-description",
      });

      expect(titleElement.props.children).toBe("User ID");
      expect(descriptionElement.props.children).toBe("user-123");
    });

    it("should display email correctly for registered user", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const emailItem = getByTestId("list-item-email");
      const titleElement = emailItem.findByProps({ testID: "list-item-title" });
      const descriptionElement = emailItem.findByProps({
        testID: "list-item-description",
      });

      expect(titleElement.props.children).toBe("Email");
      expect(descriptionElement.props.children).toBe("test@example.com");
    });

    it("should display registered account type", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const accountTypeItem = getByTestId("list-item-account-type");
      const titleElement = accountTypeItem.findByProps({
        testID: "list-item-title",
      });
      const descriptionElement = accountTypeItem.findByProps({
        testID: "list-item-description",
      });

      expect(titleElement.props.children).toBe("Account Type");
      expect(descriptionElement.props.children).toBe("Registered Account");
    });

    it("should display registered user sign out description", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const description = getByTestId("text-bodyMedium");
      expect(description.props.children).toBe(
        "Sign out of your account. You can sign back in anytime.",
      );
    });
  });

  describe("Component Rendering with Anonymous User", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "anon-456",
          email: null,
          isAnonymous: true,
        },
        signOut: mockSignOut,
      });
    });

    it("should display user ID for anonymous user", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const userIdItem = getByTestId("list-item-user-id");
      const descriptionElement = userIdItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("anon-456");
    });

    it("should display anonymous user email placeholder", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const emailItem = getByTestId("list-item-email");
      const descriptionElement = emailItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("Anonymous User");
    });

    it("should display guest account type", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const accountTypeItem = getByTestId("list-item-account-type");
      const descriptionElement = accountTypeItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("Guest Account");
    });

    it("should display anonymous user sign out description", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const description = getByTestId("text-bodyMedium");
      expect(description.props.children).toBe(
        "Sign out of your guest account. Your data will be lost unless you create a permanent account first.",
      );
    });
  });

  describe("Component Rendering with No User", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        signOut: mockSignOut,
      });
    });

    it("should handle null user gracefully", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const userIdItem = getByTestId("list-item-user-id");
      const descriptionElement = userIdItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("N/A");
    });

    it("should display anonymous user placeholder for null user", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const emailItem = getByTestId("list-item-email");
      const descriptionElement = emailItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("Anonymous User");
    });
  });

  describe("Icon Components", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should render account icon for user ID", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const userIdItem = getByTestId("list-item-user-id");
      const icon = userIdItem.findByProps({ testID: "icon-account-circle" });

      expect(icon).toBeTruthy();
      expect(icon.props["data-icon"]).toBe("account-circle");
    });

    it("should render email icon for email field", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const emailItem = getByTestId("list-item-email");
      const icon = emailItem.findByProps({ testID: "icon-email" });

      expect(icon).toBeTruthy();
      expect(icon.props["data-icon"]).toBe("email");
    });

    it("should render account-check icon for registered user", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const accountTypeItem = getByTestId("list-item-account-type");
      const icon = accountTypeItem.findByProps({
        testID: "icon-account-check",
      });

      expect(icon).toBeTruthy();
      expect(icon.props["data-icon"]).toBe("account-check");
    });

    it("should render incognito icon for anonymous user", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "anon-456",
          email: null,
          isAnonymous: true,
        },
        signOut: mockSignOut,
      });

      const { getByTestId } = render(<ProfileScreen />);

      const accountTypeItem = getByTestId("list-item-account-type");
      const icon = accountTypeItem.findByProps({ testID: "icon-incognito" });

      expect(icon).toBeTruthy();
      expect(icon.props["data-icon"]).toBe("incognito");
    });
  });

  describe("Sign Out Functionality", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should call signOut when sign out button is pressed", async () => {
      const { getByTestId } = render(<ProfileScreen />);

      const signOutButton = getByTestId("sign-out-button");
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle sign out button multiple presses", async () => {
      const { getByTestId } = render(<ProfileScreen />);

      const signOutButton = getByTestId("sign-out-button");
      fireEvent.press(signOutButton);
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(2);
      });
    });

    it("should call signOut function when button is pressed", async () => {
      const { getByTestId } = render(<ProfileScreen />);

      const signOutButton = getByTestId("sign-out-button");
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Button Styling", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should apply correct button styling", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const buttonText = getByTestId("button-text");

      expect(buttonText.props["data-mode"]).toBe("contained");
      expect(buttonText.props["data-button-color"]).toBe("#d32f2f");
    });

    it("should render sign out button text", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const buttonText = getByTestId("button-text");

      expect(buttonText.props.children).toBe("Sign Out");
    });
  });

  describe("Layout and Structure", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should render divider between user info and actions", () => {
      const { getByTestId } = render(<ProfileScreen />);

      expect(getByTestId("divider")).toBeTruthy();
    });

    it("should render all list items", () => {
      const { getByTestId } = render(<ProfileScreen />);

      expect(getByTestId("list-item-user-id")).toBeTruthy();
      expect(getByTestId("list-item-email")).toBeTruthy();
      expect(getByTestId("list-item-account-type")).toBeTruthy();
    });

    it("should have proper component hierarchy", () => {
      const { getByTestId } = render(<ProfileScreen />);

      const card = getByTestId("profile-card");
      const content = getByTestId("card-content");
      const title = getByTestId("text-headlineMedium");

      expect(card).toContainElement(content);
      expect(content).toContainElement(title);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined user properties", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: undefined,
          email: undefined,
          isAnonymous: undefined,
        },
        signOut: mockSignOut,
      });

      const { getByTestId } = render(<ProfileScreen />);

      const userIdItem = getByTestId("list-item-user-id");
      const userIdDescription = userIdItem.findByProps({
        testID: "list-item-description",
      });

      expect(userIdDescription.props.children).toBe("N/A");
    });

    it("should handle missing signOut function", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: undefined,
      });

      expect(() => render(<ProfileScreen />)).not.toThrow();
    });
  });

  describe("Integration", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "user-123",
          email: "test@example.com",
          isAnonymous: false,
        },
        signOut: mockSignOut,
      });
    });

    it("should integrate with AuthProvider context", () => {
      render(<ProfileScreen />);

      expect(mockUseAuthContext).toHaveBeenCalledTimes(1);
    });

    it("should render without errors", () => {
      expect(() => render(<ProfileScreen />)).not.toThrow();
    });

    it("should handle dynamic user state changes", () => {
      const { rerender, getByTestId } = render(<ProfileScreen />);

      // Change to anonymous user
      mockUseAuthContext.mockReturnValue({
        user: {
          uid: "anon-456",
          email: null,
          isAnonymous: true,
        },
        signOut: mockSignOut,
      });

      rerender(<ProfileScreen />);

      const accountTypeItem = getByTestId("list-item-account-type");
      const descriptionElement = accountTypeItem.findByProps({
        testID: "list-item-description",
      });

      expect(descriptionElement.props.children).toBe("Guest Account");
    });
  });
});
