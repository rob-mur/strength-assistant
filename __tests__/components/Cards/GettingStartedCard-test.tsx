import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Router } from "expo-router";
import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { PaperProvider } from "react-native-paper";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from "expo-router";

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("GettingStartedCard", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    canDismiss: jest.fn(),
    navigate: jest.fn(),
  } as unknown as Router;

  const mockOnGetStarted = jest.fn();

  const defaultProps = {
    content: "Welcome to the app! Let's get you started.",
    call_to_action: "Get Started",
    on_get_started: mockOnGetStarted,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it("renders content and call to action text", () => {
    render(
      <TestWrapper>
        <GettingStartedCard {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText("Welcome to the app! Let's get you started."),
    ).toBeTruthy();
    expect(screen.getByText("Get Started")).toBeTruthy();
  });

  it("renders without error when custom style is provided", () => {
    const customStyle = { backgroundColor: "red", padding: 20 };

    expect(() => {
      render(
        <TestWrapper>
          <GettingStartedCard {...defaultProps} style={customStyle} />
        </TestWrapper>,
      );
    }).not.toThrow();

    expect(
      screen.getByText("Welcome to the app! Let's get you started."),
    ).toBeTruthy();
  });

  it("calls on_get_started with router when button is pressed", () => {
    render(
      <TestWrapper>
        <GettingStartedCard {...defaultProps} />
      </TestWrapper>,
    );

    const button = screen.getByTestId("get-started");
    fireEvent.press(button);

    expect(mockOnGetStarted).toHaveBeenCalledWith(mockRouter);
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  it("renders button with correct props", () => {
    render(
      <TestWrapper>
        <GettingStartedCard {...defaultProps} />
      </TestWrapper>,
    );

    const button = screen.getByTestId("get-started");
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe("button");
  });

  it("renders different content and call to action", () => {
    const customProps = {
      content: "Ready to track your workouts?",
      call_to_action: "Start Tracking",
      on_get_started: mockOnGetStarted,
    };

    render(
      <TestWrapper>
        <GettingStartedCard {...customProps} />
      </TestWrapper>,
    );

    expect(screen.getByText("Ready to track your workouts?")).toBeTruthy();
    expect(screen.getByText("Start Tracking")).toBeTruthy();
  });

  it("handles multiple button presses correctly", () => {
    render(
      <TestWrapper>
        <GettingStartedCard {...defaultProps} />
      </TestWrapper>,
    );

    const button = screen.getByTestId("get-started");
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockOnGetStarted).toHaveBeenCalledTimes(3);
    expect(mockOnGetStarted).toHaveBeenCalledWith(mockRouter);
  });
});
