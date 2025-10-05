/**
 * ErrorContext Model
 *
 * Additional information about application state when error occurred.
 * This model captures contextual data to help with debugging and error analysis.
 */

import { ErrorContext as IErrorContext } from "../../specs/011-improve-error-logging/contracts/logging-service";

export class ErrorContext implements IErrorContext {
  contextId: string;
  errorEventId: string;
  userAction?: string;
  navigationState?: {
    currentRoute: string;
    previousRoute?: string;
  };
  dataState?: Record<string, unknown>;
  networkState?: "connected" | "disconnected" | "limited";
  performanceMetrics?: {
    memoryUsage?: number;
    cpuUsage?: number;
  };

  constructor(data: Partial<IErrorContext> & { errorEventId: string }) {
    // Generate unique context ID if not provided
    this.contextId = data.contextId || this.generateContextId();

    // Required field
    this.errorEventId = data.errorEventId;

    // Optional fields
    this.userAction = data.userAction;
    this.navigationState = data.navigationState;
    this.dataState = data.dataState;
    this.networkState = data.networkState;
    this.performanceMetrics = data.performanceMetrics;

    // Auto-collect context if not provided
    this.autoCollectContext();

    // Validate the constructed object
    this.validate();
  }

  /**
   * Validates the error context data according to the contract requirements
   */
  private validate(): void {
    const errors: string[] = [];

    // Validate required fields
    if (!this.errorEventId || this.errorEventId.trim().length === 0) {
      errors.push("errorEventId must reference valid ErrorEvent");
    }

    // Validate optional fields if provided
    if (this.userAction !== undefined && typeof this.userAction !== "string") {
      errors.push("userAction must be a string if provided");
    }

    if (this.userAction !== undefined && this.userAction.trim().length === 0) {
      errors.push("userAction must be non-empty if provided");
    }

    // Validate navigation state structure
    if (this.navigationState) {
      if (
        !this.navigationState.currentRoute ||
        typeof this.navigationState.currentRoute !== "string"
      ) {
        errors.push("navigationState.currentRoute must be a valid string");
      }
      if (
        this.navigationState.previousRoute !== undefined &&
        typeof this.navigationState.previousRoute !== "string"
      ) {
        errors.push(
          "navigationState.previousRoute must be a string if provided",
        );
      }
    }

    // Validate network state
    if (this.networkState !== undefined) {
      const validNetworkStates = ["connected", "disconnected", "limited"];
      if (!validNetworkStates.includes(this.networkState)) {
        errors.push(
          `networkState must be one of: ${validNetworkStates.join(", ")}`,
        );
      }
    }

    // Validate performance metrics structure
    if (this.performanceMetrics) {
      if (
        this.performanceMetrics.memoryUsage !== undefined &&
        typeof this.performanceMetrics.memoryUsage !== "number"
      ) {
        errors.push(
          "performanceMetrics.memoryUsage must be a number if provided",
        );
      }
      if (
        this.performanceMetrics.cpuUsage !== undefined &&
        typeof this.performanceMetrics.cpuUsage !== "number"
      ) {
        errors.push("performanceMetrics.cpuUsage must be a number if provided");
      }
      if (
        this.performanceMetrics.memoryUsage !== undefined &&
        this.performanceMetrics.memoryUsage < 0
      ) {
        errors.push("performanceMetrics.memoryUsage must be non-negative");
      }
      if (
        this.performanceMetrics.cpuUsage !== undefined &&
        (this.performanceMetrics.cpuUsage < 0 ||
          this.performanceMetrics.cpuUsage > 100)
      ) {
        errors.push("performanceMetrics.cpuUsage must be between 0 and 100");
      }
    }

    // Validate data state doesn't contain sensitive information
    if (this.dataState) {
      this.validateDataStateSafety(this.dataState);
    }

    if (errors.length > 0) {
      throw new Error(`ErrorContext validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Validates that data state doesn't contain potentially sensitive information
   */
  private validateDataStateSafety(dataState: Record<string, unknown>): void {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "ssn",
      "credit",
    ];

    const checkObject = (obj: unknown, path = ""): void => {
      if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          const lowerKey = key.toLowerCase();

          // Check if key name suggests sensitive data
          if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
            console.warn(
              `Potentially sensitive data in error context at ${currentPath}. Consider excluding this field.`,
            );
          }

          // Recursively check nested objects (limited depth to avoid circular references)
          if (path.split(".").length < 3) {
            checkObject(value, currentPath);
          }
        }
      }
    };

    checkObject(dataState);
  }

  /**
   * Generates a unique identifier for the error context
   */
  private generateContextId(): string {
    return "ctx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Automatically collects available context information
   */
  private autoCollectContext(): void {
    // Collect network state if not provided
    if (!this.networkState) {
      this.networkState = this.detectNetworkState();
    }

    // Collect navigation state if not provided
    if (!this.navigationState) {
      this.navigationState = this.detectNavigationState();
    }

    // Collect performance metrics if not provided
    if (!this.performanceMetrics) {
      this.performanceMetrics = this.collectPerformanceMetrics();
    }
  }

  /**
   * Attempts to detect current network state
   */
  private detectNetworkState(): "connected" | "disconnected" | "limited" {
    try {
      // Check if running in browser environment
      if (typeof navigator !== "undefined" && "onLine" in navigator) {
        return navigator.onLine ? "connected" : "disconnected";
      }

      // Check if React Native NetInfo is available
      try {
        const importModule = eval("require");
        const NetInfo = importModule("@react-native-community/netinfo");
        if (NetInfo) {
          // For React Native, we'd need to make this async, but for initialization we'll assume connected
          return "connected";
        }
      } catch {
        // NetInfo not available
      }

      // Default assumption
      return "connected";
    } catch {
      return "connected";
    }
  }

  /**
   * Attempts to detect current navigation state
   */
  private detectNavigationState():
    | { currentRoute: string; previousRoute?: string }
    | undefined {
    try {
      // Check for React Navigation
      // Note: This is a simplified detection - real implementation would need proper navigation context
      if (typeof window !== "undefined") {
        return {
          currentRoute: window.location?.pathname || "/unknown",
          previousRoute: document.referrer
            ? new URL(document.referrer).pathname
            : undefined,
        };
      }

      // For React Native, we'd need access to navigation state
      // This would typically be passed in rather than detected
      return {
        currentRoute: "/app", // Default mobile app route
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Collects basic performance metrics
   */
  private collectPerformanceMetrics():
    | { memoryUsage?: number; cpuUsage?: number }
    | undefined {
    try {
      const metrics: { memoryUsage?: number; cpuUsage?: number } = {};

      // Memory usage (browser)
      if (typeof window !== "undefined" && "performance" in window) {
        const perfMemory = (
          performance as { memory?: { usedJSHeapSize?: number } }
        ).memory;
        if (perfMemory) {
          metrics.memoryUsage = perfMemory.usedJSHeapSize || undefined;
        }
      }

      // Node.js memory usage
      if (typeof process !== "undefined" && process.memoryUsage) {
        const nodeMemory = process.memoryUsage();
        metrics.memoryUsage = nodeMemory.heapUsed;
      }

      // CPU usage is harder to determine without specific APIs
      // We'd need a performance monitoring library for accurate CPU metrics

      return Object.keys(metrics).length > 0 ? metrics : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Creates an ErrorContext for an error event
   */
  static forErrorEvent(
    errorEventId: string,
    additionalContext?: Partial<IErrorContext>,
  ): ErrorContext {
    return new ErrorContext({
      errorEventId,
      ...additionalContext,
    });
  }

  /**
   * Creates an ErrorContext with user action information
   */
  static withUserAction(
    errorEventId: string,
    userAction: string,
    additionalContext?: Partial<IErrorContext>,
  ): ErrorContext {
    return new ErrorContext({
      errorEventId,
      userAction,
      ...additionalContext,
    });
  }

  /**
   * Creates an ErrorContext with navigation information
   */
  static withNavigation(
    errorEventId: string,
    currentRoute: string,
    previousRoute?: string,
    additionalContext?: Partial<IErrorContext>,
  ): ErrorContext {
    return new ErrorContext({
      errorEventId,
      navigationState: {
        currentRoute,
        previousRoute,
      },
      ...additionalContext,
    });
  }

  /**
   * Updates the user action
   */
  setUserAction(userAction: string): void {
    this.userAction = userAction;
  }

  /**
   * Updates the navigation state
   */
  setNavigationState(currentRoute: string, previousRoute?: string): void {
    this.navigationState = {
      currentRoute,
      previousRoute,
    };
  }

  /**
   * Adds or updates data state
   */
  addDataState(key: string, value: unknown): void {
    if (!this.dataState) {
      this.dataState = {};
    }
    this.dataState[key] = value;
  }

  /**
   * Removes sensitive data from the context
   */
  sanitizeDataState(): void {
    if (!this.dataState) return;

    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
    ];

    const sanitizeObject = (
      obj: Record<string, unknown>,
    ): Record<string, unknown> => {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some((sensitive) =>
          lowerKey.includes(sensitive),
        );

        if (isSensitive) {
          sanitized[key] = "[REDACTED]";
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    };

    this.dataState = sanitizeObject(this.dataState);
  }

  /**
   * Converts the ErrorContext to a plain object for serialization
   */
  toJSON(): IErrorContext {
    return {
      contextId: this.contextId,
      errorEventId: this.errorEventId,
      userAction: this.userAction,
      navigationState: this.navigationState,
      dataState: this.dataState,
      networkState: this.networkState,
      performanceMetrics: this.performanceMetrics,
    };
  }

  /**
   * Creates an ErrorContext from a plain object (deserialization)
   */
  static fromJSON(data: IErrorContext): ErrorContext {
    return new ErrorContext(data);
  }

  /**
   * Utility methods for context analysis
   */

  /**
   * Checks if the error occurred during user interaction
   */
  isDuringUserInteraction(): boolean {
    return !!this.userAction;
  }

  /**
   * Checks if network issues may have contributed to the error
   */
  hasNetworkIssues(): boolean {
    return (
      this.networkState === "disconnected" || this.networkState === "limited"
    );
  }

  /**
   * Checks if performance issues may have contributed to the error
   */
  hasPerformanceIssues(): boolean {
    if (!this.performanceMetrics) return false;

    // Threshold values (these could be configurable)
    const HIGH_MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
    const HIGH_CPU_THRESHOLD = 80; // 80%

    const highMemory =
      this.performanceMetrics.memoryUsage !== undefined &&
      this.performanceMetrics.memoryUsage > HIGH_MEMORY_THRESHOLD;

    const highCpu =
      this.performanceMetrics.cpuUsage !== undefined &&
      this.performanceMetrics.cpuUsage > HIGH_CPU_THRESHOLD;

    return highMemory || highCpu;
  }

  /**
   * Gets a summary of the context for logging
   */
  getSummary(): string {
    const parts: string[] = [];

    if (this.userAction) {
      parts.push(`Action: ${this.userAction}`);
    }

    if (this.navigationState) {
      parts.push(`Route: ${this.navigationState.currentRoute}`);
    }

    if (this.networkState && this.networkState !== "connected") {
      parts.push(`Network: ${this.networkState}`);
    }

    if (this.hasPerformanceIssues()) {
      parts.push("Performance issues detected");
    }

    return parts.length > 0 ? parts.join(", ") : "No significant context";
  }

  /**
   * Creates a copy of the context with additional data state
   */
  withDataState(dataState: Record<string, unknown>): ErrorContext {
    return new ErrorContext({
      ...this.toJSON(),
      dataState: { ...this.dataState, ...dataState },
    });
  }

  /**
   * Creates a minimal context with only essential information
   */
  toMinimal(): Partial<IErrorContext> {
    return {
      contextId: this.contextId,
      errorEventId: this.errorEventId,
      userAction: this.userAction,
      navigationState: this.navigationState,
      networkState: this.networkState,
      // Exclude potentially large dataState and performanceMetrics
    };
  }
}
