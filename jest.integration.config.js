module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/integration/**/*-test.(ts|tsx|js|jsx)"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase/.*|@firebase/.*)",
  ],
  transform: {
    "^.+\\.mjs$": "babel-jest",
  },
  testPathIgnorePatterns: ["/node_modules/"],
  // Integration tests may take longer
  testTimeout: 30000,
  // Set environment variable to enable integration tests when needed
  setupFilesAfterEnv: ["<rootDir>/__tests__/integration/setup.ts"],
};