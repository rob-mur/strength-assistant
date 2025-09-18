// Temporarily disable fake timers to debug hanging issue
// jest.useFakeTimers();

// Mock React Native Firebase Auth using FirebaseMockFactory
jest.mock("@react-native-firebase/auth", () => {
  const FirebaseMockFactory =
    require("./__tests__/test-utils/FirebaseMockFactory").default;
  return FirebaseMockFactory.getReactNativeFirebaseMock();
});

// Mock Firebase web SDK using FirebaseMockFactory
jest.mock("firebase/auth", () => {
  const FirebaseMockFactory =
    require("./__tests__/test-utils/FirebaseMockFactory").default;
  return FirebaseMockFactory.getWebFirebaseMock();
});

// Mock Firebase Firestore web SDK
jest.mock("firebase/firestore", () => {
  const FirebaseMockFactory =
    require("./__tests__/test-utils/FirebaseMockFactory").default;
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
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");

  // Ensure Platform object exists and set OS
  if (!RN.Platform) {
    RN.Platform = {};
  }
  RN.Platform.OS = "web"; // Default to web for most tests

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
      addListener: jest.fn(() => "mock-listener-id"),
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
Object.defineProperty(global, "navigator", {
  value: {
    onLine: true,
  },
  writable: true,
  configurable: true,
});

// Set up test environment variables for Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.USE_SUPABASE_DATA = "false"; // Default to Firebase for tests
process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = "true";

// Mock Supabase client with dynamic behavior
jest.mock("@supabase/supabase-js", () => {
  let currentUser = null;
  let userCounter = 0;

  const createMockUser = (email, isAnonymous = false) => ({
    id: isAnonymous ? "test-anon-uid" : "test-uid",
    email: isAnonymous ? undefined : email,
    created_at: new Date().toISOString(),
  });

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: {
            session: currentUser
              ? { user: currentUser, access_token: "test-token" }
              : null,
          },
          error: null,
        }),
      ),
      signUp: jest.fn((options) => {
        const { email, password } = options;
        // Validate password strength
        if (password && password.length < 6) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: "Password should be at least 6 characters" },
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
        if (email === "wrong@example.com" || password === "wrongpassword") {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: "Invalid login credentials" },
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
        userCounter++;
        const user = createMockUser(undefined, true);
        // Generate unique IDs for multiple anonymous users
        user.id = `test-anon-uid-${userCounter}`;
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
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: currentUser },
          error: null,
        }),
      ),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      // Missing methods needed for auth contract tests
      linkEmailPassword: jest.fn((email, password) => {
        if (currentUser && currentUser.isAnonymous !== false) {
          const upgradedUser = { ...currentUser, email, isAnonymous: false };
          currentUser = upgradedUser;
          return Promise.resolve({
            data: { user: upgradedUser },
            error: null,
          });
        }
        return Promise.resolve({
          data: { user: null },
          error: { message: "No anonymous user to upgrade" },
        });
      }),
      forceSessionExpiry: jest.fn(() => {
        currentUser = null;
        return Promise.resolve({ error: null });
      }),
    },
    from: jest.fn((tableName) => {
      // Create chainable query builder with operation tracking
      const operationContext = {
        tableName,
        operation: null,
        insertData: null,
        isSelect: false,
        isSingle: false,
        recordId: null,
      };
      const chainableQuery = {
        select: jest.fn(() => {
          operationContext.isSelect = true;
          return chainableQuery;
        }),
        insert: jest.fn((data) => {
          operationContext.operation = "insert";
          operationContext.insertData = data;
          return chainableQuery;
        }),
        update: jest.fn((data) => {
          operationContext.operation = "update";
          operationContext.insertData = data;
          return chainableQuery;
        }),
        delete: jest.fn(() => {
          operationContext.operation = "delete";
          return chainableQuery;
        }),
        eq: jest.fn((column, value) => {
          if (column === "id") operationContext.recordId = value;
          return chainableQuery;
        }),
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
        single: jest.fn(() => {
          operationContext.isSingle = true;
          return chainableQuery;
        }),
        maybeSingle: jest.fn(() => {
          operationContext.isSingle = true;
          return chainableQuery;
        }),
        returns: jest.fn(() => chainableQuery),
        // Terminal operations that return promises with data/error structure
        then: jest.fn((resolve) => {
          // Return realistic data based on operation context
          let result;

          if (
            operationContext.operation === "insert" &&
            operationContext.insertData &&
            operationContext.isSelect
          ) {
            // For insert with select, return the inserted data with an ID
            const insertedRecord = {
              ...operationContext.insertData,
              id:
                operationContext.insertData.id ||
                require("crypto").randomUUID(),
            };
            result = operationContext.isSingle
              ? { data: insertedRecord, error: null }
              : { data: [insertedRecord], error: null };
          } else if (
            operationContext.operation === "update" &&
            operationContext.insertData &&
            operationContext.isSelect
          ) {
            // For update with select, return the updated data with preserved ID
            const updatedRecord = {
              ...operationContext.insertData,
              id:
                operationContext.recordId ||
                operationContext.insertData.id ||
                require("crypto").randomUUID(),
            };
            result = operationContext.isSingle
              ? { data: updatedRecord, error: null }
              : { data: [updatedRecord], error: null };
          } else if (operationContext.isSelect && !operationContext.operation) {
            // For standalone SELECT queries (like fetching existing exercise), return a mock exercise record
            // Use crypto.randomUUID() for valid UUID generation
            const { randomUUID } = require("crypto");
            const mockExerciseRecord = {
              id: randomUUID(),
              name: "Mock Exercise",
              user_id: "test-user-id",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted: false,
            };
            result = operationContext.isSingle
              ? { data: mockExerciseRecord, error: null }
              : { data: [mockExerciseRecord], error: null };
          } else {
            // Default behavior for other operations
            result = { data: operationContext.isSingle ? {} : [], error: null };
          }

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
    // Add real-time channel support for subscriptions
    channel: jest.fn((channelName) => {
      const mockChannel = {
        on: jest.fn(() => mockChannel), // Allow chaining
        subscribe: jest.fn(() => mockChannel),
        unsubscribe: jest.fn(() => Promise.resolve({ error: null })),
      };
      return mockChannel;
    }),
    // Add exercises table mock
    exercises: {
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        neq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        match: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        match: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    },
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient),
  };
});

// Mock the SupabaseClient wrapper class
jest.mock("./lib/data/supabase/SupabaseClient", () => {
  // Re-use the primary mockSupabaseClient from above instead of creating a duplicate
  const { createClient } = require("@supabase/supabase-js");
  const primaryMockClient = createClient();

  // Create a proper mock constructor that passes instanceof checks
  const MockSupabaseClient = function () {
    return {
      getSupabaseClient: jest.fn(() => primaryMockClient),
      getCurrentUser: jest.fn(() => Promise.resolve(null)),
    };
  };

  return {
    SupabaseClient: MockSupabaseClient,
    supabaseClient: {
      getSupabaseClient: jest.fn(() => primaryMockClient),
      getCurrentUser: jest.fn(() => Promise.resolve(null)),
    },
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

// Track event listeners for cleanup
global.eventListenersToCleanup = [];

// Memory optimization settings
const isMemoryOptimizationEnabled = true;

// T003a Performance Optimization: Balanced timeout for test stability
jest.setTimeout(15000); // 15 seconds - allows for contract tests while maintaining speed

// Setup global error handling for better test failure reporting
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual errors, not React warnings during tests
  if (args[0] && typeof args[0] === "string" && args[0].includes("Warning:")) {
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

    // Clear all timers (both real and fake)
    jest.clearAllTimers();

    // Skip fake timer cleanup since we're using real timers
    // if (jest.isMockFunction(setTimeout)) {
    //   jest.runOnlyPendingTimers();
    //   jest.useRealTimers(); // Temporarily restore
    //   jest.useFakeTimers(); // Reset for next test
    // }

    // More aggressive cleanup for contract tests
    if (expect.getState && expect.getState().currentTestName) {
      const testName = expect.getState().currentTestName;
      if (testName && testName.includes("Contract")) {
        // Clear test persistence state
        global.testPersistence = undefined;
      }
    }

    // Only clear mocks (fast operation)
    jest.clearAllMocks();

    // Clean up event listeners
    if (typeof window !== "undefined" && global.eventListenersToCleanup) {
      global.eventListenersToCleanup.forEach(({ target, event, handler }) => {
        try {
          target.removeEventListener(event, handler);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
      global.eventListenersToCleanup.length = 0;
    }

    // Reset Firebase mock state for test isolation
    try {
      const FirebaseMockFactory =
        require("./__tests__/test-utils/FirebaseMockFactory").default;
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
  process.env.NODE_ENV = "test";
  process.env.JEST_TEST_ENVIRONMENT = "true";
});

afterAll(() => {
  // Clean up global test state
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Real timers are already enabled - no need to restore
  // jest.useRealTimers();
});
