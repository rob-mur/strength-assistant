export interface LogContext {
  service: string;
  platform?: string;
  operation?: string;
  duration?: number;
  url?: string;
  emulator?: {
    host: string;
    port: number;
  };
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export class Logger {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private createMessage(
    level: string,
    message: string,
    _context?: Record<string, unknown>,
  ): string {
    const prefix = `[${this.serviceName}]`;
    return `${prefix} ${message}`;
  }

  private logWithContext(
    level: "log" | "warn" | "error",
    message: string,
    context?: Record<string, unknown>,
  ): void {
    // Skip logging in test environment to avoid Chrome test issues
    if (process.env.NODE_ENV === "test" || process.env.CHROME_TEST === "true") {
      return;
    }

    const fullMessage = this.createMessage(level, message, context);

    // Add context information if available
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    const logMessage = `${fullMessage}${contextStr}`;

    // Use appropriate console method based on level
    switch (level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
        break;
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logWithContext("log", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logWithContext("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logWithContext("error", message, context);
  }
}
