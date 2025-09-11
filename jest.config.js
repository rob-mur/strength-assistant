module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase/.*|@firebase/.*|uuid)",
  ],
  transform: {
    "^.+\\.mjs$": "babel-jest",
  },
  testPathIgnorePatterns: ["/node_modules/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  
  // Constitutional Requirement: TypeScript validation before test execution
  globalSetup: "<rootDir>/jest.global-setup.js",
  
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}", // Include our TypeScript infrastructure
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx}",
    "!lib/repo/FirebaseExerciseRepo.ts",
    "!lib/data/firebase/**",
  ],
  
  // Coverage thresholds aligned with constitutional quality requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Stricter requirements for TypeScript infrastructure
    "src/typescript/**/*.ts": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "src/constitution/**/*.ts": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Test environment configuration for constitutional compliance
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    // Ensure TypeScript strict mode compliance in test environment
    pretendToBeVisual: true,
  },
  
  // Test result processors for constitutional reporting
  reporters: [
    "default",
  ],
  
  // Ensure tests run in TypeScript-validated environment
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)",
  ],
};
