import { Logger } from "@/lib/data/supabase/supabase/logger";

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  test("creates logger with service name", () => {
    const logger = new Logger("TestService");
    expect(logger).toBeInstanceOf(Logger);
  });

  test("logs info messages with service prefix", () => {
    const logger = new Logger("TestService");
    const message = "Test info message";
    
    logger.info(message);
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "[TestService] Test info message",
      undefined
    );
  });

  test("logs info messages with context", () => {
    const logger = new Logger("TestService");
    const message = "Test info message";
    const context = { operation: "test", duration: 123 };
    
    logger.info(message, context);
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "[TestService] Test info message",
      context
    );
  });

  test("logs warning messages", () => {
    const logger = new Logger("TestService");
    const message = "Test warning message";
    const context = { operation: "test" };
    
    logger.warn(message, context);
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "[TestService] Test warning message",
      context
    );
  });

  test("logs error messages", () => {
    const logger = new Logger("TestService");
    const message = "Test error message";
    const context = { 
      error: { 
        message: "Something went wrong", 
        code: "ERR_TEST" 
      } 
    };
    
    logger.error(message, context);
    
    expect(mockConsoleError).toHaveBeenCalledWith(
      "[TestService] Test error message",
      context
    );
  });

  test("handles undefined context gracefully", () => {
    const logger = new Logger("TestService");
    
    logger.info("Info without context");
    logger.warn("Warning without context");
    logger.error("Error without context");
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "[TestService] Info without context",
      undefined
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "[TestService] Warning without context",
      undefined
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      "[TestService] Error without context",
      undefined
    );
  });

  test("formats different service names correctly", () => {
    const webLogger = new Logger("SupabaseWebService");
    const nativeLogger = new Logger("SupabaseNativeService");
    
    webLogger.info("Web message");
    nativeLogger.info("Native message");
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "[SupabaseWebService] Web message",
      undefined
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "[SupabaseNativeService] Native message",
      undefined
    );
  });
});