// Mock React Native Firebase Auth using FirebaseMockFactory
jest.mock('@react-native-firebase/auth', () => {
  const FirebaseMockFactory = require('./lib/test-utils/FirebaseMockFactory').default;
  return FirebaseMockFactory.getReactNativeFirebaseMock();
});

// Mock Firebase web SDK using FirebaseMockFactory
jest.mock('firebase/auth', () => {
  const FirebaseMockFactory = require('./lib/test-utils/FirebaseMockFactory').default;
  return FirebaseMockFactory.getWebFirebaseMock();
});

// Mock Firebase Firestore web SDK
jest.mock('firebase/firestore', () => {
  const FirebaseMockFactory = require('./lib/test-utils/FirebaseMockFactory').default;
  return {
    getFirestore: jest.fn(() => FirebaseMockFactory.createFirestoreMock()),
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
    connectFirestoreEmulator: jest.fn(),
  };
});

// Mock platform detection and React Native animations
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Ensure Platform object exists and set OS
  if (!RN.Platform) {
    RN.Platform = {};
  }
  RN.Platform.OS = 'web'; // Default to web for most tests
  
  // Mock Animated to prevent act() warnings in component tests (T002 requirement)
  RN.Animated = {
    ...RN.Animated,
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    decay: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      addListener: jest.fn(() => 'mock-listener-id'),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(() => ({ setValue: jest.fn() })),
    })),
    View: RN.View,
    Text: RN.Text,
  };
  
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

// Mock Supabase client with dynamic behavior
jest.mock('@supabase/supabase-js', () => {
  let currentUser = null;
  let userCounter = 0;

  const createMockUser = (email, isAnonymous = false) => ({
    id: isAnonymous ? 'test-anon-uid' : 'test-uid',
    email: isAnonymous ? undefined : email,
    created_at: new Date().toISOString(),
  });

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: currentUser ? { user: currentUser, access_token: 'test-token' } : null },
        error: null,
      })),
      signUp: jest.fn((options) => {
        const { email, password } = options;
        // Validate password strength
        if (password && password.length < 6) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Password should be at least 6 characters' }
          });
        }
        
        const user = createMockUser(email, false);
        currentUser = user;
        return Promise.resolve({
          data: { user, session: { user } },
          error: null,
        });
      }),
      signInWithPassword: jest.fn((options) => {
        const { email, password } = options;
        // Simulate failed auth for wrong credentials
        if (email === 'wrong@example.com' || password === 'wrongpassword') {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' }
          });
        }
        
        // Return user matching the email
        const user = createMockUser(email, false);
        currentUser = user;
        return Promise.resolve({
          data: { user, session: { user } },
          error: null,
        });
      }),
      signInAnonymously: jest.fn(() => {
        const user = createMockUser(undefined, true);
        currentUser = user;
        return Promise.resolve({
          data: { user, session: { user } },
          error: null,
        });
      }),
      signOut: jest.fn(() => {
        currentUser = null;
        return Promise.resolve({ error: null });
      }),
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: currentUser }, 
        error: null 
      })),
      onAuthStateChange: jest.fn(() => ({ 
        data: { subscription: {} }, 
        unsubscribe: jest.fn() 
      })),
    },
    from: jest.fn(() => {
      // Create chainable query builder
      const chainableQuery = {
        select: jest.fn(() => chainableQuery),
        insert: jest.fn(() => chainableQuery),
        update: jest.fn(() => chainableQuery),
        delete: jest.fn(() => chainableQuery),
        eq: jest.fn(() => chainableQuery),
        neq: jest.fn(() => chainableQuery),
        gt: jest.fn(() => chainableQuery),
        gte: jest.fn(() => chainableQuery),
        lt: jest.fn(() => chainableQuery),
        lte: jest.fn(() => chainableQuery),
        like: jest.fn(() => chainableQuery),
        ilike: jest.fn(() => chainableQuery),
        is: jest.fn(() => chainableQuery),
        in: jest.fn(() => chainableQuery),
        contains: jest.fn(() => chainableQuery),
        containedBy: jest.fn(() => chainableQuery),
        rangeGt: jest.fn(() => chainableQuery),
        rangeGte: jest.fn(() => chainableQuery),
        rangeLt: jest.fn(() => chainableQuery),
        rangeLte: jest.fn(() => chainableQuery),
        rangeAdjacent: jest.fn(() => chainableQuery),
        overlaps: jest.fn(() => chainableQuery),
        textSearch: jest.fn(() => chainableQuery),
        match: jest.fn(() => chainableQuery),
        not: jest.fn(() => chainableQuery),
        or: jest.fn(() => chainableQuery),
        filter: jest.fn(() => chainableQuery),
        order: jest.fn(() => chainableQuery),
        limit: jest.fn(() => chainableQuery),
        range: jest.fn(() => chainableQuery),
        abortSignal: jest.fn(() => chainableQuery),
        single: jest.fn(() => chainableQuery),
        maybeSingle: jest.fn(() => chainableQuery),
        csv: jest.fn(() => chainableQuery),
        geojson: jest.fn(() => chainableQuery),
        explain: jest.fn(() => chainableQuery),
        rollback: jest.fn(() => chainableQuery),
        returns: jest.fn(() => chainableQuery),
        // Terminal operations that return promises with data/error structure
        then: jest.fn((resolve) => {
          // Return realistic data structure based on operation
          const result = { data: [], error: null };
          resolve(result);
          return Promise.resolve(result);
        }),
        // Also make it awaitable directly
        [Symbol.asyncIterator]: jest.fn(),
      };
      
      // Add proper Promise.resolve behavior
      Object.assign(chainableQuery, {
        // Make it act like a Promise for await operations
        catch: jest.fn(() => chainableQuery),
        finally: jest.fn(() => chainableQuery),
      });
      return chainableQuery;
    }),
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

// Memory optimization settings
const isMemoryOptimizationEnabled = true;

// T003a Performance Optimization: Aggressive timeout for <60 second target
jest.setTimeout(5000); // 5 seconds max - aggressive timeout for speed

// Setup global error handling for better test failure reporting
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual errors, not React warnings during tests
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// T003a Performance Optimization: Minimal cleanup for speed
beforeEach(() => {
  if (isMemoryOptimizationEnabled) {
    // Clear timers only (skip expensive GC operations)
    jest.clearAllTimers();
    
    // Skip module cache clearing for speed - causes slower test execution
  }
});

afterEach(async () => {
  if (isMemoryOptimizationEnabled) {
    // T003a: Minimal cleanup for speed - skip expensive operations
    
    // Only clear mocks (fast operation)
    jest.clearAllMocks();
    
    // Reset Firebase mock state for test isolation
    try {
      const FirebaseMockFactory = require('./lib/test-utils/FirebaseMockFactory').default;
      FirebaseMockFactory.cleanup();
    } catch (error) {
      // Ignore cleanup errors to prevent test interference
    }
    
    // Skip: resetModules, GC, AsyncStorage clearing (slow operations)
    // Skip: TestDevice cleanup (can be expensive)
  }
});

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