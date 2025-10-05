/**
 * Web storage implementation using localStorage
 */

import type { PlatformStorage } from "./storage";

export const platformStorage: PlatformStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      return null;
    }
    return globalThis.localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      throw new Error("localStorage not available");
    }
    globalThis.localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      return;
    }
    globalThis.localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      return;
    }
    globalThis.localStorage.clear();
  },

  async getAllKeys(): Promise<string[]> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      return [];
    }
    return Object.keys(globalThis.localStorage);
  },

  async multiRemove(keys: string[]): Promise<void> {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) {
      return;
    }
    for (const key of keys) {
      globalThis.localStorage.removeItem(key);
    }
  },
};

export default platformStorage;
