/**
 * Contract Test: UserErrorDisplay Interface
 *
 * This test verifies that any UserErrorDisplay implementation adheres to the contract
 * defined in the logging-service.ts contract file.
 *
 * CRITICAL: This test MUST FAIL until the DefaultUserErrorDisplay is implemented.
 */

import { UserErrorDisplay } from "../../specs/011-improve-error-logging/contracts/logging-service";

// Mock React Native Alert for testing
const mockAlert = {
  alert: jest.fn((title, message, buttons) => {
    // Simulate user clicking OK button
    if (buttons && buttons.length > 0 && buttons[0].onPress) {
      buttons[0].onPress();
    }
  }),
};

// Mock React Native modules
jest.mock("react-native", () => ({
  Alert: mockAlert,
  Platform: {
    OS: "ios",
  },
}));

// Mock the unified alert service to use React Native Alert
jest.mock("../../lib/utils/alert/alertService", () => ({
  alertService: {
    show: jest.fn(async (options) => {
      // Call the mocked React Native Alert
      mockAlert.alert(options.title, options.message, options.buttons);
    }),
  },
}));

// This will fail until we implement DefaultUserErrorDisplay
let userErrorDisplay: UserErrorDisplay;

describe("UserErrorDisplay Contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // This will throw until DefaultUserErrorDisplay is implemented
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      DefaultUserErrorDisplay,
    } = require("../../lib/utils/logging/DefaultUserErrorDisplay");
    userErrorDisplay = new DefaultUserErrorDisplay();
  });

  describe("showGenericError method", () => {
    it("should show generic error message and resolve when acknowledged", async () => {
      const operation = "data-loading";

      const showPromise = userErrorDisplay.showGenericError(operation);

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.any(String), // title
        expect.stringContaining(operation), // message should contain operation
        expect.any(Array), // buttons
      );
    });

    it("should show generic error message with retry option", async () => {
      const operation = "data-saving";
      const canRetry = true;

      const showPromise = userErrorDisplay.showGenericError(
        operation,
        canRetry,
      );

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(operation),
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringMatching(/retry/i),
          }),
        ]),
      );
    });

    it("should show generic error message without retry option", async () => {
      const operation = "data-deletion";
      const canRetry = false;

      const showPromise = userErrorDisplay.showGenericError(
        operation,
        canRetry,
      );

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalled();

      const alertCall = mockAlert.alert.mock.calls[0];
      const buttons = alertCall[2];

      // Should not have retry button when canRetry is false
      if (buttons) {
        const hasRetryButton = buttons.some(
          (button: any) =>
            button.text && button.text.toLowerCase().includes("retry"),
        );
        expect(hasRetryButton).toBe(false);
      }
    });
  });

  describe("showNetworkError method", () => {
    it("should show network-specific error message", async () => {
      const operation = "api-request";

      const showPromise = userErrorDisplay.showNetworkError(operation);

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/network|connection/i), // title should reference network
        expect.stringContaining(operation),
        expect.any(Array),
      );
    });

    it("should provide network-specific guidance in message", async () => {
      const operation = "sync-data";

      await userErrorDisplay.showNetworkError(operation);

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // Message should contain network-specific guidance
      expect(message).toMatch(/network|connection|internet|connectivity/i);
    });
  });

  describe("showAuthenticationError method", () => {
    it("should show authentication-specific error message", async () => {
      const operation = "user-login";

      const showPromise = userErrorDisplay.showAuthenticationError(operation);

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/auth|login|access/i), // title should reference authentication
        expect.stringContaining(operation),
        expect.any(Array),
      );
    });

    it("should provide authentication-specific guidance in message", async () => {
      const operation = "access-protected-resource";

      await userErrorDisplay.showAuthenticationError(operation);

      const alertCall = mockAlert.alert.mock.calls[0];
      const message = alertCall[1];

      // Message should contain authentication-specific guidance
      expect(message).toMatch(/login|sign|auth|credential|permission/i);
    });
  });

  describe("showCustomError method", () => {
    it("should show custom error message without title", async () => {
      const customMessage = "This is a custom error message";

      const showPromise = userErrorDisplay.showCustomError(customMessage);

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        expect.any(String), // default title
        customMessage,
        expect.any(Array),
      );
    });

    it("should show custom error message with custom title", async () => {
      const customMessage = "This is a custom error message with title";
      const customTitle = "Custom Error Title";

      const showPromise = userErrorDisplay.showCustomError(
        customMessage,
        customTitle,
      );

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalledWith(
        customTitle,
        customMessage,
        expect.any(Array),
      );
    });

    it("should handle empty custom message gracefully", async () => {
      const emptyMessage = "";

      const showPromise = userErrorDisplay.showCustomError(emptyMessage);

      await expect(showPromise).resolves.toBeUndefined();

      expect(mockAlert.alert).toHaveBeenCalled();
    });
  });

  describe("User Interaction Handling", () => {
    it("should resolve promise when user acknowledges error", async () => {
      const operation = "test-operation";

      // Mock user clicking OK button
      mockAlert.alert.mockImplementation((title, message, buttons) => {
        setTimeout(() => {
          if (buttons && buttons[0] && buttons[0].onPress) {
            buttons[0].onPress();
          }
        }, 10);
      });

      const startTime = Date.now();
      await userErrorDisplay.showGenericError(operation);
      const endTime = Date.now();

      // Should resolve relatively quickly after user interaction
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should handle multiple concurrent error displays", async () => {
      const operation1 = "operation-1";
      const operation2 = "operation-2";

      const promise1 = userErrorDisplay.showGenericError(operation1);
      const promise2 = userErrorDisplay.showNetworkError(operation2);

      await expect(Promise.all([promise1, promise2])).resolves.toEqual([
        undefined,
        undefined,
      ]);

      expect(mockAlert.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Message Content Validation", () => {
    it("should include operation context in all error messages", async () => {
      const operations = ["test-op-1", "test-op-2", "test-op-3"];

      for (const operation of operations) {
        mockAlert.alert.mockClear();

        await userErrorDisplay.showGenericError(operation);

        const alertCall = mockAlert.alert.mock.calls[0];
        const message = alertCall[1];

        expect(message).toContain(operation);
      }
    });

    it("should provide user-friendly language in error messages", async () => {
      await userErrorDisplay.showGenericError("test-operation");

      const alertCall = mockAlert.alert.mock.calls[0];
      const title = alertCall[0];
      const message = alertCall[1];

      // Should not contain technical jargon
      expect(title).not.toMatch(/exception|stack|trace|debug/i);
      expect(message).not.toMatch(/exception|stack|trace|debug/i);

      // Should be user-friendly
      expect(title.length).toBeGreaterThan(0);
      expect(message.length).toBeGreaterThan(0);
    });

    it("should provide actionable buttons for all error types", async () => {
      const errorTypes = [
        () => userErrorDisplay.showGenericError("test"),
        () => userErrorDisplay.showNetworkError("test"),
        () => userErrorDisplay.showAuthenticationError("test"),
        () => userErrorDisplay.showCustomError("test message"),
      ];

      for (const showError of errorTypes) {
        mockAlert.alert.mockClear();

        await showError();

        const alertCall = mockAlert.alert.mock.calls[0];
        const buttons = alertCall[2];

        expect(Array.isArray(buttons)).toBe(true);
        expect(buttons.length).toBeGreaterThan(0);

        // At least one button should have an onPress handler
        const hasActionableButton = buttons.some(
          (button: any) =>
            button.onPress && typeof button.onPress === "function",
        );
        expect(hasActionableButton).toBe(true);
      }
    });
  });
});
