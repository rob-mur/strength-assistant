/**
 * Storage Manager - Supabase Only
 *
 * Manages Supabase storage backend operations.
 * Provides a unified interface for storage operations.
 */

// Import storage backend implementations
import { StorageBackend, SupabaseStorage } from "./supabase/SupabaseStorage";

/**
 * Feature Flag Interface
 */
export interface FeatureFlags {
  useSupabaseData: boolean;
}

/**
 * Storage Manager Interface
 * Manages Supabase backend operations
 */
export interface IStorageManager {
  // Returns Supabase backend
  getActiveStorageBackend(): StorageBackend;
  getAuthBackend(): StorageBackend;

  // Feature flag access (always Supabase now)
  getFeatureFlags(): FeatureFlags;
}

/**
 * Storage Manager Implementation
 *
 * This class provides a unified interface to Supabase backend operations.
 */
export class StorageManager implements IStorageManager {
  private readonly supabaseStorage: SupabaseStorage;
  private readonly featureFlags: FeatureFlags;

  constructor() {
    // Initialize Supabase backend
    this.supabaseStorage = new SupabaseStorage();
    // Always use Supabase
    this.featureFlags = {
      useSupabaseData: true,
    };
    if (__DEV__) {
      console.info(`🔄 StorageManager initialized with Supabase backend`);
    }
  }

  /**
   * Call this after construction to initialize async backends.
   */
  async init(): Promise<void> {
    await this.supabaseStorage.init();
  }

  /**
   * Returns the active storage backend (always Supabase)
   */
  getActiveStorageBackend(): StorageBackend {
    return this.supabaseStorage;
  }

  /**
   * Returns the active authentication backend (always Supabase)
   */
  getAuthBackend(): StorageBackend {
    return this.supabaseStorage;
  }

  /**
   * Returns current feature flag configuration
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Gets backend information for debugging
   */
  getBackendInfo(): { active: string; available: string[] } {
    return {
      active: "Supabase",
      available: ["Supabase"],
    };
  }

  /**
   * Clears all data from Supabase backend (testing only)
   */
  async clearAllData(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("clearAllData is not available in production");
    }

    await this.supabaseStorage.clearAllData();

    if (__DEV__) {
      console.info("🗑️ Cleared all data from Supabase backend");
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
// If you need async initialization, call: await storageManager.init();

// Export for testing
export default StorageManager;
