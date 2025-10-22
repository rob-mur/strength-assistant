/**
 * @jest-environment node
 */

import {
  createSimpleErrorLogger,
  getGlobalErrorState,
  resetGlobalErrorState,
} from "@/lib/utils/logging/SimpleErrorLogger";

describe("SimpleErrorLogger", () => {
  beforeEach(() => {
    resetGlobalErrorState();
  });

  it("creates logger with default settings", () => {
    const logger = createSimpleErrorLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.logError).toBe("function");
    expect(typeof logger.logAndBlock).toBe("function");
  });

  it("creates logger correctly", () => {
    const logger = createSimpleErrorLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.logError).toBe("function");
    expect(typeof logger.logAndBlock).toBe("function");
  });

  it("logs error without blocking", () => {
    const logger = createSimpleErrorLogger();
    const error = new Error("Test error");
    const context = "test-context";

    logger.logError(error, context);

    const state = getGlobalErrorState();
    expect(state.hasUncaughtError).toBe(false);
    expect(state.errorCount).toBe(0);
  });

  it("logs error and blocks application", () => {
    const logger = createSimpleErrorLogger();
    const error = new Error("Test blocking error");
    const context = "blocking-context";

    logger.logAndBlock(error, context);

    const state = getGlobalErrorState();
    expect(state.hasUncaughtError).toBe(true);
    expect(state.errorCount).toBe(1);
    expect(state.lastError).toBe("Test blocking error");
    expect(state.isBlocking).toBe(true);
  });

  it("handles multiple blocking errors", () => {
    const logger = createSimpleErrorLogger();

    logger.logAndBlock(new Error("First error"), "context1");
    logger.logAndBlock(new Error("Second error"), "context2");

    const state = getGlobalErrorState();
    expect(state.errorCount).toBe(2);
    expect(state.lastError).toBe("Second error");
  });

  it("resets global error state", () => {
    const logger = createSimpleErrorLogger();
    logger.logAndBlock(new Error("Test error"), "context");

    resetGlobalErrorState();

    const state = getGlobalErrorState();
    expect(state.hasUncaughtError).toBe(false);
    expect(state.errorCount).toBe(0);
    expect(state.lastError).toBe("");
  });

  it("creates multiple loggers", () => {
    const logger1 = createSimpleErrorLogger();
    const logger2 = createSimpleErrorLogger();

    expect(logger1).toBeDefined();
    expect(logger2).toBeDefined();
    expect(logger1).not.toBe(logger2);
  });

  it("gets global error state correctly", () => {
    const initialState = getGlobalErrorState();
    expect(initialState.hasUncaughtError).toBe(false);
    expect(initialState.errorCount).toBe(0);
    expect(initialState.lastError).toBe("");
  });

  it("includes timestamps in error state", () => {
    const logger = createSimpleErrorLogger();
    const beforeLog = Date.now();

    logger.logAndBlock(new Error("Timestamp test"), "timestamp-context");

    const state = getGlobalErrorState();
    const afterLog = Date.now();
    const timestamp = new Date(state.lastErrorTimestamp).getTime();

    expect(timestamp).toBeGreaterThanOrEqual(beforeLog);
    expect(timestamp).toBeLessThanOrEqual(afterLog);
  });

  it("handles error without message", () => {
    const logger = createSimpleErrorLogger();
    const error = new Error();

    logger.logAndBlock(error, "no-message-context");

    const state = getGlobalErrorState();
    expect(state.lastError).toBe("Unknown error");
  });

  it("dispatches custom event when window is available", () => {
    // Mock globalThis.window and dispatchEvent
    const mockDispatchEvent = jest.fn();
    Object.defineProperty(globalThis, 'window', {
      value: {},
      writable: true,
      configurable: true
    });
    Object.defineProperty(globalThis, 'dispatchEvent', {
      value: mockDispatchEvent,
      writable: true,
      configurable: true
    });

    const logger = createSimpleErrorLogger();
    const error = new Error("Event dispatch test");

    logger.logAndBlock(error, "event-context");

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "uncaughtError",
        detail: expect.objectContaining({
          hasUncaughtError: true,
          errorCount: 1,
          lastError: "Event dispatch test",
          isBlocking: true
        })
      })
    );

    // Clean up
    delete (globalThis as any).window;
    delete (globalThis as any).dispatchEvent;
  });

  it("handles missing window gracefully", () => {
    // Ensure window is undefined
    const originalWindow = (globalThis as any).window;
    const originalDispatchEvent = (globalThis as any).dispatchEvent;
    delete (globalThis as any).window;
    delete (globalThis as any).dispatchEvent;

    const logger = createSimpleErrorLogger();
    const error = new Error("No window test");

    // Should not throw
    expect(() => {
      logger.logAndBlock(error, "no-window-context");
    }).not.toThrow();

    const state = getGlobalErrorState();
    expect(state.hasUncaughtError).toBe(true);
    expect(state.lastError).toBe("No window test");

    // Restore original values
    if (originalWindow !== undefined) {
      (globalThis as any).window = originalWindow;
    }
    if (originalDispatchEvent !== undefined) {
      (globalThis as any).dispatchEvent = originalDispatchEvent;
    }
  });
});
