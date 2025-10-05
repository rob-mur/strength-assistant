/**
 * Platform-specific utilities exports
 * All modules automatically resolve to the appropriate platform implementation
 */

export * from "./storage";
export * from "./networkInfo";

// Re-export types for convenience
export type { PlatformStorage } from "./storage";
export type { PlatformNetworkInfo, NetworkState } from "./networkInfo";
