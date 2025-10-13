/**
 * Contract: Error Logging Service
 * Defines the interface for centralized error logging and handling
 */

export type ErrorSeverity = 'Critical' | 'Error' | 'Warning' | 'Info' | 'Debug';

export type ErrorType = 'Network' | 'Database' | 'Logic' | 'UI' | 'Authentication';

export type RecoveryActionType = 'Retry' | 'Fallback' | 'UserPrompt' | 'FailGracefully';

export interface ErrorEvent {
  id: string;
  timestamp: string; // ISO 8601 format
  message: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  errorType: ErrorType;
  isTransient: boolean;
  userId?: string;
  operation: string;
  appState?: Record<string, unknown>;
}

export interface LogEntry {
  entryId: string;
  errorEventId: string;
  logLevel: ErrorSeverity;
  component: string;
  environment: string;
  deviceInfo?: {
    platform: string;
    version: string;
  };
  sessionId?: string;
  correlationId?: string;
}

export interface ErrorContext {
  contextId: string;
  errorEventId: string;
  userAction?: string;
  navigationState?: {
    currentRoute: string;
    previousRoute?: string;
  };
  dataState?: Record<string, unknown>;
  networkState?: 'connected' | 'disconnected' | 'limited';
  performanceMetrics?: {
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

export interface RecoveryAction {
  actionId: string;
  errorType: ErrorType;
  actionType: RecoveryActionType;
  retryCount?: number;
  retryDelay?: number;
  maxRetries?: number;
  fallbackBehavior?: string;
  userMessage?: string;
}

export interface LoggingService {
  /**
   * Log an error event with full context
   * @param error The error object or message
   * @param operation The operation being performed when error occurred
   * @param severity The severity level of the error
   * @param errorType The category of error
   * @param additionalContext Optional additional context information
   * @returns Promise resolving to the created error event ID
   */
  logError(
    error: Error | string,
    operation: string,
    severity: ErrorSeverity,
    errorType: ErrorType,
    additionalContext?: Partial<ErrorContext>
  ): Promise<string>;

  /**
   * Log an informational message
   * @param message The information message
   * @param operation The operation context
   * @param additionalData Optional additional data
   */
  logInfo(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log a warning message
   * @param message The warning message
   * @param operation The operation context
   * @param additionalData Optional additional data
   */
  logWarning(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log a debug message (development only)
   * @param message The debug message
   * @param operation The operation context
   * @param additionalData Optional additional data
   */
  logDebug(
    message: string,
    operation: string,
    additionalData?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Attempt to recover from an error using defined recovery actions
   * @param errorEvent The error event to recover from
   * @returns Promise resolving to recovery success/failure
   */
  attemptRecovery(errorEvent: ErrorEvent): Promise<boolean>;

  /**
   * Get recovery action for a specific error type
   * @param errorType The type of error
   * @returns The defined recovery action or null if none exists
   */
  getRecoveryAction(errorType: ErrorType): RecoveryAction | null;

  /**
   * Configure recovery action for an error type
   * @param errorType The type of error
   * @param action The recovery action to configure
   */
  configureRecoveryAction(errorType: ErrorType, action: RecoveryAction): void;

  /**
   * Get recent error events for debugging
   * @param limit Maximum number of events to return
   * @param severity Optional severity filter
   * @returns Promise resolving to array of error events
   */
  getRecentErrors(limit?: number, severity?: ErrorSeverity): Promise<ErrorEvent[]>;

  /**
   * Clear old error events to manage storage
   * @param olderThanDays Clear events older than specified days
   * @returns Promise resolving to number of events cleared
   */
  clearOldErrors(olderThanDays: number): Promise<number>;
}

export interface ErrorHandler {
  /**
   * Handle an uncaught error globally
   * @param error The uncaught error
   * @param operation Optional operation context
   */
  handleUncaughtError(error: Error, operation?: string): void;

  /**
   * Handle an unhandled promise rejection
   * @param reason The rejection reason
   * @param operation Optional operation context
   */
  handleUnhandledRejection(reason: unknown, operation?: string): void;

  /**
   * Wrap a function with error handling
   * @param fn The function to wrap
   * @param operation The operation name for logging
   * @param errorType The type of error to classify caught errors as
   * @returns The wrapped function
   */
  wrapWithErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    operation: string,
    errorType: ErrorType
  ): T;

  /**
   * Wrap an async function with error handling and recovery
   * @param fn The async function to wrap
   * @param operation The operation name for logging
   * @param errorType The type of error to classify caught errors as
   * @param enableRecovery Whether to attempt automatic recovery
   * @returns The wrapped function
   */
  wrapAsyncWithErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: string,
    errorType: ErrorType,
    enableRecovery?: boolean
  ): T;
}

export interface UserErrorDisplay {
  /**
   * Show a generic error message to the user
   * @param operation The operation that failed
   * @param canRetry Whether the user can retry the operation
   * @returns Promise resolving when user acknowledges the error
   */
  showGenericError(operation: string, canRetry?: boolean): Promise<void>;

  /**
   * Show a network error message to the user
   * @param operation The operation that failed
   * @returns Promise resolving when user acknowledges the error
   */
  showNetworkError(operation: string): Promise<void>;

  /**
   * Show an authentication error message to the user
   * @param operation The operation that failed
   * @returns Promise resolving when user acknowledges the error
   */
  showAuthenticationError(operation: string): Promise<void>;

  /**
   * Show a custom error message to the user
   * @param message The error message to display
   * @param title Optional title for the error dialog
   * @returns Promise resolving when user acknowledges the error
   */
  showCustomError(message: string, title?: string): Promise<void>;
}

/**
 * Factory function to create logging service instance
 * @param config Optional configuration for the logging service
 * @returns Configured logging service instance
 */
export interface LoggingServiceFactory {
  createLoggingService(config?: {
    maxBufferSize?: number;
    maxRetentionDays?: number;
    enableLocalPersistence?: boolean;
    environment?: string;
  }): LoggingService;

  createErrorHandler(loggingService: LoggingService): ErrorHandler;

  createUserErrorDisplay(): UserErrorDisplay;
}