/**
 * Unit Tests: DefaultErrorHandler
 *
 * Tests for global error handling, function wrapping, retry logic,
 * and environment-specific error handling setup.
 */

import {
  DefaultErrorHandler,
  createErrorBoundaryConfig,
  ErrorBoundaryFactory,
} from "@/lib/utils/logging/DefaultErrorHandler";
import {
  LoggingService,
  UserErrorDisplay,
  ErrorType,
  ErrorEvent,
} from "@/specs/011-improve-error-logging/contracts/logging-service";

// Mock dependencies
const mockLoggingService: jest.Mocked<LoggingService> = {
  logError: jest.fn().mockResolvedValue("mock-event-id"),
  logInfo: jest.fn().mockResolvedValue("mock-info-id"),
  logWarning: jest.fn().mockResolvedValue("mock-warning-id"),
  logDebug: jest.fn().mockResolvedValue("mock-debug-id"),
  attemptRecovery: jest.fn().mockResolvedValue(true),
  getRecoveryAction: jest.fn().mockReturnValue(null),
  configureRecoveryAction: jest.fn(),
  getRecentErrors: jest.fn().mockResolvedValue([]),
  clearOldErrors: jest.fn().mockResolvedValue(0),
};

const mockUserErrorDisplay: jest.Mocked<UserErrorDisplay> = {
  showGenericError: jest.fn().mockResolvedValue(),
  showNetworkError: jest.fn().mockResolvedValue(),
  showAuthenticationError: jest.fn().mockResolvedValue(),
  showCustomError: jest.fn().mockResolvedValue(),
};

describe("DefaultErrorHandler", () => {
  let errorHandler: DefaultErrorHandler;

  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock console methods to reduce test noise
    console.error = jest.fn();
    console.warn = jest.fn();

    errorHandler = new DefaultErrorHandler(
      mockLoggingService,
      mockUserErrorDisplay,
    );
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    // Clean up global handlers
    DefaultErrorHandler.cleanupGlobalHandlers();
  });

  describe("Constructor", () => {
    it("should create error handler with logging service", () => {
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.handleUncaughtError).toBe("function");
    });

    it("should setup global error handlers", () => {
      // Global handlers should be set up during construction
      // This is tested by ensuring no errors are thrown during setup
      expect(errorHandler).toBeDefined();
    });

    it("should work without user error display", () => {
      const handlerWithoutDisplay = new DefaultErrorHandler(mockLoggingService);
      expect(handlerWithoutDisplay).toBeDefined();
    });
  });

  describe("handleUncaughtError", () => {
    it("should log uncaught error as critical", async () => {
      const testError = new Error("Uncaught test error");
      const operation = "test-operation";

      errorHandler.handleUncaughtError(testError, operation);

      // Allow async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        testError,
        operation,
        "Critical",
        "Logic", // Default classification
      );
    });

    it("should attempt recovery for recoverable errors", async () => {
      const networkError = new Error("Network timeout");

      errorHandler.handleUncaughtError(networkError, "network-op");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.attemptRecovery).toHaveBeenCalled();
    });

    it("should use default operation name when not provided", async () => {
      const testError = new Error("Default operation test");

      errorHandler.handleUncaughtError(testError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        "uncaught-error",
        "Critical",
        expect.any(String),
      );
    });

    it("should handle logging failures gracefully", async () => {
      mockLoggingService.logError.mockRejectedValueOnce(
        new Error("Logging failed"),
      );

      const testError = new Error("Test error");

      // Should not throw even if logging fails
      expect(() => {
        errorHandler.handleUncaughtError(testError);
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("handleUnhandledRejection", () => {
    it("should handle Error object rejection", async () => {
      const rejectionError = new Error("Rejected promise");

      errorHandler.handleUnhandledRejection(rejectionError, "promise-op");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        rejectionError,
        "promise-op",
        "Critical",
        expect.any(String),
      );
    });

    it("should handle string rejection", async () => {
      const rejectionMessage = "String rejection reason";

      errorHandler.handleUnhandledRejection(
        rejectionMessage,
        "string-rejection",
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        rejectionMessage,
        "string-rejection",
        "Critical",
        expect.any(String),
      );
    });

    it("should handle non-Error object rejections", async () => {
      const rejectionObject = { code: 500, message: "Server error" };

      errorHandler.handleUnhandledRejection(
        rejectionObject,
        "object-rejection",
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalled();
    });

    it("should use default operation for unhandled rejection", async () => {
      const rejectionError = new Error("Default rejection");

      errorHandler.handleUnhandledRejection(rejectionError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        "unhandled-rejection",
        "Critical",
        expect.any(String),
      );
    });
  });

  describe("wrapWithErrorHandling", () => {
    it("should wrap synchronous function and handle errors", () => {
      const throwingFn = () => {
        throw new Error("Sync function error");
      };

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        throwingFn,
        "sync-test",
        "Logic",
      );

      // Should not throw, returns undefined after error
      const result = wrappedFn();
      expect(result).toBeUndefined();
    });

    it("should preserve function return value when no error", () => {
      const normalFn = (x: number, y: number) => x + y;

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        normalFn,
        "math-test",
        "Logic",
      );

      const result = wrappedFn(2, 3);
      expect(result).toBe(5);
    });

    it("should handle promise-returning functions", async () => {
      const asyncThrowingFn = () => Promise.reject(new Error("Async error"));

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        asyncThrowingFn,
        "async-test",
        "Network",
      );

      const result = await wrappedFn();
      expect(result).toBeUndefined();
    });

    it("should preserve successful promise results", async () => {
      const asyncSuccessFn = () => Promise.resolve("success");

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        asyncSuccessFn,
        "async-success",
        "Logic",
      );

      const result = await wrappedFn();
      expect(result).toBe("success");
    });
  });

  describe("wrapAsyncWithErrorHandling", () => {
    it("should wrap async function with retry logic", async () => {
      let callCount = 0;
      const flakyAsyncFn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Flaky error");
        }
        return "success";
      };

      // Configure recovery action to enable retries
      mockLoggingService.getRecoveryAction.mockReturnValue({
        actionId: "test-retry",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 0,
        retryDelay: 1,
        maxRetries: 3,
      });
      mockLoggingService.attemptRecovery.mockResolvedValue(true);

      const wrappedFn = errorHandler.wrapAsyncWithErrorHandling(
        flakyAsyncFn,
        "flaky-test",
        "Network",
        true, // enable recovery
      );

      const result = await wrappedFn();
      expect(result).toBe("success");
      expect(callCount).toBe(3);
    });

    it("should not retry when recovery is disabled", async () => {
      let callCount = 0;
      const throwingFn = async () => {
        callCount++;
        throw new Error("Always fails");
      };

      const wrappedFn = errorHandler.wrapAsyncWithErrorHandling(
        throwingFn,
        "no-retry-test",
        "Logic",
        false, // disable recovery
      );

      const result = await wrappedFn();
      expect(result).toBeUndefined();
      expect(callCount).toBe(1); // Only called once
    });

    it("should respect max retries limit", async () => {
      let callCount = 0;
      const alwaysFailingFn = async () => {
        callCount++;
        throw new Error("Always fails");
      };

      mockLoggingService.getRecoveryAction.mockReturnValue({
        actionId: "limited-retry",
        errorType: "Database",
        actionType: "Retry",
        retryCount: 0,
        retryDelay: 1,
        maxRetries: 2,
      });
      mockLoggingService.attemptRecovery.mockResolvedValue(true);

      const wrappedFn = errorHandler.wrapAsyncWithErrorHandling(
        alwaysFailingFn,
        "limited-retry-test",
        "Database",
        true,
      );

      const result = await wrappedFn();
      expect(result).toBeUndefined();
      expect(callCount).toBe(3); // Initial call + 2 retries
    });
  });

  describe("Error Classification", () => {
    it("should classify network errors correctly", async () => {
      const networkError = new Error("Network timeout");

      errorHandler.handleUncaughtError(networkError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        "Critical",
        "Network",
      );
    });

    it("should classify authentication errors correctly", async () => {
      const authError = new Error("Unauthorized access token expired");

      errorHandler.handleUncaughtError(authError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        "Critical",
        "Authentication",
      );
    });

    it("should classify database errors correctly", async () => {
      const dbError = new Error("Database query failed");

      errorHandler.handleUncaughtError(dbError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        "Critical",
        "Database",
      );
    });

    it("should classify UI errors correctly", async () => {
      const uiError = new Error("Component render failed");

      errorHandler.handleUncaughtError(uiError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        "Critical",
        "UI",
      );
    });

    it("should default to Logic errors for unclassified errors", async () => {
      const genericError = new Error("Generic error message");

      errorHandler.handleUncaughtError(genericError);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        "Critical",
        "Logic",
      );
    });
  });

  describe("User Error Display Integration", () => {
    it("should show network error to user", async () => {
      const networkFn = () => {
        throw new Error("Network connection failed");
      };

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        networkFn,
        "network-test",
        "Network",
      );
      wrappedFn();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUserErrorDisplay.showNetworkError).toHaveBeenCalledWith(
        "network-test",
      );
    });

    it("should show authentication error to user", async () => {
      const authFn = () => {
        throw new Error("Authentication failed");
      };

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        authFn,
        "auth-test",
        "Authentication",
      );
      wrappedFn();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUserErrorDisplay.showAuthenticationError).toHaveBeenCalledWith(
        "auth-test",
      );
    });

    it("should show generic error for other error types", async () => {
      const logicFn = () => {
        throw new Error("Logic error");
      };

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        logicFn,
        "logic-test",
        "Logic",
      );
      wrappedFn();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUserErrorDisplay.showGenericError).toHaveBeenCalledWith(
        "logic-test",
        false,
      );
    });

    it("should handle user error display failures gracefully", async () => {
      mockUserErrorDisplay.showGenericError.mockRejectedValueOnce(
        new Error("Display failed"),
      );

      const testFn = () => {
        throw new Error("Test error");
      };

      const wrappedFn = errorHandler.wrapWithErrorHandling(
        testFn,
        "display-fail-test",
        "Logic",
      );

      // Should not throw even if display fails
      expect(() => wrappedFn()).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("Global Error Handler Cleanup", () => {
    it("should clean up global handlers", () => {
      // This mainly tests that cleanup doesn't throw
      expect(() => {
        DefaultErrorHandler.cleanupGlobalHandlers();
      }).not.toThrow();
    });

    it("should prevent duplicate global handler setup", () => {
      // Create multiple handlers
      const handler1 = new DefaultErrorHandler(mockLoggingService);
      const handler2 = new DefaultErrorHandler(mockLoggingService);

      // Should not throw or cause issues
      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });
  });
});

describe("Error Boundary Factory", () => {
  let mockErrorHandler: jest.Mocked<DefaultErrorHandler>;

  beforeEach(() => {
    mockErrorHandler = {
      handleUncaughtError: jest.fn(),
      handleUnhandledRejection: jest.fn(),
      wrapWithErrorHandling: jest.fn(),
      wrapAsyncWithErrorHandling: jest.fn(),
    } as any;
  });

  describe("createErrorBoundaryConfig", () => {
    it("should create error boundary config", () => {
      const config = createErrorBoundaryConfig(mockErrorHandler);

      expect(config.errorHandler).toBe(mockErrorHandler);
      expect(typeof config.onError).toBe("function");
    });

    it("should handle error in boundary config", () => {
      const config = createErrorBoundaryConfig(mockErrorHandler);
      const testError = new Error("Boundary test error");

      config.onError!(testError, {});

      expect(mockErrorHandler.handleUncaughtError).toHaveBeenCalledWith(
        testError,
        "react-error-boundary",
      );
    });
  });

  describe("ErrorBoundaryFactory.createWebErrorBoundary", () => {
    it("should create web error boundary", () => {
      const boundary =
        ErrorBoundaryFactory.createWebErrorBoundary(mockErrorHandler);

      expect(typeof boundary.handleError).toBe("function");
      expect(typeof boundary.getErrorState).toBe("function");
    });

    it("should handle error and update state", () => {
      const boundary =
        ErrorBoundaryFactory.createWebErrorBoundary(mockErrorHandler);
      const testError = new Error("Web boundary error");

      boundary.handleError(testError);

      const errorState = boundary.getErrorState();
      expect(errorState.hasError).toBe(true);
      expect(errorState.error).toBe(testError);

      expect(mockErrorHandler.handleUncaughtError).toHaveBeenCalledWith(
        testError,
        "web-error-boundary",
      );
    });
  });

  describe("ErrorBoundaryFactory.createReactNativeErrorBoundary", () => {
    it("should create React Native error boundary", () => {
      const boundary =
        ErrorBoundaryFactory.createReactNativeErrorBoundary(mockErrorHandler);

      expect(typeof boundary.handleError).toBe("function");
    });

    it("should handle fatal error correctly", () => {
      const boundary =
        ErrorBoundaryFactory.createReactNativeErrorBoundary(mockErrorHandler);
      const fatalError = new Error("Fatal RN error");

      boundary.handleError(fatalError, true);

      expect(mockErrorHandler.handleUncaughtError).toHaveBeenCalledWith(
        fatalError,
        "rn-fatal-error",
      );
    });

    it("should handle non-fatal error correctly", () => {
      const boundary =
        ErrorBoundaryFactory.createReactNativeErrorBoundary(mockErrorHandler);
      const nonFatalError = new Error("Non-fatal RN error");

      boundary.handleError(nonFatalError, false);

      expect(mockErrorHandler.handleUncaughtError).toHaveBeenCalledWith(
        nonFatalError,
        "rn-error-boundary",
      );
    });

    it("should default to non-fatal when isFatal not specified", () => {
      const boundary =
        ErrorBoundaryFactory.createReactNativeErrorBoundary(mockErrorHandler);
      const defaultError = new Error("Default error");

      boundary.handleError(defaultError);

      expect(mockErrorHandler.handleUncaughtError).toHaveBeenCalledWith(
        defaultError,
        "rn-error-boundary",
      );
    });
  });
});
