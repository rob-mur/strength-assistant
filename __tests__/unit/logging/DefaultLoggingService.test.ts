/**
 * Unit Tests: DefaultLoggingService
 *
 * Tests for core logging functionality, buffer management,
 * recovery actions, and error persistence.
 */

import {
  DefaultLoggingService,
  LoggingServiceConfig,
} from "@/lib/utils/logging/DefaultLoggingService";
import {
  ErrorSeverity,
  ErrorType,
  RecoveryAction,
} from "@/specs/011-improve-error-logging/contracts/logging-service";

describe("DefaultLoggingService", () => {
  let service: DefaultLoggingService;
  let mockConfig: LoggingServiceConfig;

  // Mock console methods to avoid test noise
  const originalConsoleLog = console.log;

  beforeEach(() => {
    mockConfig = {
      maxBufferSize: 10,
      maxRetentionDays: 7,
      enableLocalPersistence: false,
      environment: "test",
      enableConsoleLogging: false,
    };

    service = new DefaultLoggingService(mockConfig);
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("Constructor", () => {
    it("should create service with provided config", () => {
      expect(service).toBeDefined();
      expect(typeof service.logError).toBe("function");
    });

    it("should initialize empty error buffer", async () => {
      const errors = await service.getRecentErrors();
      expect(errors).toHaveLength(0);
    });
  });

  describe("logError", () => {
    it("should log Error object with all required fields", async () => {
      const error = new Error("Test error");
      const operation = "test-operation";
      const severity: ErrorSeverity = "Error";
      const errorType: ErrorType = "Logic";

      const eventId = await service.logError(
        error,
        operation,
        severity,
        errorType,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
      expect(eventId.length).toBeGreaterThan(0);

      const recentErrors = await service.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);

      const loggedError = recentErrors[0];
      expect(loggedError.message).toBe("Test error");
      expect(loggedError.operation).toBe(operation);
      expect(loggedError.severity).toBe(severity);
      expect(loggedError.errorType).toBe(errorType);
      expect(loggedError.stackTrace).toBeDefined();
    });

    it("should log string error message", async () => {
      const errorMessage = "String error message";
      const operation = "test-op";
      const severity: ErrorSeverity = "Warning";
      const errorType: ErrorType = "Network";

      const eventId = await service.logError(
        errorMessage,
        operation,
        severity,
        errorType,
      );

      expect(eventId).toBeDefined();

      const recentErrors = await service.getRecentErrors(1);
      const loggedError = recentErrors[0];
      expect(loggedError.message).toBe(errorMessage);
      expect(loggedError.stackTrace).toBeUndefined();
    });

    it("should include additional context", async () => {
      const error = new Error("Context test");
      const operation = "context-test";
      const additionalContext = {
        userAction: "button-click",
        navigationState: { currentRoute: "/test" },
      };

      await service.logError(
        error,
        operation,
        "Error",
        "UI",
        additionalContext,
      );

      const recentErrors = await service.getRecentErrors(1);
      const loggedError = recentErrors[0];
      expect(loggedError.appState).toEqual(additionalContext);
    });

    it("should set isTransient correctly for Network errors", async () => {
      await service.logError("Network error", "test", "Error", "Network");

      const recentErrors = await service.getRecentErrors(1);
      expect(recentErrors[0].isTransient).toBe(true);
    });

    it("should set isTransient correctly for non-Network errors", async () => {
      await service.logError("Logic error", "test", "Error", "Logic");

      const recentErrors = await service.getRecentErrors(1);
      expect(recentErrors[0].isTransient).toBe(false);
    });

    it("should generate valid timestamp in ISO format", async () => {
      await service.logError("Time test", "test", "Info", "Logic");

      const recentErrors = await service.getRecentErrors(1);
      const timestamp = recentErrors[0].timestamp;

      // Should be valid ISO 8601 date
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe("Buffer Management", () => {
    it("should respect maxBufferSize limit", async () => {
      // Log more errors than buffer size
      for (let i = 0; i < 15; i++) {
        await service.logError(`Error ${i}`, "test", "Error", "Logic");
      }

      const recentErrors = await service.getRecentErrors();
      expect(recentErrors.length).toBeLessThanOrEqual(mockConfig.maxBufferSize);
    });

    it("should maintain FIFO order when buffer overflows", async () => {
      // Fill buffer beyond capacity
      for (let i = 0; i < 15; i++) {
        await service.logError(`Error ${i}`, "test", "Error", "Logic");
      }

      const recentErrors = await service.getRecentErrors();

      // Should contain the latest errors (higher numbers)
      const firstError = recentErrors[0];
      expect(firstError.message).toMatch(/Error \d+/);

      // First logged error should be evicted
      const hasEarlyError = recentErrors.some((e) => e.message === "Error 0");
      expect(hasEarlyError).toBe(false);
    });
  });

  describe("logInfo", () => {
    it("should log info message and return event ID", async () => {
      const message = "Info message";
      const operation = "info-test";
      const additionalData = { userId: "test-user" };

      const eventId = await service.logInfo(message, operation, additionalData);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });

    it("should handle info logging with console disabled", async () => {
      const eventId = await service.logInfo("Silent info", "test");

      expect(eventId).toBeDefined();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe("logWarning", () => {
    it("should log warning message", async () => {
      const message = "Warning message";
      const operation = "warn-test";

      const eventId = await service.logWarning(message, operation);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });
  });

  describe("logDebug", () => {
    it("should log debug message with data", async () => {
      const message = "Debug message";
      const operation = "debug-test";
      const debugData = { component: "test", state: { active: true } };

      const eventId = await service.logDebug(message, operation, debugData);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });
  });

  describe("Recovery Actions", () => {
    it("should configure and retrieve recovery actions", () => {
      const recoveryAction: RecoveryAction = {
        actionId: "network-retry",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 0,
        retryDelay: 1000,
        maxRetries: 3,
      };

      service.configureRecoveryAction("Network", recoveryAction);

      const retrieved = service.getRecoveryAction("Network");
      expect(retrieved).toEqual(recoveryAction);
    });

    it("should return null for unconfigured error types", () => {
      const action = service.getRecoveryAction("Database");
      expect(action).toBeNull();
    });

    it("should attempt recovery with configured action", async () => {
      const recoveryAction: RecoveryAction = {
        actionId: "test-recovery",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 0,
        retryDelay: 100,
        maxRetries: 2,
      };

      service.configureRecoveryAction("Network", recoveryAction);

      const errorEvent = {
        id: "test-error",
        timestamp: new Date().toISOString(),
        message: "Network timeout",
        severity: "Error" as ErrorSeverity,
        errorType: "Network" as ErrorType,
        isTransient: true,
        operation: "data-fetch",
      };

      const result = await service.attemptRecovery(errorEvent);
      expect(typeof result).toBe("boolean");
    });

    it("should return false for recovery without configured action", async () => {
      const errorEvent = {
        id: "test-error",
        timestamp: new Date().toISOString(),
        message: "Unknown error",
        severity: "Error" as ErrorSeverity,
        errorType: "Logic" as ErrorType,
        isTransient: false,
        operation: "unknown-op",
      };

      const result = await service.attemptRecovery(errorEvent);
      expect(result).toBe(false);
    });
  });

  describe("getRecentErrors", () => {
    beforeEach(async () => {
      // Log multiple errors with different severities
      await service.logError("Critical error", "test", "Critical", "Database");
      await service.logError("Error message", "test", "Error", "Network");
      await service.logError("Warning message", "test", "Warning", "UI");
    });

    it("should return all errors with default limit", async () => {
      const errors = await service.getRecentErrors();
      expect(errors.length).toBe(3);
    });

    it("should respect custom limit", async () => {
      const errors = await service.getRecentErrors(2);
      expect(errors.length).toBe(2);
    });

    it("should filter by severity", async () => {
      const criticalErrors = await service.getRecentErrors(10, "Critical");
      expect(criticalErrors.length).toBe(1);
      expect(criticalErrors[0].severity).toBe("Critical");
    });

    it("should return empty array when no errors match severity", async () => {
      const infoErrors = await service.getRecentErrors(10, "Info");
      expect(infoErrors).toHaveLength(0);
    });

    it("should return errors in chronological order (most recent last)", async () => {
      const errors = await service.getRecentErrors();

      // Verify timestamps are in ascending order
      for (let i = 1; i < errors.length; i++) {
        const prev = new Date(errors[i - 1].timestamp);
        const curr = new Date(errors[i].timestamp);
        expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
      }
    });
  });

  describe("clearOldErrors", () => {
    beforeEach(async () => {
      // Log some test errors
      await service.logError("Old error 1", "test", "Error", "Logic");
      await service.logError("Old error 2", "test", "Error", "Logic");
      await service.logError("Old error 3", "test", "Error", "Logic");
    });

    it("should clear all errors when olderThanDays is 0", async () => {
      const initialCount = (await service.getRecentErrors()).length;
      expect(initialCount).toBeGreaterThan(0);

      const clearedCount = await service.clearOldErrors(0);
      expect(clearedCount).toBe(initialCount);

      const remainingErrors = await service.getRecentErrors();
      expect(remainingErrors).toHaveLength(0);
    });

    it("should not clear recent errors", async () => {
      const initialCount = (await service.getRecentErrors()).length;

      // Clear errors older than 1 day (all errors are recent)
      const clearedCount = await service.clearOldErrors(1);
      expect(clearedCount).toBe(0);

      const remainingErrors = await service.getRecentErrors();
      expect(remainingErrors.length).toBe(initialCount);
    });

    it("should return correct count of cleared errors", async () => {
      const initialCount = (await service.getRecentErrors()).length;

      const clearedCount = await service.clearOldErrors(0);
      expect(clearedCount).toBe(initialCount);
    });
  });

  describe("Console Logging", () => {
    it("should log to console when enabled", async () => {
      const configWithLogging: LoggingServiceConfig = {
        ...mockConfig,
        enableConsoleLogging: true,
      };

      const serviceWithLogging = new DefaultLoggingService(configWithLogging);

      await serviceWithLogging.logError(
        "Console test",
        "test",
        "Error",
        "Logic",
      );

      expect(console.log).toHaveBeenCalled();
    });

    it("should not log to console when disabled", async () => {
      await service.logError("Silent test", "test", "Error", "Logic");

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe("Error Event Structure", () => {
    it("should create error events with unique IDs", async () => {
      await service.logError("Test 1", "test", "Error", "Logic");
      await service.logError("Test 2", "test", "Error", "Logic");

      const errors = await service.getRecentErrors();
      const ids = errors.map((e) => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should include all required ErrorEvent fields", async () => {
      await service.logError(
        new Error("Full test"),
        "test-op",
        "Warning",
        "Network",
      );

      const errors = await service.getRecentErrors(1);
      const error = errors[0];

      expect(error).toHaveProperty("id");
      expect(error).toHaveProperty("timestamp");
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("stackTrace");
      expect(error).toHaveProperty("severity");
      expect(error).toHaveProperty("errorType");
      expect(error).toHaveProperty("isTransient");
      expect(error).toHaveProperty("operation");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long error messages", async () => {
      const longMessage = "A".repeat(10000);

      const eventId = await service.logError(
        longMessage,
        "test",
        "Error",
        "Logic",
      );
      expect(eventId).toBeDefined();

      const errors = await service.getRecentErrors(1);
      expect(errors[0].message).toBe(longMessage);
    });

    it("should handle special characters in error messages", async () => {
      const specialMessage = "Error with 🚨 emojis and \n newlines \t tabs";

      await service.logError(specialMessage, "test", "Error", "Logic");

      const errors = await service.getRecentErrors(1);
      expect(errors[0].message).toBe(specialMessage);
    });

    it("should handle concurrent error logging", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          service.logError(`Concurrent ${i}`, "test", "Error", "Logic"),
        );
      }

      const eventIds = await Promise.all(promises);

      expect(eventIds).toHaveLength(10);
      expect(new Set(eventIds).size).toBe(10); // All IDs should be unique
    });
  });
});
