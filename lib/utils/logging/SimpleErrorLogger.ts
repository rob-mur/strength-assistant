/**
 * SimpleErrorLogger Service
 * 
 * Lightweight error logging service with console-only output.
 * Designed to achieve <0.01ms performance target and replace complex error handling.
 */

import { SimpleErrorLogger } from '../../../specs/012-production-bug-android/contracts/simple-error-blocking';
import { createSimpleErrorLog, formatSimpleErrorLogWithStack } from '../../models/SimpleErrorLog';

/**
 * Global error state for app blocking
 */
let globalErrorState = {
  hasError: false,
  errorCount: 0,
  lastError: '',
  lastErrorTimestamp: '',
};

/**
 * Implementation of SimpleErrorLogger interface
 */
export class SimpleErrorLoggerImpl implements SimpleErrorLogger {
  /**
   * Log an error with context - no complex handling, just console output
   */
  logError(error: Error, context: string): void {
    // Simple console.error with context and error object (as expected by contract tests)
    console.error(`[${context}]`, error);
  }

  /**
   * Log an error and trigger app blocking (for uncaught errors)
   */
  logAndBlock(error: Error, context: string): void {
    // First log the error
    this.logError(error, context);
    
    // Update global error state for blocking
    globalErrorState = {
      hasError: true,
      errorCount: globalErrorState.errorCount + 1,
      lastError: error.message || 'Unknown error',
      lastErrorTimestamp: new Date().toISOString(),
    };
    
    // Notify error blocker component about state change
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('uncaughtError', {
        detail: globalErrorState,
      }));
    }
  }
}

/**
 * Gets the current global error state
 */
export function getGlobalErrorState() {
  return { ...globalErrorState };
}

/**
 * Resets the global error state (for testing)
 */
export function resetGlobalErrorState(): void {
  globalErrorState = {
    hasError: false,
    errorCount: 0,
    lastError: '',
    lastErrorTimestamp: '',
  };
}

/**
 * Creates a new SimpleErrorLogger instance
 */
export function createSimpleErrorLogger(): SimpleErrorLogger {
  return new SimpleErrorLoggerImpl();
}