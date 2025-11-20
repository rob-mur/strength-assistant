/**
 * @jest-environment node
 */

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { ErrorBlocker } from "@/lib/components/ErrorBlocker";
import * as SimpleErrorLogger from "@/lib/utils/logging/SimpleErrorLogger";
import { MAESTRO_TEST_IDS } from "@/lib/models/MaestroErrorIndicator";

jest.mock("@/lib/utils/logging/SimpleErrorLogger", () => ({
  getGlobalErrorState: jest.fn(),
}));

const mockGetGlobalErrorState =
  SimpleErrorLogger.getGlobalErrorState as jest.MockedFunction<
    typeof SimpleErrorLogger.getGlobalErrorState
  >;

describe("ErrorBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children normally when no error", () => {
    mockGetGlobalErrorState.mockReturnValue({
      hasUncaughtError: false,
      errorCount: 0,
      lastError: "",
      lastErrorTimestamp: "",
      isBlocking: false,
    });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByText } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("shows error overlay when error occurs", async () => {
    mockGetGlobalErrorState.mockReturnValue({
      hasUncaughtError: true,
      errorCount: 1,
      lastError: "Test error message",
      lastErrorTimestamp: "2023-01-01T00:00:00.000Z",
      isBlocking: true,
    });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByTestId, getByText } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    await waitFor(() => {
      expect(getByTestId(MAESTRO_TEST_IDS.ERROR_BLOCKER)).toBeTruthy();
      expect(getByText("Application Error")).toBeTruthy();
      expect(getByText("Test error message")).toBeTruthy();
      expect(getByText("1")).toBeTruthy();
    });
  });

  it("handles error in getGlobalErrorState gracefully", () => {
    mockGetGlobalErrorState.mockImplementation(() => {
      throw new Error("Mock error");
    });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByText } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("updates error state when polling detects changes", async () => {
    mockGetGlobalErrorState
      .mockReturnValueOnce({
        hasUncaughtError: false,
        errorCount: 0,
        lastError: "",
        lastErrorTimestamp: "",
        isBlocking: false,
      })
      .mockReturnValue({
        hasUncaughtError: true,
        errorCount: 1,
        lastError: "New error",
        lastErrorTimestamp: "2023-01-01T00:00:00.000Z",
        isBlocking: true,
      });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByTestId } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    await waitFor(
      () => {
        expect(getByTestId(MAESTRO_TEST_IDS.ERROR_BLOCKER)).toBeTruthy();
      },
      { timeout: 1000 },
    );
  });

  it("formats error timestamp correctly", async () => {
    const testTimestamp = "2023-01-01T12:30:45.000Z";
    mockGetGlobalErrorState.mockReturnValue({
      hasUncaughtError: true,
      errorCount: 1,
      lastError: "Test error",
      lastErrorTimestamp: testTimestamp,
      isBlocking: true,
    });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByText } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    await waitFor(() => {
      const expectedDate = new Date(testTimestamp).toLocaleString();
      expect(getByText(`Last error: ${expectedDate}`)).toBeTruthy();
    });
  });

  it("handles missing timestamp gracefully", async () => {
    mockGetGlobalErrorState.mockReturnValue({
      hasUncaughtError: true,
      errorCount: 1,
      lastError: "Test error",
      lastErrorTimestamp: "",
      isBlocking: true,
    });

    const TestComponent = () => <Text>Test Content</Text>;

    const { getByText } = render(
      <ErrorBlocker>
        <TestComponent />
      </ErrorBlocker>,
    );

    await waitFor(() => {
      expect(getByText("Last error: Unknown")).toBeTruthy();
    });
  });
});
