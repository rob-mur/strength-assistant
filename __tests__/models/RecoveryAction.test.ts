/**
 * Unit Test: RecoveryAction Model
 *
 * This test verifies that the RecoveryAction model functions correctly,
 * including validation, state management, and utility methods.
 */

import { RecoveryAction } from "../../lib/models/RecoveryAction";
import {
  ErrorType,
  RecoveryActionType,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

describe("RecoveryAction Model", () => {
  describe("Constructor and Validation", () => {
    it("should create a valid RecoveryAction", () => {
      const action = new RecoveryAction({
        actionId: "test-action",
        errorType: "Network",
        actionType: "Retry",
      });
      expect(action).toBeDefined();
    });

    it("should throw an error for invalid data", () => {
      expect(() => {
        new RecoveryAction({} as any);
      }).toThrow();
    });

    it("should set default values for retry action", () => {
      const action = new RecoveryAction({
        actionId: "test-action",
        errorType: "Network",
        actionType: "Retry",
      });
      expect(action.retryCount).toBe(0);
      expect(action.retryDelay).toBe(1000);
      expect(action.maxRetries).toBe(3);
    });
  });

  describe("Static Factory Methods", () => {
    it("should create a valid retry action", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network");
      expect(action.actionType).toBe("Retry");
      expect(action.maxRetries).toBe(3);
    });

    it("should create a valid fallback action", () => {
      const action = RecoveryAction.createFallback(
        "fallback-action",
        "UI",
        "test-fallback",
      );
      expect(action.actionType).toBe("Fallback");
      expect(action.fallbackBehavior).toBe("test-fallback");
    });

    it("should create a valid user prompt action", () => {
      const action = RecoveryAction.createUserPrompt(
        "prompt-action",
        "Authentication",
        "Please log in again",
      );
      expect(action.actionType).toBe("UserPrompt");
      expect(action.userMessage).toBe("Please log in again");
    });

    it("should create a valid fail gracefully action", () => {
      const action = RecoveryAction.createFailGracefully(
        "fail-action",
        "Logic",
      );
      expect(action.actionType).toBe("FailGracefully");
      expect(action.userMessage).toBe("Operation could not be completed.");
    });
  });

  describe("State Management", () => {
    it("should increment retry count", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network");
      action.incrementRetry();
      expect(action.getCurrentRetries()).toBe(1);
      expect(action.retryCount).toBe(1);
    });

    it("should throw error when incrementing retry for non-retry action", () => {
      const action = RecoveryAction.createFailGracefully(
        "fail-action",
        "Logic",
      );
      expect(() => {
        action.incrementRetry();
      }).toThrow();
    });

    it("should reset retry count", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network");
      action.incrementRetry();
      action.resetRetries();
      expect(action.getCurrentRetries()).toBe(0);
      expect(action.retryCount).toBe(0);
    });

    it("should record execution history", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network");
      action.recordExecution(true);
      action.recordExecution(false, "Test error");
      const stats = action.getExecutionStats();
      expect(stats.totalExecutions).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(1);
    });
  });

  describe("Utility Methods", () => {
    it("should correctly identify if it can retry", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network", 2);
      expect(action.canRetry()).toBe(true);
      action.incrementRetry();
      expect(action.canRetry()).toBe(true);
      action.incrementRetry();
      expect(action.canRetry()).toBe(false);
    });

    it("should correctly identify if it is exhausted", () => {
      const action = RecoveryAction.createRetry("retry-action", "Network", 1);
      expect(action.isExhausted()).toBe(false);
      action.incrementRetry();
      expect(action.isExhausted()).toBe(true);
    });

    it("should calculate time until next retry", (done) => {
      const action = RecoveryAction.createRetry(
        "retry-action",
        "Network",
        3,
        100,
      );
      action.incrementRetry();
      setTimeout(() => {
        expect(action.getTimeUntilNextRetry()).toBeLessThanOrEqual(50);
        done();
      }, 50);
    });
  });
});
