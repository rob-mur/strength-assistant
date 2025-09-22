import { RepositoryLogger } from "@/lib/repo/utils/LoggingUtils";

// Mock console methods to test logging output
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("RepositoryLogger", () => {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Replace console methods with mocks
    console.log = mockConsole.log;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;

    // Set NODE_ENV to test to enable logging
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe("logSuccess", () => {
    it("should log success message with proper context", () => {
      const service = "TestService";
      const operation = "testOperation";
      const additionalContext = { userId: "123" };

      RepositoryLogger.logSuccess(service, operation, additionalContext);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Repository] testOperation completed successfully",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          userId: "123",
        },
      );
    });

    it("should log success message without additional context", () => {
      const service = "TestService";
      const operation = "testOperation";

      RepositoryLogger.logSuccess(service, operation);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Repository] testOperation completed successfully",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
        },
      );
    });
  });

  describe("logError", () => {
    it("should log error message with proper context", () => {
      const error = new Error("Test error");
      const service = "TestService";
      const operation = "testOperation";
      const additionalContext = { userId: "123" };

      RepositoryLogger.logError(service, operation, error, additionalContext);

      expect(mockConsole.error).toHaveBeenCalledWith(
        "[Repository] Failed to testOperation",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          error: { message: "Test error", stack: error.stack },
          userId: "123",
        },
      );
    });

    it("should log error message without additional context", () => {
      const error = new Error("Test error");
      const service = "TestService";
      const operation = "testOperation";

      RepositoryLogger.logError(service, operation, error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        "[Repository] Failed to testOperation",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          error: { message: "Test error", stack: error.stack },
        },
      );
    });
  });

  describe("production environment", () => {
    it("should not log in production environment", () => {
      process.env.NODE_ENV = "production";

      RepositoryLogger.logSuccess("TestService", "testOperation");
      RepositoryLogger.logError(
        "TestService",
        "testOperation",
        new Error("Test"),
      );

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});
