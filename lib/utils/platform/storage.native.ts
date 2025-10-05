/**
 * React Native storage implementation using AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlatformStorage } from "./storage";

export const platformStorage: PlatformStorage = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  },

  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  },

  async multiRemove(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys);
  },
};

export default platformStorage;
