/**
 * DefaultErrorHandler Implementation
 *
 * Global error handling with automatic recovery, error boundaries,
 * and function wrapping capabilities.
 */

import {
  ErrorHandler,
  LoggingService,
  UserErrorDisplay,
  ErrorType,
  ErrorEvent,
} from "../../../specs/011-improve-error-logging/contracts/logging-service";

export class DefaultErrorHandler implements ErrorHandler {
  private readonly loggingService: LoggingService;
  private readonly userErrorDisplay?: UserErrorDisplay;
  private static globalHandlersSetup = false;
  private static globalHandlerCleanup: (() => void)[] = [];

  constructor(
    loggingService: LoggingService,
    userErrorDisplay?: UserErrorDisplay,
  ) {
    this.loggingService = loggingService;
    this.userErrorDisplay = userErrorDisplay;
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handle an uncaught error globally
   */
  handleUncaughtError(
    error: Error,
    operation: string = "uncaught-error",
  ): void {
    try {
      // Log the uncaught error as critical
      this.loggingService
        .logError(error, operation, "Critical", this.classifyError(error))
        .catch((loggingError) => {
          // Fallback to console if logging fails
          console.error("Failed to log uncaught error:", loggingError);
          console.error("Original uncaught error:", error);
        });

      // Attempt recovery for certain error types
      const errorType = this.classifyError(error);
      if (this.isRecoverableError(errorType)) {
        this.loggingService
          .attemptRecovery({
            id: "uncaught-" + Date.now(),
            timestamp: new Date().toISOString(),
            message: error.message,
            stackTrace: error.stack,
            severity: "Critical",
            errorType,
            isTransient: this.isTransientError(errorType),
            operation,
          })
          .catch((recoveryError) => {
            console.error(
              "Failed to attempt recovery for uncaught error:",
              recoveryError,
            );
          });
      }
    } catch (handlingError) {
      // Ultimate fallback - just log to console
      console.error("Error in error handler:", handlingError);
      console.error("Original error:", error);
    }
  }

  /**
   * Handle an unhandled promise rejection
   */
  handleUnhandledRejection(
    reason: unknown,
    operation: string = "unhandled-rejection",
  ): void {
    try {
      // Log the unhandled rejection with original reason (Error or string)
      const logError = reason instanceof Error ? reason : String(reason);
      const errorForClassification =
        reason instanceof Error ? reason : new Error(String(reason));

      this.loggingService
        .logError(
          logError,
          operation,
          "Critical",
          this.classifyError(errorForClassification),
        )
        .catch((loggingError) => {
          console.error("Failed to log unhandled rejection:", loggingError);
          console.error("Original rejection reason:", reason);
        });

      // Attempt recovery for certain error types
      const errorType = this.classifyError(errorForClassification);
      if (this.isRecoverableError(errorType)) {
        this.loggingService
          .attemptRecovery({
            id: "rejection-" + Date.now(),
            timestamp: new Date().toISOString(),
            message: errorForClassification.message,
            stackTrace: errorForClassification.stack,
            severity: "Error",
            errorType,
            isTransient: this.isTransientError(errorType),
            operation,
          })
          .catch((recoveryError) => {
            console.error(
              "Failed to attempt recovery for unhandled rejection:",
              recoveryError,
            );
          });
      }
    } catch (handlingError) {
      console.error("Error in rejection handler:", handlingError);
      console.error("Original rejection:", reason);
    }
  }

  /**
   * Wrap a function with error handling
   */
  wrapWithErrorHandling<T extends (...args: unknown[]) => unknown>(
    fn: T,
    operation: string,
    errorType: ErrorType,
  ): T {
    const wrappedFn = ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);

        // Handle promises returned by the function
        if (
          result &&
          typeof result === "object" &&
          result !== null &&
          "then" in result &&
          typeof (result as { then?: unknown }).then === "function"
        ) {
          return (result as Promise<unknown>).catch((error: Error) => {
            this.handleFunctionError(error, operation, errorType);
            // Swallow error after logging (defensive error handling)
            return undefined;
          });
        }

        return result;
      } catch (error) {
        this.handleFunctionError(error as Error, operation, errorType);
        // Swallow error after logging (defensive error handling)
        return undefined;
      }
    }) as T;

    return wrappedFn;
  }

  /**
   * Wrap an async function with error handling and recovery
   */
  wrapAsyncWithErrorHandling<
    T extends (...args: unknown[]) => Promise<unknown>,
  >(
    fn: T,
    operation: string,
    errorType: ErrorType,
    enableRecovery: boolean = false,
  ): T {
    const wrappedFn = (async (...args: Parameters<T>) => {
      return await this.executeWithRetry(
        fn,
        args,
        operation,
        errorType,
        enableRecovery,
      );
    }) as T;

    return wrappedFn;
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<
    T extends (...args: unknown[]) => Promise<unknown>,
  >(
    fn: T,
    args: Parameters<T>,
    operation: string,
    errorType: ErrorType,
    enableRecovery: boolean,
  ): Promise<unknown> {
    let retryCount = 0;
    const maxRetries = this.getMaxRetriesForErrorType(errorType);

    while (true) {
      try {
        return await fn(...args);
      } catch (error) {
        const retryContext = await this.processRetryError(
          error as Error,
          operation,
          errorType,
          retryCount,
          maxRetries,
          enableRecovery,
        );

        if (retryContext.shouldRetry) {
          retryCount++;
          await this.delayBeforeRetry(errorType);
          continue;
        }

        // Swallow error after logging and attempted recovery (defensive error handling)
        return undefined;
      }
    }
  }

  /**
   * Process error for retry decision
   */
  private async processRetryError(
    error: Error,
    operation: string,
    errorType: ErrorType,
    retryCount: number,
    maxRetries: number,
    enableRecovery: boolean,
  ): Promise<{ shouldRetry: boolean }> {
    const errorEvent = await this.handleFunctionError(
      error,
      operation,
      errorType,
    );

    const shouldRetry = await this.shouldAttemptRetry(
      enableRecovery,
      errorType,
      retryCount,
      maxRetries,
      errorEvent,
      operation,
    );

    return { shouldRetry };
  }

  private async shouldAttemptRetry(
    enableRecovery: boolean,
    errorType: ErrorType,
    retryCount: number,
    maxRetries: number,
    errorEvent: ErrorEvent,
    operation: string,
  ): Promise<boolean> {
    if (
      !enableRecovery ||
      !this.isRecoverableError(errorType) ||
      retryCount >= maxRetries
    ) {
      return false;
    }

    try {
      return await this.loggingService.attemptRecovery(errorEvent);
    } catch (recoveryError) {
      await this.logRecoveryFailure(recoveryError as Error, operation);
      return false;
    }
  }

  private async delayBeforeRetry(errorType: ErrorType): Promise<void> {
    const retryDelay = this.getRetryDelayForErrorType(errorType);
    if (retryDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  private async logRecoveryFailure(
    error: Error,
    operation: string,
  ): Promise<void> {
    try {
      await this.loggingService.logError(
        error,
        `${operation}-recovery`,
        "Warning",
        "Logic",
      );
    } catch {
      // Silent failure for recovery logging
    }
  }

  /**
   * Get max retries for error type from recovery configuration
   */
  private getMaxRetriesForErrorType(errorType: ErrorType): number {
    const recoveryAction = this.loggingService.getRecoveryAction(errorType);
    return recoveryAction?.maxRetries ?? 2; // Reduced default for faster tests
  }

  /**
   * Get retry delay for error type from recovery configuration
   */
  private getRetryDelayForErrorType(errorType: ErrorType): number {
    const recoveryAction = this.loggingService.getRecoveryAction(errorType);
    return recoveryAction?.retryDelay ?? 10; // Reduced default delay for faster tests
  }

  /**
   * Private helper methods
   */

  private setupGlobalErrorHandlers(): void {
    if (DefaultErrorHandler.globalHandlersSetup) {
      return;
    }

    try {
      this.setupBrowserErrorHandlers();
      this.setupNodeErrorHandlers();
      this.setupReactNativeErrorHandlers();

      DefaultErrorHandler.globalHandlersSetup = true;
    } catch (setupError) {
      console.error("Failed to setup global error handlers:", setupError);
    }
  }

  /**
   * Setup error handlers for browser environment
   */
  private setupBrowserErrorHandlers(): void {
    if (
      typeof globalThis === "undefined" ||
      !globalThis.window?.addEventListener
    ) {
      return;
    }

    const errorHandler = (event: Event) => {
      const errorEvent = event as globalThis.ErrorEvent;
      this.handleUncaughtError(
        errorEvent.error || new Error(errorEvent.message),
        "window-error",
      );
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      this.handleUnhandledRejection(event.reason, "window-unhandled-rejection");
    };

    globalThis.window.addEventListener("error", errorHandler);
    globalThis.window.addEventListener("unhandledrejection", rejectionHandler);

    // Store cleanup functions
    DefaultErrorHandler.globalHandlerCleanup.push(() => {
      globalThis.window?.removeEventListener("error", errorHandler);
      globalThis.window?.removeEventListener(
        "unhandledrejection",
        rejectionHandler,
      );
    });
  }

  /**
   * Setup error handlers for Node.js environment
   */
  private setupNodeErrorHandlers(): void {
    if (typeof process === "undefined") {
      return;
    }

    const uncaughtHandler = (error: Error) => {
      this.handleUncaughtError(error, "process-uncaught-exception");
    };

    const rejectionHandler = (reason: unknown) => {
      this.handleUnhandledRejection(reason, "process-unhandled-rejection");
    };

    // Only add listeners if we haven't exceeded the limit
    const currentListeners = process.listenerCount("uncaughtException");
    if (currentListeners < 8) {
      // Leave some room under the 10 limit
      process.on("uncaughtException", uncaughtHandler);
      process.on("unhandledRejection", rejectionHandler);

      // Store cleanup functions
      DefaultErrorHandler.globalHandlerCleanup.push(() => {
        process.removeListener("uncaughtException", uncaughtHandler);
        process.removeListener("unhandledRejection", rejectionHandler);
      });
    }
  }

  /**
   * Setup error handlers for React Native environment
   */
  private setupReactNativeErrorHandlers(): void {
    const globalWithErrorUtils = this.getReactNativeGlobal();
    if (!globalWithErrorUtils?.ErrorUtils) {
      return;
    }

    const originalHandler = globalWithErrorUtils.ErrorUtils.getGlobalHandler();

    globalWithErrorUtils.ErrorUtils.setGlobalHandler(
      (error: Error, isFatal: boolean) => {
        this.handleUncaughtError(
          error,
          isFatal ? "fatal-error" : "non-fatal-error",
        );

        // Call original handler if it exists
        if (originalHandler && typeof originalHandler === "function") {
          (originalHandler as (error: Error, isFatal: boolean) => void)(
            error,
            isFatal,
          );
        }
      },
    );
  }

  /**
   * Get React Native global object with proper typing
   */
  private getReactNativeGlobal(): {
    ErrorUtils: {
      getGlobalHandler: () => unknown;
      setGlobalHandler: (
        handler: (error: Error, isFatal: boolean) => void,
      ) => void;
    };
  } | null {
    if (globalThis.global === undefined) {
      return null;
    }

    const globalObj = globalThis.global as {
      ErrorUtils?: {
        getGlobalHandler: () => unknown;
        setGlobalHandler: (
          handler: (error: Error, isFatal: boolean) => void,
        ) => void;
      };
    };

    return globalObj.ErrorUtils
      ? (globalObj as typeof globalObj & {
          ErrorUtils: NonNullable<typeof globalObj.ErrorUtils>;
        })
      : null;
  }

  /**
   * Clean up global error handlers - primarily for testing
   */
  static cleanupGlobalHandlers(): void {
    for (const cleanup of DefaultErrorHandler.globalHandlerCleanup) {
      cleanup();
    }
    DefaultErrorHandler.globalHandlerCleanup = [];
    DefaultErrorHandler.globalHandlersSetup = false;
  }

  private async handleFunctionError(
    error: Error,
    operation: string,
    errorType: ErrorType,
  ): Promise<ErrorEvent> {
    try {
      const errorEventId = await this.loggingService.logError(
        error,
        operation,
        "Error",
        errorType,
      );

      // Show user error if userErrorDisplay is available
      if (this.userErrorDisplay) {
        try {
          switch (errorType) {
            case "Network":
              await this.userErrorDisplay.showNetworkError(operation);
              break;
            case "Authentication":
              await this.userErrorDisplay.showAuthenticationError(operation);
              break;
            default:
              await this.userErrorDisplay.showGenericError(
                operation,
                this.isRecoverableError(errorType),
              );
              break;
          }
        } catch (displayError) {
          // If showing user error fails, just log it
          console.warn("Failed to show user error:", displayError);
        }
      }

      // Return a minimal error event for recovery attempts
      return {
        id: errorEventId,
        timestamp: new Date().toISOString(),
        message: error.message,
        stackTrace: error.stack,
        severity: "Error" as const,
        errorType,
        isTransient: this.isTransientError(errorType),
        operation,
      };
    } catch (loggingError) {
      // Fallback logging
      console.error("Failed to log function error:", loggingError);
      console.error("Original function error:", error);

      // Return a fallback error event
      return {
        id: "fallback-" + Date.now(),
        timestamp: new Date().toISOString(),
        message: error.message,
        stackTrace: error.stack,
        severity: "Error" as const,
        errorType,
        isTransient: this.isTransientError(errorType),
        operation,
      };
    }
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // Network errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("socket") ||
      error.name === "NetworkError" ||
      (error.name === "TypeError" && message.includes("failed to fetch"))
    ) {
      return "Network";
    }

    // Authentication errors
    if (
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("auth") ||
      message.includes("token") ||
      message.includes("login") ||
      message.includes("permission") ||
      stack.includes("auth")
    ) {
      return "Authentication";
    }

    // Database errors
    if (
      message.includes("database") ||
      message.includes("sql") ||
      message.includes("query") ||
      message.includes("transaction") ||
      message.includes("supabase") ||
      stack.includes("supabase") ||
      stack.includes("database")
    ) {
      return "Database";
    }

    // UI errors
    if (
      message.includes("render") ||
      message.includes("component") ||
      message.includes("props") ||
      message.includes("jsx") ||
      message.includes("element") ||
      stack.includes("react") ||
      stack.includes("component")
    ) {
      return "UI";
    }

    // Default to Logic errors
    return "Logic";
  }

  private isRecoverableError(errorType: ErrorType): boolean {
    const recoverableTypes: ErrorType[] = [
      "Network",
      "Database",
      "Authentication",
    ];
    return recoverableTypes.includes(errorType);
  }

  private isTransientError(errorType: ErrorType): boolean {
    const transientTypes: ErrorType[] = ["Network", "Authentication"];
    return transientTypes.includes(errorType);
  }
}

/**
 * Error Boundary Configuration
 * For use with React applications to catch component errors
 */
export interface ErrorBoundaryConfig {
  errorHandler?: ErrorHandler;
  fallbackComponent?: string;
  onError?: (error: Error, errorInfo: unknown) => void;
}

/**
 * Create Error Boundary Hook
 * Returns configuration for React Error Boundary components
 */
export function createErrorBoundaryConfig(
  errorHandler: ErrorHandler,
): ErrorBoundaryConfig {
  return {
    errorHandler,
    onError: (error: Error, _errorInfo: unknown) => {
      errorHandler.handleUncaughtError(error, "react-error-boundary");
    },
  };
}

/**
 * Error Boundary Factory
 * Creates error boundary configurations for different environments
 */
export class ErrorBoundaryFactory {
  static createWebErrorBoundary(errorHandler: ErrorHandler): {
    handleError: (error: Error, errorInfo?: unknown) => void;
    getErrorState: () => { hasError: boolean; error?: Error };
  } {
    let errorState = { hasError: false, error: undefined as Error | undefined };

    return {
      handleError: (error: Error, _errorInfo?: unknown) => {
        errorHandler.handleUncaughtError(error, "web-error-boundary");
        errorState = { hasError: true, error };
      },
      getErrorState: () => errorState,
    };
  }

  static createReactNativeErrorBoundary(errorHandler: ErrorHandler): {
    handleError: (error: Error, isFatal?: boolean) => void;
  } {
    return {
      handleError: (error: Error, isFatal = false) => {
        errorHandler.handleUncaughtError(
          error,
          isFatal ? "rn-fatal-error" : "rn-error-boundary",
        );
      },
    };
  }
}
