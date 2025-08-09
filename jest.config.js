module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  //collectCoverage: true,
  //collectCoverageFrom: [
  //    '**/*.{ts,tsx,js,jsx}',
  //    '!**/coverage/**',
  //    '!**/node_modules/**',
  //    '!**/babel.config.js',
  //    '!**/expo-env.d.ts',
  //    '!**/.expo/**'
  //],
  setupFiles: ["./node_modules/react-native-gesture-handler/jestSetup.js"],
  setupFilesAfterEnv: ["./jest-setup.ts"],
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { caller: { preserveEnvVars: true } }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|escape-string-regexp|expo-router|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@sentry/.*)",
  ],
  moduleDirectories: ["node_modules", "utils", __dirname],
  haste: {
    defaultPlatform: "ios",
    platforms: ["android", "ios", "native"],
  },
};
