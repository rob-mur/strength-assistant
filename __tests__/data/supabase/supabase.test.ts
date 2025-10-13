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

// Mock Supabase JS
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

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
    test("uses detectSessionInUrl=true for web platform", () => {
      (Platform as any).OS = "web";
      const { createClient } = require("@supabase/supabase-js");

      initSupabase();

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            detectSessionInUrl: true,
          }),
        }),
      );
    });

    test("uses detectSessionInUrl=false for native platforms", () => {
      (Platform as any).OS = "android";
      const { createClient } = require("@supabase/supabase-js");

      initSupabase();

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            detectSessionInUrl: false,
          }),
        }),
      );
    });

    test("uses detectSessionInUrl=false for ios", () => {
      (Platform as any).OS = "ios";
      const { createClient } = require("@supabase/supabase-js");

      initSupabase();

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            detectSessionInUrl: false,
          }),
        }),
      );
    });
  });

  describe("initialization", () => {
    test("initializes once and skips subsequent calls", () => {
      const { createClient } = require("@supabase/supabase-js");
      const mockClient = { from: jest.fn() };
      createClient.mockReturnValue(mockClient);

      initSupabase();
      initSupabase(); // Second call should be skipped

      expect(createClient).toHaveBeenCalledTimes(1);
    });

    test("throws error if URL environment variable missing", () => {
      // Reset service state first to ensure clean test
      resetSupabaseService();
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      expect(() => initSupabase()).toThrow(
        "EXPO_PUBLIC_SUPABASE_URL environment variable is required",
      );
    });

    test("throws error if anon key environment variable missing", () => {
      // Reset service state first to ensure clean test
      resetSupabaseService();
      // Ensure URL is set but remove anon key
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => initSupabase()).toThrow(
        "EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
      );
    });
  });

  describe("client access", () => {
    test("returns client after initialization", () => {
      const { createClient } = require("@supabase/supabase-js");
      const mockClient = { from: jest.fn() };
      createClient.mockReturnValue(mockClient);

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
