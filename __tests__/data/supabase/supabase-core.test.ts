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
  private mockNodeEnv?: string;
  private mockEmulatorFlag?: string;
  private mockEmulatorHost?: string;
  private mockEmulatorPort?: string;

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

  // Override for testing
  protected isEmulatorEnabled(): boolean {
    const nodeEnv = this.mockNodeEnv ?? process.env.NODE_ENV;
    const emulatorFlag =
      this.mockEmulatorFlag ?? process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR;
    return nodeEnv === "development" || emulatorFlag === "true";
  }

  protected getEmulatorHost(): string {
    return (
      this.mockEmulatorHost ??
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST ??
      "127.0.0.1"
    );
  }

  protected getEmulatorPort(): number {
    const port =
      this.mockEmulatorPort ??
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT ??
      "54321";
    return parseInt(port, 10);
  }

  // Test helper methods
  public setMockNodeEnv(value?: string): void {
    this.mockNodeEnv = value;
  }

  public setMockEmulatorFlag(value?: string): void {
    this.mockEmulatorFlag = value;
  }

  public setMockEmulatorHost(value?: string): void {
    this.mockEmulatorHost = value;
  }

  public setMockEmulatorPort(value?: string): void {
    this.mockEmulatorPort = value;
  }

  // Expose protected methods for testing
  public testAssertInitialized(operation: string): void {
    this.assertInitialized(operation);
  }

  public testIsEmulatorEnabled(): boolean {
    return this.isEmulatorEnabled();
  }

  public testGetEmulatorHost(): string {
    return this.getEmulatorHost();
  }

  public testGetEmulatorPort(): number {
    return this.getEmulatorPort();
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
    delete process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT;

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
      // Set up required environment variables
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

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
      // Set up required environment variables
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

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
      // Set up required environment variables
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

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

  describe("emulator configuration", () => {
    test("detects development environment", () => {
      service.setMockNodeEnv("development");
      expect(service.testIsEmulatorEnabled()).toBe(true);
    });

    test("detects emulator flag", () => {
      service.setMockNodeEnv("production"); // Ensure not development
      service.setMockEmulatorFlag("true");
      expect(service.testIsEmulatorEnabled()).toBe(true);
    });

    test("returns false for production", () => {
      service.setMockNodeEnv("production");
      service.setMockEmulatorFlag("false");
      expect(service.testIsEmulatorEnabled()).toBe(false);
    });

    test("uses default emulator host", () => {
      expect(service.testGetEmulatorHost()).toBe("127.0.0.1");
    });

    test("uses custom emulator host", () => {
      service.setMockEmulatorHost("10.0.2.2");
      expect(service.testGetEmulatorHost()).toBe("10.0.2.2");
    });

    test("uses default emulator port", () => {
      expect(service.testGetEmulatorPort()).toBe(54321);
    });

    test("uses custom emulator port", () => {
      service.setMockEmulatorPort("8000");
      expect(service.testGetEmulatorPort()).toBe(8000);
    });

    test("handles invalid port gracefully", () => {
      service.setMockEmulatorPort("invalid");
      expect(service.testGetEmulatorPort()).toBe(NaN);
    });
  });
});
