/**
 * RecoveryAction Model
 *
 * Defined response to specific error types that attempts to restore normal operation.
 * This model represents the configuration and state of error recovery actions.
 */

import {
  ErrorType,
  RecoveryActionType,
  RecoveryAction as IRecoveryAction,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

export class RecoveryAction implements IRecoveryAction {
  actionId: string;
  errorType: ErrorType;
  actionType: RecoveryActionType;
  retryCount?: number;
  retryDelay?: number;
  maxRetries?: number;
  fallbackBehavior?: string;
  userMessage?: string;

  // Additional tracking fields for state management
  private _currentRetries: number = 0;
  private _lastExecuted?: Date;
  private _executionHistory: {
    timestamp: Date;
    success: boolean;
    error?: string;
  }[] = [];

  constructor(data: IRecoveryAction) {
    // Required fields
    this.actionId = data.actionId;
    this.errorType = data.errorType;
    this.actionType = data.actionType;

    // Optional fields
    this.retryCount = data.retryCount;
    this.retryDelay = data.retryDelay;
    this.maxRetries = data.maxRetries;
    this.fallbackBehavior = data.fallbackBehavior;
    this.userMessage = data.userMessage;

    // Set defaults based on action type
    this.setDefaults();

    // Validate the constructed object
    this.validate();
  }

  /**
   * Sets default values based on action type
   */
  private setDefaults(): void {
    switch (this.actionType) {
      case "Retry":
        this.retryCount = this.retryCount ?? 0;
        this.retryDelay = this.retryDelay ?? 1000; // 1 second default
        this.maxRetries = this.maxRetries ?? 3; // 3 retries default
        break;

      case "Fallback":
        this.fallbackBehavior = this.fallbackBehavior ?? "Use default behavior";
        break;

      case "UserPrompt":
        this.userMessage =
          this.userMessage ?? "An error occurred. Please try again.";
        break;

      case "FailGracefully":
        this.userMessage =
          this.userMessage ?? "Operation could not be completed.";
        break;
    }
  }

  /**
   * Validates the recovery action data according to the contract requirements
   */
  private validate(): void {
    const errors: string[] = [];

    this.collectAllValidationErrors(errors);

    if (errors.length > 0) {
      throw new Error(`RecoveryAction validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Collects all validation errors from different validation methods
   */
  private collectAllValidationErrors(errors: string[]): void {
    this.validateRequiredFields(errors);
    this.validateErrorType(errors);
    this.validateActionType(errors);
    this.validateRetryFields(errors);
    this.validateUserPromptFields(errors);
    this.validateOptionalStringFields(errors);
  }

  private validateRequiredFields(errors: string[]): void {
    if (!this.actionId || this.actionId.trim().length === 0) {
      errors.push("actionId is required and must be non-empty");
    }
  }

  private validateErrorType(errors: string[]): void {
    const validErrorTypes = new Set<ErrorType>([
      "Network",
      "Database",
      "Logic",
      "UI",
      "Authentication",
    ]);
    if (!validErrorTypes.has(this.errorType)) {
      errors.push(
        `errorType must be one of: ${Array.from(validErrorTypes).join(", ")}`,
      );
    }
  }

  private validateActionType(errors: string[]): void {
    const validActionTypes = new Set<RecoveryActionType>([
      "Retry",
      "Fallback",
      "UserPrompt",
      "FailGracefully",
    ]);
    if (!validActionTypes.has(this.actionType)) {
      errors.push(
        `actionType must be one of: ${Array.from(validActionTypes).join(", ")}`,
      );
    }
  }

  private validateRetryFields(errors: string[]): void {
    if (this.actionType !== "Retry") return;

    this.validateRetryCount(errors);
    this.validateRetryDelay(errors);
    this.validateMaxRetries(errors);
    this.validateRetryCountVsMaxRetries(errors);
  }

  private validateRetryCount(errors: string[]): void {
    if (
      this.retryCount !== undefined &&
      (typeof this.retryCount !== "number" || this.retryCount < 0)
    ) {
      errors.push("retryCount must be a non-negative integer");
    }
  }

  private validateRetryDelay(errors: string[]): void {
    if (
      this.retryDelay !== undefined &&
      (typeof this.retryDelay !== "number" || this.retryDelay <= 0)
    ) {
      errors.push("retryDelay must be a positive integer");
    }
  }

  private validateMaxRetries(errors: string[]): void {
    if (
      this.maxRetries !== undefined &&
      (typeof this.maxRetries !== "number" || this.maxRetries <= 0)
    ) {
      errors.push("maxRetries must be a positive integer");
    }
  }

  private validateRetryCountVsMaxRetries(errors: string[]): void {
    if (
      this.retryCount !== undefined &&
      this.maxRetries !== undefined &&
      this.retryCount > this.maxRetries
    ) {
      errors.push("retryCount cannot exceed maxRetries");
    }
  }

  private validateUserPromptFields(errors: string[]): void {
    if (this.actionType === "UserPrompt") {
      if (!this.userMessage || this.userMessage.trim().length === 0) {
        errors.push("userMessage is required for UserPrompt actions");
      }
    }
  }

  private validateOptionalStringFields(errors: string[]): void {
    if (
      this.fallbackBehavior !== undefined &&
      typeof this.fallbackBehavior !== "string"
    ) {
      errors.push("fallbackBehavior must be a string if provided");
    }

    if (
      this.userMessage !== undefined &&
      typeof this.userMessage !== "string"
    ) {
      errors.push("userMessage must be a string if provided");
    }
  }

  /**
   * Creates a retry recovery action
   */
  static createRetry(
    actionId: string,
    errorType: ErrorType,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): RecoveryAction {
    return new RecoveryAction({
      actionId,
      errorType,
      actionType: "Retry",
      retryCount: 0,
      retryDelay,
      maxRetries,
    });
  }

  /**
   * Creates a fallback recovery action
   */
  static createFallback(
    actionId: string,
    errorType: ErrorType,
    fallbackBehavior: string,
    userMessage?: string,
  ): RecoveryAction {
    return new RecoveryAction({
      actionId,
      errorType,
      actionType: "Fallback",
      fallbackBehavior,
      userMessage,
    });
  }

  /**
   * Creates a user prompt recovery action
   */
  static createUserPrompt(
    actionId: string,
    errorType: ErrorType,
    userMessage: string,
  ): RecoveryAction {
    return new RecoveryAction({
      actionId,
      errorType,
      actionType: "UserPrompt",
      userMessage,
    });
  }

  /**
   * Creates a fail gracefully recovery action
   */
  static createFailGracefully(
    actionId: string,
    errorType: ErrorType,
    userMessage?: string,
  ): RecoveryAction {
    return new RecoveryAction({
      actionId,
      errorType,
      actionType: "FailGracefully",
      userMessage: userMessage || "Operation could not be completed.",
    });
  }

  /**
   * State management methods
   */

  /**
   * Increments the retry count and records the attempt
   */
  incrementRetry(): void {
    if (this.actionType !== "Retry") {
      throw new Error("Cannot increment retry count for non-retry actions");
    }

    this._currentRetries++;
    this.retryCount = this._currentRetries;
    this._lastExecuted = new Date();
  }

  /**
   * Resets the retry count
   */
  resetRetries(): void {
    this._currentRetries = 0;
    this.retryCount = 0;
    this._executionHistory = [];
  }

  /**
   * Records an execution attempt
   */
  recordExecution(success: boolean, error?: string): void {
    this._executionHistory.push({
      timestamp: new Date(),
      success,
      error,
    });

    // Keep only the last 10 execution records
    if (this._executionHistory.length > 10) {
      this._executionHistory = this._executionHistory.slice(-10);
    }

    this._lastExecuted = new Date();
  }

  /**
   * Checks if the action can be retried
   */
  canRetry(): boolean {
    if (this.actionType !== "Retry") {
      return false;
    }

    return this._currentRetries < (this.maxRetries || 3);
  }

  /**
   * Checks if the action has been exhausted (max retries reached)
   */
  isExhausted(): boolean {
    if (this.actionType !== "Retry") {
      return false;
    }

    return this._currentRetries >= (this.maxRetries || 3);
  }

  /**
   * Gets the current retry count
   */
  getCurrentRetries(): number {
    return this._currentRetries;
  }

  /**
   * Gets the time until next retry is allowed
   */
  getTimeUntilNextRetry(): number {
    if (!this._lastExecuted || this.actionType !== "Retry") {
      return 0;
    }

    const elapsed = Date.now() - this._lastExecuted.getTime();
    const delay = this.retryDelay || 1000;

    return Math.max(0, delay - elapsed);
  }

  /**
   * Gets execution statistics
   */
  getExecutionStats(): {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    lastExecuted?: Date;
  } {
    const totalExecutions = this._executionHistory.length;
    const successCount = this._executionHistory.filter((h) => h.success).length;
    const failureCount = totalExecutions - successCount;
    const successRate =
      totalExecutions > 0 ? successCount / totalExecutions : 0;

    return {
      totalExecutions,
      successCount,
      failureCount,
      successRate,
      lastExecuted: this._lastExecuted,
    };
  }

  /**
   * Utility methods for action classification
   */

  /**
   * Checks if this is a retry action
   */
  isRetryAction(): boolean {
    return this.actionType === "Retry";
  }

  /**
   * Checks if this is a fallback action
   */
  isFallbackAction(): boolean {
    return this.actionType === "Fallback";
  }

  /**
   * Checks if this action requires user interaction
   */
  requiresUserInteraction(): boolean {
    return this.actionType === "UserPrompt";
  }

  /**
   * Gets the delay before next retry in milliseconds
   */
  getRetryDelay(): number {
    return this.retryDelay || 1000;
  }

  /**
   * Gets the maximum number of retries allowed
   */
  getMaxRetries(): number {
    return this.maxRetries || 3;
  }

  /**
   * Gets user-facing message for this action
   */
  getUserMessage(): string {
    return this.userMessage ?? this.getDefaultMessageForActionType();
  }

  private getDefaultMessageForActionType(): string {
    const defaultMessages = new Map([
      ["Retry", "Retrying operation..."],
      ["Fallback", "Using alternative approach..."],
      ["UserPrompt", "Please try again."],
      ["FailGracefully", "Operation could not be completed."],
    ]);

    return defaultMessages.get(this.actionType) ?? "Handling error...";
  }

  /**
   * Converts the RecoveryAction to a plain object for serialization
   */
  toJSON(): IRecoveryAction {
    return {
      actionId: this.actionId,
      errorType: this.errorType,
      actionType: this.actionType,
      retryCount: this.retryCount,
      retryDelay: this.retryDelay,
      maxRetries: this.maxRetries,
      fallbackBehavior: this.fallbackBehavior,
      userMessage: this.userMessage,
    };
  }

  /**
   * Creates a RecoveryAction from a plain object (deserialization)
   */
  static fromJSON(data: IRecoveryAction): RecoveryAction {
    return new RecoveryAction(data);
  }

  /**
   * Creates a copy of the recovery action with modified properties
   */
  clone(modifications?: Partial<IRecoveryAction>): RecoveryAction {
    return new RecoveryAction({
      ...this.toJSON(),
      ...modifications,
    });
  }

  /**
   * Creates a recovery action optimized for specific error types
   */
  static forErrorType(errorType: ErrorType): RecoveryAction {
    const actionId = `auto-${errorType.toLowerCase()}-recovery`;
    const recoveryStrategies = this.getRecoveryStrategies();

    const strategy =
      recoveryStrategies.get(errorType) ??
      (() => RecoveryAction.createFailGracefully(actionId, errorType));

    return strategy(actionId, errorType);
  }

  private static getRecoveryStrategies(): Map<
    ErrorType,
    (actionId: string, errorType: ErrorType) => RecoveryAction
  > {
    return new Map([
      [
        "Network",
        (actionId, errorType) =>
          RecoveryAction.createRetry(actionId, errorType, 3, 2000),
      ],
      [
        "Database",
        (actionId, errorType) =>
          RecoveryAction.createRetry(actionId, errorType, 2, 1000),
      ],
      [
        "Authentication",
        (actionId, errorType) =>
          RecoveryAction.createUserPrompt(
            actionId,
            errorType,
            "Authentication required. Please sign in again.",
          ),
      ],
      [
        "Logic",
        (actionId, errorType) =>
          RecoveryAction.createFailGracefully(
            actionId,
            errorType,
            "An unexpected error occurred. Please try again.",
          ),
      ],
      [
        "UI",
        (actionId, errorType) =>
          RecoveryAction.createFallback(
            actionId,
            errorType,
            "Use default UI behavior",
            "Display issue detected. Using fallback interface.",
          ),
      ],
    ]);
  }

  /**
   * Gets a description of what this action does
   */
  getDescription(): string {
    switch (this.actionType) {
      case "Retry":
        return `Retry up to ${this.maxRetries} times with ${this.retryDelay}ms delay`;
      case "Fallback":
        return `Fallback: ${this.fallbackBehavior}`;
      case "UserPrompt":
        return `Prompt user: ${this.userMessage}`;
      case "FailGracefully":
        return `Fail gracefully: ${this.userMessage}`;
      default:
        return "Unknown recovery action";
    }
  }

  /**
   * Gets a summary string for logging
   */
  getSummary(): string {
    const stats = this.getExecutionStats();
    const description = this.getDescription();

    return `${this.actionId} (${this.errorType}): ${description} - Executions: ${stats.totalExecutions}, Success rate: ${(stats.successRate * 100).toFixed(1)}%`;
  }
}
