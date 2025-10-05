/**
 * Platform-specific network info abstraction
 * Automatically resolves to networkInfo.native.ts or networkInfo.web.ts
 */

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

export interface PlatformNetworkInfo {
  getCurrentState(): Promise<NetworkState>;
  subscribe(callback: (state: NetworkState) => void): () => void;
}

// This file will be resolved by Metro to the appropriate platform-specific implementation
export * from "./networkInfo.native";
