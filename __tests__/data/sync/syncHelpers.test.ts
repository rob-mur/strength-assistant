import { syncHelpers } from "@/lib/data/sync/syncConfig";

// Mock the SupabaseClient since syncHelpers uses it internally
jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
    getSupabaseClient: jest.fn(),
  },
}));

// Mock the store
jest.mock("@/lib/data/store", () => ({
  exercises$: {
    get: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  },
}));

describe("syncHelpers", () => {
  afterEach(() => {
    // Reset navigator mock after each test
    delete (global as any).navigator;
  });

  describe("isSyncing", () => {
    test("returns false by default", () => {
      expect(syncHelpers.isSyncing()).toBe(false);
    });
  });

  describe("isOnline", () => {
    test("returns true when navigator.onLine is true", () => {
      // Mock navigator.onLine
      (global as any).navigator = { onLine: true };

      expect(syncHelpers.isOnline()).toBe(true);
    });

    test("returns false when navigator.onLine is false", () => {
      (global as any).navigator = { onLine: false };

      expect(syncHelpers.isOnline()).toBe(false);
    });

    test("returns true when navigator is undefined", () => {
      // No navigator defined
      expect(syncHelpers.isOnline()).toBe(true);
    });

    test("returns true when navigator.onLine is undefined", () => {
      (global as any).navigator = {};

      expect(syncHelpers.isOnline()).toBe(true);
    });
  });

  describe("getPendingChangesCount", () => {
    test("returns 0 by default", () => {
      expect(syncHelpers.getPendingChangesCount()).toBe(0);
    });
  });

  describe("hasErrors", () => {
    test("returns false by default", () => {
      expect(syncHelpers.hasErrors()).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    test("returns undefined by default", () => {
      expect(syncHelpers.getErrorMessage()).toBeUndefined();
    });
  });

  describe("forceSync", () => {
    test("executes without throwing when user is not authenticated", async () => {
      const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
      supabaseClient.getCurrentUser.mockResolvedValue(null);

      await expect(syncHelpers.forceSync()).resolves.not.toThrow();
    });

    test("handles errors gracefully", async () => {
      const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      supabaseClient.getCurrentUser.mockRejectedValue(new Error("Auth failed"));

      await expect(syncHelpers.forceSync()).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to force sync:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});