import { initializeDataLayer } from "@/lib/data/sync/index";

// Mock the dependencies
jest.mock("@/lib/data/sync/syncConfig", () => ({
  configureSyncEngine: jest.fn(),
  syncHelpers: { mockHelper: "test" },
}));

jest.mock("@/lib/data/supabase/supabase", () => ({
  initSupabase: jest.fn(),
}));

jest.mock("@/lib/data/firebase", () => ({
  initFirebase: jest.fn(),
}));

jest.mock("@/lib/data/store", () => ({
  exercises$: { mockObservable: "exercises" },
  user$: { mockObservable: "user" },
  isOnline$: { mockObservable: "isOnline" },
}));

// Mock console methods
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
    const { initFirebase } = require("@/lib/data/firebase");

    configureSyncEngine.mockImplementation(() => {});
    initSupabase.mockImplementation(() => {});
    initFirebase.mockImplementation(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("initializeDataLayer", () => {
    it("initializes all components successfully", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");
      const { initFirebase } = require("@/lib/data/firebase");

      await initializeDataLayer();

      expect(initFirebase).toHaveBeenCalled();
      expect(initSupabase).toHaveBeenCalled();
      expect(configureSyncEngine).toHaveBeenCalled();

      expect(console.log).toHaveBeenCalledWith("🔥 Initializing Firebase...");
      expect(console.log).toHaveBeenCalledWith("📊 Initializing Supabase...");
      expect(console.log).toHaveBeenCalledWith("🔄 Configuring sync engine...");
      expect(console.log).toHaveBeenCalledWith(
        "✅ Offline-first data layer initialized successfully",
      );
    });

    it("initializes components in correct order", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");
      const { initFirebase } = require("@/lib/data/firebase");

      await initializeDataLayer();

      // Verify order of calls
      const initFirebaseCallOrder = initFirebase.mock.invocationCallOrder[0];
      const initSupabaseCallOrder = initSupabase.mock.invocationCallOrder[0];
      const configureSyncEngineCallOrder =
        configureSyncEngine.mock.invocationCallOrder[0];

      expect(initFirebaseCallOrder).toBeLessThan(initSupabaseCallOrder);
      expect(initSupabaseCallOrder).toBeLessThan(configureSyncEngineCallOrder);
    });

    it("logs initialization steps", async () => {
      await initializeDataLayer();

      expect(console.log).toHaveBeenCalledTimes(4);
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        "🔥 Initializing Firebase...",
      );
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        "📊 Initializing Supabase...",
      );
      expect(console.log).toHaveBeenNthCalledWith(
        3,
        "🔄 Configuring sync engine...",
      );
      expect(console.log).toHaveBeenNthCalledWith(
        4,
        "✅ Offline-first data layer initialized successfully",
      );
    });
  });

  describe("Error Handling", () => {
    it("handles Firebase initialization errors in non-web environment", async () => {
      // Ensure non-web environment
      delete (global as any).window;

      const { initFirebase } = require("@/lib/data/firebase");
      initFirebase.mockImplementation(() => {
        throw new Error("Firebase initialization failed");
      });

      await expect(initializeDataLayer()).rejects.toThrow(
        "Firebase initialization failed",
      );
      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
    });

    it("handles Supabase initialization errors in non-web environment", async () => {
      // Ensure non-web environment
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
    });

    it("handles sync engine configuration errors in non-web environment", async () => {
      // Ensure non-web environment
      delete (global as any).window;

      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      configureSyncEngine.mockImplementation(() => {
        throw new Error("Sync engine configuration failed");
      });

      await expect(initializeDataLayer()).rejects.toThrow(
        "Sync engine configuration failed",
      );
      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
    });

    it("continues with degraded functionality in web environment", async () => {
      // Mock window object to simulate web environment
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
      });

      const { initFirebase } = require("@/lib/data/firebase");
      initFirebase.mockImplementation(() => {
        throw new Error("Firebase initialization failed");
      });

      // Should not throw error in web environment
      await expect(initializeDataLayer()).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        "❌ Failed to initialize data layer:",
        expect.any(Error),
      );
      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Continuing with degraded functionality for web environment",
      );

      // Clean up
      delete (global as any).window;
    });

    // Note: Non-web error throwing tests removed as the component correctly
    // handles web environments with degraded functionality
  });

  describe("Module Exports", () => {
    it("exports syncHelpers from syncConfig", () => {
      const { syncHelpers } = require("@/lib/data/sync/index");
      expect(syncHelpers).toEqual({ mockHelper: "test" });
    });

    it("exports store observables", () => {
      const { exercises$, user$, isOnline$ } = require("@/lib/data/sync/index");

      expect(exercises$).toEqual({ mockObservable: "exercises" });
      expect(user$).toEqual({ mockObservable: "user" });
      expect(isOnline$).toEqual({ mockObservable: "isOnline" });
    });

    it("exports initializeDataLayer function", () => {
      const moduleExports = require("@/lib/data/sync/index");
      expect(typeof moduleExports.initializeDataLayer).toBe("function");
    });
  });

  describe("Integration Tests", () => {
    it("validates all dependencies are called with correct parameters", async () => {
      const { initSupabase } = require("@/lib/data/supabase/supabase");
      const { initFirebase } = require("@/lib/data/firebase");
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");

      await initializeDataLayer();

      // Verify functions are called without parameters
      expect(initFirebase).toHaveBeenCalledWith();
      expect(initSupabase).toHaveBeenCalledWith();
      expect(configureSyncEngine).toHaveBeenCalledWith();
    });

    it("completes initialization within reasonable time", async () => {
      const startTime = Date.now();
      await initializeDataLayer();
      const endTime = Date.now();

      // Should complete quickly in test environment
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Environment Detection", () => {
    it("correctly detects web environment", async () => {
      Object.defineProperty(global, "window", {
        value: { location: { href: "http://localhost" } },
        writable: true,
      });

      const { initFirebase } = require("@/lib/data/firebase");
      initFirebase.mockImplementation(() => {
        throw new Error("Test error");
      });

      await initializeDataLayer();

      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Continuing with degraded functionality for web environment",
      );

      // Clean up
      delete (global as any).window;
    });
  });

  describe("Async Behavior", () => {
    it("handles async initialization properly", async () => {
      const { initSupabase } = require("@/lib/data/supabase/supabase");

      // Mock async behavior
      initSupabase.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const promise = initializeDataLayer();
      expect(promise).toBeInstanceOf(Promise);

      await promise;
      expect(initSupabase).toHaveBeenCalled();
    });
  });
});
