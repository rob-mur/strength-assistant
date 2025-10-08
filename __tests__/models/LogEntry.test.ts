/**
 * Unit Test: LogEntry Model
 *
 * This test verifies that the LogEntry model functions correctly,
 * including validation, auto-collection of context, and utility methods.
 */

import { LogEntry } from "../../lib/models/LogEntry";
import { ErrorSeverity } from "../../specs/011-improve-error-logging/contracts/logging-service";

jest.mock("expo-constants");

describe("LogEntry Model", () => {
  describe("Constructor and Validation", () => {
    it("should create a valid LogEntry", () => {
      const entry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
      });
      expect(entry).toBeDefined();
    });

    it("should throw an error for invalid data", () => {
      expect(() => {
        new LogEntry({} as any);
      }).toThrow();
    });

    it("should auto-populate device info", () => {
      const entry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
      });
      expect(entry.deviceInfo).toBeDefined();
      expect(entry.deviceInfo?.platform).toBe("ios"); // From mock
    });
  });

  describe("Static Factory Methods", () => {
    it("should create a LogEntry for an error event", () => {
      const entry = LogEntry.forErrorEvent(
        "test-event-id",
        "Warning",
        "test-component",
        "test",
      );
      expect(entry.errorEventId).toBe("test-event-id");
      expect(entry.logLevel).toBe("Warning");
    });

    it("should create a LogEntry with auto-detected component", () => {
      const entry = LogEntry.withAutoComponent("test-event-id", "Info", "test");
      // The detected component will be the test file itself
      expect(entry.component).not.toBe("unknown-component");
    });
  });

  describe("Utility Methods", () => {
    it("should check if it is critical", () => {
      const criticalEntry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Critical",
        component: "test-component",
        environment: "test",
      });
      expect(criticalEntry.isCritical()).toBe(true);

      const nonCriticalEntry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
      });
      expect(nonCriticalEntry.isCritical()).toBe(false);
    });

    it("should check if it is mobile", () => {
      const mobileEntry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
        deviceInfo: { platform: "android", version: "10" },
      });
      expect(mobileEntry.isMobile()).toBe(true);

      const webEntry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
        deviceInfo: { platform: "web", version: "1" },
      });
      expect(webEntry.isMobile()).toBe(false);
    });

    it("should return a formatted entry string", () => {
      const entry = new LogEntry({
        errorEventId: "test-event-id",
        logLevel: "Error",
        component: "test-component",
        environment: "test",
      });
      const formatted = entry.getFormattedEntry();
      expect(formatted).toContain("[Error]");
      expect(formatted).toContain("[ios]");
      expect(formatted).toContain("test-component");
      expect(formatted).toContain("test-event-id");
    });
  });
});
