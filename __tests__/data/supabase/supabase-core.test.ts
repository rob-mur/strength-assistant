import { SupabaseService } from "@/lib/data/supabase/supabase/supabase-core";
import { Logger } from "@/lib/data/supabase/supabase/logger";

// Mock Supabase JS
jest.mock(
  "@supabase/supabase-js",
  () => ({
    createClient: jest.fn(),
  }),
  { virtual: true },
);

// Mock the Logger
jest.mock("@/lib/data/supabase/supabase/logger");

// Store original environment
const originalEnv = process.env;

// Create a concrete test implementation of the abstract class
class TestSupabaseService extends SupabaseService {
  constructor() {
    super("TestService");
  }

  protected getInitMessage(): string {
    return "Initializing test service...";
  }

  protected getClientConfig(): { detectSessionInUrl: boolean } {
    return { detectSessionInUrl: false };
  }

  isReady(): boolean {
    return this.initialized && this.client !== null;
  }

  // Expose protected methods for testing
  public testAssertInitialized(operation: string): void {
    this.assertInitialized(operation);
  }

  public testLogInfo(message: string, context?: Record<string, unknown>): void {
    this.logInfo(message, context);
  }

  public testLogWarn(message: string, context?: Record<string, unknown>): void {
    this.logWarn(message, context);
  }

  public testLogError(
    message: string,
    context?: Record<string, unknown>,
  ): void {
    this.logError(message, context);
  }
}

describe("SupabaseService", () => {
  let service: TestSupabaseService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables to clean state - remove Supabase vars
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    // Create a mock logger instance
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Mock the Logger constructor to return our mock
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(
      () => mockLogger,
    );

    service = new TestSupabaseService();
  });

  afterEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  describe("initialization", () => {
    test("creates service with logger", () => {
      expect(Logger).toHaveBeenCalledWith("TestService");
    });

    test("starts uninitialized", () => {
      expect(service.isReady()).toBe(false);
    });

    test("becomes ready after initialization", () => {
      // Mock the getSupabaseUrl and getSupabaseAnonKey methods
      jest
        .spyOn(service as any, "getSupabaseUrl")
        .mockReturnValue("https://test.supabase.co");
      jest
        .spyOn(service as any, "getSupabaseAnonKey")
        .mockReturnValue("test-key");

      // Mock createSupabaseClient to set client
      (service as any).createSupabaseClient = jest
        .fn()
        .mockImplementation(() => {
          (service as any).client = { mock: "client" };
        });

      service.init();
      expect(service.isReady()).toBe(true);
    });

    test("returns client after initialization", () => {
      // Mock the getSupabaseUrl and getSupabaseAnonKey methods
      jest
        .spyOn(service as any, "getSupabaseUrl")
        .mockReturnValue("https://test.supabase.co");
      jest
        .spyOn(service as any, "getSupabaseAnonKey")
        .mockReturnValue("test-key");

      // Mock createSupabaseClient to set client
      (service as any).createSupabaseClient = jest
        .fn()
        .mockImplementation(() => {
          (service as any).client = { mock: "client" };
        });

      service.init();
      expect(service.getSupabaseClient()).toEqual({ mock: "client" });
    });
  });

  describe("assertInitialized", () => {
    test("throws error when not initialized", () => {
      expect(() => service.testAssertInitialized("test operation")).toThrow(
        "Supabase service not initialized. Call init() before test operation",
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Supabase service not initialized. Call init() before test operation",
        undefined,
      );
    });

    test("does not throw when initialized", () => {
      // Mock the getSupabaseUrl and getSupabaseAnonKey methods
      jest
        .spyOn(service as any, "getSupabaseUrl")
        .mockReturnValue("https://test.supabase.co");
      jest
        .spyOn(service as any, "getSupabaseAnonKey")
        .mockReturnValue("test-key");

      // Mock createSupabaseClient to avoid actual client creation
      (service as any).createSupabaseClient = jest
        .fn()
        .mockImplementation(() => {
          (service as any).client = { mock: "client" };
        });

      service.init();
      expect(() =>
        service.testAssertInitialized("test operation"),
      ).not.toThrow();
    });
  });

  describe("logging", () => {
    test("logs info messages", () => {
      const message = "Test info";
      const context = { test: true };

      service.testLogInfo(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, context);
    });

    test("logs warning messages", () => {
      const message = "Test warning";
      const context = { test: true };

      service.testLogWarn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, context);
    });

    test("logs error messages", () => {
      const message = "Test error";
      const context = { test: true };

      service.testLogError(message, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, context);
    });
  });
});
