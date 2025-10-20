/**
 * MaestroErrorDetection Service
 * 
 * Service for exposing error state to Maestro integration tests.
 * Provides test IDs and methods for detecting uncaught errors.
 */

import { MaestroErrorDetection, MaestroTestHelpers } from '../../../specs/012-production-bug-android/contracts/simple-error-blocking';
import { getGlobalErrorState } from '../logging/SimpleErrorLogger';
import { 
  MAESTRO_TEST_IDS, 
  getMaestroErrorBlockerCheck, 
  getMaestroErrorDetectionScript 
} from '../../models/MaestroErrorIndicator';

/**
 * Implementation of MaestroErrorDetection interface
 */
export class MaestroErrorDetectionImpl implements MaestroErrorDetection {
  /**
   * Test ID for the error blocker overlay that Maestro can detect
   */
  readonly ERROR_BLOCKER_TEST_ID = MAESTRO_TEST_IDS.ERROR_BLOCKER;

  /**
   * Test ID for error count display
   */
  readonly ERROR_COUNT_TEST_ID = MAESTRO_TEST_IDS.ERROR_COUNT;

  /**
   * Test ID for error message display
   */
  readonly ERROR_MESSAGE_TEST_ID = MAESTRO_TEST_IDS.ERROR_MESSAGE;

  /**
   * Check if error blocker is currently visible (for programmatic testing)
   */
  isErrorBlockerVisible(): boolean {
    const state = getGlobalErrorState();
    return state.hasError;
  }

  /**
   * Get current error count (for programmatic testing)
   */
  getErrorCount(): number {
    const state = getGlobalErrorState();
    return state.errorCount;
  }

  /**
   * Get last error message (for programmatic testing)
   */
  getLastErrorMessage(): string {
    const state = getGlobalErrorState();
    return state.lastError;
  }
}

/**
 * Implementation of MaestroTestHelpers interface
 */
export class MaestroTestHelpersImpl implements MaestroTestHelpers {
  /**
   * Maestro YAML snippet to check for error blocker
   */
  getErrorBlockerCheck(): string {
    return getMaestroErrorBlockerCheck();
  }

  /**
   * Maestro script to check for uncaught errors
   */
  getErrorDetectionScript(): string {
    return getMaestroErrorDetectionScript();
  }
}

/**
 * Creates a new MaestroErrorDetection instance
 */
export function createMaestroErrorDetection(): MaestroErrorDetection {
  return new MaestroErrorDetectionImpl();
}

/**
 * Creates a new MaestroTestHelpers instance
 */
export function createMaestroTestHelpers(): MaestroTestHelpers {
  return new MaestroTestHelpersImpl();
}