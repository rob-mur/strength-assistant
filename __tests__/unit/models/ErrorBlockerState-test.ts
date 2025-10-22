/**
 * @jest-environment node
 */

import {
  createErrorBlockerState,
  createErrorBlockerStateWithError,
  validateErrorBlockerState,
  getErrorDisplayMessage,
  isAppBlocked,
} from "@/lib/models/ErrorBlockerState";
import { ErrorBlockerState } from "@/specs/012-production-bug-android/contracts/simple-error-blocking";

describe("ErrorBlockerState", () => {
  it("creates default state correctly", () => {
    const state = createErrorBlockerState();

    expect(state.hasUncaughtError).toBe(false);
    expect(state.errorCount).toBe(0);
    expect(state.lastError).toBe("");
    expect(state.lastErrorTimestamp).toBe("");
    expect(state.isBlocking).toBe(false);
  });

  it("creates error state correctly", () => {
    const error = new Error("Test error");

    const state = createErrorBlockerStateWithError(error);

    expect(state.hasUncaughtError).toBe(true);
    expect(state.errorCount).toBe(1);
    expect(state.lastError).toBe("Test error");
    expect(state.lastErrorTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(state.isBlocking).toBe(true);
  });

  it("increments error count correctly", () => {
    const initialState = createErrorBlockerStateWithError(
      new Error("First error"),
    );

    const updatedState = createErrorBlockerStateWithError(
      new Error("Second error"),
      initialState,
    );

    expect(updatedState.hasUncaughtError).toBe(true);
    expect(updatedState.errorCount).toBe(2);
    expect(updatedState.lastError).toBe("Second error");
    expect(updatedState.isBlocking).toBe(true);
  });

  it("validates error state correctly", () => {
    const validState = createErrorBlockerState();
    const errorState = createErrorBlockerStateWithError(
      new Error("Test error"),
    );

    expect(validateErrorBlockerState(validState)).toBe(true);
    expect(validateErrorBlockerState(errorState)).toBe(true);
  });

  it("gets error display message correctly", () => {
    const defaultState = createErrorBlockerState();
    const errorState = createErrorBlockerStateWithError(
      new Error("Test error"),
    );

    expect(getErrorDisplayMessage(defaultState)).toBe("");
    expect(getErrorDisplayMessage(errorState)).toBe("Test error");
  });

  it("checks if app is blocked", () => {
    const defaultState = createErrorBlockerState();
    const errorState = createErrorBlockerStateWithError(
      new Error("Test error"),
    );

    expect(isAppBlocked(defaultState)).toBe(false);
    expect(isAppBlocked(errorState)).toBe(true);
  });

  it("handles error without message", () => {
    const error = new Error();
    const state = createErrorBlockerStateWithError(error);

    expect(state.hasUncaughtError).toBe(true);
    expect(state.errorCount).toBe(1);
    expect(state.lastError).toBe("Unknown error");
    expect(state.isBlocking).toBe(true);
  });

  it("gets display message for multiple errors", () => {
    const initialState = createErrorBlockerStateWithError(
      new Error("First error"),
    );
    const multipleErrorsState = createErrorBlockerStateWithError(
      new Error("Second error"),
      initialState,
    );

    expect(getErrorDisplayMessage(multipleErrorsState)).toBe(
      "Second error (2 errors total)",
    );
  });
});
