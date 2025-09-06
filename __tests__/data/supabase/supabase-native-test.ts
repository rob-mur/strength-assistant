import { initSupabase, getSupabaseClient, resetSupabaseService } from "@/lib/data/supabase/supabase/supabase.native";

// Mock the Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}), { virtual: true });

const { createClient } = require("@supabase/supabase-js");
const mockCreateClient = createClient;

// Mock environment variables
const originalEnv = process.env;

// Helper function to set NODE_ENV in Jest environment
function setNodeEnv(value: string) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}

describe("SupabaseNativeService", () => {
  const mockClient = {
    auth: {},
    from: jest.fn(),
    storage: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear Supabase environment variables that might interfere with tests
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT;
    mockCreateClient.mockReturnValue(mockClient as any);
    resetSupabaseService(); // Reset service state for each test
  });

  afterEach(() => {
    // Clean up any test-specific environment variables
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT;
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
            detectSessionInUrl: false, // Native-specific: should be false
          },
        }
      );
    });

    test("initializes with emulator configuration in development", () => {
      setNodeEnv("development");
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://10.0.2.2:54321", // Native-specific: should use 10.0.2.2
        "dev-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          }),
        })
      );
    });

    test("uses custom emulator host and port", () => {
      setNodeEnv("development");
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST = "192.168.1.100";
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT = "8000";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://192.168.1.100:8000",
        "dev-anon-key",
        expect.any(Object)
      );
    });

    test("uses default Android emulator host (10.0.2.2)", () => {
      setNodeEnv("development");
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-anon-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://10.0.2.2:54321",
        "dev-anon-key",
        expect.any(Object)
      );
    });

    test("uses default development key when no key provided in emulator mode", () => {
      setNodeEnv("development");
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://10.0.2.2:54321",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        expect.any(Object)
      );
    });

    test("throws error when missing production URL", () => {
      setNodeEnv("production"); // Force production mode
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      // No URL set
      
      expect(() => initSupabase()).toThrow(
        "Missing Supabase configuration. URL: false, Key: true"
      );
    });

    test("throws error when missing production anon key", () => {
      setNodeEnv("production"); // Force production mode
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
      // Set development mode to enable emulator defaults
      setNodeEnv("development");
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

  describe("platform-specific differences", () => {
    test("uses different default host than web (10.0.2.2 vs 127.0.0.1)", () => {
      setNodeEnv("development");
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "dev-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalled();
      const calls = mockCreateClient.mock.calls;
      if (calls.length > 0) {
        const [url] = calls[0];
        expect(url).toBe("http://10.0.2.2:54321");
      }
    });

    test("sets detectSessionInUrl to false for native", () => {
      // Set development mode to enable emulator mode
      setNodeEnv("development");
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalled();
      const calls = mockCreateClient.mock.calls;
      if (calls.length > 0) {
        const [,, config] = calls[0];
        expect(config?.auth?.detectSessionInUrl).toBe(false);
      }
    });
  });

  describe("error handling", () => {
    test("handles createClient errors", () => {
      setNodeEnv("production"); // Ensure production mode
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
      // Use Object.defineProperty to ensure the property is set correctly in Jest
      Object.defineProperty(process.env, 'EXPO_PUBLIC_USE_SUPABASE_EMULATOR', {
        value: 'true',
        writable: true,
        enumerable: true,
        configurable: true
      });
      // When in emulator mode, service provides default anon key
      
      initSupabase();
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        "http://10.0.2.2:54321",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        expect.any(Object)
      );
    });

    test("uses production mode when emulator flag is false", () => {
      setNodeEnv("production"); // Explicitly set production mode
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