/**
 * Legend State Configuration for Supabase Sync
 * Configures Legend State observable with Supabase backend synchronization
 */

import {
  getSupabaseUrl,
  getSupabaseEnvConfig,
  isSupabaseDataEnabled,
} from "../config/supabase-env";

export interface LegendStateSupabaseConfig {
  // Local persistence configuration
  local: {
    name: string;
    indexedDB?: {
      prefixID?: string;
      version?: number;
    };
    asyncStorage?: {
      preload?: boolean;
    };
  };

  // Sync configuration
  sync?: {
    enabled: boolean;
    supabase?: {
      url: string;
      anonKey: string;
      table: string;
      select?: string;
      actions?: {
        create?: string;
        update?: string;
        delete?: string;
      };
      realtime?: {
        enabled: boolean;
        schema?: string;
      };
    };
    // Retry configuration
    retry?: {
      infinite?: boolean;
      delay?: number;
      times?: number;
      backoff?: "constant" | "exponential";
    };
    // Conflict resolution
    conflictResolution?: "lastWriteWins" | "firstWriteWins" | "manual";
  };
}

/**
 * Creates Legend State configuration for exercises
 */
export function createExerciseStoreConfig(): LegendStateSupabaseConfig {
  const supabaseConfig = getSupabaseEnvConfig();
  const useSupabaseData = isSupabaseDataEnabled();

  return {
    local: {
      name: "exercises",
      asyncStorage: {
        preload: true,
      },
    },
    sync: useSupabaseData
      ? {
          enabled: true,
          supabase: {
            url: getSupabaseUrl(),
            anonKey: supabaseConfig.anonKey,
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
        }
      : {
          enabled: false,
        },
  };
}

/**
 * Creates Legend State configuration for user data
 */
export function createUserStoreConfig(): LegendStateSupabaseConfig {
  const supabaseConfig = getSupabaseEnvConfig();
  const useSupabaseData = isSupabaseDataEnabled();

  return {
    local: {
      name: "user",
      asyncStorage: {
        preload: true,
      },
    },
    sync: useSupabaseData
      ? {
          enabled: true,
          supabase: {
            url: getSupabaseUrl(),
            anonKey: supabaseConfig.anonKey,
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
        }
      : {
          enabled: false,
        },
  };
}

/**
 * Creates Legend State configuration for sync state tracking
 */
export function createSyncStateConfig(): LegendStateSupabaseConfig {
  return {
    local: {
      name: "syncState",
      asyncStorage: {
        preload: true,
      },
    },
    // Sync state is always local-only, no remote sync needed
    sync: {
      enabled: false,
    },
  };
}

/**
 * Global Legend State configuration options
 */
export const legendStateGlobalConfig = {
  // Enable debug logging in development
  enableLogging: __DEV__,

  // Performance optimizations
  optimizeUpdates: true,

  // Error handling
  onSyncError: (error: Error, table: string) => {
    console.error(`Legend State sync error for ${table}:`, error);

    // In development, show more detailed errors
    if (__DEV__) {
      console.error("Sync error details:", {
        message: error.message,
        stack: error.stack,
        table,
      });
    }
  },

  // Connection status handling
  onConnectionChange: (isConnected: boolean) => {
    if (__DEV__) {
      console.log(
        `Legend State connection status: ${isConnected ? "online" : "offline"}`,
      );
    }
  },
};
