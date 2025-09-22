import { Logger } from "../../data/supabase/supabase/logger";

/**
 * Common logging utilities for repository operations
 */
export class RepositoryLogger {
  private static logger = new Logger("Repository");
  /**
   * Log successful repository operation
   */
  static logSuccess(
    service: string,
    operation: string,
    additionalContext?: Record<string, unknown>,
  ): void {
    this.logger.info(`${operation} completed successfully`, {
      service,
      platform: "mobile",
      operation,
      ...additionalContext,
    });
  }

  /**
   * Log repository operation error
   */
  static logError(
    service: string,
    operation: string,
    error: Error,
    additionalContext?: Record<string, unknown>,
  ): void {
    this.logger.error(`Failed to ${operation}`, {
      service,
      platform: "mobile",
      operation,
      error: { message: error.message, stack: error.stack },
      ...additionalContext,
    });
  }
}
