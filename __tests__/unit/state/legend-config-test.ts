/**
 * Legend State Configuration Tests
 */

import {
  createExerciseStoreConfig,
  createUserStoreConfig,
  createSyncStateConfig,
  legendStateGlobalConfig,
} from "../../../lib/state/legend-config";

// Mock the supabase-env module
jest.mock("../../../lib/config/supabase-env", () => ({
  getSupabaseUrl: jest.fn(() => "https://test.supabase.co"),
  getSupabaseEnvConfig: jest.fn(() => ({
    anonKey: "test-anon-key",
  })),
  isSupabaseDataEnabled: jest.fn(() => true),
}));

describe("Legend State Configuration", () => {
  describe("createExerciseStoreConfig", () => {
    it("should create exercise store config with Supabase sync enabled", () => {
      const config = createExerciseStoreConfig();

      expect(config.local.name).toBe("exercises");
      expect(config.local.asyncStorage?.preload).toBe(true);
      expect(config.sync?.enabled).toBe(true);
      expect(config.sync?.supabase?.table).toBe("exercises");
      expect(config.sync?.supabase?.url).toBe("https://test.supabase.co");
      expect(config.sync?.supabase?.anonKey).toBe("test-anon-key");
      expect(config.sync?.supabase?.select).toBe("*");
      expect(config.sync?.supabase?.actions?.create).toBe("insert");
      expect(config.sync?.supabase?.actions?.update).toBe("update");
      expect(config.sync?.supabase?.actions?.delete).toBe("delete");
      expect(config.sync?.supabase?.realtime?.enabled).toBe(true);
      expect(config.sync?.supabase?.realtime?.schema).toBe("public");
      expect(config.sync?.retry?.infinite).toBe(false);
      expect(config.sync?.retry?.times).toBe(5);
      expect(config.sync?.retry?.delay).toBe(1000);
      expect(config.sync?.retry?.backoff).toBe("exponential");
      expect(config.sync?.conflictResolution).toBe("lastWriteWins");
    });

    it("should create exercise store config with sync disabled when Supabase is disabled", () => {
      const { isSupabaseDataEnabled } = require("../../../lib/config/supabase-env");
      isSupabaseDataEnabled.mockReturnValueOnce(false);

      const config = createExerciseStoreConfig();

      expect(config.local.name).toBe("exercises");
      expect(config.sync?.enabled).toBe(false);
    });
  });

  describe("createUserStoreConfig", () => {
    it("should create user store config with Supabase sync enabled", () => {
      const config = createUserStoreConfig();

      expect(config.local.name).toBe("user");
      expect(config.local.asyncStorage?.preload).toBe(true);
      expect(config.sync?.enabled).toBe(true);
      expect(config.sync?.supabase?.table).toBe("user_profiles");
      expect(config.sync?.supabase?.url).toBe("https://test.supabase.co");
      expect(config.sync?.supabase?.anonKey).toBe("test-anon-key");
      expect(config.sync?.retry?.times).toBe(3);
      expect(config.sync?.retry?.delay).toBe(2000);
      expect(config.sync?.conflictResolution).toBe("lastWriteWins");
    });

    it("should create user store config with sync disabled when Supabase is disabled", () => {
      const { isSupabaseDataEnabled } = require("../../../lib/config/supabase-env");
      isSupabaseDataEnabled.mockReturnValueOnce(false);

      const config = createUserStoreConfig();

      expect(config.local.name).toBe("user");
      expect(config.sync?.enabled).toBe(false);
    });
  });

  describe("createSyncStateConfig", () => {
    it("should create sync state config with sync disabled", () => {
      const config = createSyncStateConfig();

      expect(config.local.name).toBe("syncState");
      expect(config.local.asyncStorage?.preload).toBe(true);
      expect(config.sync?.enabled).toBe(false);
    });
  });

  describe("legendStateGlobalConfig", () => {
    it("should have correct global configuration", () => {
      expect(typeof legendStateGlobalConfig.enableLogging).toBe("boolean");
      expect(legendStateGlobalConfig.optimizeUpdates).toBe(true);
      expect(typeof legendStateGlobalConfig.onSyncError).toBe("function");
      expect(typeof legendStateGlobalConfig.onConnectionChange).toBe("function");
    });

    it("should handle sync errors silently", () => {
      const mockError = new Error("Test sync error");
      expect(() => {
        legendStateGlobalConfig.onSyncError(mockError, "test_table");
      }).not.toThrow();
    });

    it("should handle connection changes silently", () => {
      expect(() => {
        legendStateGlobalConfig.onConnectionChange(true);
        legendStateGlobalConfig.onConnectionChange(false);
      }).not.toThrow();
    });
  });
});