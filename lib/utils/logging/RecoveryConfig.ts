/**
 * Recovery Configuration
 *
 * Centralized configuration for error recovery actions by error type.
 * This ensures consistent error handling patterns across the application.
 */

import { ErrorType } from "../../../specs/011-improve-error-logging/contracts/logging-service";
import { RecoveryAction } from "../../models/RecoveryAction";
import { LoggingServiceFactory } from "./LoggingServiceFactory";

/**
 * Configure default recovery actions for each error type
 */
export function configureDefaultRecoveryActions(): void {
  const factory = LoggingServiceFactory.getInstance();
  const loggingService = factory.createLoggingService();

  // Network Error Recovery: Retry with exponential backoff
  const networkRecovery = RecoveryAction.createRetry(
    "network-auto-recovery",
    "Network",
    3, // maxRetries
    2000, // 2 second initial delay
  );
  loggingService.configureRecoveryAction("Network", networkRecovery.toJSON());

  // Database Error Recovery: Limited retry with shorter delay
  const databaseRecovery = RecoveryAction.createRetry(
    "database-auto-recovery",
    "Database",
    2, // maxRetries
    1000, // 1 second delay
  );
  loggingService.configureRecoveryAction("Database", databaseRecovery.toJSON());

  // Authentication Error Recovery: User prompt for re-authentication
  const authRecovery = RecoveryAction.createUserPrompt(
    "auth-auto-recovery",
    "Authentication",
    "Your session has expired. Please sign in again to continue.",
  );
  loggingService.configureRecoveryAction(
    "Authentication",
    authRecovery.toJSON(),
  );

  // UI Error Recovery: Fallback to default UI behavior
  const uiRecovery = RecoveryAction.createFallback(
    "ui-auto-recovery",
    "UI",
    "Use default UI behavior",
    "Display issue detected. Using fallback interface.",
  );
  loggingService.configureRecoveryAction("UI", uiRecovery.toJSON());

  // Logic Error Recovery: Fail gracefully with user notification
  const logicRecovery = RecoveryAction.createFailGracefully(
    "logic-auto-recovery",
    "Logic",
    "An unexpected error occurred. Please try again or contact support if the problem persists.",
  );
  loggingService.configureRecoveryAction("Logic", logicRecovery.toJSON());
}

/**
 * Recovery action configurations for specific operations
 */
export const OPERATION_SPECIFIC_RECOVERY = {
  // Critical data operations
  "save-exercise": {
    errorType: "Database" as ErrorType,
    recovery: RecoveryAction.createRetry(
      "save-exercise-recovery",
      "Database",
      5, // More retries for critical saves
      1500,
    ),
  },

  "delete-exercise": {
    errorType: "Database" as ErrorType,
    recovery: RecoveryAction.createUserPrompt(
      "delete-exercise-recovery",
      "Database",
      "Failed to delete exercise. This operation requires confirmation. Please try again.",
    ),
  },

  // Authentication operations
  "user-login": {
    errorType: "Authentication" as ErrorType,
    recovery: RecoveryAction.createFallback(
      "login-recovery",
      "Authentication",
      "Redirect to login screen",
      "Unable to sign in. Please check your credentials and try again.",
    ),
  },

  // Sync operations
  "data-sync": {
    errorType: "Network" as ErrorType,
    recovery: RecoveryAction.createRetry(
      "sync-recovery",
      "Network",
      5, // More retries for sync
      5000, // Longer delay for sync operations
    ),
  },

  // Storage operations
  "local-storage": {
    errorType: "Logic" as ErrorType,
    recovery: RecoveryAction.createFallback(
      "storage-recovery",
      "Logic",
      "Use in-memory storage as fallback",
      "Local storage unavailable. Data will be stored temporarily.",
    ),
  },
};

/**
 * Configure operation-specific recovery actions
 */
export function configureOperationRecoveryActions(): void {
  const factory = LoggingServiceFactory.getInstance();
  const loggingService = factory.createLoggingService();

  for (const [, config] of Object.entries(OPERATION_SPECIFIC_RECOVERY)) {
    // Note: This would require extending the logging service to support operation-specific recoveries
    // For now, we ensure the base error types have proper recovery actions
    const existingAction = loggingService.getRecoveryAction(config.errorType);
    if (!existingAction) {
      loggingService.configureRecoveryAction(
        config.errorType,
        config.recovery.toJSON(),
      );
    }
  }
}

/**
 * Environment-specific recovery configurations
 */
export const ENVIRONMENT_RECOVERY_CONFIG = {
  development: {
    enableDetailedLogging: true,
    enableRecoveryAttempts: true,
    maxRetryAttempts: 5,
    showDebugInfo: true,
  },

  production: {
    enableDetailedLogging: false,
    enableRecoveryAttempts: true,
    maxRetryAttempts: 3,
    showDebugInfo: false,
  },

  test: {
    enableDetailedLogging: false,
    enableRecoveryAttempts: false, // Don't mask errors in tests
    maxRetryAttempts: 0,
    showDebugInfo: false,
  },
};

/**
 * Get recovery configuration for current environment
 */
export function getEnvironmentRecoveryConfig() {
  const environment = process.env.NODE_ENV || "development";
  return (
    ENVIRONMENT_RECOVERY_CONFIG[
      environment as keyof typeof ENVIRONMENT_RECOVERY_CONFIG
    ] || ENVIRONMENT_RECOVERY_CONFIG.development
  );
}

/**
 * Initialize all recovery configurations
 */
export function initializeRecoverySystem(): void {
  console.log("🔧 Initializing error recovery system...");

  // Configure default recovery actions for all error types
  configureDefaultRecoveryActions();

  // Configure operation-specific recovery actions
  configureOperationRecoveryActions();

  console.log("✅ Error recovery system initialized");
}
