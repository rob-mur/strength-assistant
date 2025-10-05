/**
 * DefaultLoggingService Implementation
 *
 * Centralized error logging service with in-memory buffering, local persistence,
 * and error recovery capabilities.
 */

import {
  LoggingService,
  ErrorEvent as IErrorEvent,
  ErrorContext as IErrorContext,
  RecoveryAction as IRecoveryAction,
  ErrorSeverity,
  ErrorType,
} from "../../../specs/011-improve-error-logging/contracts/logging-service";

import { ErrorEvent } from "../../models/ErrorEvent";
import { LogEntry } from "../../models/LogEntry";
import { ErrorContext } from "../../models/ErrorContext";
import { RecoveryAction } from "../../models/RecoveryAction";
import { platformStorage } from "../platform/storage";

export interface LoggingServiceConfig {
  maxBufferSize?: number;
  maxRetentionDays?: number;
  enableLocalPersistence?: boolean;
  environment?: string;
  enableConsoleLogging?: boolean;
}

export class DefaultLoggingService implements LoggingService {
  private errorBuffer: Map<string, ErrorEvent> = new Map();
  private logEntries: Map<string, LogEntry> = new Map();
  private errorContexts: Map<string, ErrorContext> = new Map();
  private recoveryActions: Map<ErrorType, RecoveryAction> = new Map();

  private readonly config: Required<LoggingServiceConfig>;
  private readonly sessionId: string;

  constructor(config: LoggingServiceConfig = {}) {
    this.config = {
      maxBufferSize: config.maxBufferSize ?? 1000,
      maxRetentionDays: config.maxRetentionDays ?? 7,
      enableLocalPersistence: config.enableLocalPersistence ?? true,
      environment: config.environment ?? this.detectEnvironment(),
      enableConsoleLogging:
        config.enableConsoleLogging ?? this.shouldEnableConsoleLogging(),
    };

    this.sessionId = this.generateSessionId();

    // Initialize default recovery actions
    this.initializeDefaultRecoveryActions();

    // Cleanup old entries on startup
    this.performPeriodicCleanup();
  }

  /**
   * Log an error event with full context
   */
  async logError(
    error: Error | string,
    operation: string,
    severity: ErrorSeverity,
    errorType: ErrorType,
    additionalContext?: Partial<IErrorContext>,
  ): Promise<string> {
    try {
      // Create ErrorEvent
      const errorEvent =
        typeof error === "string"
          ? ErrorEvent.fromMessage(error, operation, severity, errorType)
          : ErrorEvent.fromError(error, operation, severity, errorType);

      // Create ErrorContext with additional context
      const errorContext = ErrorContext.forErrorEvent(
        errorEvent.id,
        additionalContext,
      );

      // Transfer context data to ErrorEvent appState
      if (additionalContext) {
        errorEvent.appState = {
          userAction: additionalContext.userAction,
          navigationState: additionalContext.navigationState,
          dataState: additionalContext.dataState,
          networkState: additionalContext.networkState,
          performanceMetrics: additionalContext.performanceMetrics,
        };
      }

      // Create LogEntry
      const logEntry = LogEntry.forErrorEvent(
        errorEvent.id,
        severity,
        this.detectComponent(),
        this.config.environment,
      );
      logEntry.setSessionId(this.sessionId);

      // Store in buffers
      this.errorBuffer.set(errorEvent.id, errorEvent);
      this.errorContexts.set(errorContext.contextId, errorContext);
      this.logEntries.set(logEntry.entryId, logEntry);

      // Persist if enabled
      if (this.config.enableLocalPersistence) {
        await this.persistToStorage(errorEvent, errorContext, logEntry);
      }

      // Log to console based on severity (if enabled)
      if (this.config.enableConsoleLogging) {
        this.logToConsole(errorEvent, errorContext);
      }

      // Manage buffer size
      this.manageBufferSize();

      return errorEvent.id;
    } catch (loggingError) {
      // Fallback logging to prevent infinite recursion
      console.error("Failed to log error:", loggingError);
      console.error("Original error:", error);
      return "logging-failed-" + Date.now();
    }
  }

  /**
   * Log an informational message
   */
  async logInfo(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    return this.logError(message, operation, "Info", "Logic", {
      dataState: additionalData,
    });
  }

  /**
   * Log a warning message
   */
  async logWarning(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    return this.logError(message, operation, "Warning", "Logic", {
      dataState: additionalData,
    });
  }

  /**
   * Log a debug message (development only)
   */
  async logDebug(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    // Only log debug messages in development
    if (this.config.environment === "development") {
      return this.logError(message, operation, "Debug", "Logic", {
        dataState: additionalData,
      });
    }
    return "debug-skipped-" + Date.now();
  }

  /**
   * Attempt to recover from an error using defined recovery actions
   */
  async attemptRecovery(errorEvent: IErrorEvent): Promise<boolean> {
    try {
      const recoveryAction = this.getRecoveryAction(errorEvent.errorType);
      if (!recoveryAction) {
        return false;
      }

      const action = RecoveryAction.fromJSON(recoveryAction);

      // Check if recovery can be attempted
      if (action.isRetryAction() && !action.canRetry()) {
        return false;
      }

      // Record recovery attempt
      action.recordExecution(false); // Will be updated if successful

      // Execute recovery based on action type
      let success = false;
      switch (action.actionType) {
        case "Retry":
          success = await this.executeRetryRecovery(action, errorEvent);
          break;
        case "Fallback":
          success = await this.executeFallbackRecovery(action, errorEvent);
          break;
        case "UserPrompt":
          success = await this.executeUserPromptRecovery(action, errorEvent);
          break;
        case "FailGracefully":
          success = await this.executeFailGracefullyRecovery(
            action,
            errorEvent,
          );
          break;
      }

      // Update recovery action state
      if (success) {
        action.recordExecution(true);
        if (action.isRetryAction()) {
          action.resetRetries();
        }
      } else if (action.isRetryAction()) {
        action.incrementRetry();
      }

      // Update stored recovery action
      this.recoveryActions.set(errorEvent.errorType, action);

      return success;
    } catch (recoveryError) {
      await this.logError(
        recoveryError as Error,
        "error-recovery",
        "Error",
        "Logic",
      );
      return false;
    }
  }

  /**
   * Get recovery action for a specific error type
   */
  getRecoveryAction(errorType: ErrorType): IRecoveryAction | null {
    const action = this.recoveryActions.get(errorType);
    return action ? action.toJSON() : null;
  }

  /**
   * Configure recovery action for an error type
   */
  configureRecoveryAction(errorType: ErrorType, action: IRecoveryAction): void {
    const recoveryAction = RecoveryAction.fromJSON(action);
    this.recoveryActions.set(errorType, recoveryAction);
  }

  /**
   * Get recent error events for debugging
   */
  async getRecentErrors(
    limit: number = 50,
    severity?: ErrorSeverity,
  ): Promise<IErrorEvent[]> {
    try {
      let errors = Array.from(this.errorBuffer.values());

      // Filter by severity if specified
      if (severity) {
        errors = errors.filter((error) => error.severity === severity);
      }

      // Sort by timestamp (most recent first)
      errors.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Apply limit
      errors = errors.slice(0, limit);

      // Convert to plain objects
      return errors.map((error) => error.toJSON());
    } catch (error) {
      await this.logError(
        error as Error,
        "get-recent-errors",
        "Warning",
        "Logic",
      );
      return [];
    }
  }

  /**
   * Clear old error events to manage storage
   */
  async clearOldErrors(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let clearedCount = 0;

      // Clear old errors from buffer
      for (const [id, errorEvent] of this.errorBuffer) {
        if (new Date(errorEvent.timestamp) < cutoffDate) {
          this.errorBuffer.delete(id);
          clearedCount++;
        }
      }

      // Clear related contexts and log entries
      const errorIds = Array.from(this.errorBuffer.keys());

      for (const [contextId, context] of this.errorContexts) {
        if (!errorIds.includes(context.errorEventId)) {
          this.errorContexts.delete(contextId);
        }
      }

      for (const [entryId, entry] of this.logEntries) {
        if (!errorIds.includes(entry.errorEventId)) {
          this.logEntries.delete(entryId);
        }
      }

      // Clear from persistent storage if enabled
      if (this.config.enableLocalPersistence) {
        await this.clearOldFromStorage(olderThanDays);
      }

      return clearedCount;
    } catch (error) {
      await this.logError(
        error as Error,
        "clear-old-errors",
        "Warning",
        "Logic",
      );
      return 0;
    }
  }

  /**
   * Private helper methods
   */

  private detectEnvironment(): string {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      return "development";
    }
    if (typeof process !== "undefined" && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    return "production";
  }

  private shouldEnableConsoleLogging(): boolean {
    const environment = this.detectEnvironment();

    // Disable console logging in test environment to prevent CI output issues
    if (
      environment === "test" ||
      process.env.JEST_TEST_ENVIRONMENT === "true"
    ) {
      return false;
    }

    // Enable console logging in development and production
    return true;
  }

  private generateSessionId(): string {
    return (
      "session-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
    );
  }

  private detectComponent(): string {
    try {
      const stack = new Error().stack || "";
      const stackLines = stack.split("\n");

      for (const line of stackLines) {
        if (line.includes(".ts") || line.includes(".js")) {
          const match = line.match(/([^/\\]+)\.(ts|js)/);
          if (match && !match[1].includes("DefaultLoggingService")) {
            return match[1];
          }
        }
      }

      return "unknown-component";
    } catch {
      return "unknown-component";
    }
  }

  private initializeDefaultRecoveryActions(): void {
    const errorTypes: ErrorType[] = [
      "Network",
      "Database",
      "Logic",
      "UI",
      "Authentication",
    ];

    for (const errorType of errorTypes) {
      const action = RecoveryAction.forErrorType(errorType);
      this.recoveryActions.set(errorType, action);
    }
  }

  private async persistToStorage(
    errorEvent: ErrorEvent,
    errorContext: ErrorContext,
    logEntry: LogEntry,
  ): Promise<void> {
    try {
      // Use local storage in web environment
      if (typeof localStorage !== "undefined") {
        const key = `error-logs-${errorEvent.id}`;
        const data = {
          errorEvent: errorEvent.toJSON(),
          errorContext: errorContext.toJSON(),
          logEntry: logEntry.toJSON(),
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(data));
      }

      // Persist error log using platform storage
      try {
        const key = `error-logs-${errorEvent.id}`;
        const data = {
          errorEvent: errorEvent.toJSON(),
          errorContext: errorContext.toJSON(),
          logEntry: logEntry.toJSON(),
          timestamp: Date.now(),
        };
        await platformStorage.setItem(key, JSON.stringify(data));
      } catch {
        // Storage not available
      }
    } catch (persistError) {
      // Don't throw here to avoid recursive logging
      console.warn("Failed to persist error to storage:", persistError);
    }
  }

  private logToConsole(
    errorEvent: ErrorEvent,
    errorContext: ErrorContext,
  ): void {
    const logMethod = this.getConsoleMethod(errorEvent.severity);
    const contextSummary = errorContext.getSummary();

    logMethod(
      `[${errorEvent.severity}] ${errorEvent.operation}: ${errorEvent.message}`,
      errorEvent.stackTrace ? `\nStack: ${errorEvent.stackTrace}` : "",
      contextSummary !== "No significant context"
        ? `\nContext: ${contextSummary}`
        : "",
    );
  }

  private getConsoleMethod(
    severity: ErrorSeverity,
  ): (...args: unknown[]) => void {
    switch (severity) {
      case "Critical":
      case "Error":
        return console.error.bind(console);
      case "Warning":
        return console.warn.bind(console);
      case "Info":
        return console.info.bind(console);
      case "Debug":
        return console.debug.bind(console);
      default:
        return console.log.bind(console);
    }
  }

  private manageBufferSize(): void {
    if (this.errorBuffer.size > this.config.maxBufferSize) {
      // Remove oldest entries
      const entries = Array.from(this.errorBuffer.entries());
      entries.sort(
        ([, a], [, b]) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const toRemove = entries.slice(
        0,
        this.errorBuffer.size - this.config.maxBufferSize,
      );
      for (const [id] of toRemove) {
        this.errorBuffer.delete(id);
      }
    }
  }

  private async performPeriodicCleanup(): Promise<void> {
    try {
      await this.clearOldErrors(this.config.maxRetentionDays);
    } catch {
      // Silent cleanup failure
    }
  }

  private async clearOldFromStorage(olderThanDays: number): Promise<void> {
    try {
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

      // Clear from localStorage
      if (typeof localStorage !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key: string | null = localStorage.key(i);
          if (key && key.startsWith("error-logs-")) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || "{}");
              if (data.timestamp && data.timestamp < cutoffTime) {
                keysToRemove.push(key);
              }
            } catch {
              // Invalid data, remove it
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach((key: string) => localStorage.removeItem(key));
      }

      // Clear from platform storage
      try {
        const allKeys = await platformStorage.getAllKeys();
        const errorLogKeys = allKeys.filter((key: string) =>
          key.startsWith("error-logs-"),
        );

        const keysToRemove: string[] = [];
        for (const key of errorLogKeys) {
          try {
            const data = JSON.parse(
              (await platformStorage.getItem(key)) || "{}",
            );
            if (data.timestamp && data.timestamp < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }

        if (keysToRemove.length > 0) {
          await platformStorage.multiRemove(keysToRemove);
        }
      } catch {
        // Storage not available
      }
    } catch {
      // Silent storage cleanup failure
    }
  }

  /**
   * Recovery execution methods
   */

  private async executeRetryRecovery(
    action: RecoveryAction,
    _errorEvent: IErrorEvent,
  ): Promise<boolean> {
    // Retry logic would be implemented by the caller
    // This method just manages the retry state
    const delay = action.getTimeUntilNextRetry();
    if (delay > 0) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), delay);
      });
    }
    return true;
  }

  private async executeFallbackRecovery(
    action: RecoveryAction,
    _errorEvent: IErrorEvent,
  ): Promise<boolean> {
    // Log the fallback behavior
    await this.logInfo(
      `Executing fallback: ${action.fallbackBehavior}`,
      "error-recovery",
    );
    return true;
  }

  private async executeUserPromptRecovery(
    action: RecoveryAction,
    _errorEvent: IErrorEvent,
  ): Promise<boolean> {
    // This would typically integrate with the UserErrorDisplay service
    // For now, just log the user message
    await this.logInfo(
      `User prompt required: ${action.getUserMessage()}`,
      "error-recovery",
    );
    return true;
  }

  private async executeFailGracefullyRecovery(
    action: RecoveryAction,
    _errorEvent: IErrorEvent,
  ): Promise<boolean> {
    // Log the graceful failure
    await this.logInfo(
      `Failing gracefully: ${action.getUserMessage()}`,
      "error-recovery",
    );
    return true;
  }
}
