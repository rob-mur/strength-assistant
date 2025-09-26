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
    _level: "log" | "warn" | "error",
    _message: string,
    _context?: Record<string, unknown>,
  ): void {
    // Silent logging to avoid Chrome test issues
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
