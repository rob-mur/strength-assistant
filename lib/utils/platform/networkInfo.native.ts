/**
 * React Native network info implementation
 */

import type { PlatformNetworkInfo, NetworkState } from "./networkInfo";

// Use dynamic import to avoid ESLint resolution issues
let NetInfo: {
  fetch: () => Promise<{
    isConnected?: boolean;
    type?: string;
    isInternetReachable?: boolean | null;
  }>;
  addEventListener: (callback: (state: unknown) => void) => () => void;
} | null;
try {
  const importModule = eval("require");
  NetInfo = importModule("@react-native-community/netinfo");
} catch {
  // Fallback for environments where NetInfo is not available
  NetInfo = null;
}

export const platformNetworkInfo: PlatformNetworkInfo = {
  async getCurrentState(): Promise<NetworkState> {
    if (!NetInfo) {
      return {
        isConnected: true,
        type: "unknown",
        isInternetReachable: null,
      };
    }

    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      type: state.type || "unknown",
      isInternetReachable: state.isInternetReachable ?? null,
    };
  },

  subscribe(callback: (state: NetworkState) => void): () => void {
    if (!NetInfo) {
      return () => {}; // Return empty unsubscribe function
    }

    return NetInfo.addEventListener((state: unknown) => {
      const netState = state as {
        isConnected?: boolean;
        type?: string;
        isInternetReachable?: boolean | null;
      };
      callback({
        isConnected: netState.isConnected ?? false,
        type: netState.type || "unknown",
        isInternetReachable: netState.isInternetReachable ?? null,
      });
    });
  },
};

export default platformNetworkInfo;
