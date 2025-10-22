/**
 * SimpleErrorLog Model
 *
 * Lightweight error log entry for simple console-only logging.
 * Designed to replace complex error logging with minimal overhead.
 */

/**
 * Simple error log entry with minimal data
 */
export interface SimpleErrorLog {
  /**
   * Error message
   */
  message: string;

  /**
   * Context where error occurred
   */
  context: string;

  /**
   * ISO timestamp when error was logged
   */
  timestamp: string;

  /**
   * Error stack trace (optional)
   */
  stack?: string;
}

/**
 * Creates a new SimpleErrorLog from an Error and context
 */
export function createSimpleErrorLog(
  error: Error,
  context: string,
): SimpleErrorLog {
  return {
    message: error.message || "Unknown error",
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };
}

/**
 * Creates a SimpleErrorLog from a string message and context
 */
export function createSimpleErrorLogFromMessage(
  message: string,
  context: string,
): SimpleErrorLog {
  return {
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats a SimpleErrorLog for console output
 */
export function formatSimpleErrorLog(log: SimpleErrorLog): string {
  const timestamp = new Date(log.timestamp).toLocaleTimeString();
  return `[${timestamp}][${log.context}] ${log.message}`;
}

/**
 * Formats a SimpleErrorLog with stack trace for console output
 */
export function formatSimpleErrorLogWithStack(log: SimpleErrorLog): string {
  const baseMessage = formatSimpleErrorLog(log);
  if (log.stack) {
    return `${baseMessage}\nStack: ${log.stack}`;
  }
  return baseMessage;
}
