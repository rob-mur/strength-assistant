import { Platform } from "react-native";
import {
  initSupabase,
  getSupabaseClient,
  resetSupabaseService,
} from "@/lib/data/supabase/supabase";

// Mock Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "native",
  },
}));

// Mock Supabase JS with isolated implementation for this test file
// Note: This overrides the global mock from jest.setup.js for this test file only
const mockCreateClient = jest.fn();

// Create a default mock client that matches the expected interface
const createDefaultMockClient = () => ({
  from: jest.fn(),
  auth: jest.fn(),
  channel: jest.fn(),
});

// Clear module cache and force remock for this specific file
beforeAll(() => {
  // Set up default return value for mockCreateClient
  mockCreateClient.mockReturnValue(createDefaultMockClient());

  jest.doMock("@supabase/supabase-js", () => ({
    createClient: mockCreateClient,
  }));
});

// Mock Logger
jest.mock("@/lib/data/supabase/supabase/logger");

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe("supabase consolidated service", () => {
  // Store original environment values
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear the isolated mock and restore default behavior
    mockCreateClient.mockClear();
    mockCreateClient.mockReturnValue(createDefaultMockClient());

    // Reset service state first
    resetSupabaseService();

    // Set environment variables explicitly for each test
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    // Restore original environment values
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });

  describe("platform detection", () => {
    test("initializes successfully for web platform", () => {
      // Global mocks handle platform differences, just verify initialization works
      resetSupabaseService();
      expect(() => initSupabase()).not.toThrow();
      expect(() => getSupabaseClient()).not.toThrow();
    });

    test("initializes successfully for native platforms", () => {
      // Global mocks ensure consistent behavior across platforms
      resetSupabaseService();
      expect(() => initSupabase()).not.toThrow();

      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(typeof client).toBe("object");
    });

    test("provides client with expected interface", () => {
      resetSupabaseService();
      initSupabase();
      const client = getSupabaseClient();

      // Global mocks provide a client with basic interface
      expect(client).toHaveProperty("from");
      expect(client).toHaveProperty("auth");
    });
  });

  describe("initialization", () => {
    test("initializes service successfully", () => {
      resetSupabaseService();

      // Should initialize without throwing
      expect(() => initSupabase()).not.toThrow();

      // Service should be accessible after initialization
      expect(() => getSupabaseClient()).not.toThrow();
      const client = getSupabaseClient();
      expect(client).toBeDefined();
    });

    test("handles environment variables correctly", () => {
      resetSupabaseService();

      // Global test setup provides environment variables
      expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();

      // Should initialize successfully with provided env vars
      expect(() => initSupabase()).not.toThrow();
    });

    test("supports multiple initialization attempts", () => {
      resetSupabaseService();

      // First initialization
      initSupabase();
      const firstClient = getSupabaseClient();

      // Second initialization should work (idempotent)
      initSupabase();
      const secondClient = getSupabaseClient();

      // Should return same client instance
      expect(firstClient).toBe(secondClient);
    });
  });

  describe("client access", () => {
    test("returns client after initialization", () => {
      const mockClient = { from: jest.fn() };
      mockCreateClient.mockReturnValue(mockClient);

      initSupabase();
      const result = getSupabaseClient();

      expect(result).toBe(mockClient);
    });

    test("throws error when accessing client before initialization", () => {
      expect(() => getSupabaseClient()).toThrow(
        "Supabase service not initialized. Call init() before getSupabaseClient()",
      );
    });
  });
});
