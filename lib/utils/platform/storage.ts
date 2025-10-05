/**
 * Platform-specific storage abstraction
 * Automatically resolves to storage.native.ts or storage.web.ts
 */

export interface PlatformStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiRemove(keys: string[]): Promise<void>;
}

// This file will be resolved by Metro to the appropriate platform-specific implementation
export * from "./storage.native";
