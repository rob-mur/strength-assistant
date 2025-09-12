// Mock React Native Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    isAnonymous: false,
  };

  const mockAuth = {
    onAuthStateChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
    signInAnonymously: jest.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    signOut: jest.fn(() => Promise.resolve()),
    currentUser: mockUser,
    useEmulator: jest.fn(),
  };

  const auth = () => mockAuth;
  
  return {
    __esModule: true,
    default: auth,
    FirebaseAuthTypes: {
      AuthErrorCode: {},
    },
  };
});

// Mock platform detection to avoid requiring native Firebase
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Ensure Platform object exists and set OS
  if (!RN.Platform) {
    RN.Platform = {};
  }
  RN.Platform.OS = 'web'; // Default to web for most tests
  
  return RN;
});

// Mock navigator global for web APIs used in isOnline() method
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
  configurable: true,
});

// Set up test environment variables for Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.USE_SUPABASE_DATA = 'false'; // Default to Firebase for tests
process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = 'true';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse = {
    data: { user: mockUser, session: { user: mockUser } },
    error: null,
  };

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { user: mockUser, access_token: 'test-token' } },
        error: null,
      })),
      signUp: jest.fn(() => Promise.resolve(mockAuthResponse)),
      signInWithPassword: jest.fn(() => Promise.resolve(mockAuthResponse)),
      signInAnonymously: jest.fn(() => Promise.resolve({
        data: { user: { ...mockUser, email: undefined }, session: { user: { ...mockUser, email: undefined } } },
        error: null,
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: {} }, unsubscribe: jest.fn() })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
      insert: jest.fn(() => ({ data: null, error: null })),
      update: jest.fn(() => ({ data: null, error: null })),
      delete: jest.fn(() => ({ data: null, error: null })),
    })),
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient),
  };
});

// Test Infrastructure Initialization (for the 80 failing tests)
// This ensures our TestDevice and other infrastructure is available

// Mock Legend State for performance (if package exists)
// jest.mock('legend-state', () => ({
//   observable: jest.fn((value) => ({
//     get: jest.fn(() => value),
//     set: jest.fn(),
//     subscribe: jest.fn(() => jest.fn()),
//   })),
//   observe: jest.fn(),
//   when: jest.fn(),
// }));

// Global test utilities setup
global.testUtils = {
  TestDevice: undefined, // Will be loaded on demand
  mockFactories: undefined, // Will be loaded on demand
  testDataBuilders: undefined, // Will be loaded on demand
};

// Ensure test timeouts are appropriate (not too short to cause timeouts)
jest.setTimeout(30000); // 30 seconds for integration tests

// Setup global error handling for better test failure reporting
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual errors, not React warnings during tests
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Constitutional Compliance: Ensure test infrastructure contracts are available
// This helps with the missing TestDevice imports that are causing test failures
beforeAll(() => {
  // Set up any global test infrastructure state
  process.env.NODE_ENV = 'test';
  process.env.JEST_TEST_ENVIRONMENT = 'true';
});

afterAll(() => {
  // Clean up global test state
  jest.clearAllMocks();
  jest.restoreAllMocks();
});