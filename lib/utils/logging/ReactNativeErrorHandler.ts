/**
 * ReactNativeErrorHandler Service
 *
 * Handles uncaught errors from React Native ErrorUtils and integrates with the simple error blocking system.
 */

import { ReactNativeErrorHandler } from "../../../specs/012-production-bug-android/contracts/simple-error-blocking";
import { createSimpleErrorLogger } from "./SimpleErrorLogger";

/**
 * React Native ErrorUtils type definition
 */
interface ErrorUtilsType {
  setGlobalHandler?: (
    handler: ((error: Error, isFatal: boolean) => void) | null,
  ) => void;
  getGlobalHandler?: () => ((error: Error, isFatal: boolean) => void) | null;
}

/**
 * Global object with ErrorUtils (React Native)
 */
interface GlobalWithErrorUtils {
  ErrorUtils?: ErrorUtilsType;
}

/**
 * Implementation of ReactNativeErrorHandler interface
 */
export class ReactNativeErrorHandlerImpl implements ReactNativeErrorHandler {
  private errorLogger = createSimpleErrorLogger();
  private originalHandler: ((error: Error, isFatal: boolean) => void) | null =
    null;

  /**
   * Handle uncaught errors from React Native ErrorUtils
   */
  handleUncaughtError(error: Error, isFatal: boolean): void {
    try {
      // Log and block the error to trigger UI blocking
      this.errorLogger.logAndBlock(
        error,
        isFatal ? "react-native-fatal" : "react-native-non-fatal",
      );

      // Call original handler if it exists
      if (this.originalHandler) {
        this.originalHandler(error, isFatal);
      }
    } catch (handlingError) {
      // Prevent recursion - if error handling fails, just log to console
      console.error(
        "[ReactNativeErrorHandler] Error while handling error:",
        handlingError,
      );
      console.error("[ReactNativeErrorHandler] Original error:", error);
    }
  }

  /**
   * Set up global error handling for React Native
   */
  setupGlobalErrorHandling(): void {
    try {
      // Check if we're in React Native environment
      if (
        typeof global !== "undefined" &&
        (global as GlobalWithErrorUtils).ErrorUtils
      ) {
        const ErrorUtils = (global as GlobalWithErrorUtils)
          .ErrorUtils as ErrorUtilsType;

        // Defensive check for ErrorUtils validity
        if (!ErrorUtils || typeof ErrorUtils !== "object") {
          console.warn(
            "[ReactNativeErrorHandler] ErrorUtils is not a valid object",
          );
          return;
        }

        // Store original handler with defensive checks
        if (
          ErrorUtils.getGlobalHandler &&
          typeof ErrorUtils.getGlobalHandler === "function"
        ) {
          try {
            this.originalHandler = ErrorUtils.getGlobalHandler();
          } catch (getHandlerError) {
            console.warn(
              "[ReactNativeErrorHandler] Failed to get original handler:",
              getHandlerError,
            );
          }
        }

        // Set our handler with defensive checks
        if (
          ErrorUtils.setGlobalHandler &&
          typeof ErrorUtils.setGlobalHandler === "function"
        ) {
          try {
            ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
              this.handleUncaughtError(error, isFatal);
            });
            console.log("✅ React Native error handlers setup complete");
          } catch (setHandlerError) {
            console.error(
              "❌ Node error handler setup failed:",
              setHandlerError,
            );
          }
        } else {
          console.warn(
            "[ReactNativeErrorHandler] setGlobalHandler is not available",
          );
        }
      } else {
        console.log(
          "[ReactNativeErrorHandler] ErrorUtils not available (likely web environment)",
        );
      }
    } catch (setupError) {
      // Don't throw if setup fails - just log and continue
      console.error("❌ Global error handler setup failed:", setupError);
    }
  }

  /**
   * Clean up global error handlers (for testing)
   */
  cleanup(): void {
    try {
      if (
        typeof global !== "undefined" &&
        (global as GlobalWithErrorUtils).ErrorUtils
      ) {
        const ErrorUtils = (global as GlobalWithErrorUtils)
          .ErrorUtils as ErrorUtilsType;

        // Defensive check for ErrorUtils validity
        if (!ErrorUtils || typeof ErrorUtils !== "object") {
          console.warn(
            "[ReactNativeErrorHandler] ErrorUtils not available for cleanup",
          );
          return;
        }

        // Restore original handler with defensive checks
        if (
          ErrorUtils.setGlobalHandler &&
          typeof ErrorUtils.setGlobalHandler === "function"
        ) {
          try {
            if (this.originalHandler) {
              ErrorUtils.setGlobalHandler(this.originalHandler);
            } else {
              // If no original handler, set to null/undefined
              ErrorUtils.setGlobalHandler(null);
            }
          } catch (setHandlerError) {
            console.warn(
              "[ReactNativeErrorHandler] Failed to restore handler:",
              setHandlerError,
            );
          }
        }

        this.originalHandler = null;
      }
    } catch (cleanupError) {
      // Don't throw on cleanup failure
      console.error(
        "[ReactNativeErrorHandler] Failed to cleanup error handlers:",
        cleanupError,
      );
    }
  }
}

/**
 * Creates a new ReactNativeErrorHandler instance
 */
export function createReactNativeErrorHandler(): ReactNativeErrorHandler {
  return new ReactNativeErrorHandlerImpl();
}
