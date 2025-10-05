/**
 * React Native Context Collector
 *
 * Collects React Native-specific context information for error reporting.
 * Includes device info, navigation state, performance metrics, and app state.
 */

import { ErrorContext } from "../../models/ErrorContext";
import { deviceInfo } from "../device/deviceInfo";

/**
 * React Native-specific context information
 */
export interface ReactNativeContext {
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
    brand?: string;
    systemVersion?: string;
  };
  appInfo: {
    version: string;
    buildNumber: string;
    bundleId: string;
  };
  memoryInfo?: {
    totalMemory?: number;
    usedMemory?: number;
    freeMemory?: number;
  };
  networkInfo?: {
    type: string;
    isConnected: boolean;
    isInternetReachable?: boolean;
  };
  navigationInfo?: {
    currentScreen?: string;
    routeStack?: string[];
  };
}

export class ReactNativeContextCollector {
  private static instance: ReactNativeContextCollector;
  private currentNavigationState: {
    routeName?: string;
    routes?: unknown[];
    index?: number;
  } | null = null;

  static getInstance(): ReactNativeContextCollector {
    if (!ReactNativeContextCollector.instance) {
      ReactNativeContextCollector.instance = new ReactNativeContextCollector();
    }
    return ReactNativeContextCollector.instance;
  }

  /**
   * Collect comprehensive React Native context for error reporting
   */
  async collectContext(
    errorEventId: string,
    userAction?: string,
  ): Promise<ErrorContext> {
    const deviceInfo = await this.collectDeviceInfo();
    const appInfo = await this.collectAppInfo();
    const memoryInfo = await this.collectMemoryInfo();
    const networkInfo = await this.collectNetworkInfo();
    const navigationInfo = await this.collectNavigationInfo();
    const performanceMetrics = await this.collectPerformanceMetrics();

    // Create error context with React Native-specific data
    return ErrorContext.forErrorEvent(errorEventId, {
      userAction,
      navigationState: navigationInfo
        ? {
            currentRoute: navigationInfo.currentScreen || "/unknown",
            previousRoute: this.getPreviousRoute(),
          }
        : undefined,
      dataState: {
        deviceInfo,
        appInfo,
        memoryInfo,
        networkInfo,
      },
      networkState: this.getNetworkState(networkInfo),
      performanceMetrics,
    });
  }

  /**
   * Set current navigation state for context collection
   */
  setNavigationState(
    navigationState: {
      routeName?: string;
      routes?: unknown[];
      index?: number;
    } | null,
  ): void {
    this.currentNavigationState = navigationState;
  }

  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<ReactNativeContext["deviceInfo"]> {
    try {
      // Use unified Expo SDK device info
      const context = await deviceInfo.getDeviceContext();
      return {
        platform: context.osName || "unknown",
        version: context.systemVersion || "unknown",
        model: context.model || undefined,
        brand: context.brand || undefined,
        systemVersion: context.systemVersion || undefined,
      };
    } catch {
      return this.getBasicDeviceInfo();
    }
  }

  /**
   * Collect application information
   */
  private async collectAppInfo(): Promise<ReactNativeContext["appInfo"]> {
    try {
      // Use unified Expo SDK device info
      const context = await deviceInfo.getDeviceContext();
      return {
        version: context.appVersion || "1.0.0",
        buildNumber: context.buildVersion || "1",
        bundleId: context.applicationId || "com.app.unknown",
      };
    } catch {
      // Fallback
      return {
        version: "1.0.0",
        buildNumber: "1",
        bundleId: "com.app.unknown",
      };
    }
  }

  /**
   * Collect memory information
   */
  private async collectMemoryInfo(): Promise<ReactNativeContext["memoryInfo"]> {
    try {
      // Use unified device service for memory info
      const totalMemory = await deviceInfo.getTotalMemory();
      const usedMemory = await deviceInfo.getUsedMemory();

      return {
        totalMemory: totalMemory > 0 ? totalMemory : undefined,
        usedMemory: usedMemory > 0 ? usedMemory : undefined,
        freeMemory:
          totalMemory > 0 && usedMemory > 0
            ? totalMemory - usedMemory
            : undefined,
      };
    } catch {
      // Silent failure for memory info
      return undefined;
    }
  }

  /**
   * Collect network information
   */
  private async collectNetworkInfo(): Promise<
    ReactNativeContext["networkInfo"]
  > {
    try {
      // Try to get NetInfo
      const NetInfo = await this.getNetInfo();
      if (NetInfo && NetInfo.fetch) {
        const state = await NetInfo.fetch();
        return {
          type: state.type || "unknown",
          isConnected: state.isConnected || false,
          isInternetReachable: state.isInternetReachable || undefined,
        };
      }

      // Fallback to basic connectivity check
      return {
        type: "unknown",
        isConnected: true, // Assume connected
      };
    } catch {
      return {
        type: "unknown",
        isConnected: true,
      };
    }
  }

  /**
   * Collect navigation information
   */
  private async collectNavigationInfo(): Promise<
    ReactNativeContext["navigationInfo"]
  > {
    try {
      if (this.currentNavigationState) {
        return {
          currentScreen: this.getCurrentScreenName(this.currentNavigationState),
          routeStack: this.getRouteStack(this.currentNavigationState),
        };
      }

      return {
        currentScreen: "unknown",
        routeStack: [],
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<{
    memoryUsage?: number;
    cpuUsage?: number;
  }> {
    try {
      // Get JavaScript heap usage if available
      const performance = (
        global as {
          performance?: {
            memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number };
          };
        }
      ).performance;
      if (performance && performance.memory) {
        return {
          memoryUsage: performance.memory.usedJSHeapSize,
        };
      }

      // Try to get React Native performance metrics
      const memoryInfo = await this.collectMemoryInfo();
      if (memoryInfo?.usedMemory) {
        return {
          memoryUsage: memoryInfo.usedMemory,
        };
      }
    } catch {
      // Silent failure for performance metrics
    }

    return {};
  }

  /**
   * Helper methods
   */

  private async getNetInfo(): Promise<{
    fetch?: () => Promise<{
      isConnected?: boolean;
      type?: string;
      isInternetReachable?: boolean | null;
    }>;
  } | null> {
    try {
      const importModule = eval("require");
      return importModule("@react-native-community/netinfo");
    } catch {
      return null;
    }
  }

  private getBasicDeviceInfo(): ReactNativeContext["deviceInfo"] {
    try {
      // Try to detect platform from React Native
      const importModule = eval("require");
      const Platform = importModule("react-native").Platform;
      return {
        platform: Platform.OS || "unknown",
        version: Platform.Version?.toString() || "unknown",
      };
    } catch {
      return {
        platform: "unknown",
        version: "unknown",
      };
    }
  }

  private getCurrentScreenName(navigationState: {
    routes?: unknown[];
    index?: number;
    routeName?: string;
  }): string {
    try {
      if (navigationState.routes && navigationState.index !== undefined) {
        const currentRoute = navigationState.routes[navigationState.index];
        return (currentRoute as { name?: string }).name || "unknown";
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  private getRouteStack(navigationState: { routes?: unknown[] }): string[] {
    try {
      if (navigationState.routes) {
        return navigationState.routes.map(
          (route: unknown) => (route as { name?: string }).name || "unknown",
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  private getPreviousRoute(): string | undefined {
    try {
      if (
        this.currentNavigationState?.routes &&
        this.currentNavigationState?.index !== undefined &&
        this.currentNavigationState.index > 0
      ) {
        const previousRoute =
          this.currentNavigationState.routes[
            this.currentNavigationState.index - 1
          ];
        return (previousRoute as { name?: string }).name;
      }
    } catch {
      // Silent failure
    }
    return undefined;
  }

  private getNetworkState(
    networkInfo?: ReactNativeContext["networkInfo"],
  ): "connected" | "disconnected" | "limited" {
    if (!networkInfo) return "connected";

    if (!networkInfo.isConnected) return "disconnected";
    if (networkInfo.isInternetReachable === false) return "limited";
    return "connected";
  }
}

/**
 * Hook for navigation state tracking
 */
export function useErrorContextNavigation() {
  const contextCollector = ReactNativeContextCollector.getInstance();

  const setNavigationState = (
    state: { routeName?: string; routes?: unknown[]; index?: number } | null,
  ) => {
    contextCollector.setNavigationState(state);
  };

  return { setNavigationState };
}

/**
 * Enhanced error context creation for React Native
 */
export async function createReactNativeErrorContext(
  errorEventId: string,
  userAction?: string,
  additionalData?: Record<string, unknown>,
): Promise<ErrorContext> {
  const collector = ReactNativeContextCollector.getInstance();
  const context = await collector.collectContext(errorEventId, userAction);

  if (additionalData) {
    return context.withDataState(additionalData);
  }

  return context;
}
