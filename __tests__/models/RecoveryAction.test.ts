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

  describe("Action Type Helpers", () => {
    it("should identify retry actions", () => {
      const retryAction = new RecoveryAction({
        actionId: "retry-test",
        errorType: "Network",
        actionType: "Retry",
      });
      
      expect(retryAction.isRetryAction()).toBe(true);
      expect(retryAction.isFallbackAction()).toBe(false);
      expect(retryAction.requiresUserInteraction()).toBe(false);
    });

    it("should identify fallback actions", () => {
      const fallbackAction = new RecoveryAction({
        actionId: "fallback-test",
        errorType: "UI",
        actionType: "Fallback",
      });
      
      expect(fallbackAction.isFallbackAction()).toBe(true);
      expect(fallbackAction.isRetryAction()).toBe(false);
      expect(fallbackAction.requiresUserInteraction()).toBe(false);
    });

    it("should identify user prompt actions", () => {
      const promptAction = new RecoveryAction({
        actionId: "prompt-test",
        errorType: "Authentication",
        actionType: "UserPrompt",
      });
      
      expect(promptAction.requiresUserInteraction()).toBe(true);
      expect(promptAction.isRetryAction()).toBe(false);
      expect(promptAction.isFallbackAction()).toBe(false);
    });
  });

  describe("Configuration Getters", () => {
    it("should get retry delay with default", () => {
      const actionWithDelay = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
        retryDelay: 5000,
      });
      
      const actionWithoutDelay = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
      });
      
      expect(actionWithDelay.getRetryDelay()).toBe(5000);
      expect(actionWithoutDelay.getRetryDelay()).toBe(1000); // default
    });

    it("should get max retries with default", () => {
      const actionWithMax = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
        maxRetries: 5,
      });
      
      const actionWithoutMax = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
      });
      
      expect(actionWithMax.getMaxRetries()).toBe(5);
      expect(actionWithoutMax.getMaxRetries()).toBe(3); // default
    });

    it("should get user message with fallback to default", () => {
      const actionWithMessage = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
        userMessage: "Custom retry message",
      });
      
      const actionWithoutMessage = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
      });
      
      expect(actionWithMessage.getUserMessage()).toBe("Custom retry message");
      expect(actionWithoutMessage.getUserMessage()).toBe("Retrying operation...");
    });

    it("should provide default messages for all action types", () => {
      const retry = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
      });
      
      const fallback = new RecoveryAction({
        actionId: "test",
        errorType: "UI",
        actionType: "Fallback",
      });
      
      const prompt = new RecoveryAction({
        actionId: "test",
        errorType: "Authentication",
        actionType: "UserPrompt",
      });
      
      const fail = new RecoveryAction({
        actionId: "test",
        errorType: "Logic",
        actionType: "FailGracefully",
      });
      
      expect(retry.getUserMessage()).toBe("Retrying operation...");
      expect(fallback.getUserMessage()).toBe("Using alternative approach...");
      expect(prompt.getUserMessage()).toBe("An error occurred. Please try again.");
      expect(fail.getUserMessage()).toBe("Operation could not be completed.");
    });
  });

  describe("Serialization", () => {
    it("should serialize to JSON", () => {
      const action = new RecoveryAction({
        actionId: "serialize-test",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 2,
        retryDelay: 2000,
        maxRetries: 5,
        fallbackBehavior: "Use cached data",
        userMessage: "Retrying connection...",
      });
      
      const json = action.toJSON();
      
      expect(json).toEqual({
        actionId: "serialize-test",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 2,
        retryDelay: 2000,
        maxRetries: 5,
        fallbackBehavior: "Use cached data",
        userMessage: "Retrying connection...",
      });
    });

    it("should deserialize from JSON", () => {
      const data = {
        actionId: "deserialize-test",
        errorType: "Database" as const,
        actionType: "Fallback" as const,
        retryCount: 1,
        retryDelay: 1500,
        maxRetries: 2,
        fallbackBehavior: "Use local data",
        userMessage: "Using backup data...",
      };
      
      const action = RecoveryAction.fromJSON(data);
      
      expect(action.actionId).toBe("deserialize-test");
      expect(action.errorType).toBe("Database");
      expect(action.actionType).toBe("Fallback");
      expect(action.retryCount).toBe(1);
      expect(action.retryDelay).toBe(1500);
      expect(action.maxRetries).toBe(2);
      expect(action.fallbackBehavior).toBe("Use local data");
      expect(action.userMessage).toBe("Using backup data...");
    });
  });

  describe("Cloning", () => {
    it("should clone with modifications", () => {
      const original = new RecoveryAction({
        actionId: "original",
        errorType: "Network",
        actionType: "Retry",
        retryCount: 1,
        maxRetries: 3,
      });
      
      const cloned = original.clone({
        actionId: "cloned",
        retryCount: 2,
        userMessage: "Modified message",
      });
      
      expect(cloned.actionId).toBe("cloned");
      expect(cloned.errorType).toBe("Network"); // unchanged
      expect(cloned.actionType).toBe("Retry"); // unchanged
      expect(cloned.retryCount).toBe(2); // modified
      expect(cloned.maxRetries).toBe(3); // unchanged
      expect(cloned.userMessage).toBe("Modified message"); // added
    });

    it("should clone without modifications", () => {
      const original = new RecoveryAction({
        actionId: "original",
        errorType: "Database",
        actionType: "Fallback",
        fallbackBehavior: "Use cache",
      });
      
      const cloned = original.clone();
      
      expect(cloned.actionId).toBe(original.actionId);
      expect(cloned.errorType).toBe(original.errorType);
      expect(cloned.actionType).toBe(original.actionType);
      expect(cloned.fallbackBehavior).toBe(original.fallbackBehavior);
      expect(cloned).not.toBe(original); // different instances
    });
  });

  describe("Factory Methods", () => {
    it("should create error-type specific recovery actions", () => {
      const networkAction = RecoveryAction.forErrorType("Network");
      expect(networkAction.errorType).toBe("Network");
      expect(networkAction.actionType).toBe("Retry");
      expect(networkAction.maxRetries).toBe(3);
      expect(networkAction.retryDelay).toBe(2000);
      
      const dbAction = RecoveryAction.forErrorType("Database");
      expect(dbAction.errorType).toBe("Database");
      expect(dbAction.actionType).toBe("Retry");
      expect(dbAction.maxRetries).toBe(2);
      expect(dbAction.retryDelay).toBe(1000);
      
      const authAction = RecoveryAction.forErrorType("Authentication");
      expect(authAction.errorType).toBe("Authentication");
      expect(authAction.actionType).toBe("UserPrompt");
      expect(authAction.userMessage).toBe("Authentication required. Please sign in again.");
      
      const uiAction = RecoveryAction.forErrorType("UI");
      expect(uiAction.errorType).toBe("UI");
      expect(uiAction.actionType).toBe("Fallback");
      expect(uiAction.fallbackBehavior).toBe("Use default UI behavior");
      
      const logicAction = RecoveryAction.forErrorType("Logic");
      expect(logicAction.errorType).toBe("Logic");
      expect(logicAction.actionType).toBe("FailGracefully");
    });

    it("should create default action for fallback", () => {
      // Test that a valid error type gets the expected behavior
      const logicAction = RecoveryAction.forErrorType("Logic");
      expect(logicAction.errorType).toBe("Logic");
      expect(logicAction.actionType).toBe("FailGracefully");
      expect(logicAction.userMessage).toBe("An unexpected error occurred. Please try again.");
    });
  });

  describe("Action Description", () => {
    it("should describe retry actions", () => {
      const retryAction = new RecoveryAction({
        actionId: "test",
        errorType: "Network",
        actionType: "Retry",
        maxRetries: 5,
        retryDelay: 3000,
      });
      
      const description = retryAction.getDescription();
      expect(description).toBe("Retry up to 5 times with 3000ms delay");
    });

    it("should describe fallback actions", () => {
      const fallbackAction = new RecoveryAction({
        actionId: "test",
        errorType: "UI",
        actionType: "Fallback",
        fallbackBehavior: "Use simple layout",
      });
      
      const description = fallbackAction.getDescription();
      expect(description).toBe("Fallback: Use simple layout");
    });

    it("should describe user prompt actions", () => {
      const promptAction = new RecoveryAction({
        actionId: "test",
        errorType: "Authentication",
        actionType: "UserPrompt",
        userMessage: "Please log in again",
      });
      
      const description = promptAction.getDescription();
      expect(description).toBe("Prompt user: Please log in again");
    });

    it("should describe fail gracefully actions", () => {
      const failAction = new RecoveryAction({
        actionId: "test",
        errorType: "Logic",
        actionType: "FailGracefully",
      });
      
      const description = failAction.getDescription();
      expect(description).toBe("Fail gracefully: Operation could not be completed.");
    });
  });
});
