import { logger } from '../../../lib/data/firebase/logger';

/**
 * Common logging utilities for repository operations
 */
export class RepositoryLogger {
  /**
   * Log successful repository operation
   */
  static logSuccess(
    service: string,
    operation: string,
    additionalContext?: Record<string, any>
  ): void {
    logger.info(`${operation} completed successfully`, {
      service,
      platform: "mobile",
      operation,
      ...additionalContext
    });
  }

  /**
   * Log repository operation error
   */
  static logError(
    service: string,
    operation: string,
    error: Error,
    additionalContext?: Record<string, any>
  ): void {
    logger.error(`Failed to ${operation}`, {
      service,
      platform: "mobile",
      operation,
      error: { message: error.message, stack: error.stack },
      ...additionalContext
    });
  }
}