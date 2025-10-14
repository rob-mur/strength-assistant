import { configureSyncEngine } from "./syncConfig";
import { initSupabase } from "../supabase/supabase";
import { storageManager } from "../StorageManager";

/**
 * Initialize the offline-first data layer
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  console.log("🔄 initializeDataLayer - Starting data layer initialization");
  try {
    // Initialize Supabase client
    console.log("🔗 initializeDataLayer - Initializing Supabase client");
    initSupabase();

    // Initialize StorageManager (includes SupabaseStorage session initialization)
    console.log("💾 initializeDataLayer - Initializing StorageManager");
    await storageManager.init();

    // Configure Legend State sync engine
    console.log("⚙️ initializeDataLayer - Configuring sync engine");
    configureSyncEngine();
    console.log("✅ initializeDataLayer - Data layer initialization complete");
  } catch (error) {
    // For Chrome/web testing, we'll continue with degraded functionality
    // rather than completely blocking the app
    if (typeof window !== "undefined") {
      return;
    }
    throw error;
  }
}

// Export sync utilities
export { syncHelpers } from "./syncConfig";
export { exercises$, user$, isOnline$ } from "../store";
