/**
 * ErrorEvent Model
 *
 * Represents an exception or error condition in the application.
 * This model includes validation rules and type definitions for error events.
 */

import {
  ErrorSeverity,
  ErrorType,
  ErrorEvent as IErrorEvent,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

export class ErrorEvent implements IErrorEvent {
  id: string;
  timestamp: string;
  message: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  errorType: ErrorType;
  isTransient: boolean;
  userId?: string;
  operation: string;
  appState?: Record<string, unknown>;

  constructor(
    data: Partial<IErrorEvent> & {
      message: string;
      operation: string;
      severity: ErrorSeverity;
      errorType: ErrorType;
    },
  ) {
    // Generate unique ID if not provided
    this.id = data.id || this.generateEventId();

    // Use provided timestamp or generate current timestamp in ISO 8601 format
    this.timestamp = data.timestamp || new Date().toISOString();

    // Required fields
    this.message = data.message;
    this.operation = data.operation;
    this.severity = data.severity;
    this.errorType = data.errorType;

    // Optional fields
    this.stackTrace = data.stackTrace;
    this.userId = data.userId;
    this.appState = data.appState;

    // Determine if error is transient based on error type and explicit setting
    this.isTransient =
      data.isTransient ?? this.determineTransientNature(data.errorType);

    // Validate the constructed object
    this.validate();
  }

  /**
   * Validates the error event data according to the contract requirements
   */
  private validate(): void {
    const errors: string[] = [];

    // Validate required fields
    if (!this.message || this.message.trim().length === 0) {
      errors.push("message is required and must be non-empty");
    }

    if (!this.operation || this.operation.trim().length === 0) {
      errors.push("operation is required and must be non-empty");
    }

    // Validate timestamp is valid ISO 8601 format
    if (!this.isValidISOTimestamp(this.timestamp)) {
      errors.push("timestamp must be valid ISO 8601 date");
    }

    // Validate severity is one of defined levels
    const validSeverities: ErrorSeverity[] = [
      "Critical",
      "Error",
      "Warning",
      "Info",
      "Debug",
    ];
    if (!validSeverities.includes(this.severity)) {
      errors.push(`severity must be one of: ${validSeverities.join(", ")}`);
    }

    // Validate errorType is one of defined categories
    const validErrorTypes: ErrorType[] = [
      "Network",
      "Database",
      "Logic",
      "UI",
      "Authentication",
    ];
    if (!validErrorTypes.includes(this.errorType)) {
      errors.push(`errorType must be one of: ${validErrorTypes.join(", ")}`);
    }

    // Validate userId if provided (basic format check)
    if (this.userId !== undefined && typeof this.userId !== "string") {
      errors.push("userId must be a string if provided");
    }

    if (errors.length > 0) {
      throw new Error(`ErrorEvent validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Generates a unique identifier for the error event
   */
  private generateEventId(): string {
    // Generate UUID-like identifier
    return (
      "error-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Validates if a timestamp string is in valid ISO 8601 format
   */
  private isValidISOTimestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp);
      return date.toISOString() === timestamp;
    } catch {
      return false;
    }
  }

  /**
   * Determines if an error type is typically transient based on its category
   */
  private determineTransientNature(errorType: ErrorType): boolean {
    const transientTypes: ErrorType[] = ["Network", "Authentication"];
    return transientTypes.includes(errorType);
  }

  /**
   * Creates an ErrorEvent from a JavaScript Error object
   */
  static fromError(
    error: Error,
    operation: string,
    severity: ErrorSeverity,
    errorType: ErrorType,
    additionalData?: Partial<IErrorEvent>,
  ): ErrorEvent {
    return new ErrorEvent({
      message: error.message,
      stackTrace: error.stack,
      operation,
      severity,
      errorType,
      ...additionalData,
    });
  }

  /**
   * Creates an ErrorEvent from a string message
   */
  static fromMessage(
    message: string,
    operation: string,
    severity: ErrorSeverity,
    errorType: ErrorType,
    additionalData?: Partial<IErrorEvent>,
  ): ErrorEvent {
    return new ErrorEvent({
      message,
      operation,
      severity,
      errorType,
      ...additionalData,
    });
  }

  /**
   * Converts the ErrorEvent to a plain object for serialization
   */
  toJSON(): IErrorEvent {
    return {
      id: this.id,
      timestamp: this.timestamp,
      message: this.message,
      stackTrace: this.stackTrace,
      severity: this.severity,
      errorType: this.errorType,
      isTransient: this.isTransient,
      userId: this.userId,
      operation: this.operation,
      appState: this.appState,
    };
  }

  /**
   * Creates an ErrorEvent from a plain object (deserialization)
   */
  static fromJSON(data: IErrorEvent): ErrorEvent {
    return new ErrorEvent(data);
  }

  /**
   * State transition methods for tracking error lifecycle
   */

  /**
   * Marks the error as logged
   */
  markAsLogged(): void {
    // Could extend to track state transitions in the future
    // For now, the error is considered logged when created
  }

  /**
   * Marks the error as resolved
   */
  markAsResolved(): void {
    // Could extend to track resolution state
    // This would be useful for error analytics and tracking
  }

  /**
   * Marks the error as escalated
   */
  markAsEscalated(): void {
    // Could extend to track escalation state
    // This would be useful for critical error handling
  }

  /**
   * Utility methods for error classification
   */

  /**
   * Checks if this error is critical
   */
  isCritical(): boolean {
    return this.severity === "Critical";
  }

  /**
   * Checks if this error is recoverable (transient)
   */
  isRecoverable(): boolean {
    return this.isTransient;
  }

  /**
   * Gets a user-friendly description of the error type
   */
  getErrorTypeDescription(): string {
    const descriptions: Record<ErrorType, string> = {
      Network: "Network connectivity issue",
      Database: "Database operation error",
      Logic: "Application logic error",
      UI: "User interface error",
      Authentication: "Authentication or authorization error",
    };

    return descriptions[this.errorType] || "Unknown error type";
  }

  /**
   * Gets a user-friendly description of the severity level
   */
  getSeverityDescription(): string {
    const descriptions: Record<ErrorSeverity, string> = {
      Critical: "Critical system failure requiring immediate attention",
      Error: "Error affecting functionality",
      Warning: "Potential issue that may affect performance",
      Info: "Informational message",
      Debug: "Debug information for development",
    };

    return descriptions[this.severity] || "Unknown severity level";
  }

  /**
   * Creates a summary string for logging or display
   */
  getSummary(): string {
    return `[${this.severity}] ${this.errorType} error in ${this.operation}: ${this.message}`;
  }
}
