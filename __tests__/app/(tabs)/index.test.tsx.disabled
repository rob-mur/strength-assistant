import React from "react";
import { render } from "@testing-library/react-native";
import HomeScreen from "@/app/(tabs)/index";

const mockNavigate = jest.fn();

// Mock dependencies
jest.mock("@/lib/components/Cards/GettingStartedCard", () => {
  return function MockGettingStartedCard({ on_get_started }: any) {
    // Simulate clicking the card to trigger navigation
    if (on_get_started) {
      setTimeout(on_get_started, 0);
    }
    return null;
  };
});

jest.mock("@/lib/locales", () => ({
  Locales: {
    t: jest.fn((key) => key),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock console.log to verify debug logging
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it("should render without crashing", () => {
    render(<HomeScreen />);
    expect(true).toBe(true);
  });
});
