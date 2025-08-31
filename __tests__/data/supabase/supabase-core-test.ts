import { SupabaseService } from "@/lib/data/supabase/supabase/supabase-core";
import { Logger } from "@/lib/data/supabase/supabase/logger";

// Mock the Logger
jest.mock("@/lib/data/supabase/supabase/logger");

// Create a concrete test implementation of the abstract class
class TestSupabaseService extends SupabaseService {
  private client: any = null;

  constructor() {
    super("TestService");
  }

  init(): void {
    this.initialized = true;
    this.client = { mock: "client" };
  }

  getSupabaseClient(): any {
    return this.client;
  }

  isReady(): boolean {
    return this.initialized && this.client !== null;
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

  public testLogError(message: string, context?: Record<string, unknown>): void {
    this.logError(message, context);
  }
}

describe("SupabaseService", () => {
  let service: TestSupabaseService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock logger instance
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;
    
    // Mock the Logger constructor to return our mock
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);
    
    service = new TestSupabaseService();
  });

  afterEach(() => {
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST;
    delete process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT;
  });

  describe("initialization", () => {
    test("creates service with logger", () => {
      expect(Logger).toHaveBeenCalledWith("TestService");
    });

    test("starts uninitialized", () => {
      expect(service.isReady()).toBe(false);
    });

    test("becomes ready after initialization", () => {
      service.init();
      expect(service.isReady()).toBe(true);
    });

    test("returns client after initialization", () => {
      service.init();
      expect(service.getSupabaseClient()).toEqual({ mock: "client" });
    });
  });

  describe("assertInitialized", () => {
    test("throws error when not initialized", () => {
      expect(() => service.testAssertInitialized("test operation")).toThrow(
        "Supabase service not initialized. Call init() before test operation"
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Supabase service not initialized. Call init() before test operation",
        undefined
      );
    });

    test("does not throw when initialized", () => {
      service.init();
      expect(() => service.testAssertInitialized("test operation")).not.toThrow();
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
      process.env.NODE_ENV = "development";
      expect(service.testIsEmulatorEnabled()).toBe(true);
    });

    test("detects emulator flag", () => {
      process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = "true";
      expect(service.testIsEmulatorEnabled()).toBe(true);
    });

    test("returns false for production", () => {
      process.env.NODE_ENV = "production";
      expect(service.testIsEmulatorEnabled()).toBe(false);
    });

    test("uses default emulator host", () => {
      expect(service.testGetEmulatorHost()).toBe("127.0.0.1");
    });

    test("uses custom emulator host", () => {
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST = "10.0.2.2";
      expect(service.testGetEmulatorHost()).toBe("10.0.2.2");
    });

    test("uses default emulator port", () => {
      expect(service.testGetEmulatorPort()).toBe(54321);
    });

    test("uses custom emulator port", () => {
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT = "8000";
      expect(service.testGetEmulatorPort()).toBe(8000);
    });

    test("handles invalid port gracefully", () => {
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT = "invalid";
      expect(service.testGetEmulatorPort()).toBe(NaN);
    });
  });
});