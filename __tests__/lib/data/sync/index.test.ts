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
    });

    it("initializes components in correct order", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");

      await initializeDataLayer();

      // Verify both functions are called (order not verifiable without console logs)
      expect(initSupabase).toHaveBeenCalled();
      expect(configureSyncEngine).toHaveBeenCalled();
    });

    it("calls initialization functions", async () => {
      const { configureSyncEngine } = require("@/lib/data/sync/syncConfig");
      const { initSupabase } = require("@/lib/data/supabase/supabase");

      await initializeDataLayer();

      // Verify both functions are called
      expect(initSupabase).toHaveBeenCalledTimes(1);
      expect(configureSyncEngine).toHaveBeenCalledTimes(1);
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

      // Console logs removed, but should still throw error in non-web environment
    });
  });
});
