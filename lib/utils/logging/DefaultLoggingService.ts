import {
  LoggingService,
  ErrorSeverity,
  ErrorType,
  ErrorEvent,
  RecoveryAction,
  ErrorContext,
} from "../../../specs/011-improve-error-logging/contracts/logging-service";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export interface LoggingServiceConfig {
  maxBufferSize: number;
  maxRetentionDays: number;
  enableLocalPersistence: boolean;
  environment: string;
  enableConsoleLogging: boolean;
}

export class DefaultLoggingService implements LoggingService {
  private readonly recoveryActions: Map<ErrorType, RecoveryAction> = new Map();
  private errors: ErrorEvent[] = [];
  private readonly config: LoggingServiceConfig;

  constructor(config: LoggingServiceConfig) {
    this.config = config;
  }

  logError(
    error: Error | string,
    operation: string,
    severity: ErrorSeverity,
    errorType: ErrorType,
    additionalContext?: Partial<ErrorContext>,
  ): Promise<string> {
    const eventId = uuidv4();
    const errorEvent: ErrorEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      message: typeof error === "string" ? error : error.message,
      stackTrace: typeof error === "string" ? undefined : error.stack,
      severity,
      errorType,
      isTransient: errorType === "Network", // Example logic
      operation,
      appState: additionalContext,
    };
    this.errors.push(errorEvent);
    if (this.errors.length > this.config.maxBufferSize) {
      this.errors.shift();
    }
    // In a real implementation, this would send the error to a logging service
    if (this.config.enableConsoleLogging) {
      console.log("Logged error:", errorEvent);
    }
    return Promise.resolve(eventId);
  }

  logInfo(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const eventId = uuidv4();
    if (this.config.enableConsoleLogging) {
      console.log("Logged info:", {
        id: eventId,
        message,
        operation,
        additionalData,
      });
    }
    return Promise.resolve(eventId);
  }

  logWarning(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const eventId = uuidv4();
    if (this.config.enableConsoleLogging) {
      console.log("Logged warning:", {
        id: eventId,
        message,
        operation,
        additionalData,
      });
    }
    return Promise.resolve(eventId);
  }

  logDebug(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const eventId = uuidv4();
    if (this.config.enableConsoleLogging) {
      console.log("Logged debug:", {
        id: eventId,
        message,
        operation,
        additionalData,
      });
    }
    return Promise.resolve(eventId);
  }

  attemptRecovery(errorEvent: ErrorEvent): Promise<boolean> {
    const recoveryAction = this.getRecoveryAction(errorEvent.errorType);
    if (recoveryAction) {
      // In a real implementation, this would execute the recovery action
      if (this.config.enableConsoleLogging) {
        console.log(
          `Attempting recovery for ${errorEvent.errorType} with action ${recoveryAction.actionId}`,
        );
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  getRecoveryAction(errorType: ErrorType): RecoveryAction | null {
    return this.recoveryActions.get(errorType) || null;
  }

  configureRecoveryAction(errorType: ErrorType, action: RecoveryAction): void {
    this.recoveryActions.set(errorType, action);
  }

  getRecentErrors(
    limit = 100,
    severity?: ErrorSeverity,
  ): Promise<ErrorEvent[]> {
    let recentErrors = this.errors;
    if (severity) {
      recentErrors = recentErrors.filter((e) => e.severity === severity);
    }
    return Promise.resolve(recentErrors.slice(-limit));
  }

  clearOldErrors(olderThanDays: number): Promise<number> {
    const oldLength = this.errors.length;
    if (olderThanDays === 0) {
      this.errors = [];
      return Promise.resolve(oldLength);
    }
    const now = new Date();
    const cutoff = new Date(
      now.getTime() - olderThanDays * 24 * 60 * 60 * 1000,
    );
    this.errors = this.errors.filter((e) => new Date(e.timestamp) >= cutoff);
    const clearedCount = oldLength - this.errors.length;
    return Promise.resolve(clearedCount);
  }
}
