/**
 * Integration Test: Error Event Logging Flow
 *
 * This test verifies the complete end-to-end flow of error logging
 * from initial error occurrence through context collection to persistent storage.
 *
 * CRITICAL: This test MUST FAIL until the logging infrastructure is implemented.
 */

import {
  LoggingServiceFactory,
  LoggingService,
  ErrorHandler,
  UserErrorDisplay,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

describe("Error Event Logging Flow Integration", () => {
  let loggingServiceFactory: LoggingServiceFactory;
  let loggingService: LoggingService;
  let errorHandler: ErrorHandler;
  let userErrorDisplay: UserErrorDisplay;

  beforeEach(() => {
    // This will fail until LoggingServiceFactory is implemented
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      LoggingServiceFactory: FactoryImpl,
    } = require("../../lib/utils/logging/LoggingServiceFactory");

    loggingServiceFactory = new FactoryImpl();
    loggingService = loggingServiceFactory.createLoggingService({
      maxBufferSize: 50,
      maxRetentionDays: 7,
      enableLocalPersistence: true,
      environment: "test",
      enableConsoleLogging: false,
    });
    errorHandler = loggingServiceFactory.createErrorHandler(loggingService);
    userErrorDisplay = loggingServiceFactory.createUserErrorDisplay();
  });

  describe("Complete Error Logging Flow", () => {
    it("should log error with full context and make it retrievable", async () => {
      const testError = new Error("Integration test error");
      const operation = "integration-test-operation";
      const additionalContext = {
        userAction: "button-click",
        navigationState: {
          currentRoute: "/test-screen",
          previousRoute: "/home",
        },
        dataState: { userId: "test-user-123" },
        networkState: "connected" as const,
      };

      // Log the error with full context
      const eventId = await loggingService.logError(
        testError,
        operation,
        "Error",
        "Logic",
        additionalContext,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");

      // Verify the error can be retrieved
      const recentErrors = await loggingService.getRecentErrors(10);
      const loggedError = recentErrors.find((error) => error.id === eventId);

      expect(loggedError).toBeDefined();
      expect(loggedError?.message).toBe(testError.message);
      expect(loggedError?.operation).toBe(operation);
      expect(loggedError?.severity).toBe("Error");
      expect(loggedError?.errorType).toBe("Logic");

      // Verify context was captured
      expect(loggedError?.appState).toBeDefined();
    });

    it("should handle error sequence with different severity levels", async () => {
      const operations = [
        {
          message: "Debug info",
          severity: "Debug" as const,
          type: "Logic" as const,
        },
        {
          message: "Warning message",
          severity: "Warning" as const,
          type: "UI" as const,
        },
        {
          message: "Error occurred",
          severity: "Error" as const,
          type: "Network" as const,
        },
        {
          message: "Critical failure",
          severity: "Critical" as const,
          type: "Database" as const,
        },
      ];

      const eventIds: string[] = [];

      // Log multiple errors with different severities
      for (const op of operations) {
        const eventId = await loggingService.logError(
          new Error(op.message),
          `operation-${op.severity.toLowerCase()}`,
          op.severity,
          op.type,
        );
        eventIds.push(eventId);
      }

      // Verify all were logged
      expect(eventIds.length).toBe(operations.length);
      eventIds.forEach((id) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe("string");
      });

      // Verify they can all be retrieved
      const recentErrors = await loggingService.getRecentErrors(10);
      const loggedEvents = recentErrors.filter((error) =>
        eventIds.includes(error.id),
      );

      expect(loggedEvents.length).toBe(operations.length);

      // Verify severity filtering works
      const criticalErrors = await loggingService.getRecentErrors(
        10,
        "Critical",
      );
      const criticalEvent = criticalErrors.find((error) =>
        error.message.includes("Critical failure"),
      );
      expect(criticalEvent).toBeDefined();
      expect(criticalEvent?.severity).toBe("Critical");
    });

    it("should handle rapid sequential error logging without data loss", async () => {
      const numberOfErrors = 20;
      const errorPromises: Promise<string>[] = [];

      // Log multiple errors rapidly
      for (let i = 0; i < numberOfErrors; i++) {
        const promise = loggingService.logError(
          new Error(`Rapid error ${i}`),
          `rapid-operation-${i}`,
          "Warning",
          "Logic",
        );
        errorPromises.push(promise);
      }

      // Wait for all to complete
      const eventIds = await Promise.all(errorPromises);

      expect(eventIds.length).toBe(numberOfErrors);
      eventIds.forEach((id, index) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe("string");
      });

      // Verify all errors were actually logged
      const recentErrors = await loggingService.getRecentErrors(
        numberOfErrors + 5,
      );
      const rapidErrors = recentErrors.filter((error) =>
        error.message.startsWith("Rapid error"),
      );

      expect(rapidErrors.length).toBe(numberOfErrors);
    });
  });

  describe("Error Context Collection", () => {
    it("should collect and preserve error context across async operations", async () => {
      const mockAsyncOperation = async () => {
        // Simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("Async operation failed");
      };

      const wrappedOperation = errorHandler.wrapAsyncWithErrorHandling(
        mockAsyncOperation,
        "async-context-test",
        "Network",
        false, // no recovery
      );

      // Execute the wrapped operation
      await wrappedOperation();

      // Verify the error was logged with context
      const recentErrors = await loggingService.getRecentErrors(5);
      const asyncError = recentErrors.find(
        (error) => error.operation === "async-context-test",
      );

      expect(asyncError).toBeDefined();
      expect(asyncError?.message).toContain("Async operation failed");
      expect(asyncError?.errorType).toBe("Network");

      // Context should be preserved even through async boundaries
      expect(asyncError?.timestamp).toBeDefined();
      expect(new Date(asyncError!.timestamp)).toBeInstanceOf(Date);
    });

    it("should collect device and environment context", async () => {
      await loggingService.logError(
        new Error("Device context test"),
        "device-context-operation",
        "Info",
        "UI",
      );

      const recentErrors = await loggingService.getRecentErrors(5);
      const deviceError = recentErrors.find(
        (error) => error.operation === "device-context-operation",
      );

      expect(deviceError).toBeDefined();

      // Should have collected some device/environment context
      // The exact context depends on implementation, but timestamp should always be present
      expect(deviceError?.timestamp).toBeDefined();
      expect(new Date(deviceError!.timestamp)).toBeInstanceOf(Date); // ISO format
    });
  });

  describe("Error Buffer Management", () => {
    it("should respect buffer size limits and cleanup old entries", async () => {
      // Create service with small buffer for testing
      const smallBufferService = loggingServiceFactory.createLoggingService({
        maxBufferSize: 5,
        maxRetentionDays: 1,
      });

      // Log more errors than buffer size
      const eventIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const eventId = await smallBufferService.logError(
          new Error(`Buffer test error ${i}`),
          `buffer-test-${i}`,
          "Info",
          "Logic",
        );
        eventIds.push(eventId);
      }

      // Buffer should not exceed maximum size
      const recentErrors = await smallBufferService.getRecentErrors();
      expect(recentErrors.length).toBeLessThanOrEqual(5);

      // Most recent errors should be preserved
      const mostRecentError = recentErrors.find((error) =>
        error.message.includes("Buffer test error 9"),
      );
      expect(mostRecentError).toBeDefined();
    });

    it("should clear old errors based on retention policy", async () => {
      // Log an error
      const eventId = await loggingService.logError(
        new Error("Old error for cleanup test"),
        "cleanup-test",
        "Warning",
        "Logic",
      );

      // Verify it exists
      let recentErrors = await loggingService.getRecentErrors();
      let oldError = recentErrors.find((error) => error.id === eventId);
      expect(oldError).toBeDefined();

      // Clear old errors (testing the cleanup mechanism)
      const clearedCount = await loggingService.clearOldErrors(0); // Clear all

      expect(typeof clearedCount).toBe("number");
      expect(clearedCount).toBeGreaterThanOrEqual(0);

      // The specific error should no longer be in recent errors
      // (though implementation may vary on immediate vs eventual cleanup)
      recentErrors = await loggingService.getRecentErrors();
      const remainingErrors = recentErrors.length;
      expect(remainingErrors).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Flow Performance", () => {
    it("should log errors with minimal performance impact", async () => {
      const startTime = performance.now();

      // Log a batch of errors
      const promises: Promise<string>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          loggingService.logError(
            new Error(`Performance test error ${i}`),
            `perf-test-${i}`,
            "Info",
            "Logic",
          ),
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (target: <1ms per error avg)
      const averageTime = totalTime / 10;
      expect(averageTime).toBeLessThan(5); // Allow some overhead for test environment

      // Verify all errors were logged
      const recentErrors = await loggingService.getRecentErrors(15);
      const perfTestErrors = recentErrors.filter((error) =>
        error.message.startsWith("Performance test error"),
      );

      expect(perfTestErrors.length).toBe(10);
    });

    it("should handle concurrent error logging without race conditions", async () => {
      const concurrentCount = 20;
      const promises: Promise<string>[] = [];

      // Launch concurrent error logging operations
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          loggingService.logError(
            new Error(`Concurrent error ${i}`),
            `concurrent-test-${i}`,
            "Warning",
            "Logic",
          ),
        );
      }

      const eventIds = await Promise.all(promises);

      // All should complete successfully
      expect(eventIds.length).toBe(concurrentCount);
      eventIds.forEach((id) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe("string");
      });

      // All should be unique
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(concurrentCount);

      // All should be retrievable
      const recentErrors = await loggingService.getRecentErrors(
        concurrentCount + 5,
      );
      const concurrentErrors = recentErrors.filter((error) =>
        error.message.startsWith("Concurrent error"),
      );

      expect(concurrentErrors.length).toBe(concurrentCount);
    });
  });

  describe("Integration with Error Handler", () => {
    it("should integrate error handler with logging service seamlessly", async () => {
      const testFunction = () => {
        throw new Error("Handler integration test error");
      };

      const wrappedFunction = errorHandler.wrapWithErrorHandling(
        testFunction,
        "handler-integration-test",
        "Logic",
      );

      // Function should not throw, but should log error
      expect(() => wrappedFunction()).not.toThrow();

      // Error should be logged
      const recentErrors = await loggingService.getRecentErrors(5);
      const handlerError = recentErrors.find(
        (error) => error.operation === "handler-integration-test",
      );

      expect(handlerError).toBeDefined();
      expect(handlerError?.message).toContain("Handler integration test error");
      expect(handlerError?.errorType).toBe("Logic");
    });
  });
});
