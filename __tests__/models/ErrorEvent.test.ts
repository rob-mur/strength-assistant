/**
 * Unit Test: ErrorEvent Model
 *
 * This test verifies that the ErrorEvent model functions correctly,
 * including validation, state management, and utility methods.
 */

import { ErrorEvent } from "../../lib/models/ErrorEvent";
import {
  ErrorSeverity,
  ErrorType,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

describe("ErrorEvent Model", () => {
  describe("Constructor and Validation", () => {
    it("should create a valid ErrorEvent", () => {
      const event = new ErrorEvent({
        message: "Test error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Logic",
      });
      expect(event).toBeDefined();
    });

    it("should throw an error for invalid data", () => {
      expect(() => {
        new ErrorEvent({} as any);
      }).toThrow();
    });

    it("should determine transient nature based on error type", () => {
      const networkError = new ErrorEvent({
        message: "Network error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Network",
      });
      expect(networkError.isTransient).toBe(true);

      const logicError = new ErrorEvent({
        message: "Logic error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Logic",
      });
      expect(logicError.isTransient).toBe(false);
    });
  });

  describe("Static Factory Methods", () => {
    it("should create an ErrorEvent from an Error object", () => {
      const error = new Error("Test error from object");
      const event = ErrorEvent.fromError(
        error,
        "test-operation",
        "Warning",
        "UI",
      );
      expect(event.message).toBe("Test error from object");
      expect(event.stackTrace).toBe(error.stack);
    });

    it("should create an ErrorEvent from a string message", () => {
      const event = ErrorEvent.fromMessage(
        "Test error from message",
        "test-operation",
        "Info",
        "Database",
      );
      expect(event.message).toBe("Test error from message");
    });
  });

  describe("Utility Methods", () => {
    it("should correctly identify if it is critical", () => {
      const criticalEvent = new ErrorEvent({
        message: "Critical error",
        operation: "test-operation",
        severity: "Critical",
        errorType: "Logic",
      });
      expect(criticalEvent.isCritical()).toBe(true);

      const nonCriticalEvent = new ErrorEvent({
        message: "Non-critical error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Logic",
      });
      expect(nonCriticalEvent.isCritical()).toBe(false);
    });

    it("should correctly identify if it is recoverable", () => {
      const recoverableEvent = new ErrorEvent({
        message: "Recoverable error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Network",
      });
      expect(recoverableEvent.isRecoverable()).toBe(true);

      const nonRecoverableEvent = new ErrorEvent({
        message: "Non-recoverable error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Logic",
      });
      expect(nonRecoverableEvent.isRecoverable()).toBe(false);
    });

    it("should return correct error type description", () => {
      const event = new ErrorEvent({
        message: "Test error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Database",
      });
      expect(event.getErrorTypeDescription()).toBe("Database operation error");
    });

    it("should return correct severity description", () => {
      const event = new ErrorEvent({
        message: "Test error",
        operation: "test-operation",
        severity: "Warning",
        errorType: "Logic",
      });
      expect(event.getSeverityDescription()).toBe(
        "Potential issue that may affect performance",
      );
    });

    it("should return a summary string", () => {
      const event = new ErrorEvent({
        message: "Test error",
        operation: "test-operation",
        severity: "Error",
        errorType: "Logic",
      });
      expect(event.getSummary()).toBe(
        "[Error] Logic error in test-operation: Test error",
      );
    });
  });
});
