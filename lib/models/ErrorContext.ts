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

    this.collectValidationErrors(errors);
    this.validateDataState();

    if (errors.length > 0) {
      throw new Error(`ErrorContext validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Collects all validation errors from different validation methods
   */
  private collectValidationErrors(errors: string[]): void {
    this.validateRequiredFields(errors);
    this.validateUserAction(errors);
    this.validateNavigationState(errors);
    this.validateNetworkState(errors);
    this.validatePerformanceMetrics(errors);
  }

  private validateRequiredFields(errors: string[]): void {
    if (!this.errorEventId || this.errorEventId.trim().length === 0) {
      errors.push("errorEventId must reference valid ErrorEvent");
    }
  }

  private validateUserAction(errors: string[]): void {
    if (this.userAction === undefined) return;

    if (typeof this.userAction !== "string") {
      errors.push("userAction must be a string if provided");
      return;
    }

    if (this.userAction.trim().length === 0) {
      errors.push("userAction must be non-empty if provided");
    }
  }

  private validateNavigationState(errors: string[]): void {
    if (!this.navigationState) return;

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
      errors.push("navigationState.previousRoute must be a string if provided");
    }
  }

  private validateNetworkState(errors: string[]): void {
    if (this.networkState === undefined) return;

    const validNetworkStates = new Set([
      "connected",
      "disconnected",
      "limited",
    ]);
    if (!validNetworkStates.has(this.networkState)) {
      errors.push(
        `networkState must be one of: ${Array.from(validNetworkStates).join(", ")}`,
      );
    }
  }

  private validatePerformanceMetrics(errors: string[]): void {
    if (!this.performanceMetrics) return;

    const { memoryUsage, cpuUsage } = this.performanceMetrics;

    this.validateMemoryUsage(memoryUsage, errors);
    this.validateCpuUsage(cpuUsage, errors);
  }

  private validateMemoryUsage(
    memoryUsage: number | undefined,
    errors: string[],
  ): void {
    if (memoryUsage === undefined) return;

    if (typeof memoryUsage !== "number") {
      errors.push(
        "performanceMetrics.memoryUsage must be a number if provided",
      );
    } else if (memoryUsage < 0) {
      errors.push("performanceMetrics.memoryUsage must be non-negative");
    }
  }

  private validateCpuUsage(
    cpuUsage: number | undefined,
    errors: string[],
  ): void {
    if (cpuUsage === undefined) return;

    if (typeof cpuUsage !== "number") {
      errors.push("performanceMetrics.cpuUsage must be a number if provided");
    } else if (cpuUsage < 0 || cpuUsage > 100) {
      errors.push("performanceMetrics.cpuUsage must be between 0 and 100");
    }
  }

  private validateDataState(): void {
    if (this.dataState) {
      this.validateDataStateSafety(this.dataState);
    }
  }

  /**
   * Validates that data state doesn't contain potentially sensitive information
   */
  private validateDataStateSafety(dataState: Record<string, unknown>): void {
    const sensitiveKeys = new Set([
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "ssn",
      "credit",
    ]);

    this.checkObjectForSensitiveData(dataState, sensitiveKeys);
  }

  private checkObjectForSensitiveData(
    obj: unknown,
    sensitiveKeys: Set<string>,
    path = "",
    maxDepth = 3,
  ): void {
    if (
      typeof obj !== "object" ||
      obj === null ||
      path.split(".").length >= maxDepth
    ) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const lowerKey = key.toLowerCase();

      if (this.containsSensitiveKeyword(lowerKey, sensitiveKeys)) {
        console.warn(
          `Potentially sensitive data in error context at ${currentPath}. Consider excluding this field.`,
        );
      }

      this.checkObjectForSensitiveData(
        value,
        sensitiveKeys,
        currentPath,
        maxDepth,
      );
    }
  }

  private containsSensitiveKeyword(
    key: string,
    sensitiveKeys: Set<string>,
  ): boolean {
    for (const sensitive of sensitiveKeys) {
      if (key.includes(sensitive)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates a unique identifier for the error context
   */
  private generateContextId(): string {
    return "ctx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11);
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
      return (
        this.detectBrowserNetworkState() ??
        this.detectReactNativeNetworkState() ??
        "connected"
      );
    } catch {
      return "connected";
    }
  }

  private detectBrowserNetworkState(): "connected" | "disconnected" | null {
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      return navigator.onLine ? "connected" : "disconnected";
    }
    return null;
  }

  private detectReactNativeNetworkState(): "connected" | null {
    try {
      const importModule = eval("require");
      const NetInfo = importModule("@react-native-community/netinfo");
      return NetInfo ? "connected" : null;
    } catch {
      return null;
    }
  }

  /**
   * Attempts to detect current navigation state
   */
  private detectNavigationState():
    | { currentRoute: string; previousRoute?: string }
    | undefined {
    try {
      return (
        this.detectWebNavigationState() ?? this.detectMobileNavigationState()
      );
    } catch {
      return undefined;
    }
  }

  private detectWebNavigationState(): {
    currentRoute: string;
    previousRoute?: string;
  } | null {
    if (typeof globalThis.window === "undefined") return null;

    return {
      currentRoute: globalThis.window.location?.pathname || "/unknown",
      previousRoute: document.referrer
        ? new URL(document.referrer).pathname
        : undefined,
    };
  }

  private detectMobileNavigationState(): { currentRoute: string } {
    return {
      currentRoute: "/app",
    };
  }

  /**
   * Collects basic performance metrics
   */
  private collectPerformanceMetrics():
    | { memoryUsage?: number; cpuUsage?: number }
    | undefined {
    try {
      const metrics: { memoryUsage?: number; cpuUsage?: number } = {};

      this.collectBrowserMemoryUsage(metrics);
      this.collectNodeMemoryUsage(metrics);

      return Object.keys(metrics).length > 0 ? metrics : undefined;
    } catch {
      return undefined;
    }
  }

  private collectBrowserMemoryUsage(metrics: { memoryUsage?: number }): void {
    if (globalThis.window && "performance" in globalThis.window) {
      const perfMemory = (
        performance as { memory?: { usedJSHeapSize?: number } }
      ).memory;
      if (perfMemory?.usedJSHeapSize) {
        metrics.memoryUsage = perfMemory.usedJSHeapSize;
      }
    }
  }

  private collectNodeMemoryUsage(metrics: { memoryUsage?: number }): void {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const nodeMemory = process.memoryUsage();
      metrics.memoryUsage = nodeMemory.heapUsed;
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

    const sensitiveKeys = new Set([
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
    ]);

    this.dataState = this.sanitizeObject(this.dataState, sensitiveKeys);
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
    sensitiveKeys: Set<string>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.containsSensitiveKeyword(
        lowerKey,
        sensitiveKeys,
      );

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (this.isNestedObject(value)) {
        sanitized[key] = this.sanitizeObject(
          value as Record<string, unknown>,
          sensitiveKeys,
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isNestedObject(value: unknown): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
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
