/**
 * ConnectivityMonitor Service
 * Purpose: Monitor network connectivity changes and provide network state information
 */

import {
  NetworkState,
  createNetworkState,
  updateNetworkState,
  createOfflineNetworkState,
} from "../models/NetworkState";

export type NetworkStateChangeCallback = (state: NetworkState) => void;

export class ConnectivityMonitor {
  private currentState: NetworkState;
  private listeners: Set<NetworkStateChangeCallback> = new Set();
  private isMonitoring = false;

  constructor(initialState?: NetworkState) {
    this.currentState = initialState || createNetworkState();
    this.setupEventListeners();
  }

  /**
   * Start monitoring network state changes
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.detectInitialState();
  }

  /**
   * Stop monitoring network state changes
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.listeners.clear();
  }

  /**
   * Get current network state
   */
  public getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Add network state change listener
   */
  public addListener(callback: NetworkStateChangeCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove network state change listener
   */
  public removeListener(callback: NetworkStateChangeCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Manually update network state (for testing)
   */
  public updateState(updates: Partial<NetworkState>): void {
    const newState = updateNetworkState(this.currentState, updates);
    this.setState(newState);
  }

  /**
   * Force refresh of network state
   */
  public async refresh(): Promise<NetworkState> {
    await this.detectCurrentState();
    return this.getCurrentState();
  }

  /**
   * Set up platform-specific event listeners
   */
  private setupEventListeners(): void {
    // Web environment
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }

    // React Native environment (NetInfo would be set up here)
    // This will be enhanced when NetInfo is added
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener("change", this.handleConnectionChange);
      }
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    if (!this.isMonitoring) return;

    this.updateState({
      isOnline: true,
      isInternetReachable: true,
      connectionType: this.detectConnectionType(),
      effectiveType: this.detectEffectiveType(),
    });
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    if (!this.isMonitoring) return;

    this.updateState({
      isOnline: false,
      isInternetReachable: false,
      connectionType: "none",
      effectiveType: "unknown",
    });
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = (): void => {
    if (!this.isMonitoring) return;

    this.detectCurrentState();
  };

  /**
   * Detect initial network state
   */
  private detectInitialState(): void {
    this.detectCurrentState();
  }

  /**
   * Detect current network state
   */
  private async detectCurrentState(): Promise<void> {
    try {
      const isOnline = await this.checkOnlineStatus();
      const isInternetReachable = isOnline
        ? await this.checkInternetReachability()
        : false;

      const newState = updateNetworkState(this.currentState, {
        isOnline,
        isInternetReachable,
        connectionType: this.detectConnectionType(),
        effectiveType: this.detectEffectiveType(),
      });

      this.setState(newState);
    } catch (error) {
      console.warn("Failed to detect network state:", error);
      // Fall back to offline state
      this.setState(createOfflineNetworkState());
    }
  }

  /**
   * Check if device is online
   */
  private async checkOnlineStatus(): Promise<boolean> {
    // Web environment
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      return navigator.onLine;
    }

    // React Native environment (would use NetInfo)
    // For now, assume online
    return true;
  }

  /**
   * Check if internet is actually reachable
   */
  private async checkInternetReachability(): Promise<boolean> {
    if (!this.checkOnlineStatus()) {
      return false;
    }

    try {
      // Try to fetch a small resource to verify internet connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Detect connection type
   */
  private detectConnectionType(): NetworkState["connectionType"] {
    // Web environment
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Map network information API types
        switch (connection.type) {
          case "wifi":
            return "wifi";
          case "cellular":
            return "cellular";
          case "ethernet":
            return "ethernet";
          default:
            return "unknown";
        }
      }
    }

    // Default assumption for web
    if (typeof window !== "undefined") {
      return "wifi"; // Most web connections are wifi or ethernet
    }

    return "unknown";
  }

  /**
   * Detect effective connection type
   */
  private detectEffectiveType(): NetworkState["effectiveType"] {
    // Web environment
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        // Map network information API effective types
        switch (connection.effectiveType) {
          case "slow-2g":
          case "2g":
            return "slow";
          case "3g":
            return "moderate";
          case "4g":
            return "fast";
          default:
            return "unknown";
        }
      }
    }

    // Default assumption
    return "fast";
  }

  /**
   * Update internal state and notify listeners
   */
  private setState(newState: NetworkState): void {
    const oldState = this.currentState;
    this.currentState = newState;

    // Only notify if state actually changed
    if (this.hasStateChanged(oldState, newState)) {
      this.notifyListeners(newState);
    }
  }

  /**
   * Check if network state has meaningfully changed
   */
  private hasStateChanged(
    oldState: NetworkState,
    newState: NetworkState,
  ): boolean {
    return (
      oldState.isOnline !== newState.isOnline ||
      oldState.isInternetReachable !== newState.isInternetReachable ||
      oldState.connectionType !== newState.connectionType ||
      oldState.effectiveType !== newState.effectiveType
    );
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error("Error in network state listener:", error);
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopMonitoring();

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }

    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.removeEventListener("change", this.handleConnectionChange);
      }
    }
  }
}
