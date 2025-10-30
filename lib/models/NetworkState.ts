/**
 * NetworkState Model
 * Purpose: Monitor online/offline connectivity status with quality detection
 */

export type ConnectionType =
  | "wifi"
  | "cellular"
  | "ethernet"
  | "none"
  | "unknown";
export type EffectiveType = "slow" | "moderate" | "fast" | "unknown";

export interface NetworkState {
  /** Basic connectivity status */
  isOnline: boolean;

  /** Can reach external servers */
  isInternetReachable: boolean;

  /** Type of network connection */
  connectionType: ConnectionType;

  /** Connection quality assessment */
  effectiveType: EffectiveType;

  /** When connection was last established */
  lastOnlineTime?: Date;

  /** When connection was last lost */
  lastOfflineTime?: Date;
}

/**
 * Validation rules for NetworkState
 */
export const validateNetworkState = (networkState: NetworkState): string[] => {
  const errors: string[] = [];

  // Online state validation
  if (networkState.isOnline && networkState.connectionType === "none") {
    errors.push('isOnline true requires connectionType !== "none"');
  }

  // Internet reachable validation
  if (networkState.isInternetReachable && !networkState.isOnline) {
    errors.push("isInternetReachable true requires isOnline true");
  }

  // Effective type validation
  if (
    networkState.connectionType === "none" &&
    networkState.effectiveType !== "unknown"
  ) {
    errors.push(
      'effectiveType must be "unknown" when connectionType is "none"',
    );
  }

  // Timestamp validation
  if (
    networkState.lastOnlineTime &&
    isNaN(networkState.lastOnlineTime.getTime())
  ) {
    errors.push("lastOnlineTime must be a valid Date object or null");
  }

  if (
    networkState.lastOfflineTime &&
    isNaN(networkState.lastOfflineTime.getTime())
  ) {
    errors.push("lastOfflineTime must be a valid Date object or null");
  }

  return errors;
};

/**
 * Create a new NetworkState with default values
 */
export const createNetworkState = (
  overrides: Partial<NetworkState> = {},
): NetworkState => {
  return {
    isOnline: true,
    isInternetReachable: true,
    connectionType: "wifi",
    effectiveType: "fast",
    lastOnlineTime: new Date(),
    lastOfflineTime: undefined,
    ...overrides,
  };
};

/**
 * Create offline network state
 */
export const createOfflineNetworkState = (): NetworkState => {
  return createNetworkState({
    isOnline: false,
    isInternetReachable: false,
    connectionType: "none",
    effectiveType: "unknown",
    lastOnlineTime: undefined,
    lastOfflineTime: new Date(),
  });
};

/**
 * Update network state with validation
 */
export const updateNetworkState = (
  current: NetworkState,
  updates: Partial<NetworkState>,
): NetworkState => {
  const newState = { ...current, ...updates };

  // Auto-update timestamps when online/offline status changes
  if (updates.isOnline !== undefined && updates.isOnline !== current.isOnline) {
    if (updates.isOnline) {
      newState.lastOnlineTime = new Date();
    } else {
      newState.lastOfflineTime = new Date();
    }
  }

  // Validate the new state
  const validationErrors = validateNetworkState(newState);
  if (validationErrors.length > 0) {
    throw new Error(
      `NetworkState validation failed: ${validationErrors.join(", ")}`,
    );
  }

  return newState;
};

/**
 * Check if network state is suitable for sync operations
 */
export const canSync = (networkState: NetworkState): boolean => {
  return networkState.isOnline && networkState.isInternetReachable;
};

/**
 * Get recommended batch size based on network conditions
 */
export const getRecommendedBatchSize = (networkState: NetworkState): number => {
  if (!canSync(networkState)) {
    return 0;
  }

  switch (networkState.effectiveType) {
    case "fast":
      return networkState.connectionType === "wifi" ? 150 : 100;
    case "moderate":
      return 75;
    case "slow":
      return 25;
    case "unknown":
    default:
      return 50; // Conservative default
  }
};

/**
 * Get sync timeout based on network conditions
 */
export const getRecommendedTimeout = (networkState: NetworkState): number => {
  if (!canSync(networkState)) {
    return 0;
  }

  switch (networkState.effectiveType) {
    case "fast":
      return 60000; // 60 seconds
    case "moderate":
      return 45000; // 45 seconds
    case "slow":
      return 30000; // 30 seconds
    case "unknown":
    default:
      return 45000; // Conservative default
  }
};

/**
 * Check if network state indicates unstable connection
 */
export const isNetworkUnstable = (networkState: NetworkState): boolean => {
  const { lastOnlineTime, lastOfflineTime } = networkState;

  if (!lastOnlineTime || !lastOfflineTime) {
    return false;
  }

  // Consider unstable if connection changed in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastOnlineTime > fiveMinutesAgo || lastOfflineTime > fiveMinutesAgo;
};
