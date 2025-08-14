/**
 * Setup file for integration tests
 */

// Set up environment for integration tests
if (process.env.NODE_ENV === 'test') {
  // Set environment variables for integration testing
  process.env.RUN_INTEGRATION_TESTS = 'false'; // Disabled by default for CI/CD
  
  // If Firebase emulator is running, enable integration tests
  if (process.env.FIREBASE_EMULATOR_HOST) {
    process.env.RUN_INTEGRATION_TESTS = 'true';
  }
}

// Extend default timeout for integration tests
jest.setTimeout(30000);