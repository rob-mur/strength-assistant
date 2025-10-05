/**
 * Web polyfill for AsyncStorage to fix "window is not defined" errors
 * in Chrome/browser environments during testing
 */

import { initializeErrorHandling } from "./logging/LoggingServiceFactory";

const { loggingService } = initializeErrorHandling();

const AsyncStorageWeb = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      loggingService
        .logError(error as Error, "localStorage-getItem", "Error", "Database")
        .catch((loggingError) =>
          console.error("Logging failed:", loggingError),
        );

      console.warn(
        "Storage operation failed for localStorage-getItem:",
        (error as Error).message,
      );
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      loggingService
        .logError(error as Error, "localStorage-setItem", "Error", "Database")
        .catch((loggingError) =>
          console.error("Logging failed:", loggingError),
        );

      console.warn(
        "Storage operation failed for localStorage-setItem:",
        (error as Error).message,
      );
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      loggingService
        .logError(
          error as Error,
          "localStorage-removeItem",
          "Error",
          "Database",
        )
        .catch((loggingError) =>
          console.error("Logging failed:", loggingError),
        );

      console.warn(
        "Storage operation failed for localStorage-removeItem:",
        (error as Error).message,
      );
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      loggingService
        .logError(error as Error, "localStorage-clear", "Error", "Database")
        .catch((loggingError) =>
          console.error("Logging failed:", loggingError),
        );

      console.warn(
        "Storage operation failed for localStorage-clear:",
        (error as Error).message,
      );
    }
  },
};

export default AsyncStorageWeb;
