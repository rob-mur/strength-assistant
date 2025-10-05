/**
 * Integration Test: User Error Display Scenarios
 *
 * This test verifies the complete user-facing error display flow
 * including integration with React Native components and user interaction handling.
 *
 * CRITICAL: This test MUST FAIL until the user error display infrastructure is implemented.
 */

import {
  LoggingServiceFactory,
  LoggingService,
  ErrorHandler,
  UserErrorDisplay,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

// Mock React Native Alert and other components
const mockAlert = {
  alert: jest.fn(),
};

const mockToast = {
  show: jest.fn(),
};

// Mock React Native modules
jest.mock("react-native", () => ({
  Alert: mockAlert,
  ToastAndroid: mockToast,
  Platform: {
    OS: "ios",
  },
}));

// Mock the unified alert service
jest.mock("../../lib/utils/alert/alertService", () => ({
  alertService: {
    show: jest.fn(async (options) => {
      // Wait a tick to allow the test to set up its mock implementation
      await new Promise((resolve) => process.nextTick(resolve));
      mockAlert.alert(options.title, options.message, options.buttons);
    }),
  },
}));

// Mock the unified toast service
jest.mock("../../lib/utils/toast/toastService", () => ({
  toastService: {
    show: jest.fn(async (options) => {
      mockToast.show(options.message);
    }),
    hide: jest.fn(),
  },
}));

describe("User Error Display Integration", () => {
  let loggingServiceFactory: LoggingServiceFactory;
  let loggingService: LoggingService;
  let errorHandler: ErrorHandler;
  let userErrorDisplay: UserErrorDisplay;

  beforeEach(() => {
    jest.clearAllMocks();

    // This will fail until LoggingServiceFactory is implemented
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      LoggingServiceFactory: FactoryImpl,
    } = require("../../lib/utils/logging/LoggingServiceFactory");

    loggingServiceFactory = new FactoryImpl();
    loggingService = loggingServiceFactory.createLoggingService({
      environment: "test",
    });
    errorHandler = loggingServiceFactory.createErrorHandler(loggingService);
    userErrorDisplay = loggingServiceFactory.createUserErrorDisplay();

    // Setup default Alert mock behavior
    mockAlert.alert.mockImplementation((title, message, buttons) => {
      // Simulate user clicking the first button
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        setTimeout(() => buttons[0].onPress(), 0);
      }
    });
  });

  describe("Error Display Integration Flow", () => {
    it("should display user error when wrapped function throws", async () => {
      const throwingFunction = () => {
        throw new Error("User-facing error test");
      };

      // Wrap function with error handling that shows user errors
      const wrappedFunction = errorHandler.wrapWithErrorHandling(
        throwingFunction,
        "user-facing-operation",
        "UI",
      );

      // Execute wrapped function
      wrappedFunction();

      // Allow async error handling to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have shown a user error
      expect(mockAlert.alert).toHaveBeenCalled();

      // Should have logged the error
      const recentErrors = await loggingService.getRecentErrors(5);
      const userError = recentErrors.find(
        (error) => error.operation === "user-facing-operation",
      );

      expect(userError).toBeDefined();
      expect(userError?.message).toContain("User-facing error test");
    });

    it("should coordinate error logging with user display for async operations", async () => {
      const asyncThrowingFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        throw new Error("Async user error test");
      };

      const wrappedAsyncFunction = errorHandler.wrapAsyncWithErrorHandling(
        asyncThrowingFunction,
        "async-user-operation",
        "Network",
        false, // no recovery
      );

      await wrappedAsyncFunction();

      // Should have shown user error
      expect(mockAlert.alert).toHaveBeenCalled();

      // Should have logged the error with correct context
      const recentErrors = await loggingService.getRecentErrors(5);
      const asyncError = recentErrors.find(
        (error) => error.operation === "async-user-operation",
      );

      expect(asyncError).toBeDefined();
      expect(asyncError?.errorType).toBe("Network");
      expect(asyncError?.message).toContain("Async user error test");
    });

    it("should handle multiple concurrent errors with proper user feedback", async () => {
      const operations = [
        { name: "operation-1", errorType: "Network" as const },
        { name: "operation-2", errorType: "Database" as const },
        { name: "operation-3", errorType: "Authentication" as const },
      ];

      const promises = operations.map(async (op) => {
        const throwingOp = async () => {
          throw new Error(`Error in ${op.name}`);
        };

        const wrapped = errorHandler.wrapAsyncWithErrorHandling(
          throwingOp,
          op.name,
          op.errorType,
          false,
        );

        return wrapped();
      });

      await Promise.all(promises);

      // Should have shown multiple alerts
      expect(mockAlert.alert).toHaveBeenCalledTimes(3);

      // Should have logged all errors
      const recentErrors = await loggingService.getRecentErrors(10);
      const concurrentErrors = recentErrors.filter((error) =>
        operations.some((op) => error.operation === op.name),
      );

      expect(concurrentErrors.length).toBe(3);
    });
  });

  describe("Error Type-Specific User Messages", () => {
    it("should show network-specific messages for network errors", async () => {
      await userErrorDisplay.showNetworkError("data-sync");

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/network|connection/i),
        expect.stringContaining("data-sync"),
        expect.any(Array),
      );

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // Message should contain network-specific guidance
      expect(message).toMatch(/network|internet|connection|connectivity/i);
    });

    it("should show authentication-specific messages for auth errors", async () => {
      await userErrorDisplay.showAuthenticationError("secure-operation");

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/auth|login|access/i),
        expect.stringContaining("secure-operation"),
        expect.any(Array),
      );

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // Message should contain auth-specific guidance
      expect(message).toMatch(/login|sign|auth|credential|permission/i);
    });

    it("should show generic messages for unspecified error types", async () => {
      await userErrorDisplay.showGenericError("general-operation");

      expect(mockAlert.alert).toHaveBeenCalled();

      const alertCall = mockAlert.alert.mock.calls[0];
      const title = alertCall[0];
      const message = alertCall[1];

      // Should be user-friendly and non-technical
      expect(title).not.toMatch(/exception|stack|trace|debug|null|undefined/i);
      expect(message).not.toMatch(
        /exception|stack|trace|debug|null|undefined/i,
      );
      expect(message).toContain("general-operation");
    });

    it("should handle custom error messages appropriately", async () => {
      const customMessage = "Your session has expired. Please log in again.";
      const customTitle = "Session Expired";

      await userErrorDisplay.showCustomError(customMessage, customTitle);

      expect(mockAlert.alert).toHaveBeenCalledWith(
        customTitle,
        customMessage,
        expect.any(Array),
      );
    });
  });

  describe("User Interaction and Response Handling", () => {
    it("should handle user acknowledgment of error messages", async () => {
      let userAcknowledged = false;

      mockAlert.alert.mockImplementation((title, message, buttons) => {
        expect(buttons).toBeDefined();
        expect(Array.isArray(buttons)).toBe(true);
        expect(buttons.length).toBeGreaterThan(0);

        // Simulate user clicking OK button immediately
        if (buttons[0].onPress) {
          buttons[0].onPress();
          userAcknowledged = true;
        }
      });

      const showPromise = userErrorDisplay.showGenericError(
        "acknowledgment-test",
      );

      await showPromise;

      // Add small delay to ensure button callback has fired
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(userAcknowledged).toBe(true);
      expect(mockAlert.alert).toHaveBeenCalled();
    });

    it("should provide retry options for recoverable errors", async () => {
      await userErrorDisplay.showGenericError("retry-test", true);

      expect(mockAlert.alert).toHaveBeenCalled();

      const alertCall = mockAlert.alert.mock.calls[0];
      const buttons = alertCall[2];

      expect(Array.isArray(buttons)).toBe(true);
      expect(buttons.length).toBeGreaterThan(1); // Should have retry + other options

      // Should have a retry button
      const hasRetryButton = buttons.some(
        (button: any) =>
          button.text && button.text.toLowerCase().includes("retry"),
      );
      expect(hasRetryButton).toBe(true);
    });

    it("should not provide retry options for non-recoverable errors", async () => {
      await userErrorDisplay.showGenericError("no-retry-test", false);

      expect(mockAlert.alert).toHaveBeenCalled();

      const alertCall = mockAlert.alert.mock.calls[0];
      const buttons = alertCall[2];

      // Should not have retry option when canRetry is false
      if (buttons && buttons.length > 0) {
        const hasRetryButton = buttons.some(
          (button: any) =>
            button.text && button.text.toLowerCase().includes("retry"),
        );
        expect(hasRetryButton).toBe(false);
      }
    });

    it("should handle rapid sequential error displays gracefully", async () => {
      const operations = ["op1", "op2", "op3", "op4", "op5"];

      const promises = operations.map((op) =>
        userErrorDisplay.showGenericError(op),
      );

      await Promise.all(promises);

      // Should have shown all error messages
      expect(mockAlert.alert).toHaveBeenCalledTimes(operations.length);

      // Each call should reference the correct operation
      operations.forEach((op, index) => {
        const call = mockAlert.alert.mock.calls[index];
        const message = call[1];
        expect(message).toContain(op);
      });
    });
  });

  describe("Error Display Context and Timing", () => {
    it("should display errors with appropriate timing for user experience", async () => {
      const startTime = Date.now();

      await userErrorDisplay.showGenericError("timing-test");

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should not take too long to show error (responsive UI)
      expect(duration).toBeLessThan(100);

      expect(mockAlert.alert).toHaveBeenCalled();
    });

    it("should preserve error context in user messages", async () => {
      const operationContext = "save-important-document";

      await userErrorDisplay.showGenericError(operationContext);

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // User should understand what operation failed
      expect(message).toContain(operationContext);
    });

    it("should handle error display during app state changes", async () => {
      // Simulate showing error during different app states
      const backgroundError =
        userErrorDisplay.showNetworkError("background-sync");
      const foregroundError =
        userErrorDisplay.showGenericError("foreground-action");

      await Promise.all([backgroundError, foregroundError]);

      // Both should be handled appropriately
      expect(mockAlert.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility and Localization Support", () => {
    it("should provide accessible error messages", async () => {
      await userErrorDisplay.showGenericError("accessibility-test");

      const alertCall = mockAlert.alert.mock.calls[0];
      const title = alertCall[0];
      const message = alertCall[1];
      const buttons = alertCall[2];

      // Title and message should be present and meaningful
      expect(title).toBeDefined();
      expect(title.length).toBeGreaterThan(0);
      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);

      // Buttons should have accessible text
      expect(Array.isArray(buttons)).toBe(true);
      buttons.forEach((button: any) => {
        expect(button.text).toBeDefined();
        expect(button.text.length).toBeGreaterThan(0);
      });
    });

    it("should handle long operation names gracefully in error messages", async () => {
      const longOperationName =
        "very-long-operation-name-that-might-cause-layout-issues-in-user-interface-components";

      await userErrorDisplay.showGenericError(longOperationName);

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // Should include the operation name but handle it gracefully
      expect(message).toContain(longOperationName);
      expect(message.length).toBeLessThan(500); // Reasonable message length
    });
  });

  describe("Error Display Consistency", () => {
    it("should maintain consistent styling and behavior across error types", async () => {
      const errorTypes = [
        () => userErrorDisplay.showGenericError("test"),
        () => userErrorDisplay.showNetworkError("test"),
        () => userErrorDisplay.showAuthenticationError("test"),
        () => userErrorDisplay.showCustomError("Test message"),
      ];

      for (const showError of errorTypes) {
        mockAlert.alert.mockClear();

        await showError();

        const alertCall = mockAlert.alert.mock.calls[0];
        const title = alertCall[0];
        const message = alertCall[1];
        const buttons = alertCall[2];

        // All should follow consistent pattern
        expect(typeof title).toBe("string");
        expect(typeof message).toBe("string");
        expect(Array.isArray(buttons)).toBe(true);
        expect(buttons.length).toBeGreaterThan(0);

        // All should have actionable buttons
        const hasActionableButton = buttons.some(
          (button: any) =>
            button.onPress && typeof button.onPress === "function",
        );
        expect(hasActionableButton).toBe(true);
      }
    });

    it("should provide consistent error IDs for tracking user interactions", async () => {
      // This tests that error display can be correlated with logged errors
      const operation = "trackable-operation";

      // First log an error
      const errorId = await loggingService.logError(
        new Error("Trackable error"),
        operation,
        "Error",
        "UI",
      );

      // Then show corresponding user error
      await userErrorDisplay.showGenericError(operation);

      // Both should be related (error logged and user notified)
      expect(errorId).toBeDefined();
      expect(mockAlert.alert).toHaveBeenCalled();

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];
      expect(message).toContain(operation);

      // Should be able to find the logged error
      const recentErrors = await loggingService.getRecentErrors(5);
      const trackedError = recentErrors.find((error) => error.id === errorId);
      expect(trackedError).toBeDefined();
    });
  });
});
