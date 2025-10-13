/**
 * LogEntry Model
 *
 * Structured record of an error event with metadata for debugging and monitoring.
 * This model represents the log entry created when an error event is recorded.
 */

import Constants from "expo-constants";
import {
  ErrorSeverity,
  LogEntry as ILogEntry,
} from "../../specs/011-improve-error-logging/contracts/logging-service";

export class LogEntry implements ILogEntry {
  entryId: string;
  errorEventId: string;
  logLevel: ErrorSeverity;
  component: string;
  environment: string;
  deviceInfo?: {
    platform: string;
    version: string;
  };
  sessionId?: string;
  correlationId?: string;

  constructor(
    data: Partial<ILogEntry> & {
      errorEventId: string;
      logLevel: ErrorSeverity;
      component: string;
      environment: string;
    },
  ) {
    // Generate unique entry ID if not provided
    this.entryId = data.entryId || this.generateEntryId();

    // Required fields
    this.errorEventId = data.errorEventId;
    this.logLevel = data.logLevel;
    this.component = data.component;
    this.environment = data.environment;

    // Optional fields
    this.deviceInfo = data.deviceInfo;
    this.sessionId = data.sessionId;
    this.correlationId = data.correlationId;

    // Auto-populate device info if not provided
    this.deviceInfo ??= this.collectDeviceInfo();

    // Generate correlation ID if not provided
    this.correlationId ??= this.generateCorrelationId();

    // Validate the constructed object
    this.validate();
  }

  /**
   * Validates the log entry data according to the contract requirements
   */
  private validate(): void {
    const errors: string[] = [];

    // Validate required fields
    if (!this.errorEventId || this.errorEventId.trim().length === 0) {
      errors.push("errorEventId must reference valid ErrorEvent");
    }

    if (!this.component || this.component.trim().length === 0) {
      errors.push("component is required and must be non-empty");
    }

    if (!this.environment || this.environment.trim().length === 0) {
      errors.push("environment must be valid environment name");
    }

    // Validate logLevel matches ErrorEvent severity levels
    const validLevels: ErrorSeverity[] = [
      "Critical",
      "Error",
      "Warning",
      "Info",
      "Debug",
    ];
    if (!validLevels.includes(this.logLevel)) {
      errors.push(`logLevel must be one of: ${validLevels.join(", ")}`);
    }

    // Validate device info structure if provided
    if (this.deviceInfo) {
      if (
        !this.deviceInfo.platform ||
        typeof this.deviceInfo.platform !== "string"
      ) {
        errors.push("deviceInfo.platform must be a valid string");
      }
      if (
        !this.deviceInfo.version ||
        typeof this.deviceInfo.version !== "string"
      ) {
        errors.push("deviceInfo.version must be a valid string");
      }
    }

    // Validate optional string fields
    if (this.sessionId !== undefined && typeof this.sessionId !== "string") {
      errors.push("sessionId must be a string if provided");
    }

    if (
      this.correlationId !== undefined &&
      typeof this.correlationId !== "string"
    ) {
      errors.push("correlationId must be a string if provided");
    }

    if (errors.length > 0) {
      throw new Error(`LogEntry validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Generates a unique identifier for the log entry
   */
  private generateEntryId(): string {
    return (
      "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 11)
    );
  }

  /**
   * Generates a correlation ID for tracking related operations
   */
  private generateCorrelationId(): string {
    return (
      "corr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8)
    );
  }

  /**
   * Collects basic device information for the log entry
   */
  private collectDeviceInfo(): { platform: string; version: string } {
    try {
      if (Constants.platform && Object.keys(Constants.platform).length > 0) {
        const platform = Object.keys(Constants.platform)[0];
        const version = Constants.osVersion || "unknown";
        return { platform, version };
      }
      return {
        platform: "unknown",
        version: "unknown",
      };
    } catch {
      // Fallback for any environment detection errors
      return {
        platform: "unknown",
        version: "unknown",
      };
    }
  }

  /**
   * Creates a LogEntry for an error event
   */
  static forErrorEvent(
    errorEventId: string,
    logLevel: ErrorSeverity,
    component: string,
    environment: string,
    additionalData?: Partial<ILogEntry>,
  ): LogEntry {
    return new LogEntry({
      errorEventId,
      logLevel,
      component,
      environment,
      ...additionalData,
    });
  }

  /**
   * Creates a LogEntry with automatic component detection
   */
  static withAutoComponent(
    errorEventId: string,
    logLevel: ErrorSeverity,
    environment: string,
    additionalData?: Partial<ILogEntry>,
  ): LogEntry {
    const component = LogEntry.detectComponent();
    return new LogEntry({
      errorEventId,
      logLevel,
      component,
      environment,
      ...additionalData,
    });
  }

  /**
   * Attempts to detect the current component or module name
   */
  static detectComponent(): string {
    try {
      // Get stack trace to determine calling component
      const stack =
        new Error("Stack trace for component detection").stack || "";
      const stackLines = stack.split("\n");

      // Look for the first line that's not this file
      for (const line of stackLines) {
        if (line.includes(".ts") || line.includes(".js")) {
          const match = /([^/\\]+)\.(ts|js)/.exec(line);
          if (match && !match[1].includes("LogEntry")) {
            return match[1];
          }
        }
      }

      return "unknown-component";
    } catch {
      return "unknown-component";
    }
  }

  /**
   * Sets the session ID for tracking user sessions
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Sets a custom correlation ID
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Updates device information
   */
  updateDeviceInfo(deviceInfo: { platform: string; version: string }): void {
    this.deviceInfo = deviceInfo;
  }

  /**
   * Converts the LogEntry to a plain object for serialization
   */
  toJSON(): ILogEntry {
    return {
      entryId: this.entryId,
      errorEventId: this.errorEventId,
      logLevel: this.logLevel,
      component: this.component,
      environment: this.environment,
      deviceInfo: this.deviceInfo,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
    };
  }

  /**
   * Creates a LogEntry from a plain object (deserialization)
   */
  static fromJSON(data: ILogEntry): LogEntry {
    return new LogEntry(data);
  }

  /**
   * Utility methods for log entry analysis
   */

  /**
   * Checks if this log entry is for a critical error
   */
  isCritical(): boolean {
    return this.logLevel === "Critical";
  }

  /**
   * Checks if this log entry is from a mobile environment
   */
  isMobile(): boolean {
    return (
      this.deviceInfo?.platform === "ios" ||
      this.deviceInfo?.platform === "android"
    );
  }

  /**
   * Checks if this log entry is from a web environment
   */
  isWeb(): boolean {
    return this.deviceInfo?.platform === "web";
  }

  /**
   * Gets a formatted string representation of the log entry
   */
  getFormattedEntry(): string {
    const timestamp = new Date().toISOString();
    const platform = this.deviceInfo?.platform || "unknown";
    const session = this.sessionId ? ` [${this.sessionId}]` : "";

    return `[${timestamp}] [${this.logLevel}] [${platform}] ${this.component}${session}: ${this.errorEventId}`;
  }

  /**
   * Gets metadata for log aggregation and analysis
   */
  getMetadata(): Record<string, unknown> {
    return {
      entryId: this.entryId,
      errorEventId: this.errorEventId,
      logLevel: this.logLevel,
      component: this.component,
      environment: this.environment,
      platform: this.deviceInfo?.platform,
      platformVersion: this.deviceInfo?.version,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a copy of the log entry with updated correlation ID
   */
  withCorrelationId(correlationId: string): LogEntry {
    return new LogEntry({
      ...this.toJSON(),
      correlationId,
    });
  }

  /**
   * Creates a copy of the log entry for a different environment
   */
  forEnvironment(environment: string): LogEntry {
    return new LogEntry({
      ...this.toJSON(),
      environment,
      entryId: this.generateEntryId(), // Generate new ID for different environment
    });
  }
}
