/**
 * @jest-environment jsdom
 */

import { createReactNativeErrorHandler } from "@/lib/utils/logging/ReactNativeErrorHandler";

// Mock the SimpleErrorLogger
jest.mock("@/lib/utils/logging/SimpleErrorLogger", () => ({
  createSimpleErrorLogger: jest.fn(() => ({
    logAndBlock: jest.fn(),
  })),
}));

describe("ReactNativeErrorHandler", () => {
  let handler: any;
  let mockErrorLogger: any;

  beforeEach(() => {
    const { createSimpleErrorLogger } = require("@/lib/utils/logging/SimpleErrorLogger");
    mockErrorLogger = createSimpleErrorLogger.mock.results[0].value;
    handler = createReactNativeErrorHandler();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any global modifications
    delete (globalThis as any).global;
  });

  describe("handleUncaughtError", () => {
    it("should log and block fatal errors", () => {
      const error = new Error("Fatal error");
      
      handler.handleUncaughtError(error, true);

      expect(mockErrorLogger.logAndBlock).toHaveBeenCalledWith(
        error,
        "react-native-fatal"
      );
    });

    it("should log and block non-fatal errors", () => {
      const error = new Error("Non-fatal error");
      
      handler.handleUncaughtError(error, false);

      expect(mockErrorLogger.logAndBlock).toHaveBeenCalledWith(
        error,
        "react-native-non-fatal"
      );
    });

    it("should call original handler if it exists", () => {
      const originalHandler = jest.fn();
      handler.originalHandler = originalHandler;
      const error = new Error("Test error");

      handler.handleUncaughtError(error, true);

      expect(originalHandler).toHaveBeenCalledWith(error, true);
    });

    it("should handle errors in error handling gracefully", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockErrorLogger.logAndBlock.mockImplementationOnce(() => {
        throw new Error("Handling error");
      });
      
      const error = new Error("Original error");

      expect(() => {
        handler.handleUncaughtError(error, true);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] Error while handling error:",
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] Original error:",
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe("setupGlobalErrorHandling", () => {
    it("should handle missing ErrorUtils gracefully", () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // No ErrorUtils available
      delete (globalThis as any).global;

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] ErrorUtils not available (likely web environment)"
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid ErrorUtils gracefully", () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Invalid ErrorUtils
      (globalThis as any).global = {
        ErrorUtils: null
      };

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] ErrorUtils is not a valid object"
      );

      consoleSpy.mockRestore();
    });

    it("should setup error handlers when ErrorUtils is available", () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        }
      };

      handler.setupGlobalErrorHandling();

      expect(mockGetGlobalHandler).toHaveBeenCalled();
      expect(mockSetGlobalHandler).toHaveBeenCalledWith(expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ React Native error handlers setup complete"
      );

      consoleSpy.mockRestore();
    });

    it("should handle getGlobalHandler errors", () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockImplementation(() => {
        throw new Error("Get handler error");
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        }
      };

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] Failed to get original handler:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle setGlobalHandler errors", () => {
      const mockSetGlobalHandler = jest.fn().mockImplementation(() => {
        throw new Error("Set handler error");
      });
      const mockGetGlobalHandler = jest.fn().mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        }
      };

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Node error handler setup failed:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should warn when setGlobalHandler is not available", () => {
      const mockGetGlobalHandler = jest.fn().mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      (globalThis as any).global = {
        ErrorUtils: {
          getGlobalHandler: mockGetGlobalHandler,
          // No setGlobalHandler
        }
      };

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] setGlobalHandler is not available"
      );

      consoleSpy.mockRestore();
    });

    it("should handle setup errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Make global access throw
      Object.defineProperty(globalThis, 'global', {
        get: () => {
          throw new Error("Global access error");
        },
        configurable: true
      });

      handler.setupGlobalErrorHandling();

      expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Global error handler setup failed:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      delete (globalThis as any).global;
    });
  });

  describe("cleanup", () => {
    it("should restore original handler when available", () => {
      const originalHandler = jest.fn();
      const mockSetGlobalHandler = jest.fn();
      
      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
        }
      };

      handler.originalHandler = originalHandler;
      handler.cleanup();

      expect(mockSetGlobalHandler).toHaveBeenCalledWith(originalHandler);
      expect(handler.originalHandler).toBeNull();
    });

    it("should set handler to null when no original handler", () => {
      const mockSetGlobalHandler = jest.fn();
      
      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
        }
      };

      handler.originalHandler = null;
      handler.cleanup();

      expect(mockSetGlobalHandler).toHaveBeenCalledWith(null);
    });

    it("should handle cleanup errors gracefully", () => {
      const mockSetGlobalHandler = jest.fn().mockImplementation(() => {
        throw new Error("Cleanup error");
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (globalThis as any).global = {
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
        }
      };

      handler.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] Failed to restore handler:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid ErrorUtils during cleanup", () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (globalThis as any).global = {
        ErrorUtils: null
      };

      handler.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] ErrorUtils not available for cleanup"
      );

      consoleSpy.mockRestore();
    });

    it("should handle missing ErrorUtils during cleanup", () => {
      delete (globalThis as any).global;

      // Should not throw
      expect(() => {
        handler.cleanup();
      }).not.toThrow();
    });

    it("should handle general cleanup failures", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Make global access throw during cleanup
      Object.defineProperty(globalThis, 'global', {
        get: () => {
          throw new Error("Global cleanup error");
        },
        configurable: true
      });

      handler.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ReactNativeErrorHandler] Failed to cleanup error handlers:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      delete (globalThis as any).global;
    });
  });
});