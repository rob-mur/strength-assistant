/**
 * Simple Error Blocking System Contracts
 * 
 * Defines interfaces for blocking app interaction when uncaught errors occur
 * and ensuring Maestro tests can detect these errors in production Android builds.
 */

import React, { ReactNode } from 'react';

export interface ErrorBlockerState {
  /**
   * Whether any uncaught error has occurred
   */
  hasUncaughtError: boolean;

  /**
   * Total number of uncaught errors detected
   */
  errorCount: number;

  /**
   * Message from the most recent error
   */
  lastError: string;

  /**
   * ISO timestamp of last error
   */
  lastErrorTimestamp: string;

  /**
   * Whether the overlay is currently blocking the app
   */
  isBlocking: boolean;
}

export interface ErrorBlockerComponent {
  /**
   * React component that wraps the entire app and blocks interaction when errors occur
   * @param props - Component props including children
   * @returns JSX element that either renders children or error blocker overlay
   */
  (props: { children: ReactNode }): React.JSX.Element;
}

export interface SimpleErrorLogger {
  /**
   * Log an error with context - no complex handling, just console output
   * @param error - Error to log
   * @param context - Context where error occurred
   */
  logError(error: Error, context: string): void;

  /**
   * Log an error and trigger app blocking (for uncaught errors)
   * @param error - Error to log and block for
   * @param context - Context where error occurred
   */
  logAndBlock(error: Error, context: string): void;
}

export interface MaestroErrorDetection {
  /**
   * Test ID for the error blocker overlay that Maestro can detect
   */
  readonly ERROR_BLOCKER_TEST_ID: 'maestro-error-blocker';

  /**
   * Test ID for error count display
   */
  readonly ERROR_COUNT_TEST_ID: 'maestro-error-count';

  /**
   * Test ID for error message display
   */
  readonly ERROR_MESSAGE_TEST_ID: 'maestro-error-message';

  /**
   * Check if error blocker is currently visible (for programmatic testing)
   * @returns True if error blocker is blocking the app
   */
  isErrorBlockerVisible(): boolean;

  /**
   * Get current error count (for programmatic testing)
   * @returns Number of uncaught errors
   */
  getErrorCount(): number;

  /**
   * Get last error message (for programmatic testing)
   * @returns Last error message or empty string
   */
  getLastErrorMessage(): string;
}

export interface ReactNativeErrorHandler {
  /**
   * Handle uncaught errors from React Native ErrorUtils
   * @param error - Error that occurred
   * @param isFatal - Whether React Native considers this a fatal error
   */
  handleUncaughtError(error: Error, isFatal: boolean): void;

  /**
   * Set up global error handling for React Native
   */
  setupGlobalErrorHandling(): void;

  /**
   * Clean up global error handlers (for testing)
   */
  cleanup(): void;
}

export interface MaestroTestHelpers {
  /**
   * Maestro YAML snippet to check for error blocker
   * @returns YAML test step that fails if error blocker is visible
   */
  getErrorBlockerCheck(): string;

  /**
   * Maestro script to check for uncaught errors
   * @returns JavaScript snippet for Maestro runScript command
   */
  getErrorDetectionScript(): string;
}

/**
 * Main factory interface for creating error blocking components
 */
export interface ErrorBlockingFactory {
  /**
   * Create the main ErrorBlocker component
   * @returns React component that can wrap the entire app
   */
  createErrorBlocker(): ErrorBlockerComponent;

  /**
   * Create a simple error logger
   * @returns SimpleErrorLogger instance
   */
  createSimpleLogger(): SimpleErrorLogger;

  /**
   * Create Maestro detection utilities
   * @returns MaestroErrorDetection instance
   */
  createMaestroDetection(): MaestroErrorDetection;

  /**
   * Create React Native error handler
   * @returns ReactNativeErrorHandler instance
   */
  createReactNativeHandler(): ReactNativeErrorHandler;

  /**
   * Create test helpers for Maestro
   * @returns MaestroTestHelpers instance
   */
  createTestHelpers(): MaestroTestHelpers;
}

/**
 * Configuration for the error blocking system
 */
export interface ErrorBlockingConfig {
  /**
   * Whether error blocking is enabled (default: true)
   */
  enabled?: boolean;

  /**
   * Maximum number of errors to track (default: 10)
   */
  maxErrors?: number;

  /**
   * Whether to show error details in the blocker UI (default: false for production)
   */
  showErrorDetails?: boolean;

  /**
   * Custom styling for the error blocker overlay
   */
  overlayStyle?: {
    backgroundColor?: string;
    opacity?: number;
    zIndex?: number;
  };

  /**
   * Whether to enable console logging (default: true)
   */
  enableConsoleLogging?: boolean;
}

/**
 * Event fired when an uncaught error is detected
 */
export interface UncaughtErrorEvent {
  /**
   * The error that was caught
   */
  error: Error;

  /**
   * Context where the error occurred
   */
  context: string;

  /**
   * Timestamp when error was detected
   */
  timestamp: string;

  /**
   * Whether this error will block the app
   */
  willBlock: boolean;

  /**
   * Current error count after this error
   */
  errorCount: number;
}