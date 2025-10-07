/**
 * Web network info implementation using browser APIs
 */

import type { PlatformNetworkInfo, NetworkState } from "./networkInfo";

class WebNetworkInfo implements PlatformNetworkInfo {
  private readonly listeners: Set<(state: NetworkState) => void> = new Set();

  constructor() {
    // Set up browser event listeners
    if (typeof globalThis.addEventListener === "function") {
      globalThis.addEventListener("online", this.handleConnectionChange);
      globalThis.addEventListener("offline", this.handleConnectionChange);

      // Modern browsers support connection API
      if ("connection" in navigator) {
        (
          navigator as {
            connection: {
              addEventListener: (event: string, handler: () => void) => void;
            };
          }
        ).connection.addEventListener("change", this.handleConnectionChange);
      }
    }
  }

  private readonly handleConnectionChange = (): void => {
    this.getCurrentState().then((state) => {
      for (const callback of this.listeners) {
        callback(state);
      }
    });
  };

  async getCurrentState(): Promise<NetworkState> {
    if (typeof globalThis.navigator === "undefined") {
      return {
        isConnected: false,
        type: "unknown",
        isInternetReachable: null,
      };
    }

    const isOnline = navigator.onLine;
    let connectionType = "unknown";

    // Try to get connection type from modern browsers
    if ("connection" in navigator) {
      const connection = (
        navigator as { connection: { effectiveType?: string; type?: string } }
      ).connection;
      connectionType = connection.effectiveType || connection.type || "unknown";
    }

    // For web, we can't easily test internet reachability without making a request
    // so we'll return null to indicate unknown
    return {
      isConnected: isOnline,
      type: connectionType,
      isInternetReachable: isOnline ? null : false,
    };
  }

  subscribe(callback: (state: NetworkState) => void): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const platformNetworkInfo = new WebNetworkInfo();
export default platformNetworkInfo;
