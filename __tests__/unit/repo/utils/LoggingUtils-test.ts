/**
 * Repository Logging Utils Tests
 */

describe("RepositoryLogger", () => {
  let RepositoryLogger: any;
  let mockLogger: { info: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    jest.resetModules();
    
    // Create fresh mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    // Mock the Logger before requiring the module
    jest.doMock("../../../../lib/data/supabase/supabase/logger", () => ({
      Logger: jest.fn().mockImplementation(() => mockLogger),
    }));

    // Import the module after mocking
    const module = require("../../../../lib/repo/utils/LoggingUtils");
    RepositoryLogger = module.RepositoryLogger;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("logSuccess", () => {
    it("should log successful operation with basic context", () => {
      RepositoryLogger.logSuccess("ExerciseService", "createExercise");

      expect(mockLogger.info).toHaveBeenCalledWith(
        "createExercise completed successfully",
        {
          service: "ExerciseService",
          platform: "mobile",
          operation: "createExercise",
        }
      );
    });

    it("should log successful operation with additional context", () => {
      const additionalContext = { exerciseId: "123", userId: "456" };
      
      RepositoryLogger.logSuccess(
        "ExerciseService", 
        "updateExercise",
        additionalContext
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "updateExercise completed successfully",
        {
          service: "ExerciseService",
          platform: "mobile",
          operation: "updateExercise",
          exerciseId: "123",
          userId: "456",
        }
      );
    });
  });

  describe("logError", () => {
    it("should log error with basic context", () => {
      const error = new Error("Test error message");
      error.stack = "Test stack trace";

      RepositoryLogger.logError("ExerciseService", "deleteExercise", error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to deleteExercise",
        {
          service: "ExerciseService",
          platform: "mobile",
          operation: "deleteExercise",
          error: {
            message: "Test error message",
            stack: "Test stack trace",
          },
        }
      );
    });

    it("should log error with additional context", () => {
      const error = new Error("Network error");
      const additionalContext = { exerciseId: "789", retryCount: 3 };

      RepositoryLogger.logError(
        "ExerciseService",
        "fetchExercises",
        error,
        additionalContext
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to fetchExercises",
        {
          service: "ExerciseService",
          platform: "mobile",
          operation: "fetchExercises",
          error: {
            message: "Network error",
            stack: error.stack,
          },
          exerciseId: "789",
          retryCount: 3,
        }
      );
    });

    it("should handle error without stack trace", () => {
      const error = new Error("Simple error");
      delete error.stack;

      RepositoryLogger.logError("TestService", "testOperation", error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to testOperation",
        {
          service: "TestService",
          platform: "mobile",
          operation: "testOperation",
          error: {
            message: "Simple error",
            stack: undefined,
          },
        }
      );
    });
  });
});