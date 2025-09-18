import { RepositoryLogger } from "@/lib/repo/utils/LoggingUtils";
import { logger } from "@/lib/data/firebase/logger";

// Mock the logger
jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockLogger = logger as jest.Mocked<typeof logger>;

describe("RepositoryLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logSuccess", () => {
    it("should log success with proper context", () => {
      const service = "TestService";
      const operation = "testOperation";
      const additionalContext = { userId: "123" };

      RepositoryLogger.logSuccess(service, operation, additionalContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "testOperation completed successfully",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          userId: "123",
        }
      );
    });
  });

  describe("logError", () => {
    it("should log error with proper context", () => {
      const error = new Error("Test error");
      const service = "TestService";
      const operation = "testOperation";
      const additionalContext = { userId: "123" };

      RepositoryLogger.logError(service, operation, error, additionalContext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to testOperation",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          error: { message: "Test error", stack: error.stack },
          userId: "123",
        }
      );
    });
  });
});