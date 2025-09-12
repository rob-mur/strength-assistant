/**
 * Jest Polyfills for React Native Expo Environment
 * 
 * Provides polyfills and global mocks required for Jest tests
 * to run in a React Native Expo environment.
 */

// React Native and Expo polyfills
// import 'react-native-gesture-handler/jestSetup'; // Comment out if causing issues

// AsyncStorage mock
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

// Mock AsyncStorage globally
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useFocusEffect: jest.fn(),
  useRoute: () => ({
    params: {},
    name: 'TestRoute',
    key: 'test-key',
  }),
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  ...jest.requireActual('react-native-paper'),
  Provider: ({ children }) => children,
  DefaultTheme: { colors: { primary: '#6200ee' } },
  MD3LightTheme: { colors: { primary: '#6200ee' } },
}));

// Mock React Native modules that might cause issues (comment out problematic ones)
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'Test App',
      slug: 'test-app',
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock UUID for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Global test environment setup
global.__DEV__ = true;
global.__TEST__ = true;

// Console suppression for cleaner test output (optional)
if (process.env.SUPPRESS_CONSOLE_WARNINGS === 'true') {
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Performance API mock for React Native
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  };
}

// Intersection Observer mock for React Native Web
if (!global.IntersectionObserver) {
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}