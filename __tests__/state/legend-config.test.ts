/**
 * Legend State Configuration Tests - Comprehensive Coverage
 *
 * Essential test coverage for the legend-config module focusing on:
 * - Store configuration generation with environment handling
 * - Supabase sync configuration with feature flag switching
 * - Local persistence configuration patterns
 * - Error handling and logging callbacks
 * - Global configuration settings
 */

import {
  createExerciseStoreConfig,
  createUserStoreConfig,
  createSyncStateConfig,
  legendStateGlobalConfig,
  LegendStateSupabaseConfig,
} from "../../lib/state/legend-config";

// Mock dependencies
jest.mock("../../lib/config/supabase-env", () => ({
  getSupabaseUrl: jest.fn(),
  getSupabaseEnvConfig: jest.fn(),
  isSupabaseDataEnabled: jest.fn(),
}));

// Import mocked modules for type safety
import {
  getSupabaseUrl,
  getSupabaseEnvConfig,
  isSupabaseDataEnabled,
} from "../../lib/config/supabase-env";

describe("Legend State Configuration", () => {
  const originalConsole = console;
  const mockConsole = {
    error: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(console, mockConsole);

    // Set up default mock returns
    (getSupabaseUrl as jest.Mock).mockReturnValue("https://test.supabase.co");
    (getSupabaseEnvConfig as jest.Mock).mockReturnValue({
      anonKey: "test-anon-key-12345",
      url: "https://test.supabase.co",
    });
    (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  describe("createExerciseStoreConfig", () => {
    it("should create exercise store config with Supabase sync enabled", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const config = createExerciseStoreConfig();

      expect(config).toEqual({
        local: {
          name: "exercises",
          asyncStorage: {
            preload: true,
          },
        },
        sync: {
          enabled: true,
          supabase: {
            url: "https://test.supabase.co",
            anonKey: "test-anon-key-12345",
            table: "exercises",
            select: "*",
            actions: {
              create: "insert",
              update: "update",
              delete: "delete",
            },
            realtime: {
              enabled: true,
              schema: "public",
            },
          },
          retry: {
            infinite: false,
            times: 5,
            delay: 1000,
            backoff: "exponential",
          },
          conflictResolution: "lastWriteWins",
        },
      });

      expect(getSupabaseUrl).toHaveBeenCalled();
      expect(getSupabaseEnvConfig).toHaveBeenCalled();
      expect(isSupabaseDataEnabled).toHaveBeenCalled();
    });

    it("should create exercise store config with sync disabled when Supabase not enabled", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(false);

      const config = createExerciseStoreConfig();

      expect(config).toEqual({
        local: {
          name: "exercises",
          asyncStorage: {
            preload: true,
          },
        },
        sync: {
          enabled: false,
        },
      });

      expect(isSupabaseDataEnabled).toHaveBeenCalled();
    });

    it("should handle different Supabase environment configurations", () => {
      (getSupabaseUrl as jest.Mock).mockReturnValue("https://prod.supabase.co");
      (getSupabaseEnvConfig as jest.Mock).mockReturnValue({
        anonKey: "prod-anon-key-67890",
        url: "https://prod.supabase.co",
      });

      const config = createExerciseStoreConfig();

      expect(config.sync?.supabase?.url).toBe("https://prod.supabase.co");
      expect(config.sync?.supabase?.anonKey).toBe("prod-anon-key-67890");
    });
  });

  describe("createUserStoreConfig", () => {
    it("should create user store config with Supabase sync enabled", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const config = createUserStoreConfig();

      expect(config).toEqual({
        local: {
          name: "user",
          asyncStorage: {
            preload: true,
          },
        },
        sync: {
          enabled: true,
          supabase: {
            url: "https://test.supabase.co",
            anonKey: "test-anon-key-12345",
            table: "user_profiles",
            select: "*",
            realtime: {
              enabled: true,
              schema: "public",
            },
          },
          retry: {
            infinite: false,
            times: 3,
            delay: 2000,
            backoff: "exponential",
          },
          conflictResolution: "lastWriteWins",
        },
      });
    });

    it("should create user store config with sync disabled when Supabase not enabled", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(false);

      const config = createUserStoreConfig();

      expect(config).toEqual({
        local: {
          name: "user",
          asyncStorage: {
            preload: true,
          },
        },
        sync: {
          enabled: false,
        },
      });
    });

    it("should use different retry settings for user store", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const config = createUserStoreConfig();

      expect(config.sync?.retry).toEqual({
        infinite: false,
        times: 3,
        delay: 2000,
        backoff: "exponential",
      });
    });

    it("should configure user_profiles table correctly", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const config = createUserStoreConfig();

      expect(config.sync?.supabase?.table).toBe("user_profiles");
      expect(config.sync?.supabase?.actions).toBeUndefined(); // User store doesn't define custom actions
    });
  });

  describe("createSyncStateConfig", () => {
    it("should create sync state config with local-only storage", () => {
      const config = createSyncStateConfig();

      expect(config).toEqual({
        local: {
          name: "syncState",
          asyncStorage: {
            preload: true,
          },
        },
        sync: {
          enabled: false,
        },
      });
    });

    it("should always disable sync for sync state regardless of Supabase setting", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const config = createSyncStateConfig();

      expect(config.sync?.enabled).toBe(false);
    });
  });

  describe("LegendStateSupabaseConfig interface", () => {
    it("should support complete configuration structure", () => {
      const fullConfig: LegendStateSupabaseConfig = {
        local: {
          name: "test",
          indexedDB: {
            prefixID: "app",
            version: 1,
          },
          asyncStorage: {
            preload: false,
          },
        },
        sync: {
          enabled: true,
          supabase: {
            url: "https://example.supabase.co",
            anonKey: "test-key",
            table: "test_table",
            select: "id, name",
            actions: {
              create: "custom_insert",
              update: "custom_update",
              delete: "custom_delete",
            },
            realtime: {
              enabled: false,
              schema: "custom",
            },
          },
          retry: {
            infinite: true,
            delay: 500,
            times: 10,
            backoff: "constant",
          },
          conflictResolution: "manual",
        },
      };

      expect(fullConfig.local.name).toBe("test");
      expect(fullConfig.sync?.enabled).toBe(true);
      expect(fullConfig.sync?.conflictResolution).toBe("manual");
    });
  });

  describe("legendStateGlobalConfig", () => {
    describe("development environment", () => {
      beforeEach(() => {
        (global as any).__DEV__ = true;
      });

      afterEach(() => {
        (global as any).__DEV__ = false;
      });

      it("should enable logging in development", () => {
        expect(legendStateGlobalConfig.enableLogging).toBe(true);
      });

      it("should handle sync errors with detailed logging in development", () => {
        const testError = new Error("Test sync error");
        testError.stack = "Test error stack trace";

        legendStateGlobalConfig.onSyncError(testError, "exercises");

        expect(mockConsole.error).toHaveBeenCalledWith(
          "Legend State sync error for exercises:",
          testError,
        );
        expect(mockConsole.error).toHaveBeenCalledWith("Sync error details:", {
          message: "Test sync error",
          stack: "Test error stack trace",
          table: "exercises",
        });
      });

      it("should log connection changes in development", () => {
        legendStateGlobalConfig.onConnectionChange(true);
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Legend State connection status: online",
        );

        legendStateGlobalConfig.onConnectionChange(false);
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Legend State connection status: offline",
        );
      });
    });

    describe("production environment", () => {
      beforeEach(() => {
        (global as any).__DEV__ = false;
      });

      it("should disable logging in production", () => {
        // Re-import module to get fresh evaluation of __DEV__
        jest.isolateModules(() => {
          const {
            legendStateGlobalConfig: productionConfig,
          } = require("../../lib/state/legend-config");
          expect(productionConfig.enableLogging).toBe(false);
        });
      });

      it("should handle sync errors without detailed logging in production", () => {
        const testError = new Error("Test sync error");

        legendStateGlobalConfig.onSyncError(testError, "exercises");

        expect(mockConsole.error).toHaveBeenCalledWith(
          "Legend State sync error for exercises:",
          testError,
        );
        expect(mockConsole.error).not.toHaveBeenCalledWith(
          "Sync error details:",
          expect.any(Object),
        );
      });

      it("should not log connection changes in production", () => {
        legendStateGlobalConfig.onConnectionChange(true);
        legendStateGlobalConfig.onConnectionChange(false);

        expect(mockConsole.log).not.toHaveBeenCalled();
      });
    });

    it("should optimize updates by default", () => {
      expect(legendStateGlobalConfig.optimizeUpdates).toBe(true);
    });

    it("should handle sync errors for different tables", () => {
      const testError = new Error("Sync failed");

      legendStateGlobalConfig.onSyncError(testError, "user_profiles");

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Legend State sync error for user_profiles:",
        testError,
      );
    });

    it("should handle errors without stack trace", () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const testError = new Error("Test error without stack");
      delete (testError as any).stack;

      legendStateGlobalConfig.onSyncError(testError, "test_table");

      expect(mockConsole.error).toHaveBeenCalledWith("Sync error details:", {
        message: "Test error without stack",
        stack: undefined,
        table: "test_table",
      });

      (global as any).__DEV__ = originalDev;
    });
  });

  describe("Configuration Integration", () => {
    it("should create consistent configurations across all store types", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      const exerciseConfig = createExerciseStoreConfig();
      const userConfig = createUserStoreConfig();
      const syncStateConfig = createSyncStateConfig();

      // All configs should have local persistence with preload
      expect(exerciseConfig.local.asyncStorage?.preload).toBe(true);
      expect(userConfig.local.asyncStorage?.preload).toBe(true);
      expect(syncStateConfig.local.asyncStorage?.preload).toBe(true);

      // All configs should use lastWriteWins for conflict resolution when sync enabled
      expect(exerciseConfig.sync?.conflictResolution).toBe("lastWriteWins");
      expect(userConfig.sync?.conflictResolution).toBe("lastWriteWins");
      expect(syncStateConfig.sync?.enabled).toBe(false); // Special case - no sync
    });

    it("should handle environment configuration errors gracefully", () => {
      (getSupabaseEnvConfig as jest.Mock).mockImplementation(() => {
        throw new Error("Environment config error");
      });

      expect(() => createExerciseStoreConfig()).toThrow(
        "Environment config error",
      );
    });

    it("should use different store names for different configurations", () => {
      const exerciseConfig = createExerciseStoreConfig();
      const userConfig = createUserStoreConfig();
      const syncStateConfig = createSyncStateConfig();

      expect(exerciseConfig.local.name).toBe("exercises");
      expect(userConfig.local.name).toBe("user");
      expect(syncStateConfig.local.name).toBe("syncState");
    });
  });

  describe("Feature Flag Integration", () => {
    it("should properly integrate with isSupabaseDataEnabled feature flag", () => {
      // Test enabled state
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);
      const enabledConfig = createExerciseStoreConfig();
      expect(enabledConfig.sync?.enabled).toBe(true);

      // Test disabled state
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(false);
      const disabledConfig = createExerciseStoreConfig();
      expect(disabledConfig.sync?.enabled).toBe(false);
    });

    it("should call feature flag function for each config creation", () => {
      createExerciseStoreConfig();
      createUserStoreConfig();

      expect(isSupabaseDataEnabled).toHaveBeenCalledTimes(2);
    });
  });
});
