/**
 * Web polyfill for AsyncStorage to fix "window is not defined" errors
 * in Chrome/browser environments during testing
 */
const AsyncStorageWeb = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      /* Silent error handling */
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      /* Silent error handling */
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      /* Silent error handling */
    }
  },
};

export default AsyncStorageWeb;
