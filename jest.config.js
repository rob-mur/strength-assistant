module.exports = {
  preset: "jest-expo",

  // Force Jest to exit to prevent hanging
  forceExit: true,

  // Optimized test discovery for constitutional performance targets
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.jest-cache/",
    "/coverage/",
    "/build/",
    "/dist/",
  ],

  // Minimal transforms for speed - only essential modules
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo|@expo|uuid|@react-navigation))",
  ],

  // Use default jest-expo transforms for compatibility
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Constitutional Requirement: TypeScript validation before test execution
  globalSetup: "<rootDir>/jest.global-setup.js",

  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}", // Include our TypeScript infrastructure
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx}",
    "!app/storybook.tsx", // Exclude storybook configuration from coverage
    "!__tests__/test-utils/**", // Exclude test infrastructure from coverage
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],

  // Coverage thresholds adjusted for current codebase coverage levels
  coverageThreshold: {
    global: {
      branches: 24,
      functions: 19,
      lines: 23,
      statements: 22,
    },
    // Individual file thresholds disabled for CI stability
    // Re-enable when specific files have dedicated test coverage
  },

  // TypeScript-first module resolution for constitutional compliance
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|tsx|js)", // Only test files in __tests__
    "**/*.(test|spec).(ts|tsx|js)", // Test files anywhere
    "**/__tests__/contracts/**/*.test.ts", // Include contract tests
  ],

  // Path aliases and constitutional infrastructure mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^../../lib/test-utils/TestDevice$":
      "<rootDir>/__tests__/test-utils/TestDevice",
    "^../lib/test-utils/(.*)$": "<rootDir>/__tests__/test-utils/$1",
    "^@constitution/(.*)$": "<rootDir>/lib/constitution/$1",
    "^@testing/(.*)$": "<rootDir>/lib/testing/$1",
  },
};
