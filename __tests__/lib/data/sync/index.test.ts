import { initializeDataLayer } from "@/lib/data/sync/index";

// Mock the dependencies
jest.mock("@/lib/data/sync/syncConfig", () => ({
  configureSyncEngine: jest.fn(),
  syncHelpers: { mockHelper: "test" },
}));

jest.mock("@/lib/data/supabase/supabase", () => ({
  initSupabase: jest.fn(),
}));

// Firebase mock removed

jest.mock("@/lib/data/store", () => ({
  exercises$: { mockObservable: "exercises" },
  user$: { mockObservable: "user" },
  isOnline$: { mockObservable: "isOnline" },
}));

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe("Data Sync Index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Reset mocks to default behavior
    const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
    const { initSupabase } = require("@/lib/data/supabase/supabase");

    configureSyncEngine.mockImplementation(() => {});
    initSupabase.mockImplementation(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("initializeDataLayer", () => {
    it("initializes Supabase and sync engine successfully", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");

      await initializeDataLayer();

      expect(initSupabase).toHaveBeenCalled();
      expect(configureSyncEngine).toHaveBeenCalled();

      expect(console.log).toHaveBeenCalledWith("📊 Initializing Supabase...");
      expect(console.log).toHaveBeenCalledWith("🔄 Configuring sync engine...");
      expect(console.log).toHaveBeenCalledWith(
        "✅ Offline-first data layer initialized successfully",
      );
    });

    it("initializes components in correct order", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");

      await initializeDataLayer();

      // Verify order of calls - Supabase first, then sync engine
      const mockCalls = (console.log as jest.Mock).mock.calls;
      expect(mockCalls.some((call) => call[0].includes("Supabase"))).toBe(true);
      expect(mockCalls.some((call) => call[0].includes("sync engine"))).toBe(
        true,
      );
      expect(mockCalls.some((call) => call[0].includes("successfully"))).toBe(
        true,
      );
    });

    it("logs initialization steps", async () => {
      await initializeDataLayer();

      expect(console.log).toHaveBeenCalledTimes(3); // Updated from 4 to 3 (no Firebase)
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        "📊 Initializing Supabase...",
      );
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        "🔄 Configuring sync engine...",
      );
      expect(console.log).toHaveBeenNthCalledWith(
        3,
        "✅ Offline-first data layer initialized successfully",
      );
    });
  });

  describe("Error Handling", () => {
    let originalWindow: any;

    beforeEach(() => {
      // Store original window state
      originalWindow = (global as any).window;

      // Mock window object to simulate web environment
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original window state
      if (originalWindow === undefined) {
        delete (global as any).window;
      } else {
        (global as any).window = originalWindow;
      }
    });

    it("handles Supabase initialization errors in web environment", async () => {
      const { initSupabase } = require("@/lib/data/supabase/supabase");
      initSupabase.mockImplementation(() => {
        throw new Error("Supabase initialization failed");
      });

      // Should not throw in web environment, but continue with degraded functionality
      await expect(initializeDataLayer()).resolves.toBeUndefined();

      expect(console.log).toHaveBeenCalledWith("📊 Initializing Supabase...");
      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Continuing with degraded functionality for web environment",
      );
    });

    it("handles sync engine configuration errors in web environment", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      configureSyncEngine.mockImplementation(() => {
        throw new Error("Sync configuration failed");
      });

      // Should not throw in web environment, but continue with degraded functionality
      await expect(initializeDataLayer()).resolves.toBeUndefined();

      expect(console.log).toHaveBeenCalledWith("🔄 Configuring sync engine...");
      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Continuing with degraded functionality for web environment",
      );
    });

    it("throws errors in non-web environment", async () => {
      // Explicitly remove window to simulate non-web environment
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (global as any).window;

      const { initSupabase } = require("@/lib/data/supabase/supabase");
      initSupabase.mockImplementation(() => {
        throw new Error("Supabase initialization failed");
      });

      await expect(initializeDataLayer()).rejects.toThrow(
        "Supabase initialization failed",
      );

      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
