import { createClient } from "@supabase/supabase-js";
import { initSupabase, getSupabaseClient, resetSupabaseService } from "@/lib/data/supabase/supabase/supabase.web";

// Mock the Supabase client
jest.mock("@supabase/supabase-js");
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock environment variables
const originalEnv = process.env;

describe("SupabaseWebService", () => {
  const mockClient = {
    auth: {},
    from: jest.fn(),
    storage: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockCreateClient.mockReturnValue(mockClient as any);
    resetSupabaseService(); // Reset service state for each test
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("initialization", () => {
    test("initializes with production configuration", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        }
      );
    });

    test("initializes with emulator configuration in development", () => {
      process.env.NODE_ENV = "development";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://127.0.0.1:54321",
        "dev-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }),
        })
      );
    });

    test("uses custom emulator host and port", () => {
      process.env.NODE_ENV = "development";
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST = "localhost";
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT = "8000";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://localhost:8000",
        "dev-anon-key",
        expect.any(Object)
      );
    });

    test("uses default development key when no key provided in emulator mode", () => {
      process.env.NODE_ENV = "development";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://127.0.0.1:54321",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        expect.any(Object)
      );
    });

    test("throws error when missing production URL", () => {
      process.env.NODE_ENV = "production"; // Force production mode
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      // No URL set
      
      expect(() => initSupabase()).toThrow(
        "Missing Supabase configuration. URL: false, Key: true"
      );
    });

    test("throws error when missing production anon key", () => {
      process.env.NODE_ENV = "production"; // Force production mode
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      // No anon key set
      
      expect(() => initSupabase()).toThrow(
        "Missing Supabase configuration. URL: true, Key: false"
      );
    });

    test("skips initialization when already initialized", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      
      initSupabase();
      initSupabase(); // Second call should skip
      
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSupabaseClient", () => {
    test("returns client after initialization", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      
      initSupabase();
      const client = getSupabaseClient();
      
      expect(client).toBe(mockClient);
    });

    test("throws error when not initialized", () => {
      // Service is already reset in beforeEach
      expect(() => getSupabaseClient()).toThrow(
        "Supabase service not initialized. Call init() before getSupabaseClient()"
      );
    });
  });

  describe("error handling", () => {
    test("handles createClient errors", () => {
      process.env.NODE_ENV = "production"; // Ensure production mode
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      
      mockCreateClient.mockImplementation(() => {
        throw new Error("Connection failed");
      });
      
      expect(() => initSupabase()).toThrow("Connection failed");
    });
  });

  describe("emulator detection", () => {
    test("detects emulator mode with EXPO_PUBLIC_USE_SUPABASE_EMULATOR", () => {
      process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = "true";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://127.0.0.1:54321",
        "dev-key",
        expect.any(Object)
      );
    });

    test("uses production mode when emulator flag is false", () => {
      process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = "false";
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://prod.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "prod-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://prod.supabase.co",
        "prod-key",
        expect.any(Object)
      );
    });
  });
});