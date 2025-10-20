/**
 * ErrorBlockerState Model
 * 
 * Simple state model for tracking uncaught errors that block app interaction.
 * Designed to replace the complex 750+ line error handling system.
 */

import { ErrorBlockerState } from '../../specs/012-production-bug-android/contracts/simple-error-blocking';

/**
 * Creates a new ErrorBlockerState with initial values
 */
export function createErrorBlockerState(): ErrorBlockerState {
  return {
    hasUncaughtError: false,
    errorCount: 0,
    lastError: '',
    lastErrorTimestamp: '',
    isBlocking: false,
  };
}

/**
 * Creates an ErrorBlockerState with an error
 */
export function createErrorBlockerStateWithError(
  error: Error,
  existingState?: ErrorBlockerState
): ErrorBlockerState {
  const errorCount = existingState ? existingState.errorCount + 1 : 1;
  const timestamp = new Date().toISOString();

  return {
    hasUncaughtError: true,
    errorCount,
    lastError: error.message || 'Unknown error',
    lastErrorTimestamp: timestamp,
    isBlocking: true,
  };
}

/**
 * Validates that an ErrorBlockerState follows business rules
 */
export function validateErrorBlockerState(state: ErrorBlockerState): boolean {
  // Rule 1: errorCount must be >= 0
  if (state.errorCount < 0) {
    return false;
  }

  // Rule 2: hasUncaughtError must be true if errorCount > 0
  if (state.errorCount > 0 && !state.hasUncaughtError) {
    return false;
  }

  // Rule 3: lastError must not be empty if hasUncaughtError is true
  if (state.hasUncaughtError && !state.lastError) {
    return false;
  }

  // Rule 4: isBlocking must equal hasUncaughtError
  if (state.isBlocking !== state.hasUncaughtError) {
    return false;
  }

  return true;
}

/**
 * Gets the display message for the current error state
 */
export function getErrorDisplayMessage(state: ErrorBlockerState): string {
  if (!state.hasUncaughtError) {
    return '';
  }

  if (state.errorCount === 1) {
    return state.lastError;
  }

  return `${state.lastError} (${state.errorCount} errors total)`;
}

/**
 * Checks if the error state represents a blocked app
 */
export function isAppBlocked(state: ErrorBlockerState): boolean {
  return state.isBlocking;
}