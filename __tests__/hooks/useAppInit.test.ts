import { renderHook, waitFor } from "@testing-library/react-native";
import { useAppInit } from "@/lib/hooks/useAppInit";
import { SplashScreen } from "expo-router";
import { initializeDataLayer } from "@/lib/data/sync";

// Mock dependencies
jest.mock("expo-router", () => ({
  SplashScreen: {
    hideAsync: jest.fn(),
  },
}));

jest.mock("@expo-google-fonts/jetbrains-mono", () => ({
  JetBrainsMono_400Regular: "JetBrainsMono_400Regular",
}));

jest.mock("@expo-google-fonts/noto-sans", () => ({
  NotoSans_400Regular: "NotoSans_400Regular",
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: {
    font: {
      MaterialCommunityIcons: "MaterialCommunityIcons",
    },
  },
}));

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("@/lib/data/sync", () => ({
  initializeDataLayer: jest.fn(),
}));

jest.mock("@/lib/data/supabase/supabase/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe("useAppInit", () => {
  let mockUseFonts: jest.Mock;
  let mockInitializeDataLayer: jest.Mock;
  let mockSplashScreenHideAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFonts = require("expo-font").useFonts as jest.Mock;
    mockInitializeDataLayer = initializeDataLayer as jest.Mock;
    mockSplashScreenHideAsync = SplashScreen.hideAsync as jest.Mock;

    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // Default successful behavior
    mockUseFonts.mockReturnValue([true, null]); // fonts loaded, no error
    mockInitializeDataLayer.mockResolvedValue(undefined);
    mockSplashScreenHideAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization Flow", () => {
    it("should return false initially while loading", () => {
      mockUseFonts.mockReturnValue([false, null]); // fonts not loaded yet

      const { result } = renderHook(() => useAppInit());

      expect(result.current.loaded).toBe(false);
    });

    it("should return true when fonts loaded and app is ready", async () => {
      mockUseFonts.mockReturnValue([true, null]); // fonts loaded
      mockInitializeDataLayer.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(mockInitializeDataLayer).toHaveBeenCalled();
      expect(mockSplashScreenHideAsync).toHaveBeenCalled();
    });

    it("should hide splash screen when fully ready", async () => {
      mockUseFonts.mockReturnValue([true, null]);
      mockInitializeDataLayer.mockResolvedValue(undefined);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockSplashScreenHideAsync).toHaveBeenCalled();
      });
    });

    it("should initialize data layer", async () => {
      mockUseFonts.mockReturnValue([true, null]);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockInitializeDataLayer).toHaveBeenCalled();
      });
    });
  });

  describe("Font Loading", () => {
    it("should wait for fonts to load", async () => {
      mockUseFonts.mockReturnValue([false, null]); // fonts not loaded

      const { result, rerender } = renderHook(() => useAppInit());

      expect(result.current.loaded).toBe(false);

      // Simulate fonts loading
      mockUseFonts.mockReturnValue([true, null]);
      rerender();

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
    });

    it("should throw error if font loading fails", () => {
      const fontError = new Error("Font loading failed");
      mockUseFonts.mockReturnValue([false, fontError]);

      expect(() => renderHook(() => useAppInit())).toThrow(
        "Font loading failed",
      );
    });

    it("should call useFonts with correct font configuration", () => {
      renderHook(() => useAppInit());

      expect(mockUseFonts).toHaveBeenCalledWith({
        NotoSans_400Regular: "NotoSans_400Regular",
        JetBrainsMono_400Regular: "JetBrainsMono_400Regular",
        MaterialCommunityIcons: "MaterialCommunityIcons",
      });
    });
  });

  describe("Data Layer Initialization", () => {
    it("should handle data layer initialization success", async () => {
      mockInitializeDataLayer.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(mockInitializeDataLayer).toHaveBeenCalled();
    });

    it("should handle data layer initialization failure", async () => {
      // Mock non-web environment (no window object)
      const originalWindow = global.window;
      delete (global as any).window;

      const error = new Error("Data layer init failed");
      mockInitializeDataLayer.mockRejectedValue(error);

      const { result } = renderHook(() => useAppInit());

      // Should still return true and continue, even if data layer fails
      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(mockInitializeDataLayer).toHaveBeenCalled();

      // Restore window object
      global.window = originalWindow;
    });

    it("should continue with degraded functionality on data layer error", async () => {
      // Mock non-web environment (no window object)
      const originalWindow = global.window;
      delete (global as any).window;

      const error = new Error("Initialization failed");
      mockInitializeDataLayer.mockRejectedValue(error);

      const { result } = renderHook(() => useAppInit());

      // App should still be ready even if data layer fails
      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Restore window object
      global.window = originalWindow;
    });
  });

  describe("Web Environment Error Handling", () => {
    let originalWindow: any;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it("should create error indicator in web environment", async () => {
      // Mock web environment
      const mockDocument = {
        createElement: jest.fn(),
        body: {
          appendChild: jest.fn(),
        },
      };

      const mockErrorDiv = {
        style: {},
        innerHTML: "",
      };

      mockDocument.createElement.mockReturnValue(mockErrorDiv);
      global.window = {} as any;
      global.document = mockDocument as any;

      const error = new Error("Test error");
      mockInitializeDataLayer.mockRejectedValue(error);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockDocument.createElement).toHaveBeenCalledWith("div");
        expect(mockDocument.body.appendChild).toHaveBeenCalledWith(
          mockErrorDiv,
        );
        expect(mockErrorDiv.innerHTML).toContain(
          "🚨 STARTUP ERROR: Test error",
        );
      });
    });

    it("should set error div styles correctly", async () => {
      const mockDocument = {
        createElement: jest.fn(),
        body: {
          appendChild: jest.fn(),
        },
      };

      const mockErrorDiv = {
        style: {} as any,
        innerHTML: "",
      };

      mockDocument.createElement.mockReturnValue(mockErrorDiv);
      global.window = {} as any;
      global.document = mockDocument as any;

      const error = new Error("Test error");
      mockInitializeDataLayer.mockRejectedValue(error);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockErrorDiv.style.cssText).toContain("position: fixed");
        expect(mockErrorDiv.style.cssText).toContain("background: #ff4444");
        expect(mockErrorDiv.style.cssText).toContain("z-index: 9999");
      });
    });

    it("should handle non-web environment errors gracefully", async () => {
      // Ensure no window object
      global.window = undefined as any;

      const error = new Error("Non-web error");
      mockInitializeDataLayer.mockRejectedValue(error);

      const { result } = renderHook(() => useAppInit());

      // Should still complete initialization
      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
    });
  });

  describe("Error Types", () => {
    it("should handle string error messages", async () => {
      mockInitializeDataLayer.mockRejectedValue("String error");

      const { result } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
    });

    it("should handle Error objects", async () => {
      const error = new Error("Error object");
      mockInitializeDataLayer.mockRejectedValue(error);

      const { result } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
    });

    it("should handle unknown error types", async () => {
      const error = { unknown: "error type" };
      mockInitializeDataLayer.mockRejectedValue(error);

      const { result } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
    });
  });

  describe("Logger Integration", () => {
    it("should create logger with correct service name", () => {
      const LoggerMock = require("@/lib/data/supabase/supabase/logger").Logger;

      renderHook(() => useAppInit());

      expect(LoggerMock).toHaveBeenCalledWith("AppInit");
    });

    it("should log initialization steps", async () => {
      const { Logger } = require("@/lib/data/supabase/supabase/logger");
      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      };
      Logger.mockImplementation(() => mockLogger);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          "Starting app initialization",
          expect.any(Object),
        );
      });
    });

    it("should log errors with proper context", async () => {
      const { Logger } = require("@/lib/data/supabase/supabase/logger");
      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      };
      Logger.mockImplementation(() => mockLogger);

      const error = new Error("Test error");
      mockInitializeDataLayer.mockRejectedValue(error);

      renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          "App initialization error",
          expect.objectContaining({
            service: "App Init",
            platform: "React Native",
            operation: "init",
            error: expect.objectContaining({
              message: "Test error",
            }),
          }),
        );
      });
    });
  });

  describe("Multiple Renders", () => {
    it("should handle multiple renders without side effects", async () => {
      const { rerender } = renderHook(() => useAppInit());

      rerender();
      rerender();

      await waitFor(() => {
        expect(mockInitializeDataLayer).toHaveBeenCalledTimes(1);
      });
    });

    it("should not hide splash screen multiple times", async () => {
      const { rerender } = renderHook(() => useAppInit());

      await waitFor(() => {
        expect(mockSplashScreenHideAsync).toHaveBeenCalled();
      });

      rerender();

      // Should not be called again
      expect(mockSplashScreenHideAsync).toHaveBeenCalledTimes(1);
    });
  });
});
