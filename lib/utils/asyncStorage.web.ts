/**
 * Web polyfill for AsyncStorage to fix "window is not defined" errors
 * in Chrome/browser environments during testing
 */

const AsyncStorageWeb = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (globalThis.window?.localStorage) {
        return globalThis.window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.warn(
        "Storage operation failed for localStorage-getItem:",
        (error as Error).message,
      );
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (globalThis.window?.localStorage) {
        globalThis.window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(
        "Storage operation failed for localStorage-setItem:",
        (error as Error).message,
      );
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (globalThis.window?.localStorage) {
        globalThis.window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(
        "Storage operation failed for localStorage-removeItem:",
        (error as Error).message,
      );
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (globalThis.window?.localStorage) {
        globalThis.window.localStorage.clear();
      }
    } catch (error) {
      console.warn(
        "Storage operation failed for localStorage-clear:",
        (error as Error).message,
      );
    }
  },
};

export default AsyncStorageWeb;
