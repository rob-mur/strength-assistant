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
    } catch (error) {
      console.warn("AsyncStorage.getItem failed:", error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn("AsyncStorage.setItem failed:", error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("AsyncStorage.removeItem failed:", error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      console.warn("AsyncStorage.clear failed:", error);
    }
  },
};

export default AsyncStorageWeb;
