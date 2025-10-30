/**
 * Network Mocking Utilities for Offline Sync Testing
 * Purpose: Comprehensive network state simulation for Jest tests
 *
 * This module provides utilities to mock network conditions for testing
 * offline sync scenarios in React Native/Expo applications.
 */

export interface MockNetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: "wifi" | "cellular" | "ethernet" | "none" | "unknown";
  effectiveType?: "slow" | "moderate" | "fast" | "unknown";
}

export interface NetworkMockConfig {
  latencyMs?: number;
  failureRate?: number;
  intermittentConnectivity?: boolean;
}

export const createNetworkMocks = () => {
  const mockNetworkState: MockNetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: "wifi",
    effectiveType: "fast",
  };

  // Store original fetch for restoration
  const originalFetch = global.fetch;
  let mockFetchEnabled = false;

  // Mock navigator.onLine (web environments)
  Object.defineProperty(global, "navigator", {
    value: {
      ...global.navigator,
      onLine: mockNetworkState.isConnected,
    },
    writable: true,
    configurable: true,
  });

  // Mock React Native NetInfo if available (will be added later)
  const netInfoMock = {
    fetch: jest.fn(() => Promise.resolve(mockNetworkState)),
    addEventListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
    useNetInfo: jest.fn(() => mockNetworkState),
    getCurrentState: jest.fn(() => Promise.resolve(mockNetworkState)),
  };

  const networkMocks = {
    // Control network state in tests
    setNetworkConnected: (connected: boolean) => {
      mockNetworkState.isConnected = connected;
      mockNetworkState.isInternetReachable = connected;
      mockNetworkState.type = connected ? "wifi" : "none";
      mockNetworkState.effectiveType = connected ? "fast" : "unknown";

      // Update navigator.onLine
      if (global.navigator) {
        (global.navigator as any).onLine = connected;
      }
    },

    // Simulate airplane mode
    setAirplaneMode: () => {
      mockNetworkState.isConnected = false;
      mockNetworkState.isInternetReachable = false;
      mockNetworkState.type = "none";
      mockNetworkState.effectiveType = "unknown";

      if (global.navigator) {
        (global.navigator as any).onLine = false;
      }
    },

    // Simulate intermittent connectivity
    setIntermittentConnectivity: (config: NetworkMockConfig = {}) => {
      const { failureRate = 0.3 } = config;

      mockFetchEnabled = true;
      global.fetch = jest.fn((url: any, options?: any) => {
        if (Math.random() < failureRate) {
          return Promise.reject(new Error("Network request failed"));
        }
        return originalFetch(url, options);
      });
    },

    // Simulate slow network
    setSlowNetwork: () => {
      mockNetworkState.isConnected = true;
      mockNetworkState.isInternetReachable = true;
      mockNetworkState.type = "cellular";
      mockNetworkState.effectiveType = "slow";

      if (global.navigator) {
        (global.navigator as any).onLine = true;
      }
    },

    // Simulate fast network
    setFastNetwork: () => {
      mockNetworkState.isConnected = true;
      mockNetworkState.isInternetReachable = true;
      mockNetworkState.type = "wifi";
      mockNetworkState.effectiveType = "fast";

      if (global.navigator) {
        (global.navigator as any).onLine = true;
      }
    },

    // Get current mock state
    getCurrentState: () => ({ ...mockNetworkState }),

    // Restore original network behavior
    restore: () => {
      global.fetch = originalFetch;
      mockFetchEnabled = false;

      // Reset to default online state
      mockNetworkState.isConnected = true;
      mockNetworkState.isInternetReachable = true;
      mockNetworkState.type = "wifi";
      mockNetworkState.effectiveType = "fast";

      if (global.navigator) {
        (global.navigator as any).onLine = true;
      }
    },

    // NetInfo mock for React Native
    netInfoMock,

    // Advanced network simulation
    simulateNetworkCondition: (
      condition: "fast" | "slow" | "unstable" | "offline",
    ) => {
      switch (condition) {
        case "fast":
          networkMocks.setFastNetwork();
          break;
        case "slow":
          networkMocks.setSlowNetwork();
          break;
        case "unstable":
          networkMocks.setIntermittentConnectivity({ failureRate: 0.5 });
          break;
        case "offline":
          networkMocks.setAirplaneMode();
          break;
      }
    },

    // Network state change simulation
    triggerNetworkChange: (newState: Partial<MockNetworkState>) => {
      Object.assign(mockNetworkState, newState);

      if (global.navigator) {
        (global.navigator as any).onLine = mockNetworkState.isConnected;
      }
    },
  };

  return networkMocks;
};

/**
 * Jest setup helper for network mocks
 * Call this in beforeEach to ensure clean state
 */
export const setupNetworkMocks = () => {
  const mocks = createNetworkMocks();

  beforeEach(() => {
    mocks.restore();
  });

  afterAll(() => {
    mocks.restore();
  });

  return mocks;
};

/**
 * Network state assertion helpers
 */
export const expectNetworkState = (
  actualState: MockNetworkState,
  expectedState: Partial<MockNetworkState>,
) => {
  Object.keys(expectedState).forEach((key) => {
    expect(actualState[key as keyof MockNetworkState]).toBe(
      expectedState[key as keyof MockNetworkState],
    );
  });
};

/**
 * Simulate realistic network transitions for testing
 */
export const createNetworkTransitionScenarios = () => {
  const mocks = createNetworkMocks();

  return {
    // Airplane mode workflow: online → offline → online
    airplaneModeWorkflow: async () => {
      mocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 100));

      mocks.setAirplaneMode();
      await new Promise((resolve) => setTimeout(resolve, 500));

      mocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 100));
    },

    // Unstable connection: multiple disconnects/reconnects
    unstableConnectionWorkflow: async () => {
      for (let i = 0; i < 3; i++) {
        mocks.setFastNetwork();
        await new Promise((resolve) => setTimeout(resolve, 200));

        mocks.setAirplaneMode();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      mocks.setFastNetwork();
    },

    // Network degradation: fast → slow → offline → fast
    networkDegradationWorkflow: async () => {
      mocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 100));

      mocks.setSlowNetwork();
      await new Promise((resolve) => setTimeout(resolve, 200));

      mocks.setAirplaneMode();
      await new Promise((resolve) => setTimeout(resolve, 300));

      mocks.setFastNetwork();
    },

    mocks,
  };
};
