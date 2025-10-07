/**
 * Contract Test: LoggingService Interface
 *
 * This test verifies that any LoggingService implementation adheres to the contract
 * defined in the logging-service.ts contract file.
 *
 * CRITICAL: This test MUST FAIL until the DefaultLoggingService is implemented.
 */

import {
  LoggingService,
  ErrorSeverity,
  ErrorType,
  ErrorEvent,
  RecoveryAction,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

// This will fail until we implement DefaultLoggingService
let loggingService: LoggingService;

describe("LoggingService Contract", () => {
  beforeEach(() => {
    const {
      DefaultLoggingService,
    } = require("../../lib/utils/logging/DefaultLoggingService");
    const mockConfig = {
      maxBufferSize: 100,
      maxRetentionDays: 30,
      enableLocalPersistence: false,
      environment: "test",
      enableConsoleLogging: true,
    };
    loggingService = new DefaultLoggingService(mockConfig);
  });

  describe("logError method", () => {
    it("should log error with standard context and return event ID", async () => {
      const testError = new Error("Test error message");
      const operation = "test-operation";
      const severity: ErrorSeverity = "Error";
      const errorType: ErrorType = "Logic";

      const eventId = await loggingService.logError(
        testError,
        operation,
        severity,
        errorType,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
      expect(eventId.length).toBeGreaterThan(0);
    });

    it("should log error with string message", async () => {
      const errorMessage = "String error message";
      const operation = "test-operation";
      const severity: ErrorSeverity = "Warning";
      const errorType: ErrorType = "Network";

      const eventId = await loggingService.logError(
        errorMessage,
        operation,
        severity,
        errorType,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });

    it("should log error with additional context", async () => {
      const testError = new Error("Context test error");
      const operation = "context-test";
      const severity: ErrorSeverity = "Critical";
      const errorType: ErrorType = "Database";
      const additionalContext = {
        userAction: "button-click",
        navigationState: {
          currentRoute: "/test-route",
          previousRoute: "/previous-route",
        },
      };

      const eventId = await loggingService.logError(
        testError,
        operation,
        severity,
        errorType,
        additionalContext,
      );

      expect(eventId).toBeDefined();
    });
  });

  describe("logInfo method", () => {
    it("should log informational message and return event ID", async () => {
      const message = "Informational message";
      const operation = "info-test";
      const additionalData = { userId: "test-user", action: "login" };

      const eventId = await loggingService.logInfo(
        message,
        operation,
        additionalData,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });
  });

  describe("logWarning method", () => {
    it("should log warning message and return event ID", async () => {
      const message = "Warning message";
      const operation = "warning-test";

      const eventId = await loggingService.logWarning(message, operation);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });
  });

  describe("logDebug method", () => {
    it("should log debug message and return event ID", async () => {
      const message = "Debug message";
      const operation = "debug-test";
      const debugData = {
        component: "test-component",
        state: { loading: false },
      };

      const eventId = await loggingService.logDebug(
        message,
        operation,
        debugData,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");
    });
  });

  describe("attemptRecovery method", () => {
    it("should attempt recovery for recoverable error and return success status", async () => {
      const errorEvent: ErrorEvent = {
        id: "test-error-id",
        timestamp: new Date().toISOString(),
        message: "Network timeout",
        severity: "Error",
        errorType: "Network",
        isTransient: true,
        operation: "data-fetch",
      };

      const recoveryResult = await loggingService.attemptRecovery(errorEvent);

      expect(typeof recoveryResult).toBe("boolean");
    });
  });

  describe("getRecoveryAction method", () => {
    it("should return recovery action for configured error type", () => {
      const networkRecoveryAction = loggingService.getRecoveryAction("Network");

      // Should return null if not configured, or RecoveryAction if configured
      expect(
        networkRecoveryAction === null ||
          typeof networkRecoveryAction === "object",
      ).toBe(true);
    });
  });

  describe("configureRecoveryAction method", () => {
    it("should configure recovery action for error type", () => {
      const recoveryAction: RecoveryAction = {
        actionId: "network-retry",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 0,
        retryDelay: 1000,
        maxRetries: 3,
      };

      // Should not throw when configuring recovery action
      expect(() => {
        loggingService.configureRecoveryAction("Network", recoveryAction);
      }).not.toThrow();

      // Should return the configured action
      const configured = loggingService.getRecoveryAction("Network");
      expect(configured).toEqual(recoveryAction);
    });
  });

  describe("getRecentErrors method", () => {
    it("should return recent errors with default limit", async () => {
      // First log some errors
      await loggingService.logError(
        new Error("Recent error 1"),
        "test-op-1",
        "Error",
        "Logic",
      );
      await loggingService.logError(
        new Error("Recent error 2"),
        "test-op-2",
        "Warning",
        "Network",
      );

      const recentErrors = await loggingService.getRecentErrors();

      expect(Array.isArray(recentErrors)).toBe(true);
      expect(recentErrors.length).toBeGreaterThan(0);
      expect(recentErrors.length).toBeLessThanOrEqual(100); // Default limit assumption
    });

    it("should return recent errors with custom limit", async () => {
      const limit = 5;
      const recentErrors = await loggingService.getRecentErrors(limit);

      expect(Array.isArray(recentErrors)).toBe(true);
      expect(recentErrors.length).toBeLessThanOrEqual(limit);
    });

    it("should filter recent errors by severity", async () => {
      await loggingService.logError(
        new Error("Critical error"),
        "test-op",
        "Critical",
        "Database",
      );

      const criticalErrors = await loggingService.getRecentErrors(
        10,
        "Critical",
      );

      expect(Array.isArray(criticalErrors)).toBe(true);
      // All returned errors should be Critical severity
      criticalErrors.forEach((error) => {
        expect(error.severity).toBe("Critical");
      });
    });
  });

  describe("clearOldErrors method", () => {
    it("should clear old errors and return count cleared", async () => {
      const clearedCount = await loggingService.clearOldErrors(30);

      expect(typeof clearedCount).toBe("number");
      expect(clearedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Event Structure Validation", () => {
    it("should create error events with all required fields", async () => {
      await loggingService.logError(
        new Error("Structure test"),
        "structure-test",
        "Error",
        "UI",
      );

      const recentErrors = await loggingService.getRecentErrors(1);
      expect(recentErrors.length).toBeGreaterThan(0);

      const errorEvent = recentErrors[0];
      expect(errorEvent.id).toBeDefined();
      expect(errorEvent.timestamp).toBeDefined();
      expect(errorEvent.message).toBeDefined();
      expect(errorEvent.severity).toBeDefined();
      expect(errorEvent.errorType).toBeDefined();
      expect(typeof errorEvent.isTransient).toBe("boolean");
      expect(errorEvent.operation).toBeDefined();

      // Validate timestamp is ISO 8601 format
      expect(() => new Date(errorEvent.timestamp)).not.toThrow();
      expect(new Date(errorEvent.timestamp).toISOString()).toBe(
        errorEvent.timestamp,
      );
    });
  });
});
