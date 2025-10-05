/**
 * Web storage implementation using localStorage
 */

import type { PlatformStorage } from "./storage";

export const platformStorage: PlatformStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage not available");
    }
    window.localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.clear();
  },

  async getAllKeys(): Promise<string[]> {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    return Object.keys(window.localStorage);
  },

  async multiRemove(keys: string[]): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  },
};

export default platformStorage;
