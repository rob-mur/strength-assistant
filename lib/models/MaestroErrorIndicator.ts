/**
 * MaestroErrorIndicator Model
 * 
 * Model for tracking error state information that Maestro integration tests can detect.
 * Provides constants and utilities for Maestro test automation.
 */

/**
 * Constants for Maestro test detection
 */
export const MAESTRO_TEST_IDS = {
  ERROR_BLOCKER: 'maestro-error-blocker',
  ERROR_COUNT: 'maestro-error-count',
  ERROR_MESSAGE: 'maestro-error-message',
} as const;

/**
 * Maestro error indicator data structure
 */
export interface MaestroErrorIndicator {
  /**
   * Whether the error blocker is currently visible
   */
  isVisible: boolean;

  /**
   * Current error count
   */
  errorCount: number;

  /**
   * Last error message
   */
  lastErrorMessage: string;

  /**
   * Timestamp of last error
   */
  lastErrorTimestamp: string;
}

/**
 * Creates a new MaestroErrorIndicator with initial values
 */
export function createMaestroErrorIndicator(): MaestroErrorIndicator {
  return {
    isVisible: false,
    errorCount: 0,
    lastErrorMessage: '',
    lastErrorTimestamp: '',
  };
}

/**
 * Creates a MaestroErrorIndicator from error state
 */
export function createMaestroErrorIndicatorFromState(
  hasError: boolean,
  errorCount: number,
  lastError: string,
  timestamp: string
): MaestroErrorIndicator {
  return {
    isVisible: hasError,
    errorCount,
    lastErrorMessage: lastError,
    lastErrorTimestamp: timestamp,
  };
}

/**
 * Generates Maestro YAML snippet to check for error blocker
 */
export function getMaestroErrorBlockerCheck(): string {
  return `# Check that error blocker is NOT visible (test should fail if errors occur)
- assertNotVisible:
    id: "${MAESTRO_TEST_IDS.ERROR_BLOCKER}"`;
}

/**
 * Generates Maestro JavaScript snippet for error detection
 */
export function getMaestroErrorDetectionScript(): string {
  return `// Check for uncaught errors in the app
const errorBlocker = maestro.findElement({ id: "${MAESTRO_TEST_IDS.ERROR_BLOCKER}" });
if (errorBlocker) {
  const errorCount = maestro.findElement({ id: "${MAESTRO_TEST_IDS.ERROR_COUNT}" });
  const errorMessage = maestro.findElement({ id: "${MAESTRO_TEST_IDS.ERROR_MESSAGE}" });
  
  throw new Error(\`Uncaught error detected - Count: \${errorCount?.text || 0}, Message: \${errorMessage?.text || 'Unknown'}\`);
}`;
}

/**
 * Gets test data for Maestro error scenarios
 */
export function getMaestroTestData(): {
  noErrorState: MaestroErrorIndicator;
  singleErrorState: MaestroErrorIndicator;
  multipleErrorsState: MaestroErrorIndicator;
} {
  return {
    noErrorState: createMaestroErrorIndicator(),
    singleErrorState: createMaestroErrorIndicatorFromState(
      true,
      1,
      'Network timeout',
      new Date().toISOString()
    ),
    multipleErrorsState: createMaestroErrorIndicatorFromState(
      true,
      3,
      'Database connection failed',
      new Date().toISOString()
    ),
  };
}