/**
 * @jest-environment node
 */

import {
  SimpleErrorLog,
  createSimpleErrorLog,
  createSimpleErrorLogFromMessage,
  formatSimpleErrorLog,
  formatSimpleErrorLogWithStack,
} from "@/lib/models/SimpleErrorLog";

describe("SimpleErrorLog", () => {
  it("creates error log with all required fields", () => {
    const error = new Error("Test error");
    const context = "test-context";

    const log = createSimpleErrorLog(error, context);

    expect(log.message).toBe("Test error");
    expect(log.context).toBe(context);
    expect(log.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(log.stack).toBe(error.stack);
  });

  it("handles error without stack trace", () => {
    const error = new Error("Test error");
    error.stack = undefined;
    const context = "test-context";

    const log = createSimpleErrorLog(error, context);

    expect(log.message).toBe("Test error");
    expect(log.context).toBe(context);
    expect(log.stack).toBeUndefined();
  });

  it("handles string error message", () => {
    const errorMessage = "String error message";
    const context = "test-context";

    const log = createSimpleErrorLogFromMessage(errorMessage, context);

    expect(log.message).toBe(errorMessage);
    expect(log.context).toBe(context);
    expect(log.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(log.stack).toBeUndefined();
  });

  it("formats error log correctly", () => {
    const error = new Error("Test error");
    const context = "test-context";
    const log = createSimpleErrorLog(error, context);

    const formatted = formatSimpleErrorLog(log);
    expect(formatted).toContain("[test-context] Test error");
  });

  it("formats error log with stack trace", () => {
    const error = new Error("Test error");
    const context = "test-context";
    const log = createSimpleErrorLog(error, context);

    const formatted = formatSimpleErrorLogWithStack(log);
    expect(formatted).toContain("[test-context] Test error");
    expect(formatted).toContain("Stack:");
  });

  it("handles error without message", () => {
    const error = new Error();
    const context = "test-context";

    const log = createSimpleErrorLog(error, context);

    expect(log.message).toBe("Unknown error");
    expect(log.context).toBe(context);
  });
});
